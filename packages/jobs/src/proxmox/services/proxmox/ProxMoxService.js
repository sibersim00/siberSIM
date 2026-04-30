const axios = require("axios");
const constants = require("./constants");
const https = require("https");
const validator = require("validator");
let accessInfo = null;

function ProxMoxService(db, payload, ip_address) {

async function getProxmoxConfig() {
  const [results] = await db.sequelize.query(
    `SELECT 
      proxmox_host        AS endpoint,
      proxmox_username    AS username,
      proxmox_password    AS password,
      proxmox_current_node AS current_node
     FROM web_settings
     WHERE status = 1
     LIMIT 1`,
    { type: db.sequelize.QueryTypes.SELECT }
  );
  console.log("resultsresultsresults",results);
  

  if (!results) throw new Error("Proxmox config not found in web_settings.");

  return {
    endpoint:       results.endpoint,
    username:       results.username,
    password:       results.password,
    current_node:   results.current_node,
  };
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
  async function QEMU_List() {
    if (!accessInfo?.cookie)
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    const cfg = await getProxmoxConfig(); 


    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu`;

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
        constants.VM_PROCESSES.QEMU_LIST,
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
        constants.VM_PROCESSES.QEMU_LIST,
      );
      throw error;
    }
  }



  async function QEMU_VM_detail(vmid) {
    if (!accessInfo?.cookie) throw new Error("Access info not initialized.");
    const cfg = await getProxmoxConfig(); 
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu/${vmid}/config`;
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
  async function LXC_List() {
    console.log("accessInfoaccessInfo",accessInfo);
    
    if (!accessInfo?.cookie) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc`;

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
        constants.VM_PROCESSES.LXC_LIST,
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
        constants.VM_PROCESSES.LXC_LIST,
      );
      console.error("Error in listing LXC containers:", errorMessage);
      return null;
    }
  }
  async function LXC_Container_detail(vmid) {
    if (!accessInfo?.cookie) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc/${vmid}/config`;

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
        null, // 👈 This is the `error` parameter
        constants.VM_PROCESSES.LXC_CONTAINER_DETAIL,
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
        constants.VM_PROCESSES.LXC_CONTAINER_DETAIL,
      );
      console.error(
        `Error in fetching container ${vmid} config:`,
        errorMessage,
      );
      throw error;
    }
  }
  // ----------------------------VM Confugration Functions----------------------------------------);

  async function cloneVM(vmType, newid, name, sourceVMID) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();
    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${sourceVMID}/clone`;

    const params = new URLSearchParams();
    params.append("newid", newid);
    params.append("full", `${constants.full}`);
    if (vmType === "qemu") {
      params.append("name", name);
    } else {
      params.append("hostname", name);
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
        constants.VM_PROCESSES.CLONE_VM,
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
        constants.VM_PROCESSES.CLONE_VM,
      );
      console.error("Error in cloning VM:", errorMessage);
      return false;
    }
  }

  async function configureVM(vmid, vmType, networkConfig = {}) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();
    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config`;

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

  async function startVM(vmid, vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/status/start`;

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

  async function stopVM(vmid, vmType) {
    console.log("vmid, vmType", vmid, vmType);

    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/status/stop`;

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

  async function destroyVM(vmid, vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}`;

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

  async function createQEMUSnapshot(vmid, snapname, vmstate) {
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

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu/${vmid}/snapshot`;

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

  async function deleteQEMUSnapshot(vmid, snapname) {
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

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu/${vmid}/snapshot/${snapname}`;

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

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.DELETE_QEMU_SNAPSHOT,
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
        constants.VM_PROCESSES.DELETE_QEMU_SNAPSHOT,
      );

      console.error("Error deleting QEMU snapshot:", errorMessage);
      return false;
    }
  }

  async function deleteLXCSnapshot(vmid, snapname) {
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

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc/${vmid}/snapshot/${snapname}`;

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

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.DELETE_LXC_SNAPSHOT,
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
        constants.VM_PROCESSES.DELETE_LXC_SNAPSHOT,
      );

      console.error("Error deleting LXC snapshot:", errorMessage);
      return false;
    }
  }

  async function restoreLXCSnapshot(vmid, snapname, startValue) {
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

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc/${vmid}/snapshot/${snapname}/rollback`;

    const formData = new URLSearchParams();
    formData.append("start", startValue); // must be passed explicitly (1 or 0)

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
        constants.VM_PROCESSES.RESTORE_LXC_SNAPSHOT,
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
        constants.VM_PROCESSES.RESTORE_LXC_SNAPSHOT,
      );

      console.error("Error restoring LXC snapshot:", errorMessage);
      return false;
    }
  }

  async function restoreQEMUSnapshot(vmid, snapname, startValue) {
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

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu/${vmid}/snapshot/${snapname}/rollback`;

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

    try {
      const response = await axios.request(config);

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.RESTORE_QEMU_SNAPSHOT,
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
        constants.VM_PROCESSES.RESTORE_QEMU_SNAPSHOT,
      );

      console.error("Error restoring QEMU snapshot:", errorMessage);
      return false;
    }
  }

  async function pauseVM(vmid, vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    // Suspend URL (QEMU only): /status/suspend
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/status/suspend`;

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

  async function resumeVM(vmid, vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    // Resume URL: /status/resume
    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/status/resume`;

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
    params.append("storage", "bucket");

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

  async function createLXCSnapshot(vmid, snapname) {
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

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc/${vmid}/snapshot`;

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
      console.log("responseresponse");
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

    console.log("bodyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy", body);

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
    console.log("configconfigconfigconfigconfig", config);

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
      console.log("responseresponseresponse", response);
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

    console.log("urlurlurl", url);
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
    console.log("configconfigconfigconfig", config);

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
      console.log("responserespon222222222222222", response);
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
      console.log("response1111111111111", response);
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

  async function getQemuConfig(vmid) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/qemu/${vmid}/config`;
    console.log("URL:", url);

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

    console.log("Request Config:", config);

    try {
      const response = await axios.request(config);

      console.log("QEMU CONFIG SUCCESS:", response.data);

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

      console.error("Error in getQemuConfig:", errorData);

      return {
        success: false,
        vmid,
        message: "Failed to fetch VM config.",
        error: errorData,
      };
    }
  }

  async function getLxcConfig(vmid) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/lxc/${vmid}/config`;
    console.log("URL:", url);

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

    console.log("Request Config:", config);

    try {
      const response = await axios.request(config);

      console.log("QEMU CONFIG SUCCESS:", response.data);

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

  async function addVmNetwork(vmid, vmType, netKey, netValue) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first.",
      );
    }
    const cfg = await getProxmoxConfig();

    const start = Date.now();
    const request_datetime = new Date();

    const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config`;

    const data = new URLSearchParams();
    console.log("NET KEY:", netKey, "NET VALUE:", netValue);
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
  
  async function disconnectVmNetwork(vmid, vmType, netKey, netValue) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();

  const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config`;

  const data = new URLSearchParams();
  console.log("DISCONNECT NET KEY:", netKey, "VALUE:", netValue);

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

async function connectVmNetwork(vmid, vmType, netKey, mac, bridge) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();

  const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config`;

  // Build value like curl
  const netValue = `virtio=${mac},bridge=${bridge}`;

  const data = new URLSearchParams();
  console.log("CONNECT NET KEY:", netKey, "VALUE:", netValue);

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

async function getVmNetworkInfo(vmid, vmType) {
  if (!accessInfo?.cookie) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();

  const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config`;

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


async function unplugVmNetwork(vmid, vmType, netKey, mac, bridge) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first."
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();

  const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config`;
  console.log("urlurlurlurl",url)
  let netValue;
   console.log("netValuenetValue",netValue)
  /* ===================== KEY FIX ===================== */
  if (vmType === "qemu") {
    // Disable cable
    netValue = `virtio=${mac},bridge=${bridge},link_down=1`;
   console.log("netValuenetValue",netValue)

  }

  if (vmType === "lxc") {
    // Remove bridge = unplug
    const ethIndex = netKey.replace("net", "");
    // netValue = `name=eth0,type=veth`;
    netValue = `name=eth${ethIndex},bridge=${bridge},link_down=1`;

   console.log("gggggggggggggggggggggggggggggggg",netValue)

  }
  /* =================================================== */

  const data = new URLSearchParams();
  console.log("datadatadatadata",data)
  console.log("UNPLUG NET KEY:", netKey, "VALUE:", netValue);
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
console.log("configconfig",config)
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
console.log("responseresponse",response)
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

async function plugVmNetwork(vmid, vmType, netKey, mac, bridge) {
  if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
    throw new Error(
      "Access info not initialized. Call generateAccessTicket first.",
    );
  }
  const cfg = await getProxmoxConfig();

  const start = Date.now();
  const request_datetime = new Date();

  const url = `${constants.endpoint}/nodes/${cfg.current_node}/${vmType}/${vmid}/config`;

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
  console.log("PLUG NET KEY:", netKey, "VALUE:", netValue);

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


  return {
    generateAccessTicket,
    QEMU_List,
    QEMU_VM_detail,
    LXC_List,
    LXC_Container_detail,
    cloneVM,
    configureVM,
    startVM,
    stopVM,
    destroyVM,
    GetNodeNetworkInfo,
    createLXCSnapshot,
    createQEMUSnapshot,
    deleteQEMUSnapshot,
    deleteLXCSnapshot,
    restoreLXCSnapshot,
    restoreQEMUSnapshot,
    resumeVM,
    pauseVM,
    getTaskLog,
    takeBackup,
    fetchFileName,
    cloneLXC,
    templateLXC,
    cloneQEMU,
    templateQEMU,
    getQemuConfig,
    getLxcConfig,
    deleteVmNetwork,
    addVmNetwork,
    disconnectVmNetwork,
    connectVmNetwork,
    getVmNetworkInfo,
    unplugVmNetwork,
    plugVmNetwork
  };
}

module.exports = ProxMoxService;
