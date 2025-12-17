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
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const cloningDelayMs =
      settings?.[0]?.cloning_delay && Number.isFinite(settings[0].cloning_delay)
        ? settings[0].cloning_delay * 1000
        : 3000;

    const configurationDelayMs =
      settings?.[0]?.configuration_delay &&
      Number.isFinite(settings[0].configuration_delay)
        ? settings[0].configuration_delay * 1000
        : 5000;

    return { cloningDelayMs, configurationDelayMs };
  } catch (err) {
    console.error("Error fetching delays:", err);
    return { cloningDelayMs: 10000, configurationDelayMs: 15000 };
  }
};

async function componentSetupJob(db, ipAddress, { scenarioid, vmrequestid,requestedby_id,
            requestedby_role, }) {
  console.log(`Starting component setup job for Scenario: ${scenarioid}, User: ${requestedby_id}`);

  const statusVal = "Initializing";

  try {
    // Fetch VM Config rows for this request
    const componentConfig = await db.sequelize.query(
      `SELECT vmconfigurationid, componentid, \`order\`, vmid AS clone_vmid, 
              componentname AS name, duration, componenttype, master_vmid AS source_vmid, network_bridge_json
       FROM vm_config
       WHERE vmrequestid = ? AND status = ?`,
      { replacements: [vmrequestid, statusVal], type: db.sequelize.QueryTypes.SELECT }
    );

    if (!componentConfig.length) {
      console.error(ERROR_MESSAGES.CONFIG_NOT_FOUND);
      await handleVMRequestFailure(db,scenarioid,requestedby_id, vmrequestid, statusVal, ERROR_MESSAGES.CONFIG_NOT_FOUND);
      return { success: false, message: ERROR_MESSAGES.CONFIG_NOT_FOUND };
    }

    // Insert VM request log
    await db.sequelize.query(
      `INSERT INTO vm_request_logs
       (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
       VALUES (?, ?, ?, 'System', 'Initiated', ?, NOW())`,
      { replacements: [vmrequestid, scenarioid, 0, ERROR_MESSAGES.VM_CONFIG_INIT], type: db.sequelize.QueryTypes.INSERT }
    );

    const { cloningDelayMs, configurationDelayMs } = await getDelays(db);

    // Step 1: Cloning
    for (const component of componentConfig) {
      console.log(`Starting component Cloning:`, component);
      const cloneResult = await cloneComponentVM(db, ipAddress, component, vmrequestid);
      if (!cloneResult?.success) throw new Error(cloneResult.message);

      if (component.componenttype?.toLowerCase() === "lxc") {
        console.log(`Waiting ${cloningDelayMs / 1000} seconds before cloning next LXC component...`);
        await sleep(cloningDelayMs);
      }
    }

    await db.sequelize.query(
      `UPDATE vm_request SET vm_steps = 'Cloning', modifiedon = NOW() WHERE vmrequestid = ?`,
      { replacements: [vmrequestid], type: db.sequelize.QueryTypes.UPDATE }
    );

    console.log(`Waiting ${configurationDelayMs / 1000} seconds before configuration...`);
    await sleep(configurationDelayMs);

    const updatedComponents = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid, componenttype, componentname AS name, network_bridge_json, duration, status 
       FROM vm_config 
       WHERE vmrequestid = ? AND status = 'Cloning'`,
      { replacements: [vmrequestid], type: db.sequelize.QueryTypes.SELECT }
    );

    const configureResult = await configureComponentVM(db, ipAddress, {
      vmrequestid,
      requestedby_id,
      components: updatedComponents,
    });
    if (!configureResult?.success) throw new Error(configureResult.message);

    const componentsForStart = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid, componenttype, componentname AS name, network_bridge_json, duration, status
       FROM vm_config
       WHERE vmrequestid = ? AND status = 'Bridge Configuration'`,
      { replacements: [vmrequestid], type: db.sequelize.QueryTypes.SELECT }
    );

    const startResult = await startComponentVM(db, ipAddress, {
      scenarioid,
      vmrequestid,
      requestedby_id,
      components: componentsForStart,
    });
    if (!startResult?.success) throw new Error(startResult.message);

    return { success: true, message: "All VMs successfully cloned, configured, and started." };
  } catch (err) {
    const reason = err.message;
    console.error("Final Catch componentSetupJob =================================>", reason);
    await handleVMRequestFailure(db,scenarioid,requestedby_id, vmrequestid, statusVal, reason);
      await stopAndDestroyComponentVM(db, ipAddress, {
      scenarioid,
      vmrequestid,
    });
    // await stopAndDestroyComponentVM(db, ipAddress, { vmrequestid });
    console.error("Final Catch handleVMRequestFailure================================>", reason);
  }
}


