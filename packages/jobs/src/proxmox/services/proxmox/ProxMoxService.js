const axios = require("axios");
const constants = require("./constants");
const keys = require("../../../keys");
const https = require("https");
const validator = require("validator");
let accessInfo = null;

function ProxMoxService(db, payload, ip_address) {

async function getProxmoxConfig() {
  const [results] = await db.sequelize.query(
    `SELECT 
      proxmox_host         AS endpoint,
      proxmox_username     AS username,
      proxmox_password     AS password,
      proxmox_current_node AS current_node,
      proxmox_other_node   AS other_nodes,
      cluster_task_type    AS cluster_method
     FROM web_settings
     WHERE status = 1
     LIMIT 1`,
    { type: db.sequelize.QueryTypes.SELECT }
  );
  if (!results) throw new Error("Proxmox config not found in web_settings.");

  return {
    endpoint:        results.endpoint,
    username:         results.username,
    password:         results.password,
    current_node:     results.current_node,
    other_nodes:       results.other_nodes,
    cluster_method:    results.cluster_method || "RoundRobin",
  };
}

async function selectNode() {
  const cfg = await getProxmoxConfig();

  const primary = cfg.current_node?.trim();
  const others = (cfg.other_nodes || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  const nodes = [primary, ...others].filter(Boolean);

  if (nodes.length <= 1) {
    console.log(`[selectNode] Only one node available: ${nodes[0]}`);
    return nodes[0];
  }

  console.log(`[selectNode] Using cluster method: ${cfg.cluster_method}`);

  switch (cfg.cluster_method) {
    case "RoundRobin":
      return await selectNodeRoundRobin(nodes);
    case "LeastLoaded":
      return await selectNodeLeastLoaded(nodes);
    case "Weighted":
      return await selectNodeWeighted(nodes);
    case "Threshold":
      return await selectNodeThreshold(nodes, cfg.current_node);
    default:
      console.warn(`[selectNode] Unknown method "${cfg.cluster_method}", defaulting to RoundRobin`);
      return await selectNodeRoundRobin(nodes);
  }
}

// ───────────────────────────────────────────────
// RoundRobin: alternate strictly based on the last assigned node
// ───────────────────────────────────────────────
async function selectNodeRoundRobin(nodes) {
  const [lastRow] = await db.sequelize.query(
    `SELECT node_name FROM vm_request
     WHERE node_name IS NOT NULL
     ORDER BY createdon DESC
     LIMIT 1`,
    { type: db.sequelize.QueryTypes.SELECT }
  );

  if (!lastRow || !lastRow.node_name) {
    console.log(`[selectNodeRoundRobin] No previous node found, selecting first: ${nodes[0]}`);
    return nodes[0];
  }

  const lastIndex = nodes.indexOf(lastRow.node_name);
  const nextIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % nodes.length;
  const selected = nodes[nextIndex];

  console.log(`[selectNodeRoundRobin] Last: ${lastRow.node_name} → Next: ${selected}`);
  return selected;
}

// ───────────────────────────────────────────────
// LeastLoaded: pick the node with fewest active VM requests (your original logic)
// ───────────────────────────────────────────────
async function selectNodeLeastLoaded(nodes) {
  const rows = await db.sequelize.query(
    `SELECT node_name, COUNT(*) AS cnt
     FROM vm_request
     WHERE node_name IN (:nodes)
       AND status NOT IN ('Completed','Terminated','Failed')
     GROUP BY node_name`,
    {
      replacements: { nodes },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  const countMap = {};
  nodes.forEach((n) => (countMap[n] = 0));
  rows.forEach((r) => (countMap[r.node_name] = parseInt(r.cnt, 10)));

  let selected = nodes[0];
  let minCount = countMap[nodes[0]];
  for (let i = 1; i < nodes.length; i++) {
    if (countMap[nodes[i]] < minCount) {
      minCount = countMap[nodes[i]];
      selected = nodes[i];
    }
  }

  console.log(`[selectNodeLeastLoaded] Counts:`, countMap, `→ selected: ${selected}`);
  return selected;
}

// ───────────────────────────────────────────────
// Weighted: pick node based on assigned weight (capacity ratio)
// NOTE: requires a weights map — for now sourced from other_nodes string format
// e.g. "sibersim1:3,sibersim2:1" meaning sibersim1 gets picked 3x more often
// Adjust the parsing below to match how you plan to store weights.
// ───────────────────────────────────────────────
async function selectNodeWeighted(nodes) {
  const cfg = await getProxmoxConfig();

  // Expect other_nodes optionally formatted as "node:weight,node:weight"
  // Falls back to equal weight (1) if no weight specified
  const weightMap = {};
  nodes.forEach((n) => (weightMap[n] = 1)); // default weight

  (cfg.other_nodes || "").split(",").forEach((entry) => {
    const [name, weight] = entry.split(":").map((s) => s?.trim());
    if (name && weight && !isNaN(weight)) {
      weightMap[name] = parseInt(weight, 10);
    }
  });

  const totalWeight = nodes.reduce((sum, n) => sum + (weightMap[n] || 1), 0);
  let rand = Math.random() * totalWeight;

  let selected = nodes[0];
  for (const n of nodes) {
    rand -= weightMap[n] || 1;
    if (rand <= 0) {
      selected = n;
      break;
    }
  }

  console.log(`[selectNodeWeighted] Weights:`, weightMap, `→ selected: ${selected}`);
  return selected;
}

// ───────────────────────────────────────────────
// Threshold: stick with current_node until it hits a load threshold,
// then overflow to other nodes
// ───────────────────────────────────────────────
async function selectNodeThreshold(nodes, primaryNode, threshold = 10) {
  const rows = await db.sequelize.query(
    `SELECT node_name, COUNT(*) AS cnt
     FROM vm_request
     WHERE node_name IN (:nodes)
       AND status NOT IN ('Completed','Terminated','Failed')
     GROUP BY node_name`,
    {
      replacements: { nodes },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  const countMap = {};
  nodes.forEach((n) => (countMap[n] = 0));
  rows.forEach((r) => (countMap[r.node_name] = parseInt(r.cnt, 10)));

  const primaryLoad = countMap[primaryNode] || 0;

  if (primaryLoad < threshold) {
    console.log(`[selectNodeThreshold] Primary "${primaryNode}" load ${primaryLoad} < ${threshold}, staying on primary`);
    return primaryNode;
  }

  // Overflow: pick least loaded among the rest
  const others = nodes.filter((n) => n !== primaryNode);
  let selected = others[0];
  let minCount = countMap[others[0]] ?? 0;

  for (let i = 1; i < others.length; i++) {
    if ((countMap[others[i]] ?? 0) < minCount) {
      minCount = countMap[others[i]];
      selected = others[i];
    }
  }

  console.log(`[selectNodeThreshold] Primary "${primaryNode}" overloaded (${primaryLoad}), overflowing to: ${selected}`);
  return selected;
}


  async function logApiRequest({
    api_end_point,
    vm_process,
    ip_address,
    request_datetime,
    response_datetime,
    response_code,
    response,
    request_payload,
    request_headers,
    duration,
  }) {
    try {
      const insertQuery = `
        INSERT INTO vm_logs
        (api_end_point,vm_process, ip_address, request_datetime, response_datetime, response_code, response, request_payload, request_headers, duration, createdon)
        VALUES (?, ?,?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await db.sequelize.query(insertQuery, {
        replacements: [
          api_end_point,
          vm_process,
          ip_address,
          request_datetime,
          response_datetime,
          response_code,
          JSON.stringify(response || {}),
          JSON.stringify(request_payload || {}),
          request_headers,
          duration,
        ],
        type: db.sequelize.QueryTypes.INSERT,
      });
    } catch (err) {
      console.error("Failed to log API request:", err);
    }
  }

  async function logApiRequestData(
    start,
    request_datetime,
    config,
    response_code,
    response,
    error = null,
    vm_process = null,
  ) {
    const response_datetime = new Date();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    await logApiRequest({
      api_end_point: config.url,
      vm_process,
      ip_address,
      request_datetime,
      response_datetime,
      response_code,
      response: error ? error.toString() : response,
      request_payload: payload,
      request_headers: JSON.stringify(config.headers),
      duration,
    });
  }

  async function generateAccessTicket() {
    const start = Date.now();
    const request_datetime = new Date();
    const cfg = await getProxmoxConfig(); 

    const formData = new URLSearchParams();
    formData.append("username", cfg.username);
    formData.append("password", cfg.password);

    const config = {
      method: "post",
      url: `${constants.endpoint}/access/ticket`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      data: formData.toString(),
    };

    try {
      const response = await axios.request(config);
      const {
        data: { ticket, CSRFPreventionToken, username, cap },
      } = response.data;

      accessInfo = {
        ticket,
        CSRFPreventionToken,
        username,
        cookie: constants.cookie_prefix + ticket,
      };

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.GENERATE_ACCESS_TICKET,
      );

      return {
        status: "200",
        message: "Access ticket generated successfully.",
        data: { ticket, CSRFPreventionToken, username, cap },
      };
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.GENERATE_ACCESS_TICKET,
      );

      return {
        status: "ERR",
        message: "Error: Unable to Generate Token",
      };
    }
  }


  async function VM_detail(vmid,vmType) {
    if (!accessInfo?.cookie) throw new Error("Access info not initialized.");
    const cfg = await getProxmoxConfig(); 
      const type = vmType.toLowerCase();
  if (!["qemu", "lxc"].includes(type)) {
    throw new Error("Invalid vmType. Must be 'lxc' or 'qemu'.");
  }
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${type}/${vmid}/config`;
    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    const start = Date.now();
    const request_datetime = new Date();

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.QEMU_VM_DETAIL,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.QEMU_VM_DETAIL,
      );
      throw error;
    }
  }
  // ----------------------------VM Confugration Functions----------------------------------------);

  // async function cloneVM(vmType, newid, name, sourceVMID,selectedNode = null) {
  //   if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
  //     throw new Error(
  //       "Access info not initialized. Call generateAccessTicket first.",
  //     );
  //   }
  //   const cfg = await getProxmoxConfig();
  //   const start = Date.now();
  //   const request_datetime = new Date();
  //   const targetNode = selectedNode || cfg.current_node;
  //   const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${sourceVMID}/clone`;

  //   const params = new URLSearchParams();
  //   params.append("newid", newid);
  //   params.append("full", `${constants.full}`);
  //   if (vmType === constants.VM_TYPES.QEMU) {
  //     params.append("name", name);
  //   } else {
  //     params.append("hostname", name);
  //   }

  //   const config = {
  //     method: "post",
  //     url,
  //     headers: {
  //       Cookie: accessInfo.cookie,
  //       "Content-Type": "application/x-www-form-urlencoded",
  //       CSRFPreventionToken: accessInfo.CSRFPreventionToken,
  //     },
  //     data: params.toString(),
  //     httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  //   };

  //   try {
  //     const response = await axios.request(config);
  //     await logApiRequestData(
  //       start,
  //       request_datetime,
  //       config,
  //       response.status.toString(),
  //       response.data,
  //       null,
  //       constants.VM_PROCESSES.CLONE_VM,
  //     );
  //     return response;
  //   } catch (error) {
  //     const errorCode = error?.response?.status?.toString() || "ERR";
  //     const errorMessage = error?.response?.data || error.toString();
  //     await logApiRequestData(
  //       start,
  //       request_datetime,
  //       config,
  //       errorCode,
  //       errorMessage,
  //       error,
  //       constants.VM_PROCESSES.CLONE_VM,
  //     );
  //     console.error("Error in cloning VM:", errorMessage);
  //     return false;
  //   }
  // }

const CLONE_STORAGE = keys.CLONE_STORAGE;


async function cloneVM(vmType, newid, name, sourceVMID, selectedNode = null) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error("Access info not initialized. Call generateAccessTicket first.");
  }

  const cfg        = await getProxmoxConfig();
  const sourceNode = cfg.current_node; // "sibersim"
  const start = Date.now();
  const request_datetime = new Date();

  //  Clone ALWAYS happens on sourceNode — never cross-node here
  const url = `${constants.endpoint}/nodes/${sourceNode}/${vmType}/${sourceVMID}/clone`;

    const params = new URLSearchParams();
    params.append("newid", newid);
    params.append("full", "0");
    // params.append("full", "1");
    // working perfectly
    if (vmType === "qemu") {
      params.append("name", name);
    } else {  
      params.append("hostname", name);
    }

  //  Place the cloned disk on shared storage so migration works later
  // params.append("storage", CLONE_STORAGE);

  const config = {
    method: "post",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    data: params.toString(),
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  };

  try {
    const response = await axios.request(config);
    await logApiRequestData(start, request_datetime, config, response.status.toString(), response.data, null, constants.VM_PROCESSES.CLONE_VM);
    return response;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();
    await logApiRequestData(start, request_datetime, config, errorCode, errorMessage, error, constants.VM_PROCESSES.CLONE_VM);
    console.error("Error in cloning VM:", errorMessage);
    return false;
  }
}

async function migrateVM(vmType, vmid, sourceNode, targetNode) {
  if (!accessInfo?.cookie) {
    throw new Error("Access info not initialized. Call generateAccessTicket first.");
  }

  const start            = Date.now();
  const request_datetime = new Date();
  const type             = vmType.toLowerCase();

  if (!["qemu", "lxc"].includes(type)) {
    throw new Error("Invalid vmType. Must be 'lxc' or 'qemu'.");
  }

  const url = `${constants.endpoint}/nodes/${sourceNode}/${type}/${vmid}/migrate`;

  const params = new URLSearchParams();
  params.append("target", targetNode);

  //  Disk is on shared 'bank' — no disk move needed, so drop with-local-disks/targetstorage
  if (type === "qemu") { 
    params.append("online", "1"); // offline migration before start
  }

//   if (type === "qemu") {
//   params.append("online", "1");
//   // params.append("with-local-disks", "1");
//   // params.append("targetstorage", CLONE_STORAGE);
// } else if (type === "lxc") {
//   params.append("restart", "1");  // auto-start on target node after migrate
// }

  const config = {
    method: "post",
    url,
    headers: {
      Cookie:              accessInfo.cookie,
      "Content-Type":      "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    data:       params.toString(),
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  };

  try {
    const response = await axios.request(config);
    console.log("responseresponseresponse",response);
    
    await logApiRequestData(start, request_datetime, config, response.status.toString(), response.data, null, constants.VM_PROCESSES.MIGRATE_VM);
    console.log(`[migrateVM] Migration task started for ${vmid} → ${targetNode}`);
    return response;
  } catch (error) {
    const errorCode    = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();
    await logApiRequestData(start, request_datetime, config, errorCode, errorMessage, error, constants.VM_PROCESSES.MIGRATE_VM);
    console.error("Error in migrating VM:", errorMessage);
    return null;
  }
}

async function waitForTask(node, upid, timeoutMs = 300000, intervalMs = 5000) {
  if (!accessInfo?.cookie) {
    throw new Error("Access info not initialized. Call generateAccessTicket first.");
  }
  console.log("upidupidupidupidupidupidupid",upid);
  

  const start            = Date.now();
  const request_datetime = new Date();
  const deadline         = Date.now() + timeoutMs;
  const upidNode = upid.split(":")[1] || node;
  const encodedUpid = encodeURIComponent(upid);
  console.log("encodedUpidencodedUpidencodedUpid",encodedUpid);
  
  const url = `${constants.endpoint}/nodes/${upidNode}/tasks/${encodedUpid}/status`;

  console.log(`[waitForTask] Polling task on node: ${upidNode}, URL: ${url}`);

  while (Date.now() < deadline) {
    try {
      const config = {
        method: "get",
        url,
        headers: {
          Cookie:              accessInfo.cookie,
          CSRFPreventionToken: accessInfo.CSRFPreventionToken,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      };

      const response   = await axios.request(config);
      const status     = response.data?.data?.status;
      const exitStatus = response.data?.data?.exitstatus;

      // Fix 1: Pass only simple scalars — no objects/headers in logApiRequestData
      await logApiRequestData(
        start,
        request_datetime,
        config, // ← strip headers to avoid ? mismatch
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.WAIT_FOR_TASK,
      );

      console.log(`[waitForTask] UPID: ${upid} | status: ${status} | exit: ${exitStatus}`);

      if (status === "stopped") {
        return exitStatus === "OK";
      }
    } catch (error) {
      const errorCode    = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      try {
        await logApiRequestData(
          start,
          request_datetime,
          { method: "get", url, headers: {} },
          errorCode,
          errorMessage,
          error,
          constants.VM_PROCESSES.WAIT_FOR_TASK,
        );
      } catch (logErr) {
        console.error("[waitForTask] Log error:", logErr.message);
      }

      console.error("[waitForTask] Poll error:", errorMessage);
    }

    //  Fix 3: inline sleep instead of relying on imported util
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.error(`[waitForTask] Timed out waiting for task ${upid}`);
  return false;
}

  async function configureVM(vmid, vmType, networkConfig = {},selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();
    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/config`;

    const params = new URLSearchParams();
    for (const [adapterKey, configStr] of Object.entries(networkConfig)) {
      params.append(adapterKey, configStr);
    }

    const config = {
      method: "put",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: params,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.CONFIGURE_VM,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.CONFIGURE_VM,
      );
      console.error("Error in configuring VM:", errorMessage);
      return false;
    }
  }

  async function startVM(vmid, vmType, selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/status/start`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.START_VM,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.START_VM,
      );
      console.error("Error in starting VM:", errorMessage);
      return false;
    }
  }

  async function stopVM(vmid, vmType,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/status/stop`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      // SAFE LOGGING
      try {
        await logApiRequestData(
          start,
          request_datetime,
          config,
          response.status.toString(),
          response.data,
          null,
          constants.VM_PROCESSES.STOP_VM,
        );
      } catch (logErr) {
        console.error("Logging failed (STOP_VM):", logErr.message);
      }

      return response; //  RETURN SUCCESS NO MATTER WHAT
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      //  SAFE LOGGING
      try {
        await logApiRequestData(
          start,
          request_datetime,
          config,
          errorCode,
          errorMessage,
          error,
          constants.VM_PROCESSES.STOP_VM,
        );
      } catch (logErr) {
        console.error("Logging failed (STOP_VM error):", logErr.message);
      }

      console.error("Error in stopping VM:", errorMessage);
      throw error; // 🔥 IMPORTANT: throw, don’t return null
    }
  }

  async function destroyVM(vmid, vmType,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}`;

    const config = {
      method: "delete",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      data: "", // Required to prevent axios from omitting the body entirely
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.DESTROY_VM,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.DESTROY_VM,
      );
      console.error("Error in destroying VM:", errorMessage);
      return {
        status: errorCode,
        data: null,
        error: errorMessage,
      };
    }
  }

  async function GetNodeNetworkInfo() {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const config = {
      method: "get",
      url: `${constants.endpoint}/nodes/${cfg.current_node}/network`,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.NETWORK_INFO,
      );
      return response.data;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.NETWORK_INFO,
      );
      console.error(`Error fetching network info:`, errorMessage);
      return null;
    }
  }

  async function createQEMUSnapshot(vmid, snapname, vmstate,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    if (!snapname) {
      throw new Error("Snapshot name (snapname) is required.");
    }

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/qemu/${vmid}/snapshot`;

    const formData = new URLSearchParams();
    formData.append("snapname", snapname);
    formData.append("vmstate", vmstate); // MUST be provided explicitly

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: formData.toString(),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.SNAPSHOT_QEMU,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.SNAPSHOT_QEMU,
      );

      console.error("Error creating QEMU snapshot:", errorMessage);
      return false;
    }
  }
  async function deleteSnapshot(vmid, snapname, vmType,selectedNode = null) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error("Access info not initialized. Call generateAccessTicket first.");
  }

  const cfg = await getProxmoxConfig();

  if (!snapname) throw new Error("Snapshot name (snapname) is required.");

  const type = vmType.toLowerCase();
  if (!["qemu", "lxc"].includes(type)) {
    throw new Error("Invalid vmType. Must be 'lxc' or 'qemu'.");
  }

  const logConstant =
    type === "qemu"
      ? constants.VM_PROCESSES.DELETE_QEMU_SNAPSHOT
      : constants.VM_PROCESSES.DELETE_LXC_SNAPSHOT;

  const start = Date.now();
  const request_datetime = new Date();
  const targetNode = selectedNode || cfg.current_node;
  const url = `${constants.endpoint}/nodes/${targetNode}/${type}/${vmid}/snapshot/${snapname}`;

  const config = {
    method: "delete",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  };

  try {
    const response = await axios.request(config);
    await logApiRequestData(start, request_datetime, config, response.status.toString(), response.data, null, logConstant);
    return response;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();
    await logApiRequestData(start, request_datetime, config, errorCode, errorMessage, error, logConstant);
    console.error(`Error deleting ${type.toUpperCase()} snapshot:`, errorMessage);
    return false;
  }
}

  async function restoreSnapshot(vmid, snapname, startValue,vmType,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();
      const type = vmType.toLowerCase();
  if (!["qemu", "lxc"].includes(type)) {
    throw new Error("Invalid vmType. Must be 'lxc' or 'qemu'.");
  }

    if (!snapname) {
      throw new Error("Snapshot name (snapname) is required.");
    }

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/${type}/${vmid}/snapshot/${snapname}/rollback`;

    const formData = new URLSearchParams();
    formData.append("start", startValue); // must be provided (1 or 0)

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: formData.toString(),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    const restoreProcess =
      type === "qemu"
        ? constants.VM_PROCESSES.RESTORE_QEMU_SNAPSHOT
        : constants.VM_PROCESSES.RESTORE_LXC_SNAPSHOT;

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        restoreProcess,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        restoreProcess,
      );

      console.error(`Error restoring ${type} snapshot:`, errorMessage);
      return false;
    }
  }

  async function pauseVM(vmid, vmType,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    // Suspend URL (QEMU only): /status/suspend
    const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/status/suspend`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: new URLSearchParams({
        todisk: 1, // exactly from your cURL
      }).toString(),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.PAUSE_VM,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.PAUSE_VM,
      );

      console.error("Error in suspending VM:", errorMessage);
      return null;
    }
  }

  async function resumeVM(vmid, vmType,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    // Resume URL: /status/resume
    const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/status/resume`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      // Resume API has NO BODY in your cURL
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.RESUME_VM,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.RESUME_VM,
      );

      console.error("Error in resuming VM:", errorMessage);
      return null;
    }
  }

  async function getTaskLog(upid) {
    if (!accessInfo?.cookie) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/tasks/${upid}/status`;

    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.GET_TASK_LOG,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.GET_TASK_LOG,
      );

      console.error("Error fetching task log:", errorMessage);
      return null;
    }
  }
const IMPORT_STORAGE = keys.IMPORT_STORAGE;
const BACKUP_STORAGE = keys.BACKUP_STORAGE;


  async function takeBackup(vmid) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/vzdump`;

    // Build URL-encoded form-data body
    const params = new URLSearchParams();
    params.append("compress", "zstd");
    params.append("mode", "snapshot");
    params.append("vmid", vmid);
    params.append("storage", BACKUP_STORAGE);

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      data: params.toString(), // URL encoded
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.TAKE_BACKUP,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.TAKE_BACKUP,
      );

      console.error("Error taking backup:", errorMessage);
      return {
        status: errorCode,
        data: null,
        error: errorMessage,
      };
    }
  }

  async function fetchFileName(upid) {
    if (!accessInfo?.cookie) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/tasks/${upid}/log`;

    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.FETCH_FILE_NAME,
      );

      return response.data;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.FETCH_FILE_NAME,
      );

      console.error("Error fetching task log:", errorMessage);
      return null;
    }
  }

  async function createLXCSnapshot(vmid, snapname,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    if (!snapname) {
      throw new Error("Snapshot name (snapname) is required.");
    }

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/lxc/${vmid}/snapshot`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: `snapname=${encodeURIComponent(snapname)}`,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.SNAPSHOT_LXC,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.SNAPSHOT_LXC,
      );

      console.error("Error creating LXC snapshot:", errorMessage);
      return false;
    }
  }

  async function cloneLXC(vmid, data) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc/${vmid}/clone`;

    const body = new URLSearchParams({
      newid: data.newid,
      hostname: data.hostname,
      full: data.full,
      snapname: data.snapname,
    }).toString();
    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: body,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };
    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.CLONE_LXC,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.CLONE_LXC,
      );

      console.error("Error in cloneLXC:", errorMessage);
      return null;
    }
  }

  async function templateLXC(vmid) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc/${vmid}/template`;
    // const url = `https://battlerangers.com:8006/api2/json/nodes/ofisgate/lxc/7580/template`;
    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };
    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.TEMPLATE_LXC,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.TEMPLATE_LXC,
      );

      console.error("Error in templateLXC:", errorMessage);
      return null;
    }
    // catch (error) {
    //   console.error("AXIOS ERROR RAW:", {
    //     message: error.message,
    //     code: error.code,
    //     errno: error.errno,
    //     syscall: error.syscall,
    //     address: error.address,
    //     port: error.port,
    //     config: error.config,
    //     stack: error.stack
    //   });

    //   if (error.response) {
    //     console.error("RESPONSE STATUS:", error.response.status);
    //     console.error("RESPONSE DATA:", error.response.data);
    //   } else if (error.request) {
    //     console.error("REQUEST SENT BUT NO RESPONSE");
    //   } else {
    //     console.error("REQUEST NOT SENT");
    //   }

    //   return null;
    // }
  }

  async function cloneQEMU(vmid, newid, name = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu/${vmid}/clone`;

    // ADD name ONLY if provided
    const params = new URLSearchParams({ newid });
    if (name) {
      params.append("name", name);
    }

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: params.toString(),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.CLONE_QEMU,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.CLONE_QEMU,
      );

      console.error("Error in cloneQEMU:", errorMessage);
      return null;
    }
  }


  async function templateQEMU(vmid) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu/${vmid}/template`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.TEMPLATE_QEMU,
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.TEMPLATE_QEMU,
      );

      console.error("Error in templateQEMU:", errorMessage);
      return null;
    }
  }

  async function getConfig(vmid,vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();
     const type = vmType.toLowerCase();
  if (!["qemu", "lxc"].includes(type)) {
    throw new Error("Invalid vmType. Must be 'lxc' or 'qemu'.");
  }

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${type}/${vmid}/config`;

    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie, // ⬅ Same as your Postman header
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };
    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status?.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.GET_QEMU_CONFIG,
      );

      return {
        success: true,
        vmid,
        data: response.data,
        message: "VM config fetched successfully.",
      };
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorData = error?.response?.data;

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorData,
        error,
        constants.VM_PROCESSES.GET_QEMU_CONFIG,
      );

      console.error("Error in getLxcConfig:", errorData);

      return {
        success: false,
        vmid,
        message: "Failed to fetch VM config.",
        error: errorData,
      };
    }
  }


  // not done yet

  async function deleteVmNetwork(vmid, vmType, netKey) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config?delete=${netKey}`;

    const config = {
      method: "put",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status?.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.DELETE_VM_NETWORK,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.DELETE_VM_NETWORK,
      );

      console.error("Error in deleteVmNetwork:", errorMessage);
      return false;
    }
  }

  async function addVmNetwork(vmid, vmType, netKey, netValue,selectedNode = null) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const targetNode = selectedNode || cfg.current_node;
    const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/config`;

    const data = new URLSearchParams();
    data.append(netKey, netValue);

    const config = {
      method: "put",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status?.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.ADD_VM_NETWORK,
      );

      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.ADD_VM_NETWORK,
      );

      console.error("Error in addVmNetwork:", errorMessage);
      return false;
    }
  }
  
  async function disconnectVmNetwork(vmid, vmType, netKey, netValue,selectedNode = null) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();
  const targetNode = selectedNode || cfg.current_node;
  const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/config`;        

  const data = new URLSearchParams();

  // Example:
  // netKey = "net0"
  // netValue = "virtio=BC:24:11:DE:01:D8,bridge=vmbr1316,tag=4094"
  data.append(netKey, netValue);

  const config = {
    method: "put",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    data,
    httpsAgent: new (require("https").Agent)({
      rejectUnauthorized: false,
    }),
  };

  try {
    const response = await axios.request(config);

    await logApiRequestData(
      start,
      request_datetime,
      config,
      response.status?.toString(),
      response.data,
      null,
      constants.VM_PROCESSES.DISCONNECT_VM_NETWORK,
    );

    return response;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();

    await logApiRequestData(
      start,
      request_datetime,
      config,
      errorCode,
      errorMessage,
      error,
      constants.VM_PROCESSES.DISCONNECT_VM_NETWORK,
    );

    console.error("Error in disconnectVmNetwork:", errorMessage);
    return false;
  }
}

