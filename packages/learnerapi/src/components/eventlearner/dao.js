const { handleComponentFailure } = require("../../jobs/componentSetupJob");
const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../../jobs/jobsConstants");
const constants = require("../../services/proxmox/constants");
const { componentSetupJob } = require("../../eventjob/componentSetupJob");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

const setEventLearnerConfiguration = ({ db }) => async (scenarioid, learnerid, eventlearnerid) => {
    try {
      const statusVal = "Initializing";
      const [webSettings] = await db.sequelize.query(`SELECT base_clone_vmid FROM web_settings WHERE company_id = 1 LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      const [learnerData] = await db.sequelize.query(`SELECT learner_id, eventlearnerid FROM event_learners WHERE eventlearnerid = ? AND status = ? ORDER BY eventlearnerid DESC LIMIT 1`,
        {
          replacements: [eventlearnerid, statusVal],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (!learnerData || !learnerData.eventlearnerid) {
        await handleComponentFailure(db, scenarioid, learnerData?.learner_id || null, learnerData?.eventlearnerid || null, statusVal, ERROR_MESSAGES.LEARNER_NOT_FOUND);
        return {success: false, message: ERROR_MESSAGES.LEARNER_NOT_FOUND};
      }
      const [scenario] = await db.sequelize.query(`SELECT component_config,network_config FROM scenarios WHERE scenarioid = ? AND deletedon IS NULL AND scenariostatus = 'Publish' AND status = 'Active'`,
        {
          replacements: [scenarioid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (!scenario || !scenario.component_config) {
        await handleComponentFailure(db, scenarioid, learnerid, eventlearnerid, statusVal, ERROR_MESSAGES.CONFIG_NOT_FOUND_SCENARIO);
        return {success: false, message: ERROR_MESSAGES.CONFIG_NOT_FOUND_SCENARIO,
        };
      }
      const baseCloneVmid = parseInt(webSettings?.base_clone_vmid || 1000);
      const componentConfig = JSON.parse(scenario.component_config);
      const networkConfig = JSON.parse(scenario.network_config);
      const uniqueNetworkValueCount = networkConfig.length;
      if (uniqueNetworkValueCount == 0) {
        await handleComponentFailure(db, scenarioid, learnerid, eventlearnerid, statusVal, ERROR_MESSAGES.NETWORK_BRIDGES);
        return {success: false, message: ERROR_MESSAGES.NETWORK_BRIDGES};
      }
      const availableNetworks = await db.sequelize.query(`SELECT networkid, networkname FROM networks WHERE status = 'Available' AND deletedon IS NULL ORDER BY networkid ASC LIMIT ?`,
        {
          replacements: [uniqueNetworkValueCount],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (availableNetworks.length < uniqueNetworkValueCount) {
        await handleComponentFailure(db, scenarioid, learnerid, eventlearnerid, statusVal, ERROR_MESSAGES.NETWORK_BRIDGES);
        return {success: false, message: ERROR_MESSAGES.NETWORK_BRIDGES};
      } else {
        const networkIds = availableNetworks.map((item) => item.networkid);
        await db.sequelize.query(`UPDATE networks SET status = 'Occupied', modifiedon = NOW() WHERE networkid in (:networkIds)`,
          {
            replacements: { networkIds },
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }
      const networkArray = networkConfig.reduce((acc, key, index) => {availableNetworks[index].networkkey = key;acc[key] = availableNetworks[index];
        return acc;}, {});
      let allFailed = true;
      for (const item of componentConfig) {
        const {vmid, order, componentid, nodeid, componentname, duration, network_ids} = item;
        let componenttype = "Unknown";
        let network_bridge_name = "{}";
        const [componentInfo] = await db.sequelize.query(`SELECT componenttype, network_bridge_name FROM components WHERE componentid = ?`,
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
        const [existingConfig] = await db.sequelize.query(`SELECT vmconfigurationid FROM vm_configuration WHERE eventlearnerid = ? AND componentid = ? LIMIT 1`,
        {
          replacements: [learnerData.eventlearnerid, componentid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
if (existingConfig?.vmconfigurationid) {
  await db.sequelize.query(`UPDATE vm_configuration SET nodeid = ?, componenttype = ?, \`order\` = ?, master_vmid = ?, componentname = ?, duration = ?, network_bridge_json = ?, status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
    {
      replacements: [nodeid, componenttype, order, vmid, componentname, duration, JSON.stringify(network_bridge_json), componentInfo ? statusVal : "Failed", existingConfig.vmconfigurationid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
  const realVmid = existingConfig.vmconfigurationid + baseCloneVmid;
  await db.sequelize.query(`UPDATE vm_configuration SET vmid = ? WHERE vmconfigurationid = ?`,
    {
      replacements: [realVmid, existingConfig.vmconfigurationid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
} else {
  const insertQuery =`INSERT INTO vm_configuration (scenarioid, learner_id, eventlearnerid, componentid, nodeid, componenttype, \`order\`, master_vmid, vmid, componentname, duration, network_bridge_json, status, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const insertValues = [scenarioid, learnerData.learner_id, learnerData.eventlearnerid, componentid, nodeid, componenttype, order, vmid, null, componentname, duration, JSON.stringify(network_bridge_json), componentInfo ? statusVal : "Failed"];
  const [configInsert] = await db.sequelize.query(insertQuery, {
    replacements: insertValues,
    type: db.sequelize.QueryTypes.INSERT,
  });
  const vmconfigurationid = configInsert;
  const realVmid = vmconfigurationid + baseCloneVmid;
  await db.sequelize.query(`UPDATE vm_configuration SET vmid = ? WHERE vmconfigurationid = ?`,
    {
      replacements: [realVmid, vmconfigurationid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
}
      }
      const finalStatus = allFailed ? "Failed" : statusVal;
      await db.sequelize.query(`UPDATE event_learners SET vm_steps = ?, status = ?, network_bridges = ?, modifiedon = NOW() WHERE eventlearnerid = ?`,
        {
          replacements: [finalStatus, allFailed ? "Failed" : "Initializing", JSON.stringify(availableNetworks), learnerData.eventlearnerid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      if (allFailed) {
        const bridgesToFree = new Set();
        for (const net of availableNetworks) {
          if (net.networkname) {
            bridgesToFree.add(net.networkname);
          }
        }
        if (bridgesToFree.size > 0) {
          for (const bridge of bridgesToFree) {
            await db.sequelize.query(`UPDATE networks SET status = ?, modifiedon = NOW() WHERE networkjson LIKE ?`,
              {
                replacements: ["Available", `%${bridge}%`],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          }
        }
        await db.sequelize.query(`UPDATE event_learners SET status = 'Terminated', modifiedon = NOW() WHERE eventlearnerid = ?`,
          {
            replacements: [learnerData.eventlearnerid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }
      return {success: !allFailed, message: allFailed ? "All components failed to configure." : "Set Configurations Successfully."};
    } catch (err) {
      console.error(err);
      return {success: false, message: "Unexpected error during scenario configuration.",
      };
    }
  };

const updateCompleteTerminate = ({ db, ipAddress }) => async (eventlearnerid, status, type) => {
    const RUNNING = "Running";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const FAILED = "Failed";
    const AVAILABLE = "Available";
    try {
      const [session] = await db.sequelize.query(`SELECT learner_id, vm_steps FROM event_learners WHERE eventlearnerid = ? LIMIT 1`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (!session) {
        return {success: false, message: `Session ID ${eventlearnerid} not found.`};
      }
      if (session.vm_steps !== RUNNING) {
        return {success: false, message: `Session vm_steps must be '${RUNNING}' to terminate.`};
      }
      const { learner_id: learnerid } = session;
      const components = await db.sequelize.query(`SELECT * FROM vm_configuration WHERE eventlearnerid = ?`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (!components.length) {
        return {success: false, message: "No components found for the session."};
      }
      const allRunning = components.every((comp) => comp.status === RUNNING);
      if (!allRunning) {
        return {success: false, message: "Not all components are in 'Running' status.",
        };
      }
      for (const component of components) {
        const {vmid, componenttype, componentname, vmconfigurationid,} = component;
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
        try {
          const tokenResult = await proxmoxService.generateAccessTicket();
          if (!tokenResult || tokenResult.status !== "200") {
            await new NotiTemplate(db, "proxmox_down", { learner_id: learnerid, userid: 0 }, "System", 0, `Proxmox Service is down. Please try again later.`);
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
            throw new Error("Proxmox connection failed.");
          }
          await proxmoxService.stopVM(vmid, vmType);
          await db.sequelize.query(`UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
            {
              replacements: [STOPPED, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        } catch (err) {
          console.error(`Stopping failed for VM '${componentname}':`, err);
          await new NotiTemplate(db, "proxmox_down", { learner_id: learnerid, userid: 0 }, "System", 0, `Proxmox Service is down. Please try again later.`);
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
          await handleComponentFailure(db, scenarioid, learnerid, eventlearnerid, FAILED, `Stopping failed for '${componentname}': ${err.message}`);
          return {success: false, message: `Failed to stop '${componentname}': ${err.message}`};
        }
      }
      for (const component of components) {
        const {vmid, componenttype, componentname, vmconfigurationid} = component;
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
        try {
          const tokenResult = await proxmoxService.generateAccessTicket();
          if (!tokenResult || tokenResult.status !== "200") {
            await new NotiTemplate(db, "proxmox_down", { learner_id: learnerid, userid: 0 }, "System", 0, `Proxmox Service is down. Please try again later.`);
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
            throw new Error("Proxmox connection failed.");
          }
          await proxmoxService.destroyVM(vmid, vmType);
          await db.sequelize.query(`UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
            {
              replacements: [DESTROYED, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        } catch (err) {
          console.error(`Destruction failed for VM '${componentname}':`, err);
          await db.sequelize.query(`UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE eventlearnerid = ?`,
            {
              replacements: [FAILED, eventlearnerid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
          await new NotiTemplate( db, "proxmox_down", { learner_id: learnerid, userid: 0 }, "System", 0, `Proxmox Service is down. Please try again later.`);
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

          await handleComponentFailure(db, scenarioid, learnerid, eventlearnerid, FAILED, `Destruction failed for'${componentname}': ${err.message}`);
          return {success: false, message: `Failed to destroy '${componentname}': ${err.message}`};
        }
      }
      await db.sequelize.query(`UPDATE event_learners SET vm_steps = ?, modifiedon = NOW() WHERE eventlearnerid = ?`,
        {
          replacements: [DESTROYED, eventlearnerid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      const bridgesToFree = new Set();
      for (const component of components) {
        if (!component.network_bridge_json) continue;
        let bridgeMap = {};
        try {
          bridgeMap = JSON.parse(component.network_bridge_json);
        } catch (err) {
          console.warn(`Invalid JSON in network_bridge_json for component ID ${component.vmconfigurationid}`);
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
          await db.sequelize.query(`UPDATE networks SET status = ?, modifiedon = NOW() WHERE networkjson LIKE ?`,
            {
              replacements: [AVAILABLE, `%\"iface\":\"${bridge}\"%`],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }
      }
      const [diagramRow] = await db.sequelize.query(`SELECT scenariodiagram FROM event_learners WHERE eventlearnerid = ? LIMIT 1`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (diagramRow?.scenariodiagram) {
        try {
          const scenariodiagram = JSON.parse(diagramRow.scenariodiagram);
          if (Array.isArray(scenariodiagram.nodes)) {
            scenariodiagram.nodes.forEach((node) => {
              if (node?.data?.isOnline) {
                node.data.isOnline = "No";
              }
            });
          }
          if (Array.isArray(scenariodiagram.edges)) {
            scenariodiagram.edges.forEach((edge) => {
              if (edge?.isAttacked) {
                edge.isAttacked = "No";
              }
            });
          }
          if (status === "Completed") {
            await db.sequelize.query(`UPDATE event_learners SET scenariodiagram = ?, modifiedon = NOW(), status = ?, ${status === "completedon"} = NOW() WHERE eventlearnerid = ?`,
              {
                replacements: [JSON.stringify(scenariodiagram), status, eventlearnerid,],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          } else {
            console.warn(`Status '${status}' is not 'Completed' or 'Terminated'. Diagram update skipped.`);
          }
        } catch (err) {
          console.warn(`Failed to parse/update scenario diagram for session ${eventlearnerid}:`,err);
        }
      } else {
        console.warn(`No scenario diagram found for session ${eventlearnerid}.`);
      }
      return {success: true, message: "All components destroyed and networks released successfully."};
    } catch (err) {
      console.error("Error in updateCompleteTerminate:", err);
      return {success: false, message: "Unexpected error occurred during termination."};
    }
  };

const restartEventLearner = ({ db, ipAddress, validation }) => async (scenarioid, learnerid, eventlearnerid) => {
    try {
      const stopResult = await updateCompleteTerminate({ db, ipAddress })(eventlearnerid, "Completed", "restart");
      if (!stopResult.success) {
        await new NotiTemplate(db, "proxmox_down", { learner_id: learnerid, userid: 0 }, "System", 0, `Proxmox Service is down. Please try again later.`);
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
        return {success: false, message: `Stop & destroy failed: ${stopResult.message}`};
      }
      await db.sequelize.query(`UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE eventlearnerid = ?`,
        {
          replacements: ["Initializing", eventlearnerid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      await db.sequelize.query(`UPDATE event_learners SET vm_steps = ?, modifiedon = NOW() WHERE eventlearnerid = ?`,
        {
          replacements: ["Initializing", eventlearnerid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      await db.sequelize.query(`UPDATE event_learners SET status = ?, modifiedon = NOW() WHERE eventlearnerid = ?`,
        {
          replacements: ["Initializing", eventlearnerid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      const result = await setEventLearnerConfiguration({db, ipAddress, validation})(scenarioid, learnerid, eventlearnerid);
      if (!result.success) {
        return {success: false, message: result.message};
      }
      componentSetupJob(db, ipAddress, {scenarioid, learnerid, eventlearnerid,
      });
      return {success: true, message: "Restart successful — event is initializing."};
    } catch (err) {
      console.error("Error in restarting event learner:", err);
      return {success: false, message: "Unexpected error occurred during restart."};
    }
  };

const generateProxmoxAccessToken = ({ db, payload }) => async (ip_address) => {
    const proxmox = ProxMoxService(db, payload, ip_address);
    const result = await proxmox.generateAccessTicket();
    const ticket = result?.data?.ticket;
    if (!ticket || result.status !== "200") {
      await new NotiTemplate(db, "proxmox_down", { learner_id: 0, userid: 0 }, "System", 0, `Proxmox Service is down. Please try again later.`);
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
    return {statusCode: result.status === "200" ? 200 : 500, message: result.message,data: ticket ? {ticket, cookie: constants.cookie_prefix + ticket} : null};
  };
  async function setEventLearnerConfigurationOnFailure({db, ipAddress, scenarioid, learnerid, eventlearnerid}) {
  try {
  await db.sequelize.query(`UPDATE vm_configuration SET status = 'Failed', modifiedon = NOW() WHERE scenarioid = ? AND learner_id = ? AND status = "Running"`,
    {
      replacements: [scenarioid, learnerid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
     await db.sequelize.query(`UPDATE event_learners SET vm_steps = 'Failed', modifiedon = NOW(),failedon  = NOW() WHERE eventlearnerid = ?`,
    {
      replacements: [eventlearnerid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
  await db.sequelize.query(`UPDATE event_learners SET status = 'Failed', modifiedon = NOW() WHERE eventlearnerid = ?`,
    {
      replacements: [eventlearnerid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
  await db.sequelize.query(`UPDATE scenario_learner SET status = 'Terminated', modifiedon = NOW() WHERE scenariolearnerid = ( SELECT scenariolearnerid FROM event_learners WHERE eventlearnerid = ?)`,
    {
      replacements: [eventlearnerid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );
  await db.sequelize.query(`INSERT INTO event_learner_logs (eventlearnerid,eventid, learner_id, type, remark, status, createdon) SELECT el.eventlearnerid,el.eventid, el.learner_id, 'System', 'Failed to call Jobs', 'Failed', NOW() FROM event_learners el WHERE el.eventlearnerid = ?`,
    {
      replacements: [eventlearnerid],
      type: db.sequelize.QueryTypes.INSERT,
    }
  );
    return {success: true, message: "Error occured. Please try after some time."};
  } catch (err) {
    console.error("DAO error in fallback:", err);
    throw err;
  }
}




const startEventLearner =
  ({ db, ipAddress }) =>
  async (scenarioid, learnerid, eventlearnerid) => {
    try {
      // 1️⃣ Fetch components for this event learner
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

      // 2️⃣ Loop through each component & start VM
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
        message: "Start process completed — status updated accordingly.",
      };
    } catch (err) {
      console.error("Error in starting event learner:", err);
      return {
        success: false,
        message: "Unexpected error occurred during start.",
      };
    }
  };



module.exports = {
  setEventLearnerConfiguration,
  updateCompleteTerminate,
  restartEventLearner,
  generateProxmoxAccessToken,
  startEventLearner,
  setEventLearnerConfigurationOnFailure
};
