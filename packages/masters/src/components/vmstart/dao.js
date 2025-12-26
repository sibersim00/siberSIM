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
          return { success: false, message: ERROR_MESSAGES.LEARNER_NOT_FOUND };
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
          return { success: false, message: ERROR_MESSAGES.NETWORK_BRIDGES };
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
          return { success: false, message: ERROR_MESSAGES.NETWORK_BRIDGES };
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
          `UPDATE scenario_learner_session SET vm_steps = ?, status = ?, network_bridges = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
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
                }
              );
            }
          }
          await db.sequelize.query(
            `UPDATE scenario_learner SET status = 'Terminated', modifiedon = NOW() WHERE scenariolearnerid = ?`,
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

const updateCompleteTerminate =
  ({ db, ipAddress }) =>
    async (scenariolearnersessionid, status, type) => {
      const RUNNING = "Running";
      const STOPPED = "Stopped";
      const DESTROYED = "Destroyed";
      const FAILED = "Failed";
      const OP_FAILED = "Operation Failed";
      const AVAILABLE = "Available";
      try {
        const [session] = await db.sequelize.query(
          `SELECT scenarioid, learner_id, vm_steps FROM scenario_learner_session WHERE scenariolearnersessionid = ? LIMIT 1`,
          {
            replacements: [scenariolearnersessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (!session) {
          return {
            success: false,
            message: `Session ID ${scenariolearnersessionid} not found.`,
          };
        }
        if (session.vm_steps !== RUNNING && session.vm_steps !== OP_FAILED) {
          return {
            success: false,
            message: `Session vm_steps must be '${RUNNING}' or '${OP_FAILED}' to terminate.`,
          };
        }
        const { scenarioid, learner_id: learnerid } = session;
        const components = await db.sequelize.query(
          `SELECT * FROM vm_configuration WHERE scenariolearnersessionid = ?`,
          {
            replacements: [scenariolearnersessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (!components.length) {
          return {
            success: false,
            message: "No components found for the session.",
          };
        }
        for (const component of components) {
          const { vmid, componenttype, componentname, vmconfigurationid } =
            component;
          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
          try {
            const tokenResult = await proxmoxService.generateAccessTicket();
            if (!tokenResult || tokenResult.status !== "200") {
              new NotiTemplate(
                db,
                "proxmox_down",
                { learner_id: 0, userid: 0 },
                "System",
                0,
                `siberSIM Service is down. Please try again later.`
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
              throw new Error("siberSIM ticket generation failed.");
            }
            await proxmoxService.stopVM(vmid, vmType).catch((err) => {
              new NotiTemplate(
                db,
                "proxmox_down",
                { learner_id: 0, userid: 0 },
                "System",
                0,
                `siberSIM Service is down. Please try again later.`
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
              throw err;
            });

            await db.sequelize.query(
              `UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
              {
                replacements: [STOPPED, vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          } catch (err) {
            console.error(
              `Stopping failed for VM '${componentname}':`,
              err.message
            );
            await db.sequelize.query(
              `UPDATE scenario_learner_session SET vm_steps = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
              {
                replacements: [OP_FAILED, scenariolearnersessionid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
            await db.sequelize.query(
              `UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
              {
                replacements: [OP_FAILED, scenariolearnersessionid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
            await db.sequelize.query(
              `INSERT INTO scenario_learner_logs (scenariolearnersessionid, scenarioid, learner_id,scenariolearnerid, type, remark, status, createdon) SELECT sls.scenariolearnersessionid, sls.scenarioid, sls.learner_id, sls.scenariolearnerid, 'System', 'Failed to Stop and destroy the component', 'Operation Failed', NOW() FROM scenario_learner_session sls WHERE sls.scenariolearnersessionid = ?`,
              {
                replacements: [scenariolearnersessionid],
                type: db.sequelize.QueryTypes.INSERT,
              }
            );
            return {
              success: false,
              message: `Failed to stop '${componentname}': ${err.message}`,
            };
          }
        }
        for (const component of components) {
          const { vmid, componenttype, componentname, vmconfigurationid } =
            component;
          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
          try {
            const tokenResult = await proxmoxService.generateAccessTicket();
            if (!tokenResult || tokenResult.status !== "200") {
              new NotiTemplate(
                db,
                "proxmox_down",
                { learner_id: 0, userid: 0 },
                "System",
                0,
                `siberSIM Service is down. Please try again later.`
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
              throw new Error("siberSIM ticket generation failed.");
            }
            await proxmoxService.destroyVM(vmid, vmType).catch((err) => {
              new NotiTemplate(
                db,
                "proxmox_down",
                { learner_id: 0, userid: 0 },
                "System",
                0,
                `siberSIM Service is down. Please try again later.`
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
              throw err;
            });
            await db.sequelize.query(
              `UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
              {
                replacements: [DESTROYED, vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          } catch (err) {
            console.error(
              `Destruction failed for VM '${componentname}':`,
              err.message
            );
            await db.sequelize.query(
              `UPDATE scenario_learner_session SET vm_steps = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
              {
                replacements: [OP_FAILED, scenariolearnersessionid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
            await db.sequelize.query(
              `UPDATE vm_configuration SET status = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
              {
                replacements: [OP_FAILED, scenariolearnersessionid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );

            await db.sequelize.query(
              `INSERT INTO scenario_learner_logs (scenariolearnersessionid, scenarioid, learner_id, scenariolearnerid, type, remark, status, createdon) SELECT sls.scenariolearnersessionid, sls.scenarioid, sls.learner_id, sls.scenariolearnerid, 'System', 'Failed to Stop and destroy the component', 'Operation Failed', NOW() FROM scenario_learner_session sls WHERE sls.scenariolearnersessionid = ?`,
              {
                replacements: [scenariolearnersessionid],
                type: db.sequelize.QueryTypes.INSERT,
              }
            );
            return {
              success: false,
              message: `Failed to destroy '${componentname}': ${err.message}`,
            };
          }
        }
        await db.sequelize.query(
          `UPDATE scenario_learner_session SET vm_steps = ?, modifiedon = NOW() WHERE scenariolearnersessionid = ?`,
          {
            replacements: [DESTROYED, scenariolearnersessionid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
        return {
          success: true,
          message: "Scenario terminated and cleaned up successfully.",
        };
      } catch (err) {
        console.error("Unexpected Error in updateCompleteTerminate:", err);
        return {
          success: false,
          message: "Unexpected error occurred during termination.",
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
        if (result.status !== "200" || !ticket) {
          new NotiTemplate(
            db,
            "proxmox_down",
            { learner_id: 0, userid: 0 },
            "System",
            0,
            "siberSIM Service is down. Please try again later."
          );
        }
        return {
          statusCode: result.status === "200" ? 200 : 500,
          message: result.message,
          data: ticket
            ? { ticket, cookie: constants.cookie_prefix + ticket }
            : null,
        };
      } catch (error) {
        console.error("Error generating siberSIM access token:", error);
        new NotiTemplate(
          db,
          "proxmox_down",
          { learner_id: 0, userid: 0 },
          "System",
          0,
          "siberSIM Service is down. Please try again later."
        );

        return {
          statusCode: 500,
          message: "Internal server error while generating access token",
          data: null,
        };
      }
    };

async function setScenarioLearnerConfigurationOnFailure({
  db,
  ipAddress,
  scenarioid,
  vmrequestid,
  requestedby_id,
  requestedby_role,
}) {
  try {
    await db.sequelize.query(
      `
      UPDATE vm_request
      SET 
        vm_steps = 'Failed',
        status = 'Failed',
        modifiedon = NOW(),
        failedon = NOW()
      WHERE vmrequestid = :vmrequestid
        AND scenarioid = :scenarioid
      `,
      {
        replacements: { vmrequestid, scenarioid },
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    await db.sequelize.query(
      `
      INSERT INTO vm_request_logs
        (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
      VALUES
        (:vmrequestid, :scenarioid, :requestedby_id, :requestedby_role,
         'Failed', 'Failed to call Jobs', NOW())
      `,
      {
        replacements: {
          vmrequestid,
          scenarioid,
          requestedby_id: requestedby_id ?? null,
          requestedby_role: requestedby_role ?? 'System',
        },
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
      const AVAILABLE = "Available";
      try {
        const sessions = await db.sequelize.query(
          `SELECT vmrequestid FROM vm_request WHERE vm_steps = ?`,
          {
            replacements: [OP_FAILED],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (!sessions.length) {
          return { success: true, message: "No Failed Scenarios to process." };
        }
        for (const { vmrequestid } of sessions) {
          const components = await db.sequelize.query(
            `SELECT * FROM vm_config WHERE vmrequestid = ?`,
            {
              replacements: [vmrequestid],
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          for (const component of components) {
            const { vmid, componenttype, componentname, vmconfigurationid } =
              component;
            const vmType = componenttype.toLowerCase();
            const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
            try {
              const tokenResult = await proxmoxService.generateAccessTicket();
              if (!tokenResult || tokenResult.status !== "200") {
                new NotiTemplate(
                  db,
                  "proxmox_down",
                  { learner_id: 0, userid: 0 },
                  "System",
                  0,
                  "siberSIM Service is down. Please try again later."
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
                throw new Error("siberSIM connection failed.");
              }
              await proxmoxService.stopVM(vmid, vmType);
              await db.sequelize.query(
                `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
                {
                  replacements: [STOPPED, vmconfigurationid],
                  type: db.sequelize.QueryTypes.UPDATE,
                }
              );
            } catch (err) {
              console.error(`Stop failed for VM ${componentname}:`, err.message);
              new NotiTemplate(
                db,
                "proxmox_down",
                { learner_id: 0, userid: 0 },
                "System",
                0,
                "siberSIM Service is down. Please try again later."
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
          }
          for (const component of components) {
            const { vmid, componenttype, componentname, vmconfigurationid } =
              component;
            const vmType = componenttype.toLowerCase();
            const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
            try {
              const tokenResult = await proxmoxService.generateAccessTicket();
              if (!tokenResult || tokenResult.status !== "200") {
                new NotiTemplate(
                  db,
                  "proxmox_down",
                  { learner_id: 0, userid: 0 },
                  "System",
                  0,
                  "siberSIM Service is down. Please try again later."
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
                throw new Error("siberSIM connection failed.");
              }
              await proxmoxService.destroyVM(vmid, vmType);
              await db.sequelize.query(
                `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
                {
                  replacements: [DESTROYED, vmconfigurationid],
                  type: db.sequelize.QueryTypes.UPDATE,
                }
              );
            } catch (err) {
              console.error(
                `Destroy failed for VM ${componentname}:`,
                err.message
              );
              new NotiTemplate(
                db,
                "proxmox_down",
                { learner_id: 0, userid: 0 },
                "System",
                0,
                "siberSIM Service is down. Please try again later."
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
          }
          const bridgesToFree = new Set();
          for (const component of components) {
            if (!component.network_bridge_json) continue;
            try {
              const bridgeMap = JSON.parse(component.network_bridge_json);
              const bridges = Object.values(bridgeMap)
                .map((val) => {
                  const match = val.match(/bridge=([^,"]+)/);
                  return match ? match[1] : null;
                })
                .filter(Boolean);
              bridges.forEach((b) => bridgesToFree.add(b));
            } catch (err) {
              console.warn(
                `Invalid network_bridge_json for vmconfigurationid ${component.vmconfigurationid}`,
                err
              );
            }
          }
          for (const bridge of bridgesToFree) {
            await db.sequelize.query(
              `UPDATE networks SET status = ?, modifiedon = NOW() WHERE networkjson LIKE ?`,
              {
                replacements: [AVAILABLE, `%\"iface\":\"${bridge}\"%`],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          }
          await db.sequelize.query(
            `UPDATE vm_request SET vm_steps = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
            {
              replacements: [DESTROYED, vmrequestid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }
        return { success: true, message: "All Failed Scenarios Removed." };
      } catch (err) {
        console.error("Error in stopAndDestroyFailedScenarios:", err);
        return {
          success: false,
          message: "Error occurred while processing failed scenarios.",
        };
      }
    };

const getOperationFailedLogs =
  ({ db }) =>
    async () => {
      try {
        const result = await db.sequelize.query(
          `SELECT sll.remark, sll.status AS log_status, sll.type, DATE_FORMAT(sll.createdon, '%Y-%m-%d %H:%i:%s') AS log_date, sls.status AS session_status, CASE WHEN sls.status = 'Completed' THEN DATE_FORMAT(sls.completedon, '%Y-%m-%d %H:%i:%s') WHEN sls.status = 'Terminated' THEN DATE_FORMAT(sls.terminatedon, '%Y-%m-%d %H:%i:%s') ELSE NULL END AS session_status_date FROM scenario_learner_logs sll INNER JOIN scenarios s ON s.scenarioid = sll.scenarioid INNER JOIN scenario_learner_session sls ON sls.scenariolearnersessionid = sll.scenariolearnersessionid WHERE sll.status = 'Operation Failed' ORDER BY sll.createdon DESC`,
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


const vncProxyConsole =
  ({ db, validation }) =>
    async (body, ipAddress) => {
      try {
        const { vmid, vmType } = body;
        const proxmoxService = ProxMoxService(db, body, ipAddress);

        let proxyResponse, consoleResponse;

        try {
          // Step 1: Auth
          await proxmoxService.generateAccessTicket();

          // Step 2: Create VNC Proxy
          proxyResponse = await proxmoxService.createVNCProxy(vmid, vmType);

          if (!proxyResponse?.data) {
            throw new Error("Failed to create VNC proxy");
          }

          // Step 3: Build NoVNC URL
          const { port, ticket } = proxyResponse.data; // adjust based on API response
          const vncUrl = `${constants.endpoint}/?port=${port}&ticket=${encodeURIComponent(ticket)}`;

          // Step 4: Open VNC Console
          // consoleResponse = await proxmoxService.openVNCConsole(vncUrl);
          // Remove this
          // consoleResponse = await proxmoxService.openVNCConsole(vncUrl);

          // Instead, only return proxy data
          return {
            statusCode: 200,
            message: "VNC Console opened successfully",
            data: {
              proxy: proxyResponse?.data || null
            }
          };

        } catch (proxmoxErr) {
          console.error("siberSIM Error:", proxmoxErr);

          new NotiTemplate(db, "proxmox_down", { learner_id: 0, userid: 0 }, "System", 0);
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
            message: "siberSIM is unreachable",
            data: null,
          };
        }
      } catch (err) {
        console.error("Error in DAO vncProxyConsole:", err);
        return {
          statusCode: 500,
          message: "Internal server error while generating VNC Console",
          data: null,
        };
      }
    };



const startScenarioLearner =
  ({ db, ipAddress }) =>
    async (scenarioid, learnerid, scenariolearnersessionid) => {
      try {
        // 1️⃣ Fetch components for this event learner
        const components = await db.sequelize.query(
          `SELECT vmid, componenttype, componentname, vmconfigurationid
         FROM vm_configuration
         WHERE scenariolearnersessionid = ?`,
          {
            replacements: [scenariolearnersessionid],
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
              message: `Could not connect to the siberSIM server for ${componentname}.`,
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


const restartscenarioLearner =
  ({ db, ipAddress }) =>
    async (scenarioid, learnerid, scenariolearnersessionid) => {
      try {
        // 1️⃣ Fetch all components for this event learner
        const components = await db.sequelize.query(
          `SELECT vmid, componenttype, componentname, vmconfigurationid
         FROM vm_configuration
         WHERE scenariolearnersessionid = ?`,
          {
            replacements: [scenariolearnersessionid],
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
              message: `Could not connect to the siberSIM server for ${componentname}.`,
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
          if (!tokenResult || tokenResult.status !== "400") {
            return {
              success: false,
              message: `Could not connect to the siberSIM server for ${componentname}.`,
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




// const getSnapshotsByVmid =
//   ({ db }) =>
//   async (vmid) => {
//     try {
//       const snapshots = await db.sequelize.query(
//         `SELECT snapshotid, vmid, snapshot_name, snapshot_status, createdon 
//          FROM vm_snapshots
//          WHERE vmid = ? AND deletedon IS NULL`,
//         {
//           replacements: [vmid],
//           type: db.sequelize.QueryTypes.SELECT,
//         }
//       );

//       return snapshots;
//     } catch (error) {
//       console.error("DAO Error fetching snapshots:", error);
//       return [];
//     }
//   };
const getSnapshotsByVmid =
  ({ db }) =>
    async (vmid) => {
      try {
        const rows = await db.sequelize.query(
          `
        SELECT 
            sd.snapshotid,
            sd.vmid,
            sd.snapshot_name,
            sd.snapshot_status,
            sd.createdon,
            vc.componentname,
            vc.componenttype,
            s.scenariotitle
        FROM vm_snapshots sd
        LEFT JOIN vm_configuration vc 
            ON sd.vmid = vc.vmid
        LEFT JOIN scenarios s
            ON vc.scenarioid = s.scenarioid
        WHERE sd.vmid = ?
          AND sd.deletedon IS NULL
        ORDER BY sd.createdon ASC;
        `,
          {
            replacements: [vmid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        // No snapshots found
        if (!rows.length) {
          return {
            componentname: null,
            scenariotitle: null,
            snapshots: [],
          };
        }

        // extract componentname & scenario title only once
        const componentname = rows[0].componentname;
        const componenttype = rows[0].componenttype;
        const scenariotitle = rows[0].scenariotitle;

        // clean snapshot array
        const snapshots = rows.map((r) => ({
          snapshotid: r.snapshotid,
          vmid: r.vmid,
          snapshot_name: r.snapshot_name,
          snapshot_status: r.snapshot_status,
          createdon: r.createdon,
        }));

        return {
          componentname,
          componenttype,
          scenariotitle,
          snapshots,
        };
      } catch (error) {
        console.error("DAO Error fetching snapshots:", error);
        return {
          componentname: null,
          scenariotitle: null,
          snapshots: [],
        };
      }
    };

const getComponentByVmid = ({ db }) => async (vmid) => {
  const [res] = await db.sequelize.query(
    `
    SELECT
      c.componentid,
      c.componentname,
      c.componenttype,
      c.vmid,
      c.componentcategoryid,
      c.network_ports,
      c.cores,
      c.memory,
      c.storage,
      v.scenarioid,
      v.learner_id
    FROM components c
    INNER JOIN vm_configuration v
      ON c.vmid = v.master_vmid
    WHERE v.vmid = :vmid
      AND c.status = 'Active'
      AND v.status != 'Destroyed'
      AND c.deletedon IS NULL
    LIMIT 1
    `,
    {
      replacements: { vmid }, // 👈 Sequelize replaces :vmid here
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  // Convert JSON ports to readable format
  if (res?.network_ports) {
    try {
      const portsObj = JSON.parse(res.network_ports);

      res.network_ports = Object.entries(portsObj)
        .map(([key, val]) => `${key} - ${val}`)
        .join("\n");
    } catch (err) {
      console.warn("Invalid JSON in network_ports", err);
    }
  }

  return res;
};

const getOriginalVmid = ({ db }) => async (clone_vmid) => {
  const [result] = await db.sequelize.query(
    `
        SELECT master_vmid,scenarioid,learner_id
        FROM vm_configuration
        WHERE vmid = ?
        LIMIT 1
      `,
    {
      replacements: [clone_vmid],
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  return result || null;
};

const saveCustomComponent = ({ db }) => async (data) => {
  const { componentname, componentcategoryid, duration, componentimage, clone_vmid, master_vmid, scenarioid, learner_id, createdby } = data;

  await db.sequelize.query(
    `
        INSERT INTO custom_component 
          (customcomponentuuid, componentname, componentcategoryid, duration, componentimage, clone_vmid, vmid, scenarioid,learner_id, status, createdby, createdon)
        VALUES 
          (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())
      `,
    {
      replacements: [
        componentname,
        componentcategoryid,
        duration,
        componentimage,
        clone_vmid,      // cloned vmid
        master_vmid,
        scenarioid,
        learner_id,    // original vmid (master)
        createdby,
      ],
      type: db.sequelize.QueryTypes.INSERT,
    }
  );

  return true;
};





module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminate,
  generateProxmoxAccessToken,
  setScenarioLearnerConfigurationOnFailure,
  stopAndDestroyFailedScenarios,
  getOperationFailedLogs,
  startScenarioLearner,
  restartscenarioLearner,
  vncProxyConsole,
  getSnapshotsByVmid,
  getComponentByVmid,
  getOriginalVmid,
  saveCustomComponent
};