async function connectVmNetwork(vmid, vmType, netKey, mac, bridge,selectedNode = null) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();
  const targetNode = selectedNode || cfg.current_node;
  const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/config`;

  // Build value like curl
  const netValue = `virtio=${mac},bridge=${bridge}`;

  const data = new URLSearchParams();

  data.append(netKey, netValue);

  const config = {
    method: "put",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    data,
    httpsAgent: new (require("https").Agent)({
      rejectUnauthorized: false,
    }),
  };

  try {
    const response = await axios.request(config);

    await logApiRequestData(
      start,
      request_datetime,
      config,
      response.status?.toString(),
      response.data,
      null,
      constants.VM_PROCESSES.CONNECT_VM_NETWORK,
    );

    return response;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();

    await logApiRequestData(
      start,
      request_datetime,
      config,
      errorCode,
      errorMessage,
      error,
      constants.VM_PROCESSES.CONNECT_VM_NETWORK,
    );

    console.error("Error in connectVmNetwork:", errorMessage);
    return false;
  }
}

async function getVmNetworkInfo(vmid, vmType,selectedNode = null) {
  if (!accessInfo?.cookie) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();
  const targetNode = selectedNode || cfg.current_node;
  const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/config`;

  const config = {
    method: "get",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      "Content-Type": "application/json",
    },
    httpsAgent: new (require("https").Agent)({
      rejectUnauthorized: false,
    }),
  };

  try {
    const response = await axios.request(config);

    await logApiRequestData(
      start,
      request_datetime,
      config,
      response.status?.toString(),
      response.data,
      null,
      constants.VM_PROCESSES.GET_VM_NETWORK_INFO,
    );

    return response.data;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();

    await logApiRequestData(
      start,
      request_datetime,
      config,
      errorCode,
      errorMessage,
      error,
      constants.VM_PROCESSES.GET_VM_NETWORK_INFO,
    );

    console.error("Error in getVmNetworkInfo:", errorMessage);
    return false;
  }
}


