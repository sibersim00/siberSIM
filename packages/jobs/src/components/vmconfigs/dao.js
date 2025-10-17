const { handleComponentFailure } = require("../../jobs/componentSetupJob");
const { sendProxmoxDownAlerts } = require("../../jobs/componentSetupJob");
const ProxMoxService = require("../../proxmox/services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../../jobs/jobsConstants");
const constants = require("../../proxmox/services/proxmox/constants");
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

      let allFound = true;
      const preparedComponents = [];
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

        let network_bridge_name = "{}";
        const [componentInfo] = await db.sequelize.query(
          `SELECT componenttype, network_bridge_name,vmid_name FROM components WHERE componentid = ?`,
          {
            replacements: [componentid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (componentInfo && componentInfo.network_bridge_name) {
          network_bridge_name = componentInfo.network_bridge_name;
        } else {
          allFound = false;
          break; // Stop Processing further
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

        preparedComponents.push({
          scenarioid,
          learner_id: learnerData.learner_id,
          scenariolearnerid: learnerData.scenariolearnerid,
          scenariolearnersessionid: learnerData.scenariolearnersessionid,
          componentid,
          nodeid,
          componenttype: componentInfo.componenttype,
          order,
          master_vmid: vmid,
          vmid: null,
          componentname: componentInfo.vmid_name,
          duration,
          network_bridge_json: JSON.stringify(network_bridge_json),
          status: statusVal,
        });
      }
      if (allFound) {
        for (const comp of preparedComponents) {
          const insertQuery = `INSERT INTO vm_configuration (scenarioid, learner_id, scenariolearnerid, scenariolearnersessionid, componentid, nodeid, componenttype, \`order\`, master_vmid, vmid, componentname, duration, network_bridge_json, status, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
          const insertValues = [
            comp.scenarioid,
            comp.learner_id,
            comp.scenariolearnerid,
            comp.scenariolearnersessionid,
            comp.componentid,
            comp.nodeid,
            comp.componenttype,
            comp.order,
            comp.master_vmid,
            comp.vmid,
            comp.componentname,
            comp.duration,
            comp.network_bridge_json,
            comp.status,
          ];

          const [configInsert] = await db.sequelize.query(insertQuery, {
            replacements: insertValues,
            type: db.sequelize.QueryTypes.INSERT,
          });

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
        await db.sequelize.query(
          `UPDATE scenario_learner_session 
            SET vm_steps = ?, status = ?, network_bridges = ?, modifiedon = NOW() 
            WHERE scenariolearnersessionid = ?`,
          {
            replacements: [
              statusVal,
              "Initializing",
              JSON.stringify(availableNetworks),
              learnerData.scenariolearnersessionid,
            ],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
        return {
          success: true,
          message: ERROR_MESSAGES.VM_CONFIG_SUCCESS,
        };
      } else {
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
              `UPDATE networks SET status = ?, modifiedon = NOW()  WHERE networkjson LIKE ?`,
              {
                replacements: ["Available", `%${bridge}%`],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          }
        }

        await handleComponentFailure(
          db,
          scenarioid,
          learnerid,
          scenariolearnersessionid,
          statusVal,
          ERROR_MESSAGES.COMPONENT_NOT_FOUND
        );
        return {
          success: false,
          message: ERROR_MESSAGES.COMPONENT_NOT_FOUND,
        };

        // await db.sequelize.query(
        //   `UPDATE scenario_learner_session
        //   SET vm_steps = ?, status = ?, network_bridges = ?, modifiedon = NOW()
        //   WHERE scenariolearnersessionid = ?`,
        //   {
        //     replacements: [
        //       "Failed",
        //       "Failed",
        //       JSON.stringify(availableNetworks),
        //       learnerData.scenariolearnersessionid,
        //     ],
        //     type: db.sequelize.QueryTypes.UPDATE,
        //   }
        // );
        // // 2. Update session to 'Terminated'
        // await db.sequelize.query(
        //   `UPDATE scenario_learner
        //     SET status = 'Terminated', modifiedon = NOW()
        //     WHERE scenariolearnerid = ?`,
        //   {
        //     replacements: [learnerData.scenariolearnerid],
        //     type: db.sequelize.QueryTypes.UPDATE,
        //   }
        // );
      }
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
    "proxmox_terminate",
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
    return 10000; // fallback to 10 sec
  }
};

const updateCompleteTerminatelearner =
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
        // const [diagramRow] = await db.sequelize.query(
        //   `SELECT scenariodiagram FROM scenario_learner_session WHERE scenariolearnersessionid = ? LIMIT 1`,
        //   {
        //     replacements: [scenariolearnersessionid],
        //     type: db.sequelize.QueryTypes.SELECT,
        //   }
        // );

        // if (diagramRow?.scenariodiagram) {
        //   const scenariodiagram = JSON.parse(diagramRow.scenariodiagram);
        //   scenariodiagram.nodes?.forEach((node) => {
        //     if (node?.data?.isOnline) node.data.isOnline = "No";
        //   });
        //   scenariodiagram.edges?.forEach((edge) => {
        //     if (edge?.isAttacked) edge.isAttacked = "No";
        //   });

        //   if (status === "Completed" || status === "Terminated") {
        //     await db.sequelize.query(
        //       `UPDATE scenario_learner_session
        //         SET scenariodiagram = ?,
        //             modifiedon = NOW(),
        //             status = ?,
        //             ${
        //               status === "Terminated" ? "terminatedon" : "completedon"
        //             } = NOW()
        //         WHERE scenariolearnersessionid = ?`,
        //       {
        //         replacements: [
        //           JSON.stringify(scenariodiagram),
        //           status,
        //           scenariolearnersessionid,
        //         ],
        //         type: db.sequelize.QueryTypes.UPDATE,
        //       }
        //     );
        //   }
        // }
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
    } finally {
      try {
        const [diagramRow] = await db.sequelize.query(
          `SELECT scenariodiagram FROM scenario_learner_session WHERE scenariolearnersessionid = ? LIMIT 1`,
          {
            replacements: [scenariolearnersessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (diagramRow?.scenariodiagram) {
          scenariodiagram = JSON.parse(diagramRow.scenariodiagram);

          // Always mark all nodes offline and remove attacks
          scenariodiagram.nodes?.forEach((node) => {
            if (node?.data?.isOnline) node.data.isOnline = "No";
          });
          scenariodiagram.edges?.forEach((edge) => {
            if (edge?.isAttacked) edge.isAttacked = "No";
          });

          await db.sequelize.query(
            `UPDATE scenario_learner_session
          SET scenariodiagram = ?, modifiedon = NOW()
          WHERE scenariolearnersessionid = ?`,
            {
              replacements: [
                JSON.stringify(scenariodiagram),
                scenariolearnersessionid,
              ],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }
      } catch (diagramErr) {
        console.error("Error while resetting isAttacked:", diagramErr);
      }
    }
  };

const generateProxmoxAccessToken =
  ({ db, payload }) =>
  async (ip_address) => {
    const proxmox = ProxMoxService(db, payload, ip_address);
    const result = await proxmox.generateAccessTicket();
    const ticket = result?.data?.ticket;

    if (!ticket || result.status !== "200") {
      sendProxmoxDownAlerts(db, learner_id);
      return {
        success: false,
        message: `Error in generating ticket. Please check server status or credentials.`,
      };
    }

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

const autoTerminateFailedScenarios =
  ({ db, ipAddress, updateCompleteTerminatelearner }) =>
  async () => {
    try {
      const OPERATION_FAILED = "Operation Failed";
      const COMPLETED = "Completed";

      // 1. Get all sessions where vm_steps is 'Operation Failed'
      const sessions = await db.sequelize.query(
        `SELECT scenariolearnersessionid 
         FROM scenario_learner_session 
         WHERE vm_steps = ?`,
        {
          replacements: [OPERATION_FAILED],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!sessions.length) {
        return {
          success: true,
          message: "No scenario sessions with 'Operation Failed' found.",
        };
      }

      let terminatedCount = 0;

      for (const { scenariolearnersessionid } of sessions) {
        // 2. Get all VM components for this session
        const components = await db.sequelize.query(
          `SELECT status FROM vm_configuration 
           WHERE scenariolearnersessionid = ?`,
          {
            replacements: [scenariolearnersessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        // 3. Ensure all components are 'Operation Failed'
        const allFailed =
          components.length > 0 &&
          components.every((comp) => comp.status === OPERATION_FAILED);

        if (!allFailed) {
          console.log(
            `Skipping session ${scenariolearnersessionid}: not all VMs are 'Operation Failed'.`
          );
          continue;
        }

        // 4. Attempt to cleanly stop + destroy
        const result = await updateCompleteTerminatelearner({ db, ipAddress })(
          scenariolearnersessionid,
          COMPLETED,
          "AutoTerminate"
        );

        if (result.success) {
          terminatedCount++;
        } else {
          console.error(
            `Auto-terminate failed for session ${scenariolearnersessionid}: ${result.message}`
          );
        }
      }

      return {
        success: true,
        message: `Auto-termination completed. Total cleaned: ${terminatedCount}`,
      };
    } catch (err) {
      console.error("Error in autoTerminateFailedScenarios:", err);
      return {
        success: false,
        message: "Unexpected error in Operation Failed auto-termination.",
      };
    }
  };

const startScenarioLearner =
  ({ db, ipAddress }) =>
  async (vmid, vmType) => {
    try {
      const proxmoxService = ProxMoxService(
        db,
        { vmType: vmType.toLowerCase() },
        ipAddress
      );

      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `Could not connect to the Proxmox server for VM ID ${vmid}.`,
        };
      }

      const startResult = await proxmoxService.startVM(
        vmid,
        vmType.toLowerCase()
      );

      if (startResult?.status === 200) {
        return {
          success: true,
          message: `VM ${vmid} (${vmType}) started successfully.`,
        };
      } else {
        return {
          success: false,
          message: `Failed to start VM ${vmid} (${vmType}).`,
        };
      }
    } catch (err) {
      console.error(`Error starting VM ${vmid}:`, err);
      return {
        success: false,
        message: "Unexpected error occurred during start.",
      };
    }
  };

const restartscenarioLearner =
  ({ db, ipAddress }) =>
  async (vmid, vmType) => {
    try {
      const proxmoxService = ProxMoxService(
        db,
        { vmType: vmType.toLowerCase() },
        ipAddress
      );

      // 1️⃣ Generate Proxmox ticket
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `Could not connect to the Proxmox server for VM ID ${vmid}.`,
        };
      }

      // 2️⃣ Stop the VM
      const stopResult = await proxmoxService.stopVM(
        vmid,
        vmType.toLowerCase()
      );
      if (stopResult?.status !== 200) {
        return {
          success: false,
          message: `Failed to stop VM ${vmid} (${vmType}).`,
        };
      }

      // 3️⃣ Wait before starting
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // 4️⃣ Start the VM again
      const startResult = await proxmoxService.startVM(
        vmid,
        vmType.toLowerCase()
      );

      if (startResult?.status === 200) {
        return {
          success: true,
          message: `VM ${vmid} (${vmType}) restarted successfully.`,
        };
      } else {
        return {
          success: false,
          message: `Failed to start VM ${vmid} (${vmType}) after restart.`,
        };
      }
    } catch (err) {
      console.error(`Error restarting VM ${vmid}:`, err);
      return {
        success: false,
        message: "Unexpected error occurred during restart.",
      };
    }
  };

module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminatelearner,
  generateProxmoxAccessToken,
  autoTerminateFailedScenarios,
  startScenarioLearner,
  restartscenarioLearner,
};
