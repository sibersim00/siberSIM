const { handleComponentFailure } = require("../../eventjob/componentSetupJob");
const { sendProxmoxDownAlerts } = require("../../eventjob/componentSetupJob");
const ProxMoxService = require("../../proxmox/services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../../eventjob/jobsConstants");
const constants = require("../../proxmox/services/proxmox/constants");
const { componentSetupJob } = require("../../eventjob/componentSetupJob");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");



const setEventLearnerConfiguration =
  ({ db }) =>
    async (scenarioid, learnerid, eventlearnerid) => {
      try {
        const statusVal = "Initializing";

        const [webSettings] = await db.sequelize.query(
          `SELECT base_clone_vmid FROM web_settings WHERE company_id = 1 LIMIT 1`,
          { type: db.sequelize.QueryTypes.SELECT }
        );

        const [learnerData] = await db.sequelize.query(
          `SELECT learner_id, eventlearnerid FROM event_learners WHERE eventlearnerid = ? AND status = ? ORDER BY eventlearnerid DESC LIMIT 1`,
          {
            replacements: [eventlearnerid, statusVal],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (!learnerData || !learnerData.eventlearnerid) {
          await handleComponentFailure(
            db,
            scenarioid,
            learnerData?.learner_id || null,
            learnerData?.eventlearnerid || null,
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
            eventlearnerid,
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
            eventlearnerid,
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
            eventlearnerid,
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
            eventlearnerid: learnerData.eventlearnerid,
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
            const insertQuery = `INSERT INTO vm_configuration (scenarioid, learner_id, eventlearnerid, componentid, nodeid, componenttype, \`order\`, master_vmid, vmid, componentname, duration, network_bridge_json, status, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
            const insertValues = [
              comp.scenarioid,
              comp.learner_id,
              comp.eventlearnerid,
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
            `UPDATE event_learners 
            SET vm_steps = ?, status = ?, network_bridges = ?, modifiedon = NOW() 
            WHERE eventlearnerid = ?`,
            {
              replacements: [
                statusVal,
                "Initializing",
                JSON.stringify(availableNetworks),
                learnerData.eventlearnerid,
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
          await db.sequelize.query(
            `UPDATE event_learners
   SET status = 'Terminated', modifiedon = NOW()
   WHERE eventlearnerid = ?`,
            {
              replacements: [learnerData.eventlearnerid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );


          await handleComponentFailure(
            db,
            scenarioid,
            learnerid,
            eventlearnerid,
            statusVal,
            ERROR_MESSAGES.COMPONENT_NOT_FOUND
          );
          return {
            success: false,
            message: ERROR_MESSAGES.COMPONENT_NOT_FOUND,
          };
        }
      } catch (err) {
        console.error(err);
        return {
          success: false,
          message: "Unexpected error during event.",
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

async function markOperationFailedAndNotify(db, eventlearnerid, err, learner_id) {
  const OP_FAILED = "Operation Failed";
  console.error("Operation failed:", err?.message || err);
  // 1. Send notification & email alert
  await sendProxmoxDownAlerts(db, learner_id);

  await new NotiTemplate(
    db,
    "Proxmox_Terminate",
    { userid: 0, },
    "Admin",
    0
  );

  // 2. Mark scenario session as failed
  await db.sequelize.query(
    `UPDATE event_learners
     SET vm_steps = ?, modifiedon = NOW()
     WHERE eventlearnerid = ?`,
    {
      replacements: [OP_FAILED, eventlearnerid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );

  // 4. Insert log entry
  await db.sequelize.query(
    `INSERT INTO event_learner_logs
      (eventlearnerid,eventid, learner_id, type, remark, status, createdon)
      SELECT
        sls.eventlearnerid,
        sls.eventid,
        sls.learner_id,
        'System',
        'Failed to Stop and destroy the component',        
        'Operation Failed',
        NOW()
      FROM event_learners sls
      WHERE sls.eventlearnerid = ?`,
    {
      replacements: [eventlearnerid],
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

const updateCompleteTerminate =
  ({ db, ipAddress }) =>
    async (eventlearnerid, status, type) => {
      console.log("Update Terminate......");
      const RUNNING = "Running";
      const STOPPED = "Stopped";
      const DESTROYED = "Destroyed";
      const FAILED = "Failed";
      const OP_FAILED = "Operation Failed";
      let hasFailed = false;

      const [session] = await db.sequelize.query(
        `SELECT learner_id, vm_steps, network_bridges FROM event_learners
      WHERE eventlearnerid = ? LIMIT 1`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      const handleFailureOnce = async (err) => {
        if (!hasFailed) {
          hasFailed = true;
          await markOperationFailedAndNotify(
            db,
            eventlearnerid,
            err,
            session.learner_id
          );
        }
      };

      try {
        // if (session.vm_steps !== RUNNING && session.vm_steps !== OP_FAILED) {
        //   return {
        //     success: false,
        //     message: `Session vm_steps must be '${RUNNING}' or '${OP_FAILED}' to terminate.`,
        //   };
        // }

        // Fetch components
        const components = await db.sequelize.query(
          `SELECT * FROM vm_configuration WHERE eventlearnerid = ?`,
          {
            replacements: [eventlearnerid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        const vmConfig = {};

        components.forEach(({ vmid }) => {
          vmConfig[vmid] = { stop: false, destroy: false };
        });

        //Stop loop

        for (const {
          vmid,
          componenttype,
          componentname,
          vmconfigurationid,
          status: vmStatus,
        } of components) {
          if (vmStatus === "Completed") {
            console.log(`Skipping VM ${componentname} (${vmid}) as it is already Completed`);
            continue;
          }
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

        //Destroy loop (only for stop success) & mark Completed

        for (const {
          vmid,
          componenttype,
          componentname,
          vmconfigurationid,
          status: vmStatus,
        } of components) {
          if (vmStatus === "Completed") {
            console.log(`Skipping VM ${componentname} (${vmid}) as it is already Completed`);
            continue;
          }
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
            `UPDATE event_learners SET vm_steps = ?, modifiedon = NOW() WHERE eventlearnerid = ?`,
            {
              replacements: [DESTROYED, eventlearnerid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );

          // Update scenario diagram
          const [diagramRow] = await db.sequelize.query(
            `SELECT scenariodiagram FROM event_learners WHERE eventlearnerid = ? LIMIT 1`,
            {
              replacements: [eventlearnerid],
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

            if (status === "Completed") {
              await db.sequelize.query(
                `UPDATE event_learners
      SET scenariodiagram = ?,
          modifiedon = NOW(),
          status = ?
          ${status === "Completed" ? ", completedon = NOW()" : ""}
      WHERE eventlearnerid = ?`,
                {
                  replacements: [
                    JSON.stringify(scenariodiagram),
                    status,
                    eventlearnerid,
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

const restartEventLearner =
  ({ db, ipAddress }) =>
  async (scenarioid, learnerid, eventlearnerid) => {
    try {
      // 1️⃣ Fetch all components for this event learner
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname, vmconfigurationid
         FROM vm_configuration
         WHERE eventlearnerid = ?`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!components.length) {
        return {
          success: false,
          message: "No components found for this event learner.",
        };
      }

      // 2️⃣ Stop each component
      for (const { vmid, componenttype, componentname, vmconfigurationid } of components) {
        const proxmoxService = ProxMoxService(
          db,
          { vmType: componenttype.toLowerCase() },
          ipAddress
        );

        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          return {
            success: false,
            message: `Could not connect to the Proxmox server for ${componentname}.`,
          };
        }

        const stopResult = await proxmoxService.stopVM(
          vmid,
          componenttype.toLowerCase()
        );

        // ✅ Always mark as Stopped whether stop succeeds or fails
        await db.sequelize.query(
          `UPDATE vm_configuration 
           SET status = 'Stopped', modifiedon = NOW() 
           WHERE vmconfigurationid = ?`,
          {
            replacements: [vmconfigurationid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );

        if (stopResult?.status !== 200) {
          console.warn(`${vmid}-${componentname} - Stop failed`);
        }
      }

      // 3️⃣ Wait for 10 seconds
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // 4️⃣ Start each component
      for (const { vmid, componenttype, componentname, vmconfigurationid } of components) {
        const proxmoxService = ProxMoxService(
          db,
          { vmType: componenttype.toLowerCase() },
          ipAddress
        );

        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          return {
            success: false,
            message: `Could not connect to the Proxmox server for ${componentname}.`,
          };
        }

        const startResult = await proxmoxService.startVM(
          vmid,
          componenttype.toLowerCase()
        );

        if (startResult?.status === 200) {
          // ✅ Mark as Running
          await db.sequelize.query(
            `UPDATE vm_configuration 
             SET status = 'Running', modifiedon = NOW() 
             WHERE vmconfigurationid = ?`,
            {
              replacements: [vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        } else {
          // ❌ Mark as Starting if start failed
          await db.sequelize.query(
            `UPDATE vm_configuration 
             SET status = 'Starting', modifiedon = NOW() 
             WHERE vmconfigurationid = ?`,
            {
              replacements: [vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
          console.warn(`${vmid}-${componentname} - Start failed`);
        }
      }

      return {
        success: true,
        message: "Restart process completed — status updated accordingly.",
      };
    } catch (err) {
      console.error("Error in restarting event learner:", err);
      return {
        success: false,
        message: "Unexpected error occurred during restart.",
      };
    }
  };


const autoTerminateExpiredEvents =
  ({ db, ipAddress, updateCompleteTerminate }) =>
    async () => {
      const RUNNING = "Running";
      const COMPLETED = "Completed";

      try {
        // 1. Fetch expired events where status is still 'Running'
        const expiredEvents = await db.sequelize.query(
          `SELECT eventid FROM events 
         WHERE status = ? AND eventendtime < NOW()`,
          {
            replacements: [RUNNING],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (!expiredEvents.length) {
          return {
            success: true,
            message: "No expired events found to terminate.",
          };
        }

        for (const { eventid } of expiredEvents) {
          // 2. Get all learners for that event
          const learners = await db.sequelize.query(
            `SELECT eventlearnerid FROM event_learners 
           WHERE eventid = ?`,
            {
              replacements: [eventid],
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          for (const { eventlearnerid } of learners) {
            const result = await updateCompleteTerminate({ db, ipAddress })(
              eventlearnerid,
              "Completed", // 👈 set status to "Completed"
              "AutoTerminate"
            );

            if (!result.success) {
              console.error(
                `Failed to auto-terminate learner ${eventlearnerid}: ${result.message}`
              );
            } else {
              // ✅ Update event_learner status to 'Completed'
              await db.sequelize.query(
                `UPDATE event_learners
       SET status = ?, modifiedon = NOW()
       WHERE eventlearnerid = ?`,
                {
                  replacements: ["Completed", eventlearnerid],
                  type: db.sequelize.QueryTypes.UPDATE,
                }
              );
            }
          }

          // 4. Update event status to Completed
          await db.sequelize.query(
            `UPDATE events 
           SET status = ?, modifiedon = NOW()
           WHERE eventid = ?`,
            {
              replacements: [COMPLETED, eventid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }

        return {
          success: true,
          message: "Auto-termination completed for expired events.",
        };
      } catch (err) {
        console.error("Error in autoTerminateExpiredEvents:", err);
        return {
          success: false,
          message: "Unexpected error occurred in auto-termination job.",
        };
      }
    };


const generateProxmoxAccessToken =
  ({ db, payload }) =>
    async (ip_address) => {
      try {
        const proxmox = ProxMoxService(db, payload, ip_address);
        const result = await proxmox.generateAccessTicket();

        const ticket = result?.data?.ticket;

        if (ticket) {
          return {
            statusCode: 200,
            message: "Successfully connected to the Proxmox server.",
            data: {
              ticket,
              cookie: constants.cookie_prefix + ticket,
            },
          };
        } else {
          // No ticket received – credentials might be wrong or server is rejecting
          await new NotiTemplate(
            db,
            "proxmox_down",
            { learner_id: 0, userid: 0 },
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

          return {
            statusCode: 500,
            message:
              "Login to the Proxmox server failed. Please check the username, password, and permissions.",
            data: null,
          };
        }
      } catch (error) {
        console.error("Error in generateProxmoxAccessToken:", error);

        await new NotiTemplate(
          db,
          "proxmox_down",
          { learner_id: 0, userid: 0 },
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

        return {
          statusCode: 500,
          message:
            "Unable to connect to the Proxmox server. Please ensure it is online and reachable.",
          error: error.toString(),
          data: null,
        };
      }
    };


module.exports = {
  setEventLearnerConfiguration,
  updateCompleteTerminate,
  restartEventLearner,
  autoTerminateExpiredEvents,
  generateProxmoxAccessToken,
};