async function unplugVmNetwork(vmid, vmType, netKey, mac, bridge,selectedNode = null) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first."
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();
  const targetNode = selectedNode || cfg.current_node;
  const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/config`;
  let netValue;
  /* ===================== KEY FIX ===================== */
  if (vmType === "qemu") {
    // Disable cable
    netValue = `virtio=${mac},bridge=${bridge},link_down=1`;
  }

  if (vmType === "lxc") {
    // Remove bridge = unplug
    const ethIndex = netKey.replace("net", "");
    // netValue = `name=eth0,type=veth`;
    netValue = `name=eth${ethIndex},bridge=${bridge},link_down=1`;
  }
  /* =================================================== */

  const data = new URLSearchParams();
  data.append(netKey, netValue);

  const config = {
    method: "put",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    data,
    httpsAgent: new (require("https").Agent)({
      rejectUnauthorized: false,
    }),
  };
  try {
    const response = await axios.request(config);

    await logApiRequestData(
      start,
      request_datetime,
      config,
      response.status?.toString(),
      response.data,
      null,
      constants.VM_PROCESSES.UNPLUG_VM_NETWORK
    );
    return response;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();

    await logApiRequestData(
      start,
      request_datetime,
      config,
      errorCode,
      errorMessage,
      error,
      constants.VM_PROCESSES.UNPLUG_VM_NETWORK
    );

    console.error("Error in unplugVmNetwork:", errorMessage);
    return false;
  }
}

async function plugVmNetwork(vmid, vmType, netKey, mac, bridge,selectedNode = null) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();
  const targetNode = selectedNode || cfg.current_node;
  const url = `${constants.endpoint}/nodes/${targetNode}/${vmType}/${vmid}/config`;

  let netValue;

  /* ===================== DIFFERENCE HERE ===================== */
  if (vmType === "qemu") {
    // QEMU = enable cable
    netValue = `virtio=${mac},bridge=${bridge},link_down=0`;
  }

  if (vmType === "lxc") {
    // LXC = attach interface to bridge
    const ethIndex = netKey.replace("net", "");
    netValue = `name=eth${ethIndex},bridge=${bridge},hwaddr=${mac},type=veth`;
  }
  /* ============================================================ */

  const data = new URLSearchParams();
  data.append(netKey, netValue);

  const config = {
    method: "put",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    data,
    httpsAgent: new (require("https").Agent)({
      rejectUnauthorized: false,
    }),
  };

  try {
    const response = await axios.request(config);

    await logApiRequestData(
      start,
      request_datetime,
      config,
      response.status?.toString(),
      response.data,
      null,
      constants.VM_PROCESSES.PLUG_VM_NETWORK,
    );

    return response;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();

    await logApiRequestData(
      start,
      request_datetime,
      config,
      errorCode,
      errorMessage,
      error,
      constants.VM_PROCESSES.PLUG_VM_NETWORK,
    );

    console.error("Error in plugVmNetwork:", errorMessage);
    return false;
  }
}

const VMID_RANGE_START = keys.VMID_RANGE_START;
const VMID_RANGE_END = keys.VMID_RANGE_END;

async function checkVmidStatus(vmid, vmType) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();
  const start = Date.now();
  const request_datetime = new Date();
  const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/status/current`;
  const config = {
    method: "get",
    url,
    headers: {
      Cookie: accessInfo.cookie,
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    httpsAgent: new (require("https").Agent)({
      rejectUnauthorized: false,
    }),
  };

  try {
    const response = await axios.request(config);

    await logApiRequestData(
      start,
      request_datetime,
      config,
      response.status?.toString(),
      response.data,
      null,
      constants.VM_PROCESSES.CHECK_VMID_STATUS,
    );

    // 200 OK = VMID is already in use
    return response.status === 200;
  } catch (error) {
    const errorCode = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();

    await logApiRequestData(
      start,
      request_datetime,
      config,
      errorCode,
      errorMessage,
      error,
      constants.VM_PROCESSES.CHECK_VMID_STATUS,
    );

    // 404 or 500 = VMID is free
    const freeStatusCodes = [404, 500];
    if (freeStatusCodes.includes(error?.response?.status)) {
      return false;
    }

    // Unexpected error — bubble it up so findFreeVmid doesn't silently skip
    console.error(`Unexpected error checking VMID ${vmid} (${vmType}):`, errorMessage);
    throw error;
  }
}


