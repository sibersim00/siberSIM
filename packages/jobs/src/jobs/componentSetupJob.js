const ProxMoxService = require("../proxmox/services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../jobs/jobsConstants");
const NotiTemplate = require("../utils/notiUtility");
const MailTemplate = require("../utils/mailUtility");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getDelays = async (db) => {
  try {
    const settings = await db.sequelize.query(
      `SELECT cloning_delay, configuration_delay 
       FROM web_settings 
       WHERE status = 1 
       LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT },
    );

    const cloningDelaySeconds =
      settings?.[0]?.cloning_delay && Number.isFinite(settings[0].cloning_delay)
        ? settings[0].cloning_delay
        : 3;

    const configurationDelaySeconds =
      settings?.[0]?.configuration_delay &&
      Number.isFinite(settings[0].configuration_delay)
        ? settings[0].configuration_delay
        : 5;

    // Convert both to milliseconds
    const cloningDelayMs = cloningDelaySeconds * 1000;
    const configurationDelayMs = configurationDelaySeconds * 1000;

    return { cloningDelayMs, configurationDelayMs };
  } catch (err) {
    console.error("Error fetching delays:", err);
    // fallback defaults (in ms)
    return { cloningDelayMs: 10000, configurationDelayMs: 15000 };
  }
};

async function componentSetupJob(
  db,
  ipAddress,
  { scenarioid, requestedby_id, vmrequestid },
) {
  console.log(
    `Starting component setup job for Scenario: ${scenarioid}, Learner: ${requestedby_id}`,
  );

  const statusVal = "Initializing";

  try {
    const componentConfig = await db.sequelize.query(
      `SELECT vmconfigurationid, componentid, \`order\`, vmid AS clone_vmid, 
              componentname AS name, duration, componenttype, master_vmid AS source_vmid
       FROM vm_config
       WHERE vmrequestid = ? AND status = ?`,
      {
        replacements: [vmrequestid, statusVal],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (componentConfig.length == 0) {
      console.error(ERROR_MESSAGES.CONFIG_NOT_FOUND);
      await handleComponentFailure(
        db,
        scenarioid,
        requestedby_id,
        vmrequestid,
        statusVal,
        ERROR_MESSAGES.CONFIG_NOT_FOUND,
      );
      return {
        success: false,
        message: ERROR_MESSAGES.CONFIG_NOT_FOUND,
      };
    }

    await db.sequelize.query(
      `INSERT INTO vm_request_logs 
       (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
       VALUES (?, ?, ?, 'System', 'Initiated', ?, NOW())`,
      {
        replacements: [
          vmrequestid,
          scenarioid,
          requestedby_id,
          ERROR_MESSAGES.VM_CONFIG_INIT,
        ],
        type: db.sequelize.QueryTypes.INSERT,
      },
    );
    const proxmoxService = ProxMoxService(db,{}, ipAddress);
    const tokenResult = await proxmoxService.generateAccessTicket();
    console.log("tokenResulttokenResulttokenResult",tokenResult);
    
    if (!tokenResult || tokenResult.status != "200") {
      sendProxmoxDownAlerts(db, requestedby_id);
      await handleComponentFailure(
        db,
        scenarioid,
        requestedby_id,
        vmrequestid,
        statusVal,
        ERROR_MESSAGES.PROXMOX_FAILURE,
      );
      return {
        success: false,
        message: `Could not connect to the siberSIM server while Configuring. Please check server status or credentials.`,
      };
    }


        const selectedNode = await proxmoxService.selectNode();
    console.log(`[componentSetupJob] Selected node: ${selectedNode}`);

    //  Save chosen node before any Proxmox call fires
    await db.sequelize.query(
      `UPDATE vm_request SET node_name = ?, modifiedo.0n = NOW() WHERE vmrequestid = ?`,
      {
        replacements: [selectedNode, vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );
    //Fetch Clone & Configuration Delays
    const { cloningDelayMs, configurationDelayMs } = await getDelays(db);

    //  Step 1: Cloning
    for (const component of componentConfig) {
      console.log(`Starting component Cloning:`, component);
      const cloneResult = await cloneComponentVM(
        db,
        ipAddress,
        component,
        vmrequestid,
        selectedNode
      );

      if (!cloneResult?.success) {
        console.log(
          "cloneComponentVM=======================>",
          cloneResult.message,
        );
        throw new Error(cloneResult.message);
      }
      // if (component.componenttype?.toLowerCase() === "lxc") {
      //   console.log(
      //     `Waiting ${
      //       cloningDelayMs / 1000
      //     } seconds before cloning next LXC component...`,
      //   );
        await sleep(cloningDelayMs);
      // }
    }

    await db.sequelize.query(
      `UPDATE vm_request SET vm_steps = 'Cloning', modifiedon = NOW() WHERE vmrequestid = ?`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    console.log(
      `Waiting ${configurationDelayMs / 1000} seconds before configuration...`,
    );
    await sleep(configurationDelayMs);

    const updatedComponents = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid, componenttype, componentname AS name, network_bridge_json, duration, status 
       FROM vm_config 
       WHERE vmrequestid = ? AND status = 'Cloning'`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    const configureResult = await configureComponentVM(db, ipAddress, {
      scenarioid,
      requestedby_id,
      vmrequestid,
      components: updatedComponents,
      selectedNode,
    });

    if (!configureResult?.success) {
      console.log(
        "configureComponentVM=======================>",
        configureResult.message,
      );
      throw new Error(configureResult.message);
    }

    const componentsForStart = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid, componenttype, componentname AS name, network_bridge_json, duration, status
       FROM vm_config
       WHERE vmrequestid = ? AND status = 'Bridge Configuration'`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    const startResult = await startComponentVM(db, ipAddress, {
      scenarioid,
      requestedby_id,
      vmrequestid,
      components: componentsForStart,
      selectedNode,
    });

    if (!startResult?.success) {
      console.log(
        "startComponentVM=======================>",
        startResult.message,
      );
      throw new Error(startResult.message);
    }

    return {
      success: true,
      message: "All VMs successfully cloned, configured, and started.",
    };
  } catch (err) {
    const reason = err.message;
    console.error(
      "Final Catch stopAndDestroyComponentVM================================>",
      reason,
    );

    await handleComponentFailure(
      db,
      scenarioid,
      requestedby_id,
      vmrequestid,
      statusVal,
      reason,
    );

    await stopAndDestroyComponentVM(db, ipAddress, {
      scenarioid,
      requestedby_id,
      vmrequestid,
    });

    console.error(
      "Final Catch handleComponentFailure================================>",
      reason,
    );
  }
}

// async function cloneComponentVM(db, ipAddress, component, vmrequestid,selectedNode) {
//   const {
//     vmconfigurationid,
//     clone_vmid,
//     name,
//     componenttype,
//     source_vmid,
//     scenarioid,
//     requestedby_id,
//   } = component;
//   const vmType = componenttype.toLowerCase();
//   const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
//   const result = await proxmoxService.cloneVM(
//     vmType,
//     clone_vmid,
//     name,
//     source_vmid,
//     selectedNode,
//   );
//   if (!result || result.status !== 200) {
//     return {
//       success: false,
//       message: `${clone_vmid}-${name} - ${ERROR_MESSAGES.CLONE_FAILED}`,
//     };
//   }
//     console.log(`Clone succeeded for ${clone_vmid}-${name} on ${selectedNode}`);

//   await db.sequelize.query(
//     `UPDATE vm_config SET status = 'Cloning', modifiedon = NOW() WHERE vmconfigurationid = ?`,
//     {
//       replacements: [vmconfigurationid],
//       type: db.sequelize.QueryTypes.UPDATE,
//     },
//   );

//   return { success: true };
// }

async function cloneComponentVM(db, ipAddress, component, vmrequestid, selectedNode) {
  const { vmconfigurationid, clone_vmid, name, componenttype, source_vmid } = component;

  const vmType         = componenttype.toLowerCase();
  const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
  const cfg            = await proxmoxService.getProxmoxConfig();
  const sourceNode     = cfg.current_node; // "sibersim"

  // Step 1: Clone on sourceNode, disk lands on shared 'bank'
  const result = await proxmoxService.cloneVM(
    vmType,
    clone_vmid,
    name,
    source_vmid,
    selectedNode, // not used for URL anymore, kept for logging/signature
  );

  if (!result || result.status !== 200) {
    return { success: false, message: `${clone_vmid}-${name} - ${ERROR_MESSAGES.CLONE_FAILED}` };
  }

  console.log(`Clone succeeded for ${clone_vmid}-${name} on ${sourceNode}`);

  const cloneTaskId = result.data?.data;
  if (cloneTaskId) {
    console.log(`[cloneComponentVM] Waiting for clone task ${cloneTaskId}...`);
    const cloneDone = await proxmoxService.waitForTask(sourceNode, cloneTaskId);
    if (!cloneDone) {
      return { success: false, message: `${clone_vmid}-${name} - Clone task timed out or failed.` };
    }
  }

  // Step 2: Migrate to selectedNode if different — disk is on shared 'bank', so this is fast
  if (selectedNode && selectedNode !== sourceNode) {
    console.log(`[cloneComponentVM] Migrating ${clone_vmid}-${name} from ${sourceNode} → ${selectedNode}`);

    const migrateResult = await proxmoxService.migrateVM(vmType, clone_vmid, sourceNode, selectedNode);

    if (!migrateResult || migrateResult.status !== 200) {
      return { success: false, message: `${clone_vmid}-${name} - Migration failed after cloning.` };
    }

    const migrateTaskId = migrateResult.data?.data;
    if (migrateTaskId) {
      console.log(`[cloneComponentVM] Waiting for migration task ${migrateTaskId}...`);
      const migrateDone = await proxmoxService.waitForTask(sourceNode, migrateTaskId);
      if (!migrateDone) {
        return { success: false, message: `${clone_vmid}-${name} - Migration task timed out or failed.` };
      }
    }

    console.log(`Migration complete for ${clone_vmid}-${name} on ${selectedNode}`);
  }

  await db.sequelize.query(
    `UPDATE vm_config SET status = 'Cloning', modifiedon = NOW() WHERE vmconfigurationid = ?`,
    { replacements: [vmconfigurationid], type: db.sequelize.QueryTypes.UPDATE },
  );

  return { success: true };
}

async function configureComponentVM(
  db,
  ipAddress,
  { scenarioid, requestedby_id, vmrequestid, components,selectedNode },
) {
  for (const component of components) {
    console.log(`Starting component Configure Bridge:`, component);
    const {
      vmconfigurationid,
      vmid,
      componenttype,
      network_bridge_json,
      name,
    } = component;
    const vmType = componenttype.toLowerCase();
    const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
    const bridgeJson = JSON.parse(network_bridge_json || "{}");
    const result = await proxmoxService.configureVM(vmid, vmType, bridgeJson,selectedNode);
    if (!result || result.status !== 200 || !result.data) {
      return {
        success: false,
        message: `${vmid}-${name} - ${ERROR_MESSAGES.CONFIGURATION_FAILED}`,
      };
    }
      console.log(`Bridge configure succeeded for ${vmid}-${name} on ${selectedNode}`);
    await db.sequelize.query(
      `UPDATE vm_config SET status = 'Bridge Configuration', modifiedon = NOW() WHERE vmconfigurationid = ?`,
      {
        replacements: [vmconfigurationid],
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );
  }

  await db.sequelize.query(
    `UPDATE vm_request SET vm_steps = 'Bridge Configuration', modifiedon = NOW() WHERE vmrequestid = ?`,
    {
      replacements: [vmrequestid],
      type: db.sequelize.QueryTypes.UPDATE,
    },
  );
  console.log(
    `All components configured. Request updated to 'Bridge Configuration'.`,
  );
  return { success: true };
}

async function startComponentVM(
  db,
  ipAddress,
  { scenarioid, requestedby_id, vmrequestid, components,selectedNode},
) {
  try {
    for (const component of components) {
      console.log(`Starting component to Start:`, component);
      const { vmid, componenttype, name, vmconfigurationid, duration } =
        component;
      const vmType = componenttype.toLowerCase();
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const result = await proxmoxService.startVM(vmid, vmType,selectedNode);
      if (!result || result.status !== 200 || !result.data) {
        return {
          success: false,
          message: `${vmid}-${name} - ${ERROR_MESSAGES.START_FAILED}`,
        };
      }
      console.log(`Started '${name}' on ${selectedNode} successfully.`);
      await db.sequelize.query(
        `UPDATE vm_config SET status = 'Starting', modifiedon = NOW() WHERE vmconfigurationid = ?`,
        {
          replacements: [vmconfigurationid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );

      let durationInSeconds = duration ? parseInt(duration, 10) : 0;
      console.log(
        `Waiting For Start ${vmid}-${name} for ${durationInSeconds} sec.`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, durationInSeconds * 1000),
      );
    }

    await db.sequelize.query(
      `UPDATE vm_config SET status = 'Running', modifiedon = NOW() WHERE scenarioid = ? AND vmrequestid = ? AND status = 'Starting'`,
      {
        replacements: [scenarioid, vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    await db.sequelize.query(
      `UPDATE vm_request SET vm_steps = 'Running', modifiedon = NOW(), startedon = CURRENT_TIMESTAMP
       WHERE vmrequestid = ?`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    console.log(
      `All components started. Request and components updated to 'Running'.`,
    );

    const [request] = await db.sequelize.query(
      `SELECT network_bridges FROM vm_request WHERE vmrequestid = ? AND scenarioid = ? AND requestedby_id = ?`,
      {
        replacements: [vmrequestid, scenarioid, requestedby_id],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (request && request.network_bridges) {
      const bridgeArray = JSON.parse(request.network_bridges || "[]");
      const bridgeNames = bridgeArray.map((b) => b.networkname);

      if (bridgeNames.length > 0) {
        console.log("Bridge names to update:", bridgeNames);

        await db.sequelize.query(
          `UPDATE networks 
           SET status = 'In Use', modifiedon = NOW()
           WHERE networkname IN (:bridges) AND status = 'Occupied'`,
          {
            replacements: { bridges: bridgeNames },
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
      }
    }

    await db.sequelize.query(
      `UPDATE vm_request SET status = 'Start', modifiedon = NOW() WHERE vmrequestid = ? AND vm_steps = 'Running'`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    // Fetch scenario diagram from scenarios table
    const [scenarioData] = await db.sequelize.query(
      `SELECT scenariodiagram FROM scenarios WHERE scenarioid = ?`,
      {
        replacements: [scenarioid],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    let diagram = JSON.parse(scenarioData.scenariodiagram);

    // Fetch component details to map vmid and component names
    // const componentDetails = await db.sequelize.query(
    //   `SELECT vmid, componentname, nodeid, componenttype
    //    FROM vm_config
    //    WHERE vmrequestid = ? AND scenarioid = ? AND requestedby_id = ?`,
    //   {
    //     replacements: [vmrequestid, scenarioid, requestedby_id],
    //     type: db.sequelize.QueryTypes.SELECT,
    //   }
    // );
    const componentDetails = await db.sequelize.query(
      `
  SELECT 
    vc.vmid,
    vc.componentname,
    vc.nodeid,
    vc.componenttype
  FROM vm_config vc
  INNER JOIN vm_request vr
    ON vr.vmrequestid = vc.vmrequestid
  WHERE
    vc.vmrequestid = ?
    AND vc.scenarioid = ?
    AND vr.requestedby_id = ?

  `,
      {
        replacements: [vmrequestid, scenarioid, requestedby_id],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    const vmMap = {};
    componentDetails.forEach((comp) => {
      vmMap[comp.nodeid] = {
        vmid: comp.vmid,
        componenttype: comp.componenttype?.toLowerCase(),
        componentname: comp.componentname,
      };
    });

    if (Array.isArray(diagram.nodes)) {
      diagram.nodes = diagram.nodes.map((node) => {
        const nodeid = node.id;
        const vmData = vmMap[nodeid];

        if (vmData?.vmid) {
          const { vmid, componenttype, componentname } = vmData;
          node.data.label = `${vmid} - ${componentname}`;
          node.data.isOnline = "Yes";
          node.data.vmid = vmid;
          node.data.vmType = componenttype;
        }
        return node;
      });
    }

    if (typeof request.network_bridges === "string") {
      try {
        request.network_bridges = JSON.parse(request.network_bridges);
      } catch (e) {
        console.error("Failed to parse network_bridges:", e);
        request.network_bridges = [];
      }
    }

    if (Array.isArray(request.network_bridges)) {
      const networkBridges = JSON.parse(
        JSON.stringify(request.network_bridges),
      );

      diagram.edges = diagram.edges.map((edge) => {
        const currentLabel = edge.data?.label?.toString();
        const matchedBridge = networkBridges.find(
          (bridge) => bridge.networkkey?.toString() === currentLabel,
        );

        if (matchedBridge) {
          edge.data.label = matchedBridge.networkname;
        } else {
          console.log(`No match found for label ${currentLabel}`);
        }
        return edge;
      });
    }

    if (Array.isArray(diagram.edges)) {
      diagram.edges = diagram.edges.map((edge) => ({
        ...edge,
        isAttacked: "Yes",
      }));
    }

    // Update vm_request with modified diagram
    await db.sequelize.query(
      `UPDATE vm_request SET scenariodiagram = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
      {
        replacements: [JSON.stringify(diagram), vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );
    console.log("Scenario diagram updated in request.");

    return { success: true };
  } catch (err) {
    console.error("Unhandled error in startComponentVM:", err);
    return {
      success: false,
      message: `${ERROR_MESSAGES.UNHANDLED_START_ERROR}`,
    };
  }
}

// handler for stop and destroy
async function markOperationFailedAndNotify(
  db,
  vmrequestid,
  err,
  scenarioid,
  requestedby_id,
) {
  const OP_FAILED = "Operation Failed";
  console.error("Operation failed:", err?.message || err);
  await sendProxmoxDownAlerts(db, requestedby_id);

  await new NotiTemplate(
    db,
    "proxmox_terminate",
    { userid: 0, scenarioid, requestedby_id },
    "Admin",
    0,
  );

  await db.sequelize.query(
    `UPDATE vm_request
     SET vm_steps = ?, modifiedon = NOW()
     WHERE vmrequestid = ?`,
    {
      replacements: [OP_FAILED, vmrequestid],
      type: db.sequelize.QueryTypes.UPDATE,
    },
  );

  await db.sequelize.query(
    `INSERT INTO vm_request_logs
      (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
      VALUES (?, ?, ?, 'System', 'Operation Failed', 'Failed to Stop and destroy the component', NOW())`,
    {
      replacements: [vmrequestid, scenarioid, requestedby_id],
      type: db.sequelize.QueryTypes.INSERT,
    },
  );
}
const getTerminationDelay = async (db) => {
  try {
    const [settings] = await db.sequelize.query(
      `SELECT termination_delay FROM web_settings WHERE status = 1 LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT },
    );

    const delaySeconds =
      settings?.termination_delay && Number.isFinite(settings.termination_delay)
        ? settings.termination_delay
        : 10;

    return delaySeconds * 1000; // convert to ms
  } catch (err) {
    console.error("Error fetching termination_delay:", err);
    return 10000; // fallback to 10 sec
  }
};

async function stopAndDestroyComponentVM(
  db,
  ipAddress,
  { scenarioid, requestedby_id, vmrequestid },
) {
  const OP_FAILED = "Operation Failed";
  let hasFailed = false;

  const handleFailureOnce = async (err) => {
    if (!hasFailed) {
      hasFailed = true;
      await markOperationFailedAndNotify(
        db,
        vmrequestid,
        err,
        scenarioid,
        requestedby_id,
      );
    }
  };

  try {
    const components = await db.sequelize.query(
      `
  SELECT
    vc.vmconfigurationid,
    vc.vmid,
    vc.componenttype,
    vc.componentname AS name,
    vc.status
  FROM vm_config vc
  INNER JOIN vm_request vr
    ON vr.vmrequestid = vc.vmrequestid
  WHERE
    vc.scenarioid = ?
    AND vc.vmrequestid = ?
    AND vr.requestedby_id = ?
    AND vr.requestedby_role = 'Learner'
  `,
      {
        replacements: [scenarioid, vmrequestid, requestedby_id],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (!components || components.length === 0) {
      console.error("No components found.");
      return { success: false, message: "No components found." };
    }

    console.log("Start Components to stop and destroy:");

    const vmConfig = {};
    components.forEach(({ vmid }) => {
      vmConfig[vmid] = { stop: false, destroy: false };
    });

    // 1️⃣ STOP phase
    for (const component of components) {
      if (component.status !== "Initializing") {
        const { vmid, componenttype, name, vmconfigurationid } = component;
        if (component.status == "Starting" || component.status == "Running") {
          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

          const tokenResult = await proxmoxService.generateAccessTicket();
          if (!tokenResult || tokenResult.status !== "200") {
            await handleFailureOnce(
              new Error("siberSIM connection failed before stop/destroy"),
            );
            continue;
          }
          console.log(
            `${vmid}-${name} Components to stop process started. Current Status : ${component.status}`,
          );
          const stopResult = await proxmoxService.stopVM(vmid, vmType);
          if (stopResult?.status === 200 && stopResult?.data) {
            console.log(`Stopped '${name}' (VMID: ${vmid})`);
            vmConfig[vmid].stop = true;
          } else {
            console.log(`Failed: Stop '${name}' (VMID: ${vmid})`);
            await db.sequelize.query(
              `UPDATE vm_config 
               SET status = ?, modifiedon = NOW() 
               WHERE vmconfigurationid = ?`,
              {
                replacements: ["Stopped", vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
            await handleFailureOnce(new Error(`Stop failed for ${name}`));
          }
        } else {
          vmConfig[vmid].stop = true;
        }
      }
    }

    await sleep(await getTerminationDelay(db));

    // 2️⃣ DESTROY phase
    for (const component of components) {
      const { vmid, componenttype, name, vmconfigurationid, status } =
        component;
      if (
        status == "Cloning" ||
        status == "Bridge Configuration" ||
        status == "Stopped"
      ) {
        if (!vmConfig[vmid].stop) continue;

        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        // const tokenResult = await proxmoxService.generateAccessTicket();
        // if (!tokenResult || tokenResult.status !== "200") {
        //   return {
        //     success: false,
        //     message: `Could not connect to the siberSIM server while Starting. Please check server status or credentials.`,
        //   };
        // }
        const destroyResult = await proxmoxService.destroyVM(vmid, vmType);
        if (destroyResult?.status === 200 && destroyResult?.data) {
          console.log(`Destroyed '${name}' (VMID: ${vmid})`);
          vmConfig[vmid].destroy = true;

          await db.sequelize.query(
            `UPDATE vm_config 
             SET status = ?, modifiedon = NOW() 
             WHERE vmconfigurationid = ?`,
            {
              replacements: ["Completed", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
        } else {
          console.log(`Failed: Destroy '${name}' (VMID: ${vmid})`);
          await db.sequelize.query(
            `UPDATE vm_config 
             SET status = ?, modifiedon = NOW() 
             WHERE vmconfigurationid = ?`,
            {
              replacements: ["Destroyed", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
          await handleFailureOnce(new Error(`Destroy failed for ${name}`));
        }
      } else if (status == "Initializing") {
        await db.sequelize.query(
          `UPDATE vm_config 
           SET status = ?, modifiedon = NOW() 
           WHERE vmconfigurationid = ?`,
          {
            replacements: ["Failed", vmconfigurationid],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
      }
    }

    if (!hasFailed) {
      console.log(
        "All applicable VMs stopped, destroyed, and marked as Completed.",
      );
    } else {
      console.log("Some VMs failed during stop/destroy process.");
    }
  } catch (err) {
    console.error(
      `Unhandled error in stopAndDestroyComponentVM: ${err.message}`,
    );
    await handleFailureOnce(err);
  }
}

async function handleComponentFailure(
  db,
  scenarioid,
  requestedby_id,
  vmrequestid,
  currentStatus,
  reason,
) {
  console.error(
    `Marking all components and request as 'Failed'. Reason: ${reason}`,
  );

  const [result] = await db.sequelize.query(
    `SELECT requestedby_id, network_bridges, scenariodiagram
     FROM vm_request
     WHERE vmrequestid = ?`,
    {
      replacements: [vmrequestid],
      type: db.sequelize.QueryTypes.SELECT,
    },
  );

  let scenariodiagram;
  if (result?.scenariodiagram) {
    try {
      scenariodiagram = JSON.parse(result.scenariodiagram);

      scenariodiagram.nodes?.forEach((node) => {
        if (node?.data?.isOnline) node.data.isOnline = "No";
      });
      scenariodiagram.edges?.forEach((edge) => {
        if (edge?.isAttacked) edge.isAttacked = "No";
      });

      await db.sequelize.query(
        `UPDATE vm_request
         SET scenariodiagram = ?, modifiedon = NOW()
         WHERE vmrequestid = ?`,
        {
          replacements: [JSON.stringify(scenariodiagram), vmrequestid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );
    } catch (diagramErr) {
      console.error("Error resetting diagram at start:", diagramErr);
    }
  }

  // 2. Mark request as Failed
  await db.sequelize.query(
    `UPDATE vm_request
     SET vm_steps = 'Failed', status = 'Failed', modifiedon = NOW(), failedon = NOW()
     WHERE vmrequestid = ?`,
    {
      replacements: [vmrequestid],
      type: db.sequelize.QueryTypes.UPDATE,
    },
  );

  if (result?.requestedby_id) {
    if (result?.network_bridges) {
      // Release network bridges
      let availableNetworks = JSON.parse(result?.network_bridges);
      const bridgesToFree = new Set();
      for (const net of availableNetworks) {
        if (net.networkname) {
          bridgesToFree.add(net.networkname);
        }
      }
      if (bridgesToFree.size > 0) {
        for (const bridge of bridgesToFree) {
          await db.sequelize.query(
            `UPDATE networks SET status = ?, modifiedon = NOW() WHERE networkjson LIKE ?`,
            {
              replacements: ["Available", `%${bridge}%`],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
        }
      }

      // await db.sequelize.query(
      //   `UPDATE vm_config
      //    SET status = 'Failed', modifiedon = NOW()
      //    WHERE scenarioid = ? AND requestedby_id = ? AND vmrequestid = ? AND status = ?`,
      //   {
      //     replacements: [scenarioid, requestedby_id, vmrequestid, currentStatus],
      //     type: db.sequelize.QueryTypes.UPDATE,
      //   }
      // );
      await db.sequelize.query(
        `
  UPDATE vm_config vc
  INNER JOIN vm_request vr
    ON vr.vmrequestid = vc.vmrequestid
  SET
    vc.status = 'Failed',
    vc.modifiedon = NOW()
  WHERE
    vc.scenarioid = ?
    AND vc.vmrequestid = ?
    AND vr.requestedby_id = ?
    AND vc.status = ?
  `,
        {
          replacements: [
            scenarioid,
            vmrequestid,
            requestedby_id,
            currentStatus,
          ],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );
    }
  }

  // 3. Insert into vm_request_logs
  await db.sequelize.query(
    `INSERT INTO vm_request_logs
     (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
     VALUES (?, ?, ?, 'System', 'Failed', ?, NOW())`,
    {
      replacements: [vmrequestid, scenarioid, requestedby_id, reason],
      type: db.sequelize.QueryTypes.INSERT,
    },
  );
}

async function sendProxmoxDownAlerts(db, requestedby_id = 0) {
  // Notification
  new NotiTemplate(
    db,
    "proxmox_down",
    { learner_id: requestedby_id || 0, userid: 0 },
    "System",
    0,
  );

  // Mail
  new MailTemplate(db, "proxmox_down_alert", {
    downdatetime: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  });
}

module.exports = {
  componentSetupJob,
  handleComponentFailure,
  sendProxmoxDownAlerts,
};