async function cloneComponentVM(db, ipAddress, component) {
  const { vmconfigurationid, clone_vmid, name, componenttype, source_vmid } = component;
  console.log("componentcomponentcomponent",component);
  
  const vmType = componenttype.toLowerCase();
  const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
  const tokenResult = await proxmoxService.generateAccessTicket();

  if (!tokenResult || tokenResult.status != "200") {
    return { success: false, message: `Could not connect to Proxmox server while Cloning.` };
  }

  const result = await proxmoxService.cloneVM(vmType, clone_vmid, name, source_vmid);
  if (!result || result.status !== 200) {
    return { success: false, message: `${clone_vmid}-${name} - ${ERROR_MESSAGES.CLONE_FAILED}` };
  }

  console.log(`Clone succeeded for ${clone_vmid}-${name}`);

  await db.sequelize.query(
    `UPDATE vm_config SET status = 'Cloning', modifiedon = NOW() WHERE vmconfigurationid = ?`,
    { replacements: [vmconfigurationid], type: db.sequelize.QueryTypes.UPDATE }
  );

  return { success: true };
}

async function configureComponentVM(db, ipAddress, { vmrequestid,requestedby_id, components }) {
  for (const component of components) {
    console.log(`Starting component Configure Bridge:`, component);
    const { vmconfigurationid, vmid, componenttype, network_bridge_json, name } = component;
    const vmType = componenttype.toLowerCase();
    const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
    const tokenResult = await proxmoxService.generateAccessTicket();

    if (!tokenResult || tokenResult.status != "200") {
      return { success: false, message: `Could not connect to Proxmox server while Configuring.` };
    }

    const bridgeJson = JSON.parse(network_bridge_json || "{}");
    const result = await proxmoxService.configureVM(vmid, vmType, bridgeJson);
    if (!result || result.status !== 200 || !result.data) {
      return { success: false, message: `${vmid}-${name} - ${ERROR_MESSAGES.CONFIGURATION_FAILED}` };
    }

    console.log(`Bridge configure succeeded for ${vmid}-${name}`);

    await db.sequelize.query(
      `UPDATE vm_config SET status = 'Bridge Configuration', modifiedon = NOW() WHERE vmconfigurationid = ?`,
      { replacements: [vmconfigurationid], type: db.sequelize.QueryTypes.UPDATE }
    );
  }

  await db.sequelize.query(
    `UPDATE vm_request SET vm_steps = 'Bridge Configuration', modifiedon = NOW() WHERE vmrequestid = ?`,
    { replacements: [vmrequestid], type: db.sequelize.QueryTypes.UPDATE }
  );

  console.log(`All components configured. VM request updated to 'Bridge Configuration'.`);
  return { success: true };
}

async function startComponentVM(db, ipAddress, {scenarioid, vmrequestid,requestedby_id, components }) {
  try {
    for (const component of components) {
      console.log(`Starting component to Start:`, component);
      const { vmconfigurationid, vmid, componenttype, name, duration } = component;
      const vmType = componenttype.toLowerCase();
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();

      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: `Could not connect to Proxmox server while Starting.` };
      }

      const result = await proxmoxService.startVM(vmid, vmType);
      if (!result || result.status !== 200 || !result.data) {
        return { success: false, message: `${vmid}-${name} - ${ERROR_MESSAGES.START_FAILED}` };
      }

      console.log(`Started '${name}' successfully.`);

      await db.sequelize.query(
        `UPDATE vm_config SET status = 'Starting', modifiedon = NOW() WHERE vmconfigurationid = ?`,
        { replacements: [vmconfigurationid], type: db.sequelize.QueryTypes.UPDATE }
      );

      if (duration) await sleep(parseInt(duration, 10) * 1000);
    }

    await db.sequelize.query(
      `UPDATE vm_config SET status = 'Running', modifiedon = NOW() WHERE vmrequestid = ? AND requestedby_id =? AND status = 'Starting'`,
      { replacements: [vmrequestid,requestedby_id], type: db.sequelize.QueryTypes.UPDATE }
    );

    await db.sequelize.query(
      `UPDATE vm_request SET vm_steps = 'Running', status = 'Running', startedon = CURRENT_TIMESTAMP, modifiedon = NOW() WHERE vmrequestid = ?`,
      { replacements: [vmrequestid], type: db.sequelize.QueryTypes.UPDATE }
    );

    console.log(`All components started. VM request updated to 'Running'.`);