// ─── FIND FREE VMID ───────────────────────────────────────────────────────────
async function findFreeVmid() {
  for (let vmid = VMID_RANGE_START; vmid <= VMID_RANGE_END; vmid++) {
    const usedAsQemu = await checkVmidStatus(vmid, "qemu");
    if (usedAsQemu) continue;

    const usedAsLxc = await checkVmidStatus(vmid,"lxc");
    if (usedAsLxc) continue;

    // Free in both QEMU and LXC
    return vmid;
  }

  throw new Error(
    `No free VMID available in range ${VMID_RANGE_START}–${VMID_RANGE_END}.`,
  );
}

async function restoreVM({ vmid, zstFile, vmType,proxmoxPath,storage }) {
  if (!accessInfo?.cookie) {
    throw new Error("Access info not initialized. Call generateAccessTicket first.");
  }

  const cfg              = await getProxmoxConfig();
  const start            = Date.now();
  const request_datetime = new Date();
  const storageId = process.env.IMPORT_STORAGE || "bucket";
  const type = vmType.toLowerCase();
  if (!["qemu", "lxc"].includes(type)) {
    throw new Error("Invalid vmType. Must be 'lxc' or 'qemu'.");
  }
  // const volid            = `local:backup/${zstFile}`;
  const volid     = `${storageId}:backup/${zstFile}`;  
  const url              = `${constants.endpoint}/nodes/${cfg.current_node}/${type}`;
  // ── Build params based on vmType ──────────────────────────────────
 const params = vmType === "qemu"
    ? {
        archive: volid,       // QEMU uses archive
        vmid:    String(vmid),
        storage: storage,
      }
    : {
        ostemplate: volid,    // LXC uses ostemplate
        vmid:       String(vmid),
        storage:    storage,
        restore:    "1",      // LXC needs restore=1
        unique:     "1"
      };

  const config = {
    method: "post",
    url,
    headers: {
      Cookie:             accessInfo.cookie,
      "Content-Type":    "application/x-www-form-urlencoded",
      CSRFPreventionToken: accessInfo.CSRFPreventionToken,
    },
    data:       new URLSearchParams(params).toString(),
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  };

  try {
    const response = await axios.request(config);
    await logApiRequestData(start, request_datetime, config, response.status.toString(), response.data, null, constants.VM_PROCESSES.RESTORE_VM);
    return response;
  } catch (error) {
    const errorCode    = error?.response?.status?.toString() || "ERR";
    const errorMessage = error?.response?.data || error.toString();
    await logApiRequestData(start, request_datetime, config, errorCode, errorMessage, error, constants.VM_PROCESSES.RESTORE_VM);
    console.error("Error restoring VM:", errorMessage);
    return null;
  }
}





  return {
    generateAccessTicket,
    VM_detail,
    cloneVM,
    configureVM,
    startVM,
    stopVM,
    destroyVM,
    GetNodeNetworkInfo,
    createLXCSnapshot,
    createQEMUSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    resumeVM,
    pauseVM,
    getTaskLog,
    takeBackup,
    fetchFileName,
    cloneLXC,
    templateLXC,
    cloneQEMU,
    templateQEMU,
    getConfig,
    deleteVmNetwork,
    addVmNetwork,
    disconnectVmNetwork,
    connectVmNetwork,
    getVmNetworkInfo,
    unplugVmNetwork,
    plugVmNetwork,
    restoreVM,
    findFreeVmid,
    selectNode,
    migrateVM,
    getProxmoxConfig,
    waitForTask
  };
}

module.exports = ProxMoxService;
