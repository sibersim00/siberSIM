const { handleComponentFailure } = require("../../jobs/componentSetupJob");
const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../../jobs/jobsConstants");
const constants = require("../../services/proxmox/constants");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

const setScenarioLearnerConfiguration =
  ({ db }) =>
  async (scenarioid, learnerid, scenariolearnersessionid) => {
    try {
      const statusVal = "Initializing";

      const [webSettings] = await db.sequelize.query(
        `SELECT base_clone_vmid FROM web_settings WHERE company_id = 1 LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT }
      );

      const [learnerData] = await db.sequelize.query(
        `SELECT learner_id, scenariolearnerid, scenariolearnersessionid FROM scenario_learner_session WHERE scenariolearnersessionid = ? AND status = ? ORDER BY scenariolearnersessionid DESC LIMIT 1`,
        {
          replacements: [scenariolearnersessionid, statusVal],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!learnerData || !learnerData.scenariolearnersessionid) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerData?.learner_id || null,
          learnerData?.scenariolearnersessionid || null,
          statusVal,
          ERROR_MESSAGES.LEARNER_NOT_FOUND
        );
        return {
          success: false,
          message: ERROR_MESSAGES.LEARNER_NOT_FOUND,
        };
      }

      const [scenario] = await db.sequelize.query(
        `SELECT component_config,network_config FROM scenarios WHERE scenarioid = ? AND deletedon IS NULL AND scenariostatus = 'Publish' AND status = 'Active'`,
        {
          replacements: [scenarioid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!scenario || !scenario.component_config) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          ERROR_MESSAGES.CONFIG_NOT_FOUND_SCENARIO
        );
        return {
          success: false,
          message: ERROR_MESSAGES.CONFIG_NOT_FOUND_SCENARIO,
        };
      }

      const baseCloneVmid = parseInt(webSettings?.base_clone_vmid || 1000);
      const componentConfig = JSON.parse(scenario.component_config);
      const networkConfig = JSON.parse(scenario.network_config);

      const uniqueNetworkValueCount = networkConfig.length;
      if (uniqueNetworkValueCount == 0) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          ERROR_MESSAGES.NETWORK_BRIDGES
        );
        return {
          success: false,
          message: ERROR_MESSAGES.NETWORK_BRIDGES,
        };
      }

      const availableNetworks = await db.sequelize.query(
        `SELECT networkid, networkname FROM networks WHERE status = 'Available' AND deletedon IS NULL ORDER BY networkid ASC LIMIT ?`,
        {
          replacements: [uniqueNetworkValueCount],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (availableNetworks.length < uniqueNetworkValueCount) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          ERROR_MESSAGES.NETWORK_BRIDGES
        );
        return {
          success: false,
          message: ERROR_MESSAGES.NETWORK_BRIDGES,
        };
      } else {
        const networkIds = availableNetworks.map((item) => item.networkid);
        await db.sequelize.query(
          `UPDATE networks SET status = 'Occupied', modifiedon = NOW() WHERE networkid in (:networkIds)`,
          {
            replacements: { networkIds },
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      const networkArray = networkConfig.reduce((acc, key, index) => {
        availableNetworks[index].networkkey = key;
        acc[key] = availableNetworks[index];
        return acc;
      }, {});

      let allFailed = true;

      for (const item of componentConfig) {
        const {
          vmid,
          order,
          componentid,
          nodeid,
          componentname,
          duration,
          network_ids,
        } = item;

        let componenttype = "Unknown";
        let network_bridge_name = "{}";

        const [componentInfo] = await db.sequelize.query(
          `SELECT componenttype, network_bridge_name FROM components WHERE componentid = ?`,
          {
            replacements: [componentid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (componentInfo && componentInfo.componenttype) {
          componenttype = componentInfo.componenttype;
          network_bridge_name = componentInfo.network_bridge_name || "{}";
          allFailed = false;
        }

        const prefixMap = JSON.parse(network_bridge_name);
        const bridgeMap = networkArray;
        const network_bridge_json = {};
        for (const [netKey, netId] of Object.entries(network_ids)) {
          const prefix = prefixMap[netKey];
          const bridgeName = bridgeMap[netId]?.networkname;
          if (prefix && bridgeName) {
            network_bridge_json[netKey] = `${prefix},bridge=${bridgeName}`;
          }
        }

        const insertQuery = `INSERT INTO vm_configuration (scenarioid, learner_id, scenariolearnerid, scenariolearnersessionid, componentid, nodeid, componenttype, \`order\`, master_vmid, vmid, componentname, duration, network_bridge_json, status, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        const insertValues = [
          scenarioid,
          learnerData.learner_id,
          learnerData.scenariolearnerid,
          learnerData.scenariolearnersessionid,
          componentid,
          nodeid,
          componenttype,
          order,
          vmid,
          null,
          componentname,
          duration,
          JSON.stringify(network_bridge_json),
          componentInfo ? statusVal : "Failed",
        ];

        const [configInsert] = await db.sequelize.query(insertQuery, {
          replacements: insertValues,
          type: db.sequelize.QueryTypes.INSERT,
        });

        if (componentInfo) {
          const vmconfigurationid = configInsert;
          const realVmid = vmconfigurationid + baseCloneVmid;
          await db.sequelize.query(
            `UPDATE vm_configuration SET vmid = ? WHERE vmconfigurationid = ?`,
            {
              replacements: [realVmid, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }
      }

      const finalStatus = allFailed ? "Failed" : statusVal;
      await db.sequelize.query(
        `UPDATE scenario_learner_session 
        SET vm_steps = ?, status = ?, network_bridges = ?, modifiedon = NOW() 
        WHERE scenariolearnersessionid = ?`,
        {
          replacements: [
            finalStatus,
            allFailed ? "Failed" : "Initializing",
            JSON.stringify(availableNetworks),
            learnerData.scenariolearnersessionid,
          ],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      if (allFailed) {
        // 1. Release occupied network bridges
        const bridgesToFree = new Set();

        for (const net of availableNetworks) {
          if (net.networkname) {
            bridgesToFree.add(net.networkname);
          }
        }

        if (bridgesToFree.size > 0) {
          for (const bridge of bridgesToFree) {
            await db.sequelize.query(
              `UPDATE networks
         SET status = ?, modifiedon = NOW()
         WHERE networkjson LIKE ?`,
              {
                replacements: ["Available", `%${bridge}%`],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          }
        }

        // 2. Update session to 'Terminated'
        await db.sequelize.query(
          `UPDATE scenario_learner
   SET status = 'Terminated', modifiedon = NOW()
   WHERE scenariolearnerid = ?`,
          {
            replacements: [learnerData.scenariolearnerid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      return {
        success: !allFailed,
        message: allFailed
          ? "All components failed to configure."
          : "Set Configurations Successfully.",
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: "Unexpected error during scenario configuration.",
      };
    }
  };

const releaseNetworks = async (db, networksArray) => {
  const bridgesToFree = new Set();
  let bridgeMap;
  bridgeMap = JSON.parse(networksArray);
  bridgeMap.forEach((net) => {
    if (net.networkname) {
      bridgesToFree.add(net.networkname);
    }
  });

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
};

async function markOperationFailedAndNotify(
  db,
  scenariolearnersessionid,
  err,
  scenarioid,
  learner_id
) {
  const OP_FAILED = "Operation Failed";
  console.error("Operation failed:", err?.message || err);
  // 1. Send notification & email alert
  await sendProxmoxDownAlerts(db, learner_id);

  await new NotiTemplate(
    db,
    "Proxmox_Terminate",
    { userid: 0, scenarioid, learner_id },
    "Admin",
    0
  );

  await db.sequelize.query(
    `UPDATE scenario_learner_session
     SET vm_steps = ?, modifiedon = NOW()
     WHERE scenariolearnersessionid = ?`,
    {
      replacements: [OP_FAILED, scenariolearnersessionid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );

  // 4. Insert log entry
  await db.sequelize.query(
    `INSERT INTO scenario_learner_logs
      (scenariolearnersessionid, scenarioid, learner_id, scenariolearnerid, type, remark, status, createdon)
      SELECT
        sls.scenariolearnersessionid,
        sls.scenarioid,
        sls.learner_id,
        sls.scenariolearnerid,
        'System',
        'Failed to Stop and destroy the component',        
        'Operation Failed',
        NOW()
      FROM scenario_learner_session sls
      WHERE sls.scenariolearnersessionid = ?`,
    {
      replacements: [scenariolearnersessionid],
      type: db.sequelize.QueryTypes.INSERT,
    }
  );
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
    return 10000; // fallback to 10 secs
  }
};

const updateCompleteTerminate =
  ({ db, ipAddress }) =>
  async (scenariolearnersessionid, status, type) => {
    console.log("Update Terminate......");
    const RUNNING = "Running";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const FAILED = "Failed";
    const OP_FAILED = "Operation Failed";
    let hasFailed = false;

    const [session] = await db.sequelize.query(
      `SELECT scenarioid, learner_id, vm_steps, network_bridges FROM scenario_learner_session
      WHERE scenariolearnersessionid = ? LIMIT 1`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    const handleFailureOnce = async (err) => {
      if (!hasFailed) {
        hasFailed = true;
        await markOperationFailedAndNotify(
          db,
          scenariolearnersessionid,
          err,
          session.scenarioid,
          session.learner_id
        );
      }
    };

    try {
      if (session.vm_steps !== RUNNING && session.vm_steps !== OP_FAILED) {
        return {
          success: false,
          message: `Session vm_steps must be '${RUNNING}' or '${OP_FAILED}' to terminate.`,
        };
      }

      // Fetch components
      const components = await db.sequelize.query(
        `SELECT * FROM vm_configuration WHERE scenariolearnersessionid = ?`,
        {
          replacements: [scenariolearnersessionid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      // 1. Stop all components first
      // 1️⃣ Create single tracking object

      const vmConfig = {};

      components.forEach(({ vmid }) => {
        vmConfig[vmid] = { stop: false, destroy: false };
      });

      // 2️⃣ Stop loop

      for (const {
        vmid,
        componenttype,
        componentname,
        vmconfigurationid,
      } of components) {
        const proxmoxService = ProxMoxService(
          db,
          { vmType: componenttype.toLowerCase() },
          ipAddress
        );
        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          return {
            success: false,
            message: `Could not connect to the Proxmox server while destroying components.`,
          };
        }

        const stopResult = await proxmoxService.stopVM(
          vmid,
          componenttype.toLowerCase()
        );

        if (stopResult?.status === 200 && stopResult?.data) {
          vmConfig[vmid].stop = true;
        } else {
          await db.sequelize.query(
            `UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,

            {
              replacements: ["Stopped", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );

          await handleFailureOnce(
            new Error(`Stop failed for ${componentname}`)
          );
        }
      }

      // Wait before destroy

      await sleep(await getTerminationDelay(db));

      // 3️⃣ Destroy loop (only for stop success) & mark Completed

      for (const {
        vmid,
        componenttype,
        componentname,
        vmconfigurationid,
      } of components) {
        if (!vmConfig[vmid].stop) continue; // skip if stop failed

        const proxmoxService = ProxMoxService(
          db,
          { vmType: componenttype.toLowerCase() },
          ipAddress
        );
        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          return {
            success: false,
            message: `Could not connect to the Proxmox server while destroying components.`,
          };
        }

        const destroyResult = await proxmoxService.destroyVM(
          vmid,
          componenttype.toLowerCase()
        );

        if (destroyResult?.status === 200 && destroyResult?.data) {
          vmConfig[vmid].destroy = true;

          // Mark as Completed when both stop & destroy succeed

          await db.sequelize.query(
            `UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,

            {
              replacements: ["Completed", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        } else {
          await db.sequelize.query(
            `UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,

            {
              replacements: ["Destroyed", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );

          await handleFailureOnce(
            new Error(`Destroy failed for ${componentname}`)
          );
        }
      }

      if (!hasFailed) {
        // Update session to DESTROYED
        await db.sequelize.query(
          `UPDATE scenario_learner_session SET vm_steps = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
          {
            replacements: [DESTROYED, scenariolearnersessionid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );

        // Update scenario diagram
        const [diagramRow] = await db.sequelize.query(
          `SELECT scenariodiagram FROM scenario_learner_session WHERE scenariolearnersessionid = ? LIMIT 1`,
          {
            replacements: [scenariolearnersessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (diagramRow?.scenariodiagram) {
          const scenariodiagram = JSON.parse(diagramRow.scenariodiagram);
          scenariodiagram.nodes?.forEach((node) => {
            if (node?.data?.isOnline) node.data.isOnline = "No";
          });
          scenariodiagram.edges?.forEach((edge) => {
            if (edge?.isAttacked) edge.isAttacked = "No";
          });

          if (status === "Completed" || status === "Terminated") {
            await db.sequelize.query(
              `UPDATE scenario_learner_session
                SET scenariodiagram = ?,
                    modifiedon = NOW(),
                    status = ?,
                    ${
                      status === "Terminated" ? "terminatedon" : "completedon"
                    } = NOW()
                WHERE scenariolearnersessionid = ?`,
              {
                replacements: [
                  JSON.stringify(scenariodiagram),
                  status,
                  scenariolearnersessionid,
                ],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          }
        }
      }

      await releaseNetworks(db, session.network_bridges);

      const successMessage =
        status === "Completed"
          ? "Scenario Completed Successfully."
          : status === "Terminated"
          ? "Scenario Terminated Successfully."
          : "All components destroyed and networks released.";

      return {
        success: true,
        message: successMessage,
      };
    } catch (err) {
      console.error("Error in updateCompleteTerminatelearner:", err);
      await releaseNetworks(session.network_bridges);
      await handleFailureOnce(err);
      return {
        success: false,
        message: "Unexpected error occurred during termination.",
      };
    }
  };

const generateProxmoxAccessToken =
  ({ db, payload }) =>
  async (ip_address) => {
    const proxmox = ProxMoxService(db, payload, ip_address);
    const result = await proxmox.generateAccessTicket();
    const ticket = result?.data?.ticket;

    return {
      statusCode: result.status === "200" ? 200 : 500,
      message: result.message,
      data: ticket
        ? {
            ticket,
            cookie: constants.cookie_prefix + ticket,
          }
        : null,
    };
  };

// Inside your DAO file
async function setScenarioLearnerConfigurationOnFailure({
  db,
  ipAddress,
  scenarioid,
  learnerid,
  scenariolearnersessionid,
}) {
  try {
    // Example update: set status = 'Failed' in the session table
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

    await db.sequelize.query(
      `INSERT INTO scenario_learner_logs
     (scenariolearnersessionid, scenarioid, learner_id, scenariolearnerid, type, remark, status, createdon)
     SELECT
       sls.scenariolearnersessionid,
       sls.scenarioid,
       sls.learner_id,
       sls.scenariolearnerid,
       'System',
       'Failed to call Jobs',        
       'Failed',
       NOW()
     FROM scenario_learner_session sls
     WHERE sls.scenariolearnersessionid = ?`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.INSERT,
      }
    );

    return {
      success: true,
      message: "Something went wrong while starting your scenario.",
    };
  } catch (err) {
    console.error("DAO error in fallback:", err);
    throw err;
  }
}

const stopAndDestroyFailedScenarios =
  ({ db, ipAddress }) =>
  async () => {
    const OP_FAILED = "Operation Failed";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const COMPLETED = "Completed";
    let allComponentsFixed = true;

    try {
      const sessions = await db.sequelize.query(
        `SELECT scenariolearnersessionid,scenarioid,learner_id
         FROM scenario_learner_session 
         WHERE vm_steps = ?`,
        {
          replacements: [OP_FAILED],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!sessions.length) {
        return { success: true, message: "No Failed Scenarios to process." };
      }

      for (const {
        scenariolearnersessionid,
        scenarioid,
        learner_id,
      } of sessions) {
        const components = await db.sequelize.query(
          `SELECT * 
           FROM vm_configuration 
           WHERE scenariolearnersessionid = ? and status!="Completed"`,
          {
            replacements: [scenariolearnersessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        for (const component of components) {
          const {
            vmid,
            componenttype,
            componentname,
            vmconfigurationid,
            status,
          } = component;
          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

          if (status === COMPLETED) {
            console.log(`Skipping ${componentname} (status: ${status})`);
            continue;
          }

          const tokenResult = await proxmoxService.generateAccessTicket();
          if (tokenResult?.status !== "200") {
            console.log(`Token failed for ${componentname}, skipping...`);
            allComponentsFixed = false; // mark failure
            continue;
          }

          let stopOK = false;
          let destroyOK = false;

          if (status === STOPPED) {
            const stopRes = await proxmoxService.stopVM(vmid, vmType);
            stopOK = stopRes?.status === 200;
            if (stopOK) await sleep(await getTerminationDelay(db));
            else allComponentsFixed = false; // failed stop
            await new NotiTemplate(
              db,
              "Proxmox_Terminate",
              { userid: 0, scenarioid, learner_id },
              "Admin",
              0
            );
          }

          if (status === DESTROYED || stopOK) {
            const destroyRes = await proxmoxService.destroyVM(vmid, vmType);
            destroyOK = destroyRes?.status === 200;
            if (!destroyOK) allComponentsFixed = false; // failed destroy
            await new NotiTemplate(
              db,
              "Proxmox_Terminate",
              { userid: 0, scenarioid, learner_id },
              "Admin",
              0
            );
          }

          let newStatus;
          if (stopOK && destroyOK) newStatus = COMPLETED;
          else if (destroyOK) newStatus = COMPLETED;
          else if (stopOK && !destroyOK) newStatus = DESTROYED;
          else newStatus = STOPPED;

          await db.sequelize.query(
            `UPDATE vm_configuration 
     SET status = ?, modifiedon = NOW() 
     WHERE vmconfigurationid = ?`,
            {
              replacements: [newStatus, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }

        // After loop finishes → update scenario session
        const scenarioFinalStatus = allComponentsFixed ? DESTROYED : OP_FAILED;

        await db.sequelize.query(
          `UPDATE scenario_learner_session 
   SET vm_steps = ?, modifiedon = NOW() 
   WHERE scenariolearnersessionid = ?`,
          {
            replacements: [scenarioFinalStatus, scenariolearnersessionid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      return { success: true, message: "All Failed Scenarios processed." };
    } catch (err) {
      console.error("Error in stopAndDestroyFailedScenarios:", err);
      return {
        success: false,
        message: "Error occurred while processing failed scenarios.",
      };
    }
  };

const stopAndDestroyFailedEvents =
  ({ db, ipAddress }) =>
  async () => {
    const OP_FAILED = "Operation Failed";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const COMPLETED = "Completed";
    let allComponentsFixed = true;

    try {
      // 1️⃣ Get all failed event learners
      const eventLearners = await db.sequelize.query(
        `SELECT 
    el.eventlearnerid, 
    el.eventid, 
    el.learner_id, 
    e.scenarioid
FROM event_learners el
JOIN events e ON el.eventid = e.eventid
WHERE el.vm_steps = ?
`,
        {
          replacements: [OP_FAILED],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!eventLearners.length) {
        return { success: true, message: "No Failed Events to process." };
      }

      for (const {
        eventlearnerid,
        eventid,
        learner_id,
        scenarioid,
      } of eventLearners) {
        // 2️⃣ Get all components for the event (via scenarioid, learner_id, and eventlearnerid)
        const components = await db.sequelize.query(
          `SELECT *
           FROM vm_configuration
           WHERE eventlearnerid = ? AND status != "Completed"`,
          {
            replacements: [eventlearnerid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        for (const component of components) {
          const {
            vmid,
            componenttype,
            componentname,
            vmconfigurationid,
            status,
          } = component;

          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

          if (status === COMPLETED) {
            console.log(`Skipping ${componentname} (status: ${status})`);
            continue;
          }

          const tokenResult = await proxmoxService.generateAccessTicket();
          if (tokenResult?.status !== "200") {
            console.log(`Token failed for ${componentname}, skipping...`);
            allComponentsFixed = false;
            continue;
          }

          let stopOK = false;
          let destroyOK = false;

          if (status === STOPPED) {
            const stopRes = await proxmoxService.stopVM(vmid, vmType);
            stopOK = stopRes?.status === 200;
            if (stopOK) await sleep(await getTerminationDelay(db));
            else allComponentsFixed = false;

            await new NotiTemplate(
              db,
              "Proxmox_Terminate",
              { userid: 0, scenarioid, learner_id, eventid },
              "Admin",
              0
            );
          }

          if (status === DESTROYED || stopOK) {
            const destroyRes = await proxmoxService.destroyVM(vmid, vmType);
            destroyOK = destroyRes?.status === 200;
            if (!destroyOK) allComponentsFixed = false;

            await new NotiTemplate(
              db,
              "Proxmox_Terminate",
              { userid: 0, scenarioid, learner_id, eventid },
              "Admin",
              0
            );
          }

          let newStatus;
          if (stopOK && destroyOK) newStatus = COMPLETED;
          else if (destroyOK) newStatus = COMPLETED;
          else if (stopOK && !destroyOK) newStatus = DESTROYED;
          else newStatus = STOPPED;

          await db.sequelize.query(
            `UPDATE vm_configuration
             SET status = ?, modifiedon = NOW()
             WHERE vmconfigurationid = ?`,
            {
              replacements: [newStatus, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }

        // 3️⃣ Update final status in event_learners table
        const finalStatus = allComponentsFixed ? DESTROYED : OP_FAILED;

        await db.sequelize.query(
          `UPDATE event_learners
           SET vm_steps = ?, modifiedon = NOW()
           WHERE eventlearnerid = ?`,
          {
            replacements: [finalStatus, eventlearnerid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      return { success: true, message: "All Failed Events processed." };
    } catch (err) {
      console.error("Error in stopAndDestroyFailedEvents:", err);
      return {
        success: false,
        message: "Error occurred while processing failed events.",
      };
    }
  };

const getOperationFailedLogs =
  ({ db }) =>
  async () => {
    try {
      const result = await db.sequelize.query(
        `SELECT
    sls.vm_steps,
    DATE_FORMAT(sls.startedon, '%Y-%m-%d %H:%i:%s') AS started_on,
    sls.status AS session_status,
    CONCAT(l.firstname, ' ', l.lastname) AS learner_name,   -- Full learner name
    s.scenariotitle AS scenario_name,                       -- Scenario name
    DATE_FORMAT(
        CASE 
            WHEN sls.status = 'Completed' THEN sls.completedon
            WHEN sls.status = 'Terminated' THEN sls.terminatedon
            ELSE sls.failedon
        END,
        '%Y-%m-%d %H:%i:%s'
    ) AS end_date
FROM scenario_learner_session sls
INNER JOIN scenarios s 
    ON s.scenarioid = sls.scenarioid
INNER JOIN learners l 
    ON l.learner_id = sls.learner_id
WHERE sls.vm_steps = 'Operation Failed'
ORDER BY sls.startedon DESC;
`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error fetching Operation Failed logs:", error);
      throw error;
    }
  };

const getEventOperationFailedLogs =
  ({ db }) =>
  async () => {
    try {
      const result = await db.sequelize.query(
        `SELECT
    el.eventlearnerid,
    el.vm_steps,
    DATE_FORMAT(el.startedon, '%Y-%m-%d %H:%i:%s') AS started_on,
    el.status AS session_status,
    CONCAT(l.firstname, ' ', l.lastname) AS learner_name,  -- Full learner name
    e.eventname AS event_name,                             -- Event name
    DATE_FORMAT(
        CASE 
            WHEN el.status = 'Completed' THEN el.completedon
            ELSE el.failedon
        END,
        '%Y-%m-%d %H:%i:%s'
    ) AS end_date
FROM event_learners el
INNER JOIN events e 
    ON e.eventid = el.eventid
INNER JOIN learners l 
    ON l.learner_id = el.learner_id
WHERE el.vm_steps = 'Operation Failed'
ORDER BY el.startedon DESC;`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error fetching Event Operation Failed logs:", error);
      throw error;
    }
  };

module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminate,
  generateProxmoxAccessToken,
  setScenarioLearnerConfigurationOnFailure,
  stopAndDestroyFailedScenarios,
  stopAndDestroyFailedEvents,
  getOperationFailedLogs,
  getEventOperationFailedLogs,
};