const [session] = await db.sequelize.query(
      `SELECT network_bridges FROM vm_request WHERE vmrequestid = ? AND scenarioid = ? AND learner_id = ?`,
      {
        replacements: [vmrequestid, scenarioid, learnerid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
   

    if (session && session.network_bridges) {
      const bridgeArray = JSON.parse(session.network_bridges || "[]");
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
          }
        );
      }
    }

    await db.sequelize.query(
      `UPDATE scenario_learner_session SET status = 'Start', modifiedon = NOW() WHERE scenariolearnersessionid = ? AND vm_steps = 'Running'`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );
    await db.sequelize.query(
      `UPDATE scenario_learner SET status = 'Running', modifiedon = NOW() WHERE scenarioid = ? AND learner_id = ?`,
      {
        replacements: [scenarioid, learnerid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    // Fetch scenario diagram from scenarios table
    const [scenarioData] = await db.sequelize.query(
      `SELECT scenariodiagram FROM scenarios WHERE scenarioid = ?`,
      {
        replacements: [scenarioid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    let diagram = JSON.parse(scenarioData.scenariodiagram);
    // Fetch component details to map vmid and component names
    const componentDetails = await db.sequelize.query(
      `SELECT vmid, componentname,nodeid,componenttype  FROM vm_configuration  WHERE scenariolearnersessionid = ? AND scenarioid = ? AND learner_id = ?`,
      {
        replacements: [scenariolearnersessionid, scenarioid, learnerid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    const vmMap = {};
    componentDetails.forEach((comp) => {
      vmMap[comp.nodeid] = {
        vmid: comp.vmid,
        componenttype: comp.componenttype?.toLowerCase(), // 'qemu' or 'lxc'
        componentname: comp.componentname,
      };
    });
console.log("diagramdiagram",diagram);

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

    if (typeof session.network_bridges === "string") {
      try {
        session.network_bridges = JSON.parse(session.network_bridges);
      } catch (e) {
        console.error("Failed to parse network_bridges:", e);
        session.network_bridges = [];
      }
    }
    if (Array.isArray(session.network_bridges)) {
      const networkBridges = JSON.parse(
        JSON.stringify(session.network_bridges)
      );

      diagram.edges = diagram.edges.map((edge) => {
        const currentLabel = edge.data?.label?.toString();
        const matchedBridge = networkBridges.find(
          (bridge) => bridge.networkkey?.toString() === currentLabel
        );

        if (matchedBridge) {
          edge.data.label = matchedBridge.networkname;
        } else {
          console.log(`No match found for label ${currentLabel}`);
        }
        return edge;
      });
    }

    // Update scenario_learner_session with modified diagram
    await db.sequelize.query(
      `UPDATE scenario_learner_session SET scenariodiagram = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
      {
        replacements: [JSON.stringify(diagram), scenariolearnersessionid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );
    console.log("Scenario diagram updated in session.");




    return { success: true };
  } catch (err) {
    console.error("Unhandled error in startComponentVM:", err);
    return { success: false, message: ERROR_MESSAGES.UNHANDLED_START_ERROR };
  }
}




// handler for stop and destroy
async function markOperationFailedAndNotify(
  db,
  vmrequestid,
  err,
  scenarioid,
  learner_id
) {
  const OP_FAILED = "Operation Failed";
  console.error("Operation failed:", err?.message || err);

  // 1. Send notification & email alert
  await sendProxmoxDownAlerts(db, learner_id);

  // 2. Notification using NotiTemplate
  // await new NotiTemplate(
  //   db,
  //   "proxmox_terminate",
  //   { userid: 0, scenarioid, learner_id },
  //   "Admin",
  //   0
  // );

  // 3. Update VM request status
  await db.sequelize.query(
    `UPDATE vm_request
     SET vm_steps = ?, modifiedon = NOW()
     WHERE vmrequestid = ?`,
    {
      replacements: [OP_FAILED, vmrequestid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );

  // 4. Insert log entry into vm_request_logs
  await db.sequelize.query(
    `INSERT INTO vm_request_logs
      (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
      VALUES (?, ?, ?, 'System', 'Operation Failed', 'Failed to Stop and destroy the component', NOW())`,
    {
      replacements: [vmrequestid, scenarioid],
      type: db.sequelize.QueryTypes.INSERT,
    }
  );
}

// Helper to fetch termination delay from DB
const getTerminationDelay = async (db) => {
  try {
    const [settings] = await db.sequelize.query(
      `SELECT termination_delay FROM web_settings WHERE status = 1 LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT }
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
  { scenarioid, learnerid, vmrequestid }
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
        learnerid
      );
    }
  };

  try {
    const components = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid, componenttype, componentname AS name, status 
       FROM vm_config 
       WHERE scenarioid = ? AND vmrequestid = ?`,
      {
        replacements: [scenarioid, vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      }
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

    // STOP phase
    for (const component of components) {
      if (component.status !== "Initializing") {
        const { vmid, componenttype, name, vmconfigurationid } = component;
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          await handleFailureOnce(new Error("Proxmox connection failed before stop/destroy"));
          continue;
        }

        console.log(
          `${vmid}-${name} Components to stop process started. Current Status : ${component.status}`
        );

        if (component.status === "Starting" || component.status === "Running") {
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
              }
            );
            await handleFailureOnce(new Error(`Stop failed for ${name}`));
          }
        } else {
          vmConfig[vmid].stop = true; // Already stopped
        }
      }
    }

    await sleep(await getTerminationDelay(db));

    // DESTROY phase
    for (const component of components) {
      const { vmid, componenttype, name, vmconfigurationid } = component;

      if (!vmConfig[vmid].stop) continue; // skip destroy if stop failed

      const vmType = componenttype.toLowerCase();
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        await handleFailureOnce(new Error("Proxmox connection failed before destroy"));
        continue;
      }

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
          }
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
          }
        );
        await handleFailureOnce(new Error(`Destroy failed for ${name}`));
      }
    }

    if (!hasFailed) {
      console.log("All applicable VMs stopped, destroyed, and marked as Completed.");
    } else {
      console.log("Some VMs failed during stop/destroy process.");
    }
  } catch (err) {
    console.error(`Unhandled error in stopAndDestroyComponentVM: ${err.message}`);
    await handleFailureOnce(err);
  }
}

async function handleVMRequestFailure(
  db,
  scenarioid,
  requestedby_id,
  vmrequestid,
  currentStatus,
  reason
) {
  console.error(`Marking all components and VM request as 'Failed'. Reason: ${reason}`);

  const [result] = await db.sequelize.query(
    `SELECT network_bridges FROM vm_request WHERE vmrequestid = ?`,
    {
      replacements: [vmrequestid],
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  // Mark VM request as Failed
  await db.sequelize.query(
    `UPDATE vm_request
     SET vm_steps = 'Failed', status = 'Failed', modifiedon = NOW(), failedon = NOW()
     WHERE vmrequestid = ?`,
    { replacements: [vmrequestid], type: db.sequelize.QueryTypes.UPDATE }
  );

  // Mark all related VM configs as Failed
  await db.sequelize.query(
    `UPDATE vm_config
     SET status = 'Failed', modifiedon = NOW()
     WHERE scenarioid = ? AND vmrequestid = ? AND status = ?`,
    { replacements: [scenarioid, vmrequestid, currentStatus], type: db.sequelize.QueryTypes.UPDATE }
  );

  // Release network bridges if any
  if (result?.network_bridges) {
    const bridges = JSON.parse(result.network_bridges);
    for (const net of bridges) {
      if (net.networkname) {
        await db.sequelize.query(
          `UPDATE networks SET status = 'Available', modifiedon = NOW() WHERE networkjson LIKE ?`,
          { replacements: [`%${net.networkname}%`], type: db.sequelize.QueryTypes.UPDATE }
        );
      }
    }
  }

  // Insert log into vm_request_logs
  await db.sequelize.query(
    `INSERT INTO vm_request_logs
     (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
     VALUES (?, ?, ?, 'System', 'Failed', ?, NOW())`,
    { replacements: [vmrequestid, scenarioid, learnerid, reason], type: db.sequelize.QueryTypes.INSERT }
  );
}

async function sendProxmoxDownAlerts(db, learner_id = 0) {
  new NotiTemplate(
    db,
    "proxmox_down",
    { learner_id: learner_id || 0, userid: 0 },
    "System",
    0
  );

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
  handleVMRequestFailure,
  sendProxmoxDownAlerts,
};
