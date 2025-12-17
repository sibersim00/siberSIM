const ProxMoxService = require("../services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../jobs/jobsConstants");

async function componentSetupJob(
  db,
  ipAddress,
  { scenarioid, learnerid, scenariolearnersessionid }
) {
  console.log(
    `Starting component setup job for Scenario: ${scenarioid}, Learner: ${learnerid}`
  );

  const statusVal = "Initializing";

  try {
    const componentConfig = await db.sequelize.query(
      `SELECT vmconfigurationid, componentid, \`order\`, vmid AS clone_vmid, 
              componentname AS name, duration, componenttype, master_vmid AS source_vmid
       FROM vm_configuration
       WHERE scenariolearnersessionid = ? AND status = ?`,
      {
        replacements: [scenariolearnersessionid, statusVal],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (componentConfig.length == 0) {
      console.error(ERROR_MESSAGES.CONFIG_NOT_FOUND);
      await handleComponentFailure(
        db,
        scenarioid,
        learnerid,
        scenariolearnersessionid,
        statusVal,
        ERROR_MESSAGES.CONFIG_NOT_FOUND
      );
      return {
        success: false,
        message: ERROR_MESSAGES.CONFIG_NOT_FOUND,
      };
    }
    const initiationRemark = `Component setup initiated for Scenario: ${scenarioid}, Learner: ${learnerid}`;
    await db.sequelize.query(
      `INSERT INTO scenario_learner_logs 
       (scenariolearnersessionid, scenarioid, learner_id, scenariolearnerid, type, remark, status, createdon)
       SELECT 
         sls.scenariolearnersessionid,
         sls.scenarioid,
         sls.learner_id,
         sls.scenariolearnerid,
         'System',
         ?,         
         'Initiated',
         NOW()
       FROM scenario_learner_session sls
       WHERE sls.scenariolearnersessionid = ?`,
      {
        replacements: [initiationRemark, scenariolearnersessionid],
        type: db.sequelize.QueryTypes.INSERT,
      }
    );

    for (const component of componentConfig) {
      try {
        console.log(`Starting component Clonning:`, component);
        await cloneComponentVM(
          db,
          ipAddress,
          component,
          scenariolearnersessionid
        );
      } catch (err) {
        const reason = `${ERROR_MESSAGES.UNHANDLED_SETUP_ERROR}: ${err.message}`;
        console.error(reason);
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          reason
        );
      }
    }

    const ids = componentConfig.map((c) => c.vmconfigurationid);
    await db.sequelize.query(
      `UPDATE vm_configuration
        SET status = 'Cloning', modifiedon = NOW()
        WHERE vmconfigurationid IN (:ids)`,
      {
        replacements: { ids },
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    await db.sequelize.query(
      `UPDATE scenario_learner_session
       SET vm_steps = 'Cloning', modifiedon = NOW()
       WHERE scenariolearnersessionid = ?`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    const updatedComponents = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid, componenttype, componentname AS name, network_bridge_json, status
   FROM vm_configuration
   WHERE scenariolearnersessionid = ? AND status = 'Cloning'`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    await configureComponentVM(db, ipAddress, {
      scenarioid,
      learnerid,
      scenariolearnersessionid,
      components: updatedComponents,
    });

    const updatedids = updatedComponents.map((c) => c.vmconfigurationid);
    await db.sequelize.query(
      `UPDATE vm_configuration
     SET status = 'Bridge Configuration', modifiedon = NOW()
     WHERE vmconfigurationid IN (:ids)`,
      {
        replacements: { ids: updatedids },
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    const componentsForStart = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid, componenttype, componentname AS name, network_bridge_json, status
     FROM vm_configuration
     WHERE scenariolearnersessionid = ? AND status = 'Bridge Configuration'`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    await startComponentVM(db, ipAddress, {
      scenarioid,
      learnerid,
      scenariolearnersessionid,
      components: componentsForStart,
    });
  } catch (err) {
    const reason = `Unhandled error in component setup: ${err.message}`;
    console.error(reason);
    await stopAndDestroyComponentVM(db, ipAddress, {
      scenarioid,
      learnerid,
      scenariolearnersessionid,
    });
    await handleComponentFailure(
      db,
      scenarioid,
      learnerid,
      scenariolearnersessionid,
      statusVal,
      reason
    );
  }
}

async function cloneComponentVM(
  db,
  ipAddress,
  component,
  scenariolearnersessionid
) {
  const {
    clone_vmid,
    name,
    componenttype,
    source_vmid,
    scenarioid,
    learner_id,
  } = component;

  const vmType = componenttype.toLowerCase();
  const statusVal = "Cloning";

  if (!clone_vmid || !source_vmid) {
    const missing = !clone_vmid
      ? ERROR_MESSAGES.MISSING_TARGET_VMID
      : ERROR_MESSAGES.MISSING_MASTER_VMID;

    const reason = `${missing} (Component: '${name}')`;
    console.error(reason);

    await handleComponentFailure(
      db,
      scenarioid,
      learner_id,
      scenariolearnersessionid,
      statusVal,
      reason
    );

    throw new Error(reason); // for stack trace clarity
  }

  try {
    const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
    await proxmoxService.generateAccessTicket();

    const result = await proxmoxService.cloneVM(
      vmType,
      clone_vmid,
      name,
      source_vmid
    );

    if (result?.status !== 200 || !result?.data) {
      const errorMsg = `${ERROR_MESSAGES.CLONE_FAILED}: '${name}' (status: ${result?.status})`;
      throw new Error(errorMsg);
    }

    if (!result) {
      throw new Error(`${ERROR_MESSAGES.CLONE_FAILED}: '${name}'`);
    }

    console.log(`Clone succeeded for '${name}'`);
    return true;
  } catch (err) {
    await handleComponentFailure(
      db,
      scenarioid,
      learner_id,
      scenariolearnersessionid,
      statusVal,
      `${ERROR_MESSAGES.CLONE_FAILED} (${name}): ${err.message}`
    );
    throw err;
  }
}

async function configureComponentVM(
  db,
  ipAddress,
  { scenarioid, learnerid, scenariolearnersessionid, components }
) {
  const statusVal = "Cloning";
  try {
    const filteredComponents = components.filter((c) => c.status === "Cloning");
    if (!filteredComponents || filteredComponents.length === 0) {
      await handleComponentFailure(
        db,
        scenarioid,
        learnerid,
        scenariolearnersessionid,
        statusVal,
        ERROR_MESSAGES.NO_COMPONENTS_FOR_STATUS
      );
      return {
        success: false,
        message: ERROR_MESSAGES.NO_COMPONENTS_FOR_STATUS,
      };
    }

    for (const component of filteredComponents) {
      console.log(`Starting component Configure Bridge:`, component);
      try {
        const { vmid, componenttype, network_bridge_json, name } = component;
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
        await proxmoxService.generateAccessTicket();
        const bridgeJson = JSON.parse(network_bridge_json || "{}");
        const result = await proxmoxService.configureVM(
          vmid,
          vmType,
          bridgeJson
        );
        if (result?.status !== 200 || !result?.data) {
          const errorMsg = `${ERROR_MESSAGES.CONFIGURATION_FAILED}: '${name}' (status: ${result?.status})`;
          throw new Error(errorMsg);
        }
        console.log(`Configured '${name}' successfully.`);
      } catch (err) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          `${ERROR_MESSAGES.CONFIGURATION_ERROR} (${component.name}): ${err.message}`
        );
        return {
          success: false,
          message: ERROR_MESSAGES.CONFIGURATION_ERROR,
        };
      }
    }
    // All succeeded
    await db.sequelize.query(
      `UPDATE vm_configuration
      SET status = 'Bridge Configuration', modifiedon = NOW()
      WHERE scenarioid = ? AND learner_id = ? AND status = ?`,
      {
        replacements: [scenarioid, learnerid, statusVal],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    await db.sequelize.query(
      `UPDATE scenario_learner_session
      SET vm_steps = 'Bridge Configuration', modifiedon = NOW()
      WHERE scenariolearnersessionid = ?`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    console.log(
      `All components configured. Session updated to 'Bridge Configuration'.`
    );
  } catch (err) {
    await handleComponentFailure(
      db,
      scenarioid,
      learnerid,
      scenariolearnersessionid,
      statusVal,
      `${ERROR_MESSAGES.UNHANDLED_CONFIGURE_ERROR}: ${err.message}`
    );
  }
}

async function startComponentVM(
  db,
  ipAddress,
  { scenarioid, learnerid, scenariolearnersessionid, components }
) {
  const statusVal = "Bridge Configuration";
  try {
    const filteredComponents = components.filter(
      (c) => c.status === "Bridge Configuration"
    );
    if (!filteredComponents || filteredComponents.length === 0) {
      await handleComponentFailure(
        db,
        scenarioid,
        learnerid,
        scenariolearnersessionid,
        statusVal,
        ERROR_MESSAGES.NO_COMPONENTS_FOR_STATUS
      );
      return {
        success: false,
        message: ERROR_MESSAGES.NO_COMPONENTS_FOR_STATUS,
      };
    }

    for (const component of filteredComponents) {
      console.log(`Starting component Starting:`, component);
      try {
        const { vmid, componenttype, name, vmconfigurationid } = component;
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
        await proxmoxService.generateAccessTicket();
        const result = await proxmoxService.startVM(vmid, vmType);
        if (result?.status !== 200 || !result?.data) {
          const errorMsg = `${ERROR_MESSAGES.START_FAILED}: '${name}' (status: ${result?.status})`;
          throw new Error(errorMsg);
        }
        console.log(`Started '${name}' successfully.`);
        await db.sequelize.query(
          `UPDATE vm_configuration SET status = 'Starting', modifiedon = NOW()
           WHERE vmconfigurationid = ?`,
          {
            replacements: [vmconfigurationid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );

        const [scenarioRow] = await db.sequelize.query(
          `SELECT component_config FROM scenarios WHERE scenarioid = ?`,
          {
            replacements: [scenarioid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        let durationInSeconds = 0;

        if (scenarioRow && scenarioRow.component_config) {
          try {
            const configArray = JSON.parse(scenarioRow.component_config);
            const matchedComponent = configArray.find((c) => c.vmid === vmid);
            const rawDuration = matchedComponent?.duration || "0";
            const parsedDuration = parseInt(rawDuration, 10);
            durationInSeconds = isNaN(parsedDuration) ? 0 : parsedDuration;
          } catch (e) {
            console.error(
              "Error parsing component_config or duration:",
              e.message
            );
          }
        }
        await new Promise((resolve) =>
          setTimeout(resolve, durationInSeconds * 1000)
        );
      } catch (err) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          `${ERROR_MESSAGES.START_ERROR} (${component.name}): ${err.message}`
        );
        return {
          success: false,
          message: ERROR_MESSAGES.START_ERROR,
        };
      }
    }

    await db.sequelize.query(
      `UPDATE vm_configuration SET status = 'Running', modifiedon = NOW() WHERE scenarioid = ? AND learner_id = ? AND status = 'Starting'`,
      {
        replacements: [scenarioid, learnerid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    await db.sequelize.query(
      `UPDATE scenario_learner_session SET vm_steps = 'Running', modifiedon = NOW(),startedon = CURRENT_TIMESTAMP
       WHERE scenariolearnersessionid = ?`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    console.log(
      `All components started. Session and components updated to 'Running'.`
    );
    const [session] = await db.sequelize.query(
      `SELECT network_bridges FROM scenario_learner_session WHERE scenariolearnersessionid = ? AND scenarioid = ? AND learner_id = ?`,
      {
        replacements: [scenariolearnersessionid, scenarioid, learnerid],
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
      `UPDATE scenario_learner_session SET status = 'Start', modifiedon = NOW()
        WHERE scenariolearnersessionid = ? AND vm_steps = 'Running'`,
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

    if (scenarioData && scenarioData.scenariodiagram) {
      let diagram;
      try {
        diagram = JSON.parse(scenarioData.scenariodiagram);
      } catch (parseError) {
        console.error("Error parsing scenario diagram:", parseError);
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          `${ERROR_MESSAGES.UNHANDLED_START_ERROR}: Failed to parse scenario diagram`
        );
        return;
      }

      // Fetch component details to map vmid and component names
      const componentDetails = await db.sequelize.query(
        `SELECT vmid, componentname,nodeid,componenttype  FROM vm_configuration
             WHERE scenariolearnersessionid = ? AND scenarioid = ? AND learner_id = ?`,
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
        `UPDATE scenario_learner_session
             SET scenariodiagram = ?, modifiedon = NOW()
             WHERE scenariolearnersessionid = ?`,
        {
          replacements: [JSON.stringify(diagram), scenariolearnersessionid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      console.log("Scenario diagram updated in session.");
    } else {
      console.error("Scenario diagram not found in scenarios table.");
      await handleComponentFailure(
        db,
        scenarioid,
        learnerid,
        scenariolearnersessionid,
        statusVal,
        `${ERROR_MESSAGES.UNHANDLED_START_ERROR}: Scenario diagram not found`
      );
    }
  } catch (err) {
    console.error("Unhandled error in startComponentVM:", err);
    await handleComponentFailure(
      db,
      scenarioid,
      learnerid,
      scenariolearnersessionid,
      statusVal,
      `${ERROR_MESSAGES.UNHANDLED_START_ERROR}: ${err.message}`
    );
  }
}

async function stopAndDestroyComponentVM(
  db,
  ipAddress,
  { scenarioid, learnerid, scenariolearnersessionid }
) {
  const statusVal = "Starting";
  try {
    const components = await db.sequelize.query(
      `SELECT vmconfigurationid, vmid AS clone_vmid, componenttype, componentname AS name
       FROM vm_configuration
       WHERE scenarioid = ? AND learner_id = ? AND status = ?`,
      {
        replacements: [scenarioid, learnerid, statusVal],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!components || components.length === 0) {
      console.error("No components with status 'Starting' found.");
      return {
        success: false,
        message: "No components with status 'Starting' found.",
      };
    }
    console.log("Components to stop and destroy:", components);
    for (const component of components) {
      const { clone_vmid, componenttype, name } = component;

      try {
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
        await proxmoxService.generateAccessTicket();

        const result = await proxmoxService.stopVM(clone_vmid, vmType);
        if (result?.status !== 200 || !result?.data) {
          const errorMsg = `${ERROR_MESSAGES.STOP_ERROR}: '${name}' (status: ${result?.status})`;
          throw new Error(errorMsg);
        }
        console.log(`Stopped '${name}' (VMID: ${clone_vmid})`);

        const resultdestroy = await proxmoxService.destroyVM(
          clone_vmid,
          vmType
        );
        if (resultdestroy?.status !== 200 || !resultdestroy?.data) {
          const errorMsg = `${ERROR_MESSAGES.DESTROY_ERROR}: '${name}' (status: ${resultdestroy?.status})`;
          throw new Error(errorMsg);
        }
        console.log(`Destroyed '${name}' (VMID: ${clone_vmid})`);
      } catch (err) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          ERROR_MESSAGES.COMPONENT_OPERATION_FAILED
        );
        throw err;
      }
    }
    await handleComponentFailure(
      db,
      scenarioid,
      learnerid,
      scenariolearnersessionid,
      statusVal,
      ERROR_MESSAGES.CLEANUP_COMPLETED_WITH_FAILURE
    );
    console.log("All applicable VMs stopped, destroyed, and marked as Failed.");
  } catch (err) {
    console.error(
      `Unhandled error in stopAndDestroyComponentVM: ${err.message}`
    );
  }
}

async function handleComponentFailure(
  db,
  scenarioid,
  learnerid,
  scenariolearnersessionid,
  currentStatus,
  reason
) {
  console.error(
    `Marking all components and session as 'Failed'. Reason: ${reason}`
  );
  // 1. Mark components as Failed
  await db.sequelize.query(
    `UPDATE vm_configuration
     SET status = 'Failed', modifiedon = NOW()
     WHERE scenarioid = ? AND learner_id = ? AND status = ?`,
    {
      replacements: [scenarioid, learnerid, currentStatus],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );

  // 2. Mark session as Failed
  await db.sequelize.query(
    `UPDATE scenario_learner_session
     SET vm_steps = 'Failed', modifiedon = NOW(),failedon  = NOW()
     WHERE scenariolearnersessionid = ?`,
    {
      replacements: [scenariolearnersessionid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
  await db.sequelize.query(
    `UPDATE scenario_learner_session
     SET status = 'Failed', modifiedon = NOW()
     WHERE scenariolearnersessionid = ?`,
    {
      replacements: [scenariolearnersessionid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
  await db.sequelize.query(
    `UPDATE scenario_learner
     SET status = 'Terminated', modifiedon = NOW()
     WHERE scenariolearnerid = (
       SELECT scenariolearnerid
       FROM scenario_learner_session
       WHERE scenariolearnersessionid = ?
     )`,
    {
      replacements: [scenariolearnersessionid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );

  // 3. Insert into scenario_learner_logs
  await db.sequelize.query(
    `INSERT INTO scenario_learner_logs
     (scenariolearnersessionid, scenarioid, learner_id, scenariolearnerid, type, remark, status, createdon)
     SELECT
       sls.scenariolearnersessionid,
       sls.scenarioid,
       sls.learner_id,
       sls.scenariolearnerid,
       'System',
       ?,        
       'Failed',
       NOW()
     FROM scenario_learner_session sls
     WHERE sls.scenariolearnersessionid = ?`,
    {
      replacements: [reason, scenariolearnersessionid],
      type: db.sequelize.QueryTypes.INSERT,
    }
  );
  // 4. Release network bridges associated with these components
  const components = await db.sequelize.query(
    `SELECT network_bridge_json
     FROM vm_configuration
     WHERE scenarioid = ? AND learner_id = ?`,
    {
      replacements: [scenarioid, learnerid],
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  const bridgesToFree = new Set();

  for (const component of components) {
    if (!component.network_bridge_json) continue;

    let bridgeMap = {};
    try {
      bridgeMap = JSON.parse(component.network_bridge_json);
    } catch (err) {
      console.warn(
        `Invalid JSON in network_bridge_json for a component:`,
        err.message
      );
      continue;
    }

    const bridges = Object.values(bridgeMap)
      .map((val) => {
        const match = val.match(/bridge=([^,"]+)/);
        return match ? match[1] : null;
      })
      .filter((bridge) => !!bridge);

    for (const bridge of bridges) {
      bridgesToFree.add(bridge);
    }
  }

  if (bridgesToFree.size > 0) {
    for (const bridge of bridgesToFree) {
      await db.sequelize.query(
        `UPDATE networks
         SET status = 'Available', modifiedon = NOW()
         WHERE networkjson LIKE ?`,
        {
          replacements: [`%\"iface\":\"${bridge}\"%`],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
    }
  }
}
module.exports = {
  componentSetupJob,
  handleComponentFailure,
};
