const { handleComponentFailure } = require("../../jobs/componentSetupJob");
const { sendProxmoxDownAlerts } = require("../../jobs/componentSetupJob");
const ProxMoxService = require("../../proxmox/services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../../jobs/jobsConstants");
const constants = require("../../proxmox/services/proxmox/constants");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

const setScenarioLearnerConfiguration =
  ({ db }) =>
  async (scenarioid, requestedby_id, vmrequestid) => {
    try {
      const statusVal = "Initializing";
      // Get base clone VM ID
      const [webSettings] = await db.sequelize.query(
        `SELECT base_clone_vmid FROM web_settings WHERE company_id = 1 LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      // Fetch VM request (replacing scenario_learner_session)
      const [vmRequest] = await db.sequelize.query(
        `
        SELECT *
        FROM vm_request
        WHERE vmrequestid = ?
          AND status = ?
        LIMIT 1
        `,
        {
          replacements: [vmrequestid, statusVal],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!vmRequest) {
        await handleComponentFailure(
          db,
          scenarioid,
          requestedby_id,
          vmrequestid,
          statusVal,
          ERROR_MESSAGES.LEARNER_NOT_FOUND,
        );
        return {
          success: false,
          message: ERROR_MESSAGES.LEARNER_NOT_FOUND,
        };
      }

      // Fetch scenario
      const [scenario] = await db.sequelize.query(
        `SELECT component_config, network_config FROM scenarios WHERE scenarioid = ? AND deletedon IS NULL AND scenariostatus = 'Publish' AND status = 'Active'`,
        {
          replacements: [scenarioid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!scenario || !scenario.component_config) {
        await handleComponentFailure(
          db,
          scenarioid,
          requestedby_id,
          vmrequestid,
          statusVal,
          ERROR_MESSAGES.CONFIG_NOT_FOUND_SCENARIO,
        );
        return {
          success: false,
          message: ERROR_MESSAGES.CONFIG_NOT_FOUND_SCENARIO,
        };
      }

      const baseCloneVmid = parseInt(webSettings?.base_clone_vmid || 1000);

      const componentConfig = JSON.parse(scenario.component_config);
      const networkConfig = JSON.parse(scenario.network_config);

      if (networkConfig.length === 0) {
        await handleComponentFailure(
          db,
          scenarioid,
          requestedby_id,
          vmrequestid,
          statusVal,
          ERROR_MESSAGES.NETWORK_BRIDGES,
        );
        return {
          success: false,
          message: ERROR_MESSAGES.NETWORK_BRIDGES,
        };
      }

      //Allocate Networks
      const availableNetworks = await db.sequelize.query(
        `SELECT networkid, networkname FROM networks WHERE status = 'Available' AND deletedon IS NULL ORDER BY networkid ASC LIMIT ?`,
        {
          replacements: [networkConfig.length],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (availableNetworks.length < networkConfig.length) {
        await handleComponentFailure(
          db,
          scenarioid,
          requestedby_id,
          vmrequestid,
          statusVal,
          ERROR_MESSAGES.NETWORK_BRIDGES,
        );
        return {
          success: false,
          message: ERROR_MESSAGES.NETWORK_BRIDGES,
        };
      }

      const networkIds = availableNetworks.map((n) => n.networkid);
      await db.sequelize.query(
        `UPDATE networks SET status = 'Occupied', modifiedon = NOW() WHERE networkid IN (:networkIds)`,
        {
          replacements: { networkIds },
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );

      const networkArray = networkConfig.reduce((acc, key, index) => {
        availableNetworks[index].networkkey = key;
        acc[key] = availableNetworks[index];
        return acc;
      }, {});

      //  Prepare components
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
          `SELECT componenttype, network_bridge_name, vmid_name,componentname FROM components WHERE componentid = ?`,
          {
            replacements: [componentid],
            type: db.sequelize.QueryTypes.SELECT,
          },
        );

        if (componentInfo && componentInfo.network_bridge_name) {
          network_bridge_name = componentInfo.network_bridge_name;
        } else {
          allFound = false;
          break;
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
          requestedby_id,
          vmrequestid,
          componentid,
          nodeid,
          componenttype: componentInfo.componenttype,
          order,
          master_vmid: vmid,
          vmid: null,
          componentname: componentInfo.componentname,
          duration,
          network_bridge_json: JSON.stringify(network_bridge_json),
          status: statusVal,
        });
      }

      //  Insert into vm_config
      if (allFound) {
        for (const comp of preparedComponents) {
          const insertQuery = `INSERT INTO vm_config
            (scenarioid, vmrequestid, componentid, nodeid, componenttype, \`order\`, master_vmid, vmid, componentname, duration, network_bridge_json, status, createdon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
          const insertValues = [
            comp.scenarioid,
            comp.vmrequestid,
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

          const realVmid = configInsert + baseCloneVmid;
          await db.sequelize.query(
            `UPDATE vm_config SET vmid = ? WHERE vmconfigurationid = ?`,
            {
              replacements: [realVmid, configInsert],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
        }

        await db.sequelize.query(
          `UPDATE vm_request SET vm_steps = ?, status = ?, network_bridges = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
          {
            replacements: [
              statusVal,
              "Initializing",
              JSON.stringify(availableNetworks),
              vmrequestid,
            ],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );

        return {
          success: true,
          message: ERROR_MESSAGES.VM_CONFIG_SUCCESS,
        };
      } else {
        // Release occupied networks
        for (const net of availableNetworks) {
          if (net.networkname) {
            await db.sequelize.query(
              `UPDATE networks SET status = ?, modifiedon = NOW() WHERE networkjson LIKE ?`,
              {
                replacements: ["Available", `%${net.networkname}%`],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
          }
        }

        await handleComponentFailure(
          db,
          scenarioid,
          requestedby_id,
          vmrequestid,
          statusVal,
          ERROR_MESSAGES.COMPONENT_NOT_FOUND,
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
        },
      );
    }
  }
};

async function markOperationFailedAndNotify(
  db,
  vmrequestid,
  err,
  scenarioid,
  learner_id,
) {
  const OP_FAILED = "Operation Failed";
  console.error("Operation failed:", err?.message || err);

  // Send notification & email alert
  await sendProxmoxDownAlerts(db, learner_id);

  await new NotiTemplate(
    db,
    "proxmox_terminate",
    { userid: 0, scenarioid, learner_id },
    "Admin",
    0,
  );

  //  Update VM request status to 'Operation Failed'
  await db.sequelize.query(
    `UPDATE vm_request
     SET status = ?, vm_steps = ?, modifiedon = NOW()
     WHERE vmrequestid = ?`,
    {
      replacements: [OP_FAILED, OP_FAILED, vmrequestid],
      type: db.sequelize.QueryTypes.UPDATE,
    },
  );

  await db.sequelize.query(
    `INSERT INTO vm_request_logs
      (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
      SELECT
        vr.vmrequestid,
        vr.scenarioid,
        vr.requestedby_id,
        'System' AS requestedby_role,
        'Operation Failed' AS status,
        'Failed to stop and destroy the components' AS remark,
        NOW()
      FROM vm_request vr
      WHERE vr.vmrequestid = ?`,
    {
      replacements: [vmrequestid],
      type: db.sequelize.QueryTypes.INSERT,
    },
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
    console.error("Error fetching Termination Delay:", err);
    return 10000; // fallback to 10 sec
  }
};

const updateCompleteTerminatelearner =
  ({ db, ipAddress }) =>
  async (vmrequestid, status, type) => {
    const RUNNING = "Running";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const FAILED = "Failed";
    const OP_FAILED = "Operation Failed";
    let hasFailed = false;

    //  Fetch VM request
    const [vmRequest] = await db.sequelize.query(
      `SELECT * FROM vm_request WHERE vmrequestid = ? LIMIT 1`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );
    console.log("vmRequestvmRequestvmRequestvmRequest", vmRequest);

    if (!vmRequest) {
      return { success: false, message: "VM Request not found." };
    }

    let scenariodiagram;
    if (vmRequest?.scenariodiagram) {
      try {
        scenariodiagram = JSON.parse(vmRequest.scenariodiagram);

        scenariodiagram.nodes?.forEach((node) => {
          if (node?.data?.isOnline) node.data.isOnline = "No";
        });
        scenariodiagram.edges?.forEach((edge) => {
          if (edge?.isAttacked) edge.isAttacked = "No";
        });

        await db.sequelize.query(
          `UPDATE vm_request SET scenariodiagram = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
          {
            replacements: [JSON.stringify(scenariodiagram), vmrequestid],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
      } catch (diagramErr) {
        console.error("Error resetting diagram at start:", diagramErr);
      }
    }

    const handleFailureOnce = async (err) => {
      if (!hasFailed) {
        hasFailed = true;
        await markOperationFailedAndNotify(
          db,
          vmrequestid,
          err,
          vmRequest.scenarioid,
          vmRequest.requestedby_id,
        );
      }
    };

    let components = [];

    try {
      if (vmRequest.vm_steps !== RUNNING && vmRequest.vm_steps !== OP_FAILED) {
        return {
          success: false,
          message: `VM request must be '${RUNNING}' or '${OP_FAILED}' to terminate.`,
        };
      }

      // Fetch components for this VM request
      components = await db.sequelize.query(
        `SELECT * FROM vm_config WHERE vmrequestid = ? and status = "Running"`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      const vmConfig = {};
      components.forEach(({ vmid }) => {
        vmConfig[vmid] = { stop: false, destroy: false };
      });
      const proxmoxService = ProxMoxService(db, {}, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message:
            "Could not connect to the server while destroying components.",
        };
      }

      // Stop loop
      for (const {
        vmid,
        componenttype,
        componentname,
        vmconfigurationid,
      } of components) {
        const proxmoxService = ProxMoxService(
          db,
          { vmType: componenttype.toLowerCase() },
          ipAddress,
        );
        const stopResult = await proxmoxService.stopVM(
          vmid,
          componenttype.toLowerCase(),
        );
        if (stopResult?.status === 200 && stopResult?.data) {
          vmConfig[vmid].stop = true;
        } else {
          await db.sequelize.query(
            `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
            {
              replacements: ["Stopped", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
          await handleFailureOnce(
            new Error(`Stop failed for ${componentname}`),
          );
        }
      }

      // Wait before destroy
      await sleep(await getTerminationDelay(db));

      //  Destroy loop
      for (const {
        vmid,
        componenttype,
        componentname,
        vmconfigurationid,
      } of components) {
        if (!vmConfig[vmid].stop) continue;

        const proxmoxService = ProxMoxService(
          db,
          { vmType: componenttype.toLowerCase() },
          ipAddress,
        );
        const destroyResult = await proxmoxService.destroyVM(
          vmid,
          componenttype.toLowerCase(),
        );
        if (destroyResult?.status === 200 && destroyResult?.data) {
          vmConfig[vmid].destroy = true;

          await db.sequelize.query(
            `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
            {
              replacements: ["Completed", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
        } else {
          await db.sequelize.query(
            `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
            {
              replacements: ["Destroyed", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
          await handleFailureOnce(
            new Error(`Destroy failed for ${componentname}`),
          );
        }
      }

      if (!hasFailed) {
        await db.sequelize.query(
          `UPDATE vm_request SET vm_steps = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
          {
            replacements: [DESTROYED, vmrequestid],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
      }

      // Release Networks
      await releaseNetworks(db, vmRequest.network_bridges);

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
      await releaseNetworks(db, vmRequest.network_bridges);
      await handleFailureOnce(err);
      return {
        success: false,
        message: "Unexpected error occurred during termination.",
      };
    } finally {
      try {
        if (scenariodiagram) {
          scenariodiagram.nodes?.forEach((node) => {
            if (node?.data?.isOnline) node.data.isOnline = "No";
          });
          scenariodiagram.edges?.forEach((edge) => {
            if (edge?.isAttacked) edge.isAttacked = "No";
          });

          await db.sequelize.query(
            `UPDATE vm_request SET scenariodiagram = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
            {
              replacements: [JSON.stringify(scenariodiagram), vmrequestid],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
        }
      } catch (diagramErr) {
        console.error("Error while resetting isAttacked:", diagramErr);
      }

      // Mark snapshots deleted
      try {
        const vmids = components.map((c) => c.vmid).filter((v) => v);
        if (vmids.length > 0) {
          await db.sequelize.query(
            `UPDATE vm_snapshots SET snapshot_status = 'Delete', deletedon = NOW() WHERE vmid IN (${vmids.map(() => "?").join(",")}) AND deletedon IS NULL`,
            { replacements: vmids, type: db.sequelize.QueryTypes.UPDATE },
          );
        }
      } catch (snapErr) {
        console.error("Error marking snapshots deleted:", snapErr);
      }

      // Reject pending custom components
      try {
        const vmids = components.map((c) => c.vmid).filter((v) => v);
        if (vmids.length > 0) {
          await db.sequelize.query(
            `UPDATE custom_component
              SET status = 'reject', reject_reason = 'Scenario completed or terminated', modifiedby = ?, modifiedon = NOW()
              WHERE clone_vmid IN (${vmids.map(() => "?").join(",")}) AND status = 'pending'`,
            {
              replacements: [vmRequest.requestedby_id, ...vmids],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
        }
      } catch (ccErr) {
        console.error("Error rejecting pending custom components:", ccErr);
      }
    }
  };

const deleteScenarioLearner =
  ({ db, ipAddress }) =>
  async (vmrequestid) => {
    const DESTROYED = "Destroyed";
    let hasFailed = false;

    // Fetch VM request info
    const [request] = await db.sequelize.query(
      `SELECT scenarioid, requestedby_id AS learner_id, status, network_bridges, scenariodiagram
         FROM vm_request
         WHERE vmrequestid = ? LIMIT 1`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (!request) {
      return { success: false, message: "Invalid VM request." };
    }

    // Reset diagram (mark nodes offline + remove attacks)
    let scenariodiagram;
    try {
      if (request.scenariodiagram) {
        scenariodiagram = JSON.parse(request.scenariodiagram);

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
      }
    } catch (e) {
      console.error("Diagram update failed:", e);
    }

    // Helper to ensure failure logs/updates run only once
    const handleFailureOnce = async (err) => {
      if (!hasFailed) {
        hasFailed = true;
        await markOperationFailedAndNotify(
          db,
          vmrequestid,
          err,
          request.scenarioid,
          request.learner_id,
        );
      }
    };

    try {
      // Fetch all VM components for this request
      const components = await db.sequelize.query(
        `SELECT * FROM vm_config WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      // Loop over components and delete based on type
      for (const {
        vmid,
        componenttype,
        componentname,
        vmconfigurationid,
      } of components) {
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          return {
            success: false,
            message: "We couldn't authenticate with the server.Please try after some time",
          };
        }

        if (vmType === "lxc") {
          const destroyRes = await proxmoxService.destroyVM(vmid, vmType);
          if (destroyRes?.status === 200) {
            await db.sequelize.query(
              `UPDATE vm_config SET status='Completed', modifiedon=NOW()
                 WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
            await db.sequelize.query(
              `UPDATE vm_request SET vm_steps='Destroyed', modifiedon=NOW()
                 WHERE vmrequestid=?`,
              {
                replacements: [vmrequestid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
          } else {
            await db.sequelize.query(
              `UPDATE vm_config SET status='Destroyed', modifiedon=NOW()
                 WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
            await handleFailureOnce(
              new Error(`LXC delete failed for ${componentname}`),
            );
          }
        } else if (vmType === "qemu") {
          const stopRes = await proxmoxService.stopVM(vmid, vmType);
          if (stopRes?.status !== 200) {
            await handleFailureOnce(
              new Error(`Stop failed for ${componentname}`),
            );
          }
          await sleep(await getTerminationDelay(db));
          const destroyRes = await proxmoxService.destroyVM(vmid, vmType);

          if (destroyRes?.status === 200) {
            await db.sequelize.query(
              `UPDATE vm_config SET status='Completed', modifiedon=NOW()
                 WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
            await db.sequelize.query(
              `UPDATE vm_request SET vm_steps='Destroyed', modifiedon=NOW()
                 WHERE vmrequestid=?`,
              {
                replacements: [vmrequestid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
          } else {
            await db.sequelize.query(
              `UPDATE vm_config SET status='Destroyed', modifiedon=NOW()
                 WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
            await handleFailureOnce(
              new Error(`Destroy failed for ${componentname}`),
            );
          }
        }
      }

      // Update VM request status if no failures
      if (!hasFailed) {
        await db.sequelize.query(
          `UPDATE vm_request
             SET status="Terminated", vm_steps=?, modifiedon=NOW()
             WHERE vmrequestid=?`,
          {
            replacements: [DESTROYED, DESTROYED, vmrequestid],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
      }

      // Release networks
      await releaseNetworks(db, request.network_bridges);

      return { success: true, message: "Scenario deleted successfully." };
    } catch (err) {
      console.error("Error in deleteScenarioLearner:", err);
      await releaseNetworks(db, request.network_bridges);
      await handleFailureOnce(err);
      return { success: false, message: "Unexpected error occurred." };
    } finally {
      // Mark snapshots as deleted
      try {
        const comps = await db.sequelize.query(
          `SELECT vmid FROM vm_config WHERE vmrequestid=?`,
          { replacements: [vmrequestid], type: db.sequelize.QueryTypes.SELECT },
        );

        const vmids = comps.map((c) => c.vmid).filter((v) => v);

        if (vmids.length > 0) {
          await db.sequelize.query(
            `UPDATE vm_snapshots
               SET snapshot_status='Delete', deletedon=NOW()
               WHERE vmid IN (${vmids.map(() => "?").join(",")}) AND deletedon IS NULL`,
            { replacements: vmids, type: db.sequelize.QueryTypes.UPDATE },
          );
        }
      } catch (e) {
        console.error("Snapshot delete update failed:", e);
      }

      // Insert VM request logs for each failed or completed action
      try {
        await db.sequelize.query(
          `INSERT INTO vm_request_logs (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon)
             VALUES (?, ?, ?, 'System', 'Terminated', 'Scenario deleted or components destroyed', NOW())`,
          {
            replacements: [vmrequestid, request.scenarioid, request.learner_id],
            type: db.sequelize.QueryTypes.INSERT,
          },
        );
      } catch (logErr) {
        console.error("Failed to insert VM request log:", logErr);
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

      // 1. Get all VM requests where vm_steps is 'Operation Failed'
      const requests = await db.sequelize.query(
        `SELECT vmrequestid 
           FROM vm_request
           WHERE vm_steps = ?`,
        {
          replacements: [OPERATION_FAILED],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!requests.length) {
        return {
          success: true,
          message: "No VM requests with 'Operation Failed' found.",
        };
      }

      let terminatedCount = 0;

      for (const { vmrequestid } of requests) {
        // 2. Get all VM components for this request
        const components = await db.sequelize.query(
          `SELECT status FROM vm_config 
             WHERE vmrequestid = ?`,
          {
            replacements: [vmrequestid],
            type: db.sequelize.QueryTypes.SELECT,
          },
        );

        // 3. Ensure all components are 'Operation Failed'
        const allFailed =
          components.length > 0 &&
          components.every((comp) => comp.status === OPERATION_FAILED);

        if (!allFailed) {
          console.log(
            `Skipping request ${vmrequestid}: not all VMs are 'Operation Failed'.`,
          );
          continue;
        }

        // 4. Attempt to cleanly stop + destroy
        const result = await updateCompleteTerminatelearner({ db, ipAddress })(
          vmrequestid,
          COMPLETED,
          "AutoTerminate",
        );

        if (result.success) {
          terminatedCount++;
        } else {
          console.error(
            `Auto-terminate failed for request ${vmrequestid}: ${result.message}`,
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
        ipAddress,
      );
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `We couldn't authenticate with the server.Please try after some time.`,
        };
      }
      const startResult = await proxmoxService.startVM(
        vmid,
        vmType.toLowerCase(),
      );
      if (startResult?.status === 200) {
        await db.sequelize.query(
          `UPDATE vm_config
             SET status = 'Running', modifiedon = NOW()
             WHERE vmid = ? AND componenttype = ?`,
          {
            replacements: [vmid, vmType.toUpperCase()],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
        return {
          success: true,
          message: `VM ${vmid} (${vmType}) started successfully.`,
        };
      }
      return {
        success: false,
        message: `Failed to start VM ${vmid} (${vmType}).`,
      };
    } catch (err) {
      console.error(`Error starting VM ${vmid}:`, err);
      await db.sequelize.query(
        `UPDATE vm_config
           SET status = 'Failed', modifiedon = NOW()
           WHERE vmid = ?`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );

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
        ipAddress,
      );
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `We couldn't authenticate with the server.Please try after some time`,
        };
      }
      const stopResult = await proxmoxService.stopVM(
        vmid,
        vmType.toLowerCase(),
      );
      if (stopResult?.status !== 200) {
        return {
          success: false,
          message: `Failed to stop VM ${vmid} (${vmType}).`,
        };
      }
      await sleep(await getTerminationDelay(db));
      const startResult = await proxmoxService.startVM(
        vmid,
        vmType.toLowerCase(),
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
const createSnapshot =
  ({ db, ipAddress }) =>
  async (vmid, vmType, vmstate) => {
    try {
      // Fetch config with componentname
      const vmConfig = await db.sequelize.query(
        `SELECT master_vmid, vmrequestid, scenarioid, componentname
           FROM vm_config
           WHERE vmid = ?
           LIMIT 1`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (!vmConfig.length) {
        return { success: false, message: `VM ID ${vmid} not found.` };
      }
      const { master_vmid, vmrequestid, scenarioid, componentname } =
        vmConfig[0];
      // Fetch active snapshots (limit = 3)
      const activeSnapshots = await db.sequelize.query(
        `SELECT snapshot_name 
           FROM vm_snapshots
           WHERE vmid = ? AND deletedon IS NULL`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (activeSnapshots.length >= 3) {
        return {
          success: false,
          message: `This VM already has 3 snapshots. To create a new one, please remove an older snapshot.`,
        };
      }
      const [latestSnap] = await db.sequelize.query(
        `SELECT snapshot_name 
           FROM vm_snapshots
           WHERE vmid = ?
           ORDER BY snapshotid DESC
           LIMIT 1`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      let nextNumber = 1;
      if (latestSnap && latestSnap.snapshot_name) {
        const match = latestSnap.snapshot_name.match(/-snapshot-(\d+)$/i);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      const sanitizeComponentName = (name) => {
        if (!name) return "component";
        const parts = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
        return parts
          .map((p, index) =>
            index === 0
              ? p.toLowerCase()
              : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(),
          )
          .join("");
      };
      const formattedComponentName = sanitizeComponentName(componentname);
      const snapname = `${formattedComponentName}-snapshot-${nextNumber}`;
      const proxmoxService = ProxMoxService(
        db,
        { vmType: vmType.toLowerCase() },
        ipAddress,
      );
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: `We couldn't authenticate with the server.Please try after some time` };
      }
      let snapshotResult;
      if (vmType.toLowerCase() === "lxc") {
        snapshotResult = await proxmoxService.createLXCSnapshot(vmid, snapname);
      } else {
        if (!vmstate)
          return { success: false, message: "vmstate required for QEMU." };
        snapshotResult = await proxmoxService.createQEMUSnapshot(
          vmid,
          snapname,
          vmstate,
        );
      }
      if (snapshotResult?.status !== 200) {
        return { success: false, message: `Snapshot creation failed.` };
      }
      await db.sequelize.query(
        `INSERT INTO vm_snapshots  (master_vmid, vmid, scenarioid, component_type, snapshot_name, snapshot_status, createdon) VALUES (?, ?, ?, ?, ?, 'Capture', NOW())`,
        {
          replacements: [
            master_vmid,
            vmid,
            scenarioid,
            vmType.toUpperCase(),
            snapname,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        },
      );

      return {
        success: true,
        message: `Snapshot '${snapname}' created successfully.`,
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Unexpected error occurred." };
    }
  };

const deleteSnapshot =
  ({ db, ipAddress }) =>
  async (vmid, vmType, snapname) => {
    try {
      const proxmoxService = ProxMoxService(
        db,
        { vmType: vmType.toLowerCase() },
        ipAddress,
      );

      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `We couldn't authenticate with the server.Please try after some time`,
        };
      }
      let deleteResult;

      if (vmType.toLowerCase() === "lxc") {
        deleteResult = await proxmoxService.deleteLXCSnapshot(vmid, snapname);
      } else if (vmType.toLowerCase() === "qemu") {
        deleteResult = await proxmoxService.deleteQEMUSnapshot(vmid, snapname);
      } else {
        return {
          success: false,
          message: "Invalid vmType. Must be 'lxc' or 'qemu'.",
        };
      }

      if (deleteResult?.status !== 200) {
        return {
          success: false,
          message: `Failed to delete snapshot '${snapname}' for VM ${vmid}.`,
        };
      }
      await db.sequelize.query(
        `UPDATE vm_snapshots  SET   snapshot_status = 'Delete',  deletedon = NOW()  WHERE vmid = ?   AND snapshot_name = ?  LIMIT 1`,
        {
          replacements: [vmid, snapname],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );
      return {
        success: true,
        message: `Snapshot '${snapname}' deleted successfully for VM ${vmid}.`,
      };
    } catch (err) {
      console.error(
        `Error deleting snapshot '${snapname}' for VM ${vmid}:`,
        err,
      );
      return {
        success: false,
        message: "Unexpected error occurred while deleting snapshot.",
      };
    }
  };

const restoreSnapshot =
  ({ db, ipAddress }) =>
  async (vmid, vmType, snapname, startValue) => {
    try {
      const proxmoxService = ProxMoxService(
        db,
        { vmType: vmType.toLowerCase() },
        ipAddress,
      );

      // Fetch snapshots in chronological order
      const snapshots = await db.sequelize.query(
        `SELECT snapshot_name FROM vm_snapshots WHERE vmid = ? AND deletedon IS NULL ORDER BY createdon ASC`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (snapshots.length === 0) {
        return { success: false, message: "No snapshots found." };
      }

      const snapshotNames = snapshots.map((s) => s.snapshot_name);
      const latestSnapshot = snapshotNames[snapshotNames.length - 1];

      // Generate Proxmox Token
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: `We couldn't authenticate with the server.Please try after some time` };
      }
      // If selected snapshot IS the latest → restore directly
      if (snapname === latestSnapshot) {
        const result = await performRestore(
          vmid,
          vmType,
          snapname,
          startValue,
          ipAddress,
          db,
        );

        if (result.success) {
          await db.sequelize.query(
            `UPDATE vm_snapshots SET snapshot_status = 'Restore' WHERE vmid = ? AND snapshot_name = ? AND deletedon IS NULL`,
            {
              replacements: [vmid, snapname],
              type: db.sequelize.QueryTypes.UPDATE,
            },
          );
        }
        return result;
      }
      // If NOT latest → delete higher snapshots automatically
      const snapIndex = snapshotNames.indexOf(snapname);
      if (snapIndex === -1) {
        return { success: false, message: "Snapshot not found." };
      }
      const snapshotsToDelete = snapshotNames.slice(snapIndex + 1);
      // Delete snapshots AFTER the selected one
      for (const sname of snapshotsToDelete) {
        let deleteResult;

        if (vmType.toLowerCase() === "lxc") {
          deleteResult = await proxmoxService.deleteLXCSnapshot(vmid, sname);
        } else {
          deleteResult = await proxmoxService.deleteQEMUSnapshot(vmid, sname);
        }

        if (deleteResult?.status !== 200) {
          return {
            success: false,
            message: `Failed to delete snapshot '${sname}'. Restore cancelled.`,
          };
        }
        // Update delete status in DB
        await db.sequelize.query(
          `UPDATE vm_snapshots SET snapshot_status = 'Delete', deletedon = NOW() WHERE vmid = ? AND snapshot_name = ? LIMIT 1`,
          {
            replacements: [vmid, sname],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
      }
      //After deleting ≥ snapshots → restore the selected snapshot
      const restoreResult = await performRestore(
        vmid,
        vmType,
        snapname,
        startValue,
        ipAddress,
        db,
      );
      if (restoreResult.success) {
        await db.sequelize.query(
          `UPDATE vm_snapshots SET snapshot_status = 'Restore' WHERE vmid = ? AND snapshot_name = ? AND deletedon IS NULL`,
          {
            replacements: [vmid, snapname],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
        return {
          success: true,
          message: `'${snapname}' has been restored successfully`,
        };
      }
      return restoreResult;
    } catch (err) {
      console.error(err);
      return { success: false, message: "Unexpected error occurred." };
    }
  };

async function performRestore(
  vmid,
  vmType,
  snapname,
  startValue,
  ipAddress,
  db,
) {
  const proxmoxService = ProxMoxService(
    db,
    { vmType: vmType.toLowerCase() },
    ipAddress,
  );
  const tokenResult = await proxmoxService.generateAccessTicket();
  if (!tokenResult || tokenResult.status !== "200") {
    return { success: false, message: `We couldn't authenticate with the server.Please try after some time` };
  }
  let restoreResult;
  if (vmType.toLowerCase() === "lxc") {
    restoreResult = await proxmoxService.restoreLXCSnapshot(
      vmid,
      snapname,
      startValue,
    );
  } else {
    restoreResult = await proxmoxService.restoreQEMUSnapshot(
      vmid,
      snapname,
      startValue,
    );
  }

  if (restoreResult?.status === 200) {
    return {
      success: true,
      message: `Snapshot '${snapname}' restored successfully.`,
    };
  }
  return {
    success: false,
    message: `Failed to restore snapshot '${snapname}'.`,
  };
}
const getHibernateDelay = async (db) => {
  try {
    const [settings] = await db.sequelize.query(
      `SELECT hibernate_delay FROM web_settings WHERE status = 1 LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT },
    );

    const delaySeconds =
      settings?.hibernate_delay && Number.isFinite(settings.hibernate_delay)
        ? settings.hibernate_delay
        : 10;

    return delaySeconds * 1000; // convert to ms
  } catch (err) {
    console.error("Error fetching Hibernate Delay:", err);
    return 10000; // fallback to 10 sec
  }
};

const pauseScenarioLearner =
  ({ db, ipAddress }) =>
  async (vmrequestid) => {
    try {
      // ------------------ FETCH COMPONENTS ------------------
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname
         FROM vm_config
         WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!components.length) {
        return {
          success: false,
          message: "No VM components found for this VM request.",
        };
      }

      const hibernateDelayMs = await getHibernateDelay(db);

      let allSuccess = true;
      let proxmoxFailed = false;
      let results = [];
      let pausedVMs = [];

      // ------------------ PAUSE LOOP ------------------
      for (const { vmid, componenttype } of components) {
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        // -------- Generate Proxmox Ticket --------
        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          allSuccess = false;
          proxmoxFailed = true;

          results.push({
            vmid,
            status: "failed",
            message: `We couldn't authenticate with the server.Please try after some time`,
          });
          break;
        }

        // -------- Pause / Stop VM --------
        let pauseResult;
        if (vmType === "qemu") {
          pauseResult = await proxmoxService.pauseVM(vmid, vmType);
        } else if (vmType === "lxc") {
          pauseResult = await proxmoxService.stopVM(vmid, vmType);
        } else {
          allSuccess = false;
          proxmoxFailed = true;

          results.push({
            vmid,
            status: "failed",
            message: `Invalid VM type ${vmType} for VM ${vmid}`,
          });
          break;
        }

        // -------- Pause Success --------
        if (pauseResult?.status === 200) {
          await db.sequelize.query(
            `UPDATE vm_config
             SET status = 'Hibernate', modifiedon = NOW()
             WHERE vmrequestid = ? AND vmid = ?`,
            {
              replacements: [vmrequestid, vmid],
            },
          );

          pausedVMs.push({ vmid, vmType });

          results.push({
            vmid,
            status: "success",
            message:
              vmType === "qemu"
                ? `VM ${vmid} paused successfully`
                : `VM ${vmid} stopped successfully (LXC pause equivalent)`,
          });
        } else {
          // -------- Pause Failed --------
          allSuccess = false;
          proxmoxFailed = true;

          results.push({
            vmid,
            status: "failed",
            message:
              vmType === "qemu"
                ? `Failed to pause VM ${vmid}`
                : `Failed to stop VM ${vmid}`,
          });
          break;
        }

        await sleep(hibernateDelayMs);
      }

      // ------------------ ROLLBACK (FALLBACK) ------------------
      if (proxmoxFailed && pausedVMs.length > 0) {
        console.warn(
          `Rollback started for vmrequestid ${vmrequestid}. Restoring ${pausedVMs.length} VMs`,
        );

        for (const { vmid, vmType } of pausedVMs) {
          try {
            const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
            await proxmoxService.generateAccessTicket();

            if (vmType === "qemu") {
              await proxmoxService.resumeVM(vmid, vmType);
            } else if (vmType === "lxc") {
              await proxmoxService.startVM(vmid, vmType);
            }
            await db.sequelize.query(
              `UPDATE vm_config
               SET status = 'Running', modifiedon = NOW()
               WHERE vmrequestid = ? AND vmid = ?`,
              {
                replacements: [vmrequestid, vmid],
              },
            );
          } catch (rollbackErr) {
            console.error(
              `Rollback failed for VM ${vmid}:`,
              rollbackErr.message,
            );
          }
        }
      }
      // ------------------ FINAL RESPONSE ------------------
      return {
        success: allSuccess,
        message: allSuccess
          ? "All VMs paused successfully."
          : proxmoxFailed
            ? "Pause failed. Rollback executed. Scenario restored to running state."
            : "Scenario failed to pause.",
        details: results,
      };
    } catch (err) {
      console.error("Error in pauseScenarioLearner:", err);
      return {
        success: false,
        message: "Unexpected error occurred during pause.",
      };
    }
  };

const resumeScenarioLearner =
  ({ db, ipAddress }) =>
  async (vmrequestid) => {
    try {
      // ------------------ FETCH COMPONENTS ------------------
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname
         FROM vm_config
         WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!components.length) {
        return {
          success: false,
          message: "No VM components found for this VM request.",
        };
      }

      const hibernateDelayMs = await getHibernateDelay(db);

      let allSuccess = true;
      let proxmoxFailed = false;
      let results = [];
      let resumedVMs = [];

      // ------------------ RESUME LOOP ------------------
      for (const { vmid, componenttype } of components) {
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        // -------- Generate Proxmox Ticket --------
        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          allSuccess = false;
          proxmoxFailed = true;

          results.push({
            vmid,
            status: "failed",
            message: `We couldn't authenticate with the server.Please try after some time`,
          });
          break;
        }
        // -------- Resume / Start VM --------
        let resumeResult;
        if (vmType === "qemu") {
          resumeResult = await proxmoxService.resumeVM(vmid, vmType);
        } else if (vmType === "lxc") {
          resumeResult = await proxmoxService.startVM(vmid, vmType);
        } else {
          allSuccess = false;
          proxmoxFailed = true;

          results.push({
            vmid,
            status: "failed",
            message: `Invalid VM type ${vmType} for VM ${vmid}`,
          });
          break;
        }
        // -------- Resume Success --------
        if (resumeResult?.status === 200) {
          await db.sequelize.query(
            `UPDATE vm_config
             SET status = 'Running', modifiedon = NOW()
             WHERE vmrequestid = ? AND vmid = ?`,
            {
              replacements: [vmrequestid, vmid],
            },
          );
          resumedVMs.push({ vmid, vmType });
          results.push({
            vmid,
            status: "success",
            message:
              vmType === "qemu"
                ? `VM ${vmid} resumed successfully`
                : `VM ${vmid} started successfully (LXC resume equivalent)`,
          });
        } else {
          allSuccess = false;
          proxmoxFailed = true;

          results.push({
            vmid,
            status: "failed",
            message:
              vmType === "qemu"
                ? `Failed to resume VM ${vmid}`
                : `Failed to start VM ${vmid}`,
          });
          break;
        }

        await sleep(hibernateDelayMs);
      }
      // ------------------ ROLLBACK (FALLBACK) ------------------
      if (proxmoxFailed && resumedVMs.length > 0) {
        console.warn(
          `Resume rollback started for vmrequestid ${vmrequestid}. Re-hibernating ${resumedVMs.length} VMs`,
        );
        for (const { vmid, vmType } of resumedVMs) {
          try {
            const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
            await proxmoxService.generateAccessTicket();

            if (vmType === "qemu") {
              await proxmoxService.pauseVM(vmid, vmType);
            } else if (vmType === "lxc") {
              await proxmoxService.stopVM(vmid, vmType);
            }
            await db.sequelize.query(
              `UPDATE vm_config
               SET status = 'Hibernate', modifiedon = NOW()
               WHERE vmrequestid = ? AND vmid = ?`,
              {
                replacements: [vmrequestid, vmid],
              },
            );
          } catch (rollbackErr) {
            console.error(
              `Resume rollback failed for VM ${vmid}:`,
              rollbackErr.message,
            );
          }
        }
      }
      return {
        success: allSuccess,
        message: allSuccess
          ? "All VMs resumed successfully."
          : proxmoxFailed
            ? "Resume failed. Rollback executed. Scenario restored to hibernate state."
            : "Scenario failed to resume.",
        details: results,
      };
    } catch (err) {
      console.error("Error in resumeScenarioLearner:", err);
      return {
        success: false,
        message: "Unexpected error occurred during resume.",
      };
    }
  };

const fetchScenarioWithComponents = async (db, scenarioId) => {
  const rows = await db.sequelize.query(
    `SELECT * FROM scenarios WHERE scenarioid = :scenarioId`,
    {
      replacements: { scenarioId },
      type: db.sequelize.QueryTypes.SELECT,
    },
  );
  if (!rows.length) return null;
  const scenario = rows[0];
  // Parse components JSON
  let componentIds = [];
  try {
    const parsed = JSON.parse(scenario.component_config);
    componentIds = parsed.map((c) => c.componentid);
  } catch (err) {
    console.error("Error parsing components JSON:", err);
  }

  if (componentIds.length > 0) {
    const componentDetails = await db.sequelize.query(
      `SELECT * FROM components WHERE componentid IN (:componentIds)`,
      {
        replacements: { componentIds },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    scenario.componentDetails = componentDetails;
  } else {
    scenario.componentDetails = [];
  }

  return scenario;
};

const getScenarioById =
  ({ db, ipAddress }) =>
  async (scenarioId) => {
    try {
      const scenario = await fetchScenarioWithComponents(db, scenarioId);
      if (!scenario) {
        return { success: false, message: "Scenario not found." };
      }

      const components = scenario.componentDetails || [];
      const vmComponents = components.filter((c) => c.vmid);

      if (!vmComponents.length) {
        return {
          success: false,
          message: "No VMID found in scenario component details.",
        };
      }

      let backupResults = [];

      for (const comp of vmComponents) {
        const { vmid, componentname } = comp;

        try {
          const proxmoxService = ProxMoxService(db, {}, ipAddress);
          const tokenResult = await proxmoxService.generateAccessTicket();
          if (!tokenResult || tokenResult.status !== "200") {
            return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
          }

          const backup = await proxmoxService.takeBackup(vmid);

          if (backup?.data) {
            const upid = backup.data.data;

            await db.sequelize.query(
              `INSERT INTO component_export (componentid, vmid,scenarioid, upid, status,      createdon)  VALUES (:componentid, :vmid,:scenarioid, :upid, 'Pending', NOW())`,
              {
                replacements: {
                  componentid: comp.componentid,
                  vmid: vmid,
                  scenarioid: scenarioId,
                  upid,
                },
                type: db.sequelize.QueryTypes.INSERT,
              },
            );
          }

          if (backup?.status === 200) {
            backupResults.push({
              vmid,
              componentname,
              status: "success",
              message: "Backup started successfully",
            });
          } else {
            backupResults.push({
              vmid,
              componentname,
              status: "failed",
              message: "Backup failed",
            });
          }
        } catch (err) {
          backupResults.push({
            vmid,
            componentname,
            status: "failed",
            message: "Unexpected error during backup",
          });
        }
      }
      const allGood = backupResults.every((x) => x.status === "success");
      // Fetch filenames from component_export (updated by cron)
      const exports = await db.sequelize.query(
        `SELECT vmid, file_name FROM component_export  WHERE scenarioid = :scenarioid`,
        {
          replacements: { scenarioid: scenarioId },
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      // Merge filename into backupResults
      backupResults = backupResults.map((b) => {
        const match = exports.find((e) => e.vmid === b.vmid);
        return {
          ...b,
          filename: match?.file_name || null,
        };
      });

      return {
        success: allGood,
        message: allGood
          ? "All VM backups triggered successfully."
          : "Some VM backups failed.",
        scenario,
        componentDetails: components,
        backupResults,
      };
    } catch (err) {
      console.error("Error in getScenarioById:", err);
      return { success: false, message: "Unexpected server error." };
    }
  };

const checkBackupStatus =
  ({ db, ipAddress }) =>
  async () => {
    try {
      const pendingItems = await db.sequelize.query(
        `SELECT * FROM component_export WHERE status IN ('Pending','Running')`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      const proxmoxService = ProxMoxService(db, {}, ipAddress);

      for (const item of pendingItems) {
        const { upid, componentexportid } = item;

        try {
          const tokenResult = await proxmoxService.generateAccessTicket();
          if (!tokenResult || tokenResult.status !== "200") {
            console.log("We couldn't authenticate with the server.Please try after some time");
            continue;
          }

          // -------------------------------------------------
          // GET BACKUP STATUS (getTaskLog)
          // -------------------------------------------------
          const logResponse = await proxmoxService.getTaskLog(upid);
          if (!logResponse?.data?.data) continue;

          const result = logResponse.data.data;
          const exitstatus = result.exitstatus;
          const taskStatus = result.status;

          let newStatus = "Running";
          let rejectReason = null;

          if (exitstatus === "OK" && taskStatus === "stopped") {
            newStatus = "Completed";
            rejectReason = "Backup completed successfully.";
          } else if (
            exitstatus?.toLowerCase().includes("error") ||
            exitstatus === "unknown error" ||
            exitstatus === "job errors"
          ) {
            newStatus = "Failed";
            rejectReason =
              "Something went wrong in Proxmox, please try again later.";
          }

          // -------------------------------------------------
          // FETCH FILENAME using fetchFileName()
          // -------------------------------------------------

          let extractedFileName = null;
          try {
            const fileResponse = await proxmoxService.fetchFileName(upid);
            const lines = fileResponse?.data || [];

            if (Array.isArray(lines)) {
              for (const line of lines) {
                if (line.t && line.t.includes("creating vzdump archive")) {
                  const match = line.t.match(/dump\/([^ ]+\.zst)/);
                  if (match) {
                    extractedFileName = match[1];
                    break;
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error fetching or parsing filename:", err);
          }

          // -------------------------------------------------
          // UPDATE component_export TABLE
          // -------------------------------------------------
          let updateQuery = `
            UPDATE component_export
            SET status = :newStatus,
                reject_reason = :rejectReason,
                modifiedon = NOW()
            WHERE componentexportid = :exportId
          `;

          let replacements = {
            newStatus,
            rejectReason,
            exportId: componentexportid,
          };

          // Completed + filename → add file_name
          if (newStatus === "Completed" && extractedFileName) {
            updateQuery = `
              UPDATE component_export
              SET status = :newStatus,
                  file_name = :fileName,
                  reject_reason = :rejectReason,
                  modifiedon = NOW()
              WHERE componentexportid = :exportId
            `;
            replacements.fileName = extractedFileName;
          }

          await db.sequelize.query(updateQuery, {
            replacements,
            type: db.sequelize.QueryTypes.UPDATE,
          });
          // -------------------------------------------------
          // CHECK SCENARIO EXPORT STATUS BASED ON COMPONENTS
          // -------------------------------------------------

          try {
            const scenarioRow = await db.sequelize.query(
              `SELECT scenarioid 
                FROM component_export 
                WHERE componentexportid = :exportId`,
              {
                replacements: { exportId: componentexportid },
                type: db.sequelize.QueryTypes.SELECT,
              },
            );

            if (scenarioRow.length) {
              const scenarioId = scenarioRow[0].scenarioid;

              // Get all component statuses for this scenario
              const statusCounts = await db.sequelize.query(
                `SELECT 
                  SUM(status = 'Completed') AS completedCount,
                  SUM(status = 'Running') AS runningCount,
                  SUM(status = 'Failed') AS failedCount,
                  COUNT(*) AS totalCount
                  FROM component_export
                  WHERE scenarioid = :scenarioId`,
                {
                  replacements: { scenarioId },
                  type: db.sequelize.QueryTypes.SELECT,
                },
              );

              const { completedCount, runningCount, failedCount, totalCount } =
                statusCounts[0];

              let scenarioStatus = "Running"; // default

              if (failedCount > 0) {
                scenarioStatus = "Failed";
              } else if (completedCount == totalCount) {
                scenarioStatus = "Complete";
              } else {
                scenarioStatus = "Running"; // because some components still running
              }

              // Update scenario_export
              await db.sequelize.query(
                `UPDATE scenario_export
                  SET status = :scenarioStatus,
                  modifiedon = NOW()
                  WHERE scenarioid = :scenarioId`,
                {
                  replacements: { scenarioStatus, scenarioId },
                  type: db.sequelize.QueryTypes.UPDATE,
                },
              );

              console.log(
                `Scenario ${scenarioId} status updated → ${scenarioStatus} 
                (Completed: ${completedCount}, Running: ${runningCount}, Failed: ${failedCount})`,
              );
            }
          } catch (err) {
            console.error("Failed to update scenario_export status:", err);
          }
        } catch (err) {
          console.error("Cron Status Update Error (loop):", err);
        }
      }
    } catch (err) {
      console.error("Cron Status Update Error:", err);
    }
  };

const markComponentRejected = async ({
  db,
  customComponentId,
  modifiedBy = null,
  reason = null,
}) => {
  // 🔹 Update status
  await db.sequelize.query(
    `
    UPDATE custom_component
    SET
      status = 'Reject',
      modifiedon = NOW(),
      modifiedby = ?
    WHERE customcomponentid = ?
    `,
    {
      replacements: [modifiedBy, customComponentId],
      type: db.sequelize.QueryTypes.UPDATE,
    },
  );

  // FETCH learner + component for notification
  const [componentDetails] = await db.sequelize.query(
    `
    SELECT
      cc.componentname,
      cc.learner_id,
      CONCAT(l.firstname, ' ', l.lastname) AS learner_name
    FROM custom_component cc
    JOIN learners l ON l.learner_id = cc.learner_id
    WHERE cc.customcomponentid = ?
    LIMIT 1
    `,
    {
      replacements: [customComponentId],
      type: db.sequelize.QueryTypes.SELECT,
    },
  );

  // SEND notification to Learner
  if (componentDetails) {
    new NotiTemplate(
      db,
      "component_approval",
      {
        componentname: componentDetails.componentname,
        learner_name: componentDetails.learner_name,
        learner_id: componentDetails.learner_id,
        status: "Rejected",
        reject_reason: reason,
        userid: 0, // Admin
      },
      "Learner",
      componentDetails.learner_id,
    );
  }

  return {
    success: false,
    statusCode: 500,
    message: reason || "Component rejected due to Proxmox failure.",
  };
};

const markComponentOperationFailed = async ({
  db,
  customComponentId,
  modifiedBy,
  reason,
}) => {
  await db.sequelize.query(
    `
    UPDATE custom_component
    SET status = 'operation_failed',
        reject_reason = ?,
        modifiedby = ?,
        modifiedon = NOW()
    WHERE customcomponentid = ?
    `,
    {
      replacements: [reason, modifiedBy || null, customComponentId],
      type: db.sequelize.QueryTypes.UPDATE,
    },
  );

  return {
    success: false,
    statusCode: 500,
    message: reason,
  };
};

const save =
  ({ db, ipAddress }) =>
  async (payload) => {
    try {
      const vmType = payload.subcategoryTypeid.toLowerCase();
      const customComponentId = payload.customcomponentid;
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const [component] = await db.sequelize.query(
        `
          SELECT clone_vmid, vmid, componenttype
          FROM custom_component
          WHERE customcomponentid = ?
          LIMIT 1
        `,
        {
          replacements: [customComponentId],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!component) {
        return { success: false, message: "Custom component not found." };
      }
      const sourceVmid = component.clone_vmid;
      const newVmid = component.vmid;
      if (!sourceVmid || !newVmid) {
        return {
          success: false,
          message: "VMID information missing in custom component.",
        };
      }
      // Proxmox connection
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }
      let snapshotName, cloneResult, templateResult;
      const cleanupLXCOnCloneFail = async () => {
        try {
          if (snapshotName) {
            await proxmoxService.deleteLXCSnapshot(sourceVmid, snapshotName);
          }
        } catch (e) {
          console.error("Cleanup LXC clone fail error:", e);
        }
      };
      const cleanupLXCOnTemplateFail = async () => {
        let snapshotDeleted = false;
        let vmDestroyed = false;
        try {
          if (snapshotName) {
            await sleep(await getTerminationDelay(db));
            const snapDelRes = await proxmoxService.deleteLXCSnapshot(
              sourceVmid,
              snapshotName,
            );
            if (snapDelRes?.status !== 200) {
              throw new Error("LXC snapshot delete failed");
            }
            snapshotDeleted = true;
          }
          if (newVmid) {
            await sleep(await getTerminationDelay(db));
            const destroyRes = await proxmoxService.destroyVM(newVmid, "lxc");
            if (destroyRes?.status !== 200) {
              throw new Error("LXC VM destroy failed");
            }
            vmDestroyed = true;
          }
          return { success: true };
        } catch (err) {
          console.error("LXC cleanup error:", err);
          return {
            success: false,
            snapshotDeleted,
            vmDestroyed,
          };
        }
      };
      const cleanupQEMUOnTemplateFail = async () => {
        try {
          if (!newVmid) return true;

          await sleep(await getTerminationDelay(db));
          const destroyRes = await proxmoxService.destroyVM(newVmid, "qemu");
          if (destroyRes?.status !== 200) {
            throw new Error("QEMU destroy failed");
          }
          return true;
        } catch (e) {
          console.error("Cleanup QEMU template fail error:", e);
          return false;
        }
      };
      /** ---------- LXC ---------- **/
      if (vmType === "lxc") {
        snapshotName = `snapshot-${newVmid}`;
        const snapResult = await proxmoxService.createLXCSnapshot(
          sourceVmid,
          snapshotName,
        );
        if (snapResult?.status !== 200) {
          return await markComponentRejected({
            db,
            customComponentId,
            modifiedBy: payload.createdby,
            // reason: "LXC snapshot failed.",
            reason:
              "This request is automatically rejected due to a Proxmox service issue.",
          });
        }
        // await sleep(20000);
        const snapshotUpid = snapResult?.data?.data;
        //  WAIT FOR SNAPSHOT TASK
        while (true) {
          const statusRes = await proxmoxService.getTaskLog(snapshotUpid);

          const status = statusRes?.data?.data?.status;
          const exitstatus = statusRes?.data?.data?.exitstatus;
          if (status === "stopped") {
            if (exitstatus !== "OK") {
              return await markComponentRejected({
                db,
                customComponentId,
                modifiedBy: payload.createdby,
                reason: `LXC snapshot failed: ${exitstatus}`,
              });
            }
            break; //  snapshot completed successfully
          }

          await sleep(5000);
        }
        cloneResult = await proxmoxService.cloneLXC(sourceVmid, {
          newid: newVmid,
          hostname: payload.componentname,
          full: 1,
          snapname: snapshotName,
        });
        if (cloneResult?.status !== 200) {
          await cleanupLXCOnCloneFail();
          return await markComponentRejected({
            db,
            customComponentId,
            modifiedBy: payload.createdby,
            // reason: "LXC clone failed.",
            reason:
              "This request is automatically rejected due to a Proxmox service issue.",
          });
        }
        let upid = cloneResult?.data?.data;
        while (true) {
          const logResponse = await proxmoxService.getTaskLog(upid);
          if (!logResponse) {
            throw new Error("Unable to fetch clone task status");
          }
          const status = logResponse?.data?.data?.status;
          const exitStatus = logResponse?.data?.data?.exitstatus;
          if (status === "stopped") {
            if (exitStatus === "OK") {
              break; // clone completed successfully
            } else {
              await cleanupLXCOnCloneFail();
              return await markComponentRejected({
                db,
                customComponentId,
                modifiedBy: payload.createdby,
                reason: `LXC clone failed: ${exitStatus}`,
              });
            }
          }
          // Still running → wait before next check
          await sleep(5000);
        }
        templateResult = await proxmoxService.templateLXC(newVmid);
        if (templateResult?.status !== 200) {
          const cleanupResult = await cleanupLXCOnTemplateFail();

          if (!cleanupResult.success) {
            return await markComponentOperationFailed({
              db,
              customComponentId,
              modifiedBy: payload.createdby,
              reason: !cleanupResult.snapshotDeleted
                ? "LXC template failed and snapshot cleanup could not be completed. Manual intervention required."
                : "LXC template failed and VM cleanup could not be completed. Manual intervention required.",
            });
          }
          return await markComponentRejected({
            db,
            customComponentId,
            modifiedBy: payload.createdby,
            reason:
              "This request is automatically rejected due to a Proxmox service issue.",
          });
        }
      }
      /** ---------- QEMU ---------- **/
      if (vmType === "qemu") {
        function toProxmoxHostname(name) {
          return (
            name
              .replace(/[^A-Za-z0-9.-]/g, "") // allow letters, numbers, dash, dot
              .replace(/^-+/, "")
              .replace(/-+$/, "")
              .substring(0, 63) || "vm"
          );
        }
        const proxmoxHostname = toProxmoxHostname(payload.componentname);
        cloneResult = await proxmoxService.cloneQEMU(
          sourceVmid,
          newVmid,
          proxmoxHostname,
        );
        if (cloneResult?.status !== 200) {
          return await markComponentRejected({
            db,
            customComponentId,
            modifiedBy: payload.createdby,
            // reason: "QEMU clone failed",
            reason:
              "This request is automatically rejected due to a Proxmox service issue.",
          });
        }
        let upid = cloneResult?.data?.data;
        while (true) {
          const logResponse = await proxmoxService.getTaskLog(upid);
          if (!logResponse) {
            throw new Error("Unable to fetch clone task status");
          }
          const status = logResponse?.data?.data?.status;
          const exitStatus = logResponse?.data?.data?.exitstatus;
          if (status === "stopped") {
            if (exitStatus === "OK") {
              break; // clone completed successfully
            } else {
              await cleanupLXCOnCloneFail();
              return await markComponentRejected({
                db,
                customComponentId,
                modifiedBy: payload.createdby,
                reason: `LXC clone failed: ${exitStatus}`,
              });
            }
          }
          // Still running → wait before next check
          await sleep(10000);
        }
        templateResult = await proxmoxService.templateQEMU(newVmid);
        if (templateResult?.status !== 200) {
          await sleep(await getTerminationDelay(db));
          const cleanupSuccess = await cleanupQEMUOnTemplateFail();

          if (!cleanupSuccess) {
            return await markComponentOperationFailed({
              db,
              customComponentId,
              modifiedBy: payload.createdby,
              reason:
                "VM template failed and automatic cleanup could not be completed. Manual intervention required.",
            });
          }
          return await markComponentRejected({
            db,
            customComponentId,
            modifiedBy: payload.createdby,
            reason:
              "This request is automatically rejected due to a Proxmox service issue.",
          });
        }
      }
      let vmDetailResponse;
      if (vmType === "lxc") {
        vmDetailResponse = await proxmoxService.LXC_Container_detail(newVmid);
      } else {
        vmDetailResponse = await proxmoxService.QEMU_VM_detail(newVmid);
      }
      const proxmoxData = vmDetailResponse?.data?.data || {};
      const safeJson = (obj) =>
        obj && Object.keys(obj).length ? JSON.stringify(obj) : "{}";
      const extractStorage = () => {
        const keys = [
          "sata0",
          "scsi0",
          "ide0",
          "virtio0",
          "nvme0",
          "usb0",
          "rootfs",
        ];
        const found = keys.find((k) =>
          Object.keys(proxmoxData).some((p) => p.toLowerCase() === k),
        );
        if (!found) return null;

        const realKey = Object.keys(proxmoxData).find(
          (k) => k.toLowerCase() === found,
        );
        const val = proxmoxData[realKey];
        const match = val?.match(/size=(\d+)([MG])/i);
        return match ? Number(match[1]) : null;
      };

      const extractNetworkPorts = () => {
        const ports = {};
        Object.entries(proxmoxData).forEach(([k, v]) => {
          if (k.startsWith("net")) ports[k] = v;
        });
        return ports;
      };
      // const extractBridgeNames = () => {
      //   const bridges = {};
      //   Object.entries(proxmoxData).forEach(([k, v]) => {
      //     if (!k.startsWith("net")) return;

      //     if (vmType === "qemu") {
      //       const m = v.match(/bridge=(\w+)/);
      //       if (m) bridges[k] = m[1];
      //     } else {
      //       const m = v.match(/name=(eth\d+)/);
      //       if (m) bridges[k] = m[1];
      //     }
      //   });
      //   return bridges;
      // };
      const extractPortsPrefix = () => {
        const prefix = {};

        Object.entries(proxmoxData).forEach(([k, v]) => {
          if (!k.startsWith("net")) return;

          if (vmType === "qemu") {
            const typeMatch = v.match(/^(\w+)=/);
            if (typeMatch && typeMatch[1]) {
              prefix[k] = typeMatch[1]; // virtio
            }
          } else if (vmType === "lxc") {
            const nameMatch = v.match(/name=(eth\d+)/);
            if (nameMatch && nameMatch[1]) {
              prefix[k] = `name=${nameMatch[1]}`;
            }
          }
        });

        return prefix;
      };
      await db.sequelize.query(
        ` INSERT INTO components ( componentuuid, componentcategoryid, componenttype, vmid, componentname, vmid_name, component_status, componentimage, duration, proxmox_json, network_ports, network_bridge_name, cores, memory, storage, status, createdby, createdon ) VALUES ( UUID(), ?, ?, ?, ?, ?, 'Private', ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, NOW() ) `,
        {
          replacements: [
            payload.componentcategoryid,
            vmType.toUpperCase(),
            newVmid,
            payload.componentname,
            payload.vmid_name,
            payload.componentimage || null,
            payload.duration || 0,
            safeJson(proxmoxData),
            safeJson(extractNetworkPorts()),
            safeJson(extractPortsPrefix()),
            parseInt(proxmoxData?.cores) || null,
            parseInt(proxmoxData?.memory) || null,
            extractStorage(),
            payload.createdby || null,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        },
      );
      await db.sequelize.query(
        `
          UPDATE custom_component
          SET status = 'Approved',
              modifiedon = NOW(),
              modifiedby = ?
          WHERE customcomponentid = ?
        `,
        {
          replacements: [payload.createdby || null, customComponentId],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );

      const [componentDetails] = await db.sequelize.query(
        ` SELECT  cc.componentname, l.firstname AS learner_name, l.learner_id FROM custom_component cc JOIN learners l ON l.learner_id = cc.learner_id WHERE cc.customcomponentid = ? LIMIT 1 `,
        {
          replacements: [customComponentId],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      new NotiTemplate(
        db,
        "component_status_notification",
        {
          componenttitle: componentDetails.componentname,
          learner_name: componentDetails.learner_name,
          learner_id: componentDetails.learner_id,
          status: "Approve",
          userid: 0,
        },
        "Admin",
        componentDetails.learner_id,
      );

      return {
        success: true,
        statusCode: 200,
        message: "Clone & template completed successfully.",
        sourceVmid,
        newVmid,
      };
    } catch (error) {
      console.error("Error in save + proxmox:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message,
      };
    }
  };

const vmDetails =
  ({ db, validation }) =>
  async (body, ipAddress) => {
    try {
      const { vmType, vmid } = body;
      const proxmoxService = ProxMoxService(db, body, ipAddress);

      let response;

      try {
        await proxmoxService.generateAccessTicket();

        if (vmType === "lxc") {
          response = await proxmoxService.LXC_Container_detail(vmid);
        } else if (vmType === "qemu") {
          response = await proxmoxService.QEMU_VM_detail(vmid);
        } else {
          console.error("Invalid vmType:", vmType);
          return {
            statusCode: 400,
            message: validation.messages.proxmox_type,
          };
        }
      } catch (proxmoxErr) {
        console.error("siberSIM Error:", proxmoxErr);

        // Send system notification on siberSIM failure
        new NotiTemplate(
          db,
          "proxmox_down",
          { learner_id: 0, userid: 0 },
          "System",
          0,
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

        throw new Error("siberSIM is unreachable.");
      }

      return {
        statusCode: 200,
        data: response?.data || null,
      };
    } catch (err) {
      console.error("Error in DAO vmDetails:", err);
      throw err;
    }
  };

const getVmConfig =
  ({ db, ipAddress }) =>
  async ({ vmid, vmType }) => {
    try {
      // Normalize vmType
      vmType = vmType?.toLowerCase();

      if (!["qemu", "lxc"].includes(vmType)) {
        return {
          success: false,
          message: "Invalid VM type. Allowed values: qemu, lxc",
        };
      }
      const [settings] = await db.sequelize.query(
        `
          SELECT component_approval
          FROM web_settings
          WHERE status = 1
          LIMIT 1
        `,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      const approvalFlag = settings?.component_approval === "true";
      const approvalMessage = approvalFlag
        ? "Auto approval process"
        : "Admin approval process";
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `We couldn't authenticate with the server.Please try after some time`,
        };
      }
      let result;

      if (vmType === "qemu") {
        result = await proxmoxService.getQemuConfig(vmid);
      } else {
        result = await proxmoxService.getLxcConfig(vmid);
      }

      if (!result?.success) {
        return {
          success: false,
          message: `Failed to fetch config for ${vmType.toUpperCase()} ${vmid}.`,
          error: result?.error,
        };
      }

      const configData = result?.data?.data || {};
      const keys = Object.keys(configData);
      let mustStopVM = false;
      let stopMessage = null;

      if (vmType === "qemu") {
        const hasTPM = keys.some((k) => k.startsWith("tpmstate"));
        const hasHOSTPCI = keys.some((k) => k.startsWith("hostpci"));

        if (hasTPM || hasHOSTPCI) {
          mustStopVM = true;
          stopMessage =
            "Please note that converting this VM into a component requires stopping the VM. If the VM is started before component approval, the request will be automatically rejected.";
        }
      }
      return {
        success: true,
        message: `${vmType.toUpperCase()} config fetched successfully.`,
        vmType,
        mustStopVM,
        stopMessage,

        approvalFlag,
        approvalMessage,
      };
    } catch (err) {
      console.error(`Error fetching VM config (${vmType}) for ${vmid}:`, err);
      return {
        success: false,
        message: "Unexpected error occurred while fetching VM config.",
      };
    }
  };

const stopScenarioVM =
  ({ ipAddress, db }) =>
  async (vmid, vmType) => {
    const normalizedVmType = vmType.toLowerCase();

    try {
      const proxmoxService = ProxMoxService(
        { vmType: normalizedVmType },
        ipAddress,
      );
      const tokenResult = await proxmoxService.generateAccessTicket();

      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: "We couldn't authenticate with the server.Please try after some time",
        };
      }
      const stopRes = await proxmoxService.stopVM(vmid, normalizedVmType);
      if (stopRes?.status === 200) {
        const [updateResult] = await db.sequelize.query(
          `
            UPDATE vm_config
            SET status = 'Stopped',
                modifiedon = NOW()
            WHERE vmid = ?
          `,
          {
            replacements: [vmid],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );

        // Optional safety check
        if (updateResult === 0) {
          return {
            success: false,
            message: "VM stopped but component record not found.",
          };
        }

        return {
          success: true,
          message: "VM stopped and component status updated to Stop.",
        };
      }

      return {
        success: false,
        message: "Failed to stop VM.",
      };
    } catch (err) {
      console.error("Error in stopScenarioVM DAO:", err);

      return {
        success: false,
        message: err?.message || "Unexpected error occurred while stopping VM.",
      };
    }
  };

const addScenarioVmNetwork =
  ({ ipAddress, db }) =>
  async (vmid, vmType, netKey) => {
    // support comma separated keys
    const netKeys = netKey
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    /* -------------------- MAX PORT VALIDATION -------------------- */

    const [settings] = await db.sequelize.query(
      `SELECT max_ports FROM web_settings WHERE status = 1 LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT },
    );

    const maxPorts = settings?.max_ports ?? 8;

    const getNetIndex = (key) => {
      const m = key.match(/^net(\d+)$/);
      return m ? parseInt(m[1], 10) : null;
    };

    for (const key of netKeys) {
      const idx = getNetIndex(key);
      if (idx === null) {
        return {
          success: false,
          message: `Invalid network key format: ${key}`,
        };
      }
      if (idx >= maxPorts) {
        return {
          success: false,
          message: `Only ${maxPorts} network ports are allowed.`,
        };
      }
    }

    // fetch existing count
    const existingRow = await db.sequelize.query(
      `SELECT network_bridge_json FROM vm_config WHERE vmid=? LIMIT 1`,
      {
        replacements: [vmid],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );
    let existingCount = 0;
    if (existingRow?.[0]?.network_bridge_json) {
      try {
        const parsed = JSON.parse(existingRow[0].network_bridge_json);
        existingCount = Object.keys(parsed).length;
      } catch {}
    }
    if (existingCount + netKeys.length > maxPorts) {
      return {
        success: false,
        message: `Max ${maxPorts} network ports allowed.`,
      };
    }
    try {
      const normalizedVmType = vmType.toLowerCase();
      const proxmoxService = ProxMoxService(
        db,
        { vmType: normalizedVmType },
        ipAddress,
      );
      /* -------------------- AUTH -------------------- */
      const tokenResult = await proxmoxService.generateAccessTicket();

      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: "We couldn't authenticate with the server.Please try after some time",
        };
      }
      /* -------------------- FETCH EXISTING BRIDGE JSON -------------------- */
      const configRows = await db.sequelize.query(
        ` SELECT network_bridge_json FROM vm_config WHERE vmid = ? LIMIT 1
        `,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      let bridgeJson = {};
      if (configRows?.[0]?.network_bridge_json) {
        try {
          bridgeJson = JSON.parse(configRows[0].network_bridge_json);
        } catch {
          bridgeJson = {};
        }
      }

      /* -------------------- ADD NETWORKS ONE BY ONE -------------------- */
      for (const key of netKeys) {
        const idx = getNetIndex(key);

        const netValueQEMU = "virtio,bridge=vmbr10";
        const netValueLXC = `name=eth${idx},bridge=vmbr10,ip=dhcp`;

        const netValue =
          normalizedVmType === "qemu" ? netValueQEMU : netValueLXC;
        if (bridgeJson[key]) {
          return {
            success: false,
            message: `Network ${key} already exists.`,
          };
        }
        const addNetRes = await proxmoxService.addVmNetwork(
          vmid,
          normalizedVmType,
          key,
          netValue,
        );

        if (!addNetRes || addNetRes.status !== 200) {
          return {
            success: false,
            message: `Failed to add network ${key} in Proxmox.`,
          };
        }

        bridgeJson[key] = netValue;
      }
      /* ------------------- UPDATE vm_config -------------------- */
      const [updateResult] = await db.sequelize.query(
        `
        UPDATE vm_config
        SET network_bridge_json = ?,
            modifiedon = NOW()
        WHERE vmid = ?
        `,
        {
          replacements: [JSON.stringify(bridgeJson), vmid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );

      if (updateResult === 0) {
        return {
          success: false,
          message: "Network added but DB update failed.",
        };
      }

      /* -------------------- UPDATE DIAGRAM -------------------- */

      const [configRow] = await db.sequelize.query(
        `SELECT vmrequestid FROM vm_config WHERE vmid = ? LIMIT 1`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!configRow?.vmrequestid) {
        return {
          success: true,
          message: "Network added but vmrequest not found.",
          data: bridgeJson,
        };
      }

      const [vmReqRow] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid = ? LIMIT 1`,
        {
          replacements: [configRow.vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (vmReqRow?.scenariodiagram) {
        let diagram;

        try {
          diagram = JSON.parse(vmReqRow.scenariodiagram);
        } catch {
          diagram = null;
        }

        if (diagram?.nodes) {
          const node = diagram.nodes.find(
            (n) => Number(n?.data?.vmid) === Number(vmid),
          );

          if (node) {
            if (!Array.isArray(node.data.networkport)) {
              node.data.networkport = [];
            }

            for (const key of netKeys) {
              const idx = getNetIndex(key);
              const netValueQEMU = "virtio,bridge=vmbr10";
              const netValueLXC = `name=eth${idx},bridge=vmbr10,ip=dhcp`;
              const netValue =
                normalizedVmType === "qemu" ? netValueQEMU : netValueLXC;

              node.data.networkport.push({
                [key]: netValue,
              });
            }

            await db.sequelize.query(
              `UPDATE vm_request SET scenariodiagram = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
              {
                replacements: [JSON.stringify(diagram), configRow.vmrequestid],
                type: db.sequelize.QueryTypes.UPDATE,
              },
            );
          }
        }
      }

      return {
        success: true,
        message: "Network port added successfully.",
        data: bridgeJson,
      };
    } catch (err) {
      console.error("Error in addScenarioVmNetwork DAO:", err);
      return {
        success: false,
        message:
          err?.message ||
          "Unexpected error occurred while adding network interface.",
      };
    }
  };

const deleteScenarioVmNetwork =
  ({ ipAddress, db }) =>
  async (vmid, vmType, netKey) => {
    const normalizedVmType = vmType.toLowerCase();

    try {
      const proxmoxService = ProxMoxService(
        db,
        { vmType: normalizedVmType },
        ipAddress,
      );

      const tokenResult = await proxmoxService.generateAccessTicket();

      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: "We couldn't authenticate with the server.Please try after some time",
        };
      }
      /* -------------------- DELETE NETWORK IN PROXMOX -------------------- */
      const deleteNetRes = await proxmoxService.deleteVmNetwork(
        vmid,
        normalizedVmType,
        netKey,
      );

      if (deleteNetRes?.status !== 200) {
        return {
          success: false,
          message: "Failed to delete network port.",
        };
      }

      /* -------------------- UPDATE vm_config -------------------- */
      const [row] = await db.sequelize.query(
        `
        SELECT network_bridge_json, vmrequestid
        FROM vm_config
        WHERE vmid = ?
        LIMIT 1
        `,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      let bridgeJson = {};

      if (row?.network_bridge_json) {
        try {
          bridgeJson = JSON.parse(row.network_bridge_json);
        } catch {
          bridgeJson = {};
        }
      }
      delete bridgeJson[netKey];
      const [updateResult] = await db.sequelize.query(
        ` UPDATE vm_config SET network_bridge_json = ?, modifiedon = NOW() WHERE vmid = ? `,
        {
          replacements: [JSON.stringify(bridgeJson), vmid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );
      if (updateResult === 0) {
        return {
          success: false,
          message: "Network deleted but DB update failed.",
        };
      }
      /* -------------------- SCENARIO DIAGRAM UPDATE -------------------- */
      if (row?.vmrequestid) {
        const [vmReq] = await db.sequelize.query(
          `
          SELECT scenariodiagram
          FROM vm_request
          WHERE vmrequestid = ?
          LIMIT 1
          `,
          {
            replacements: [row.vmrequestid],
            type: db.sequelize.QueryTypes.SELECT,
          },
        );

        if (vmReq?.scenariodiagram) {
          let diagram;
          try {
            diagram = JSON.parse(vmReq.scenariodiagram);
          } catch {
            diagram = null;
          }

          if (diagram?.nodes) {
            const node = diagram.nodes.find(
              (n) => Number(n?.data?.vmid) === Number(vmid),
            );

            if (node && Array.isArray(node.data.networkport)) {
              //remove matching netKey
              node.data.networkport = node.data.networkport.filter(
                (obj) => !obj[netKey],
              );

              await db.sequelize.query(
                `
                UPDATE vm_request
                SET scenariodiagram = ?, modifiedon = NOW()
                WHERE vmrequestid = ?
                `,
                {
                  replacements: [JSON.stringify(diagram), row.vmrequestid],
                  type: db.sequelize.QueryTypes.UPDATE,
                },
              );
            }
          }
        }
      }
      return {
        success: true,
        message: "Network port deleted successfully.",
        data: bridgeJson,
      };
    } catch (err) {
      console.error("Error in deleteScenarioVmNetwork DAO:", err);
      return {
        success: false,
        message:
          err?.message ||
          "Unexpected error occurred while deleting network interface.",
      };
    }
  };

const ModifyScenarioVmNetwork =
  ({ ipAddress, db }) =>
  async (
    vmid,
    Targetvmid,
    netKey,
    mode,
    source,
    sourceHandle,
    target,
    targetHandle,
    label,
    staticVmbr
  ) => {
    console.log("TargetvmidTargetvmidTargetvmid", Targetvmid);

    const [vmTypeRow] = await db.sequelize.query(
      `SELECT componenttype FROM vm_config WHERE vmid=? LIMIT 1`,
      {
        replacements: [vmid],
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (!vmTypeRow?.componenttype) {
      return { success: false, message: "VM type not found" };
    }

    const normalizedVmType = vmTypeRow.componenttype.toLowerCase();
    try {
      let networkid = null;
      let networkname = null;
      let netValue = null;
      let finalLabel = label;
      /* =========================================================
           MODE: NEW
        ========================================================= */
      // if (mode === "new") {
      //   const [availableNetwork] = await db.sequelize.query(
      //     `SELECT networkid, networkname FROM networks WHERE status='Available' AND deletedon IS NULL ORDER BY networkid ASC LIMIT 1`,
      //     { type: db.sequelize.QueryTypes.SELECT },
      //   );

      //   if (!availableNetwork) {
      //     return { success: false, message: "No free networks." };
      //   }
      //   networkid = availableNetwork.networkid;
      //   networkname = availableNetwork.networkname;
      //   const ethIndex = netKey.replace("net", "");
      //   /* ---------- BUILD NET VALUE ---------- */
      //   if (normalizedVmType === "qemu") {
      //     netValue = `virtio,bridge=${networkname}`;
      //   } else if (normalizedVmType === "lxc") {
      //     netValue = `name=eth${ethIndex},bridge=${networkname}`;
      //   } else {
      //     return { success: false, message: "Unsupported VM type" };
      //   }

      //   finalLabel = networkname;

      //   /* ---------- PROXMOX ---------- */
      //   const proxmoxService = ProxMoxService(
      //     db,
      //     { vmType: normalizedVmType },
      //     ipAddress,
      //   );

      //   const token = await proxmoxService.generateAccessTicket();
      //   if (!token || token.status !== "200") {
      //     return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      //   }
      //   const addNet = await proxmoxService.addVmNetwork(
      //     vmid,
      //     normalizedVmType,
      //     netKey,
      //     netValue,
      //   );
      //   console.log("addNetaddNetaddNetaddNetaddNet", addNet);

      //   // if (addNet?.status !== 200) {
      //   //   return { success: false, message: "Proxmox add net failed" };
      //   // }
      //   if (addNet?.status !== 200) {
      //   return { success: false, message: "Failed to add network bridge. Please try again." };
      //   }
      //   /* ---------- MARK OCCUPIED ---------- */
      //   await db.sequelize.query(
      //     `UPDATE networks
      //      SET status='In Use', modifiedon=NOW()
      //      WHERE networkid=?`,
      //     {
      //       replacements: [networkid],
      //       type: db.sequelize.QueryTypes.UPDATE,
      //     },
      //   );
      // }
      if (mode === "new") {
        const [availableNetwork] = await db.sequelize.query(
          `SELECT networkid, networkname FROM networks 
           WHERE status='Available' AND deletedon IS NULL 
           ORDER BY networkid ASC LIMIT 1`,
          { type: db.sequelize.QueryTypes.SELECT },
        );

        if (!availableNetwork) {
          return { success: false, message: "No free networks." };
        }

        networkid = availableNetwork.networkid;
        networkname = availableNetwork.networkname;
        finalLabel = networkname;

        const ethIndex = netKey.replace("net", "");

        // ---------- SOURCE NET VALUE ----------
        if (normalizedVmType === "qemu") {
          netValue = `virtio,bridge=${networkname}`;
        } else if (normalizedVmType === "lxc") {
          netValue = `name=eth${ethIndex},bridge=${networkname}`;
        } else {
          return { success: false, message: "Unsupported VM type" };
        }

        // ---------- TARGET VM FETCH ----------
        const [targetVmRow] = await db.sequelize.query(
          `SELECT vmid, componenttype FROM vm_config WHERE vmid=? LIMIT 1`,
          {
            replacements: [Targetvmid], // ⚠️ ensure this maps correctly
            type: db.sequelize.QueryTypes.SELECT,
          },
        );

        if (!targetVmRow) {
          return { success: false, message: "Target VM not found" };
        }

        const targetVmType = targetVmRow.componenttype.toLowerCase();

        const targetNetKey = targetHandle
          .replace("-target", "")
          .replace("-source", "");

        let targetNetValue;

        if (targetVmType === "qemu") {
          targetNetValue = `virtio,bridge=${networkname}`;
        } else if (targetVmType === "lxc") {
          const targetEthIndex = targetNetKey.replace("net", "");
          targetNetValue = `name=eth${targetEthIndex},bridge=${networkname}`;
        }

        // ---------- PROXMOX ----------
        const proxmoxService = ProxMoxService(
          db,
          { vmType: normalizedVmType },
          ipAddress,
        );

        const token = await proxmoxService.generateAccessTicket();
        if (!token || token.status !== "200") {
          return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
        }

        // 👉 APPLY TO SOURCE
        const addNetSource = await proxmoxService.addVmNetwork(
          vmid,
          normalizedVmType,
          netKey,
          netValue,
        );

        // 👉 APPLY TO TARGET
        const proxmoxServiceTarget = ProxMoxService(
          db,
          { vmType: targetVmType },
          ipAddress,
        );

        console.log("addNetSourceaddNetSource",addNetSource);
        console.log("targetNetKeytargetNetKey",targetNetKey);
        console.log("targetNetValuetargetNetValuetargetNetValue",targetNetValue);
        

        const addNetTarget = await proxmoxServiceTarget.addVmNetwork(
          targetVmRow.vmid,
          targetVmType,
          targetNetKey,
          targetNetValue,
        );

        console.log("addNetTargetaddNetTargetaddNetTarget",addNetTarget);


        if (
          addNetSource?.status !== 200 ||
          addNetTarget?.status !== 200
        ) {
          return {
            success: false,
            message: "Failed to apply network bridge to both VMs",
          };
        }

        // ---------- MARK NETWORK USED ----------
        await db.sequelize.query(
          `UPDATE networks
           SET status='In Use', modifiedon=NOW()
           WHERE networkid=?`,
          {
            replacements: [networkid],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );

        /* ---------- UPDATE SOURCE JSON ---------- */
        const [sourceVmRow] = await db.sequelize.query(
          `SELECT network_bridge_json FROM vm_config WHERE vmid=? LIMIT 1`,
          {
            replacements: [vmid],
            type: db.sequelize.QueryTypes.SELECT,
          },
        );

        let sourceBridgeJson = {};
        if (sourceVmRow?.network_bridge_json) {
          try {
            sourceBridgeJson = JSON.parse(
              sourceVmRow.network_bridge_json,
            );
          } catch {}
        }

        sourceBridgeJson[netKey] = {
          networkid,
          networkname,
          value: netValue,
        };

        await db.sequelize.query(
          `UPDATE vm_config 
           SET network_bridge_json=?, modifiedon=NOW() 
           WHERE vmid=?`,
          {
            replacements: [
              JSON.stringify(sourceBridgeJson),
              vmid,
            ],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );

        /* ---------- UPDATE TARGET JSON ---------- */
        const [targetVmConfig] = await db.sequelize.query(
          `SELECT network_bridge_json FROM vm_config WHERE vmid=? LIMIT 1`,
          {
            replacements: [targetVmRow.vmid],
            type: db.sequelize.QueryTypes.SELECT,
          },
        );

        let targetBridgeJson = {};
        if (targetVmConfig?.network_bridge_json) {
          try {
            targetBridgeJson = JSON.parse(
              targetVmConfig.network_bridge_json,
            );
          } catch {}
        }

        targetBridgeJson[targetNetKey] = {
          networkid,
          networkname,
          value: targetNetValue,
        };

        await db.sequelize.query(
          `UPDATE vm_config 
           SET network_bridge_json=?, modifiedon=NOW() 
           WHERE vmid=?`,
          {
            replacements: [
              JSON.stringify(targetBridgeJson),
              targetVmRow.vmid,
            ],
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );
      }

      /* =========================================================
           MODE: EXISTING
        ========================================================= */
      // if (mode === "existing") {
      //   if (!label) {
      //     return {
      //       success: false,
      //       message:
      //         "No existing network found. Unable to add a network bridge.",
      //     };
      //   }
      //   finalLabel = label;
      // }
//       if (mode === "existing") {
//   if (!label) {
//     return {
//       success: false,
//       message:
//         "No existing network found. Unable to add a network bridge.",
//     };
//   }

//   networkname = label; // existing bridge like vmbr1010
//   finalLabel = label;
// console.log("networknamenetworknamenetworkname",networkname);

//   const ethIndex = netKey.replace("net", "");

//   /* ---------- BUILD NET VALUE ---------- */
//   if (normalizedVmType === "qemu") {
//     netValue = `virtio,bridge=${networkname}`;
//   } else if (normalizedVmType === "lxc") {
//     netValue = `name=eth${ethIndex},bridge=${networkname}`;
//   } else {
//     return { success: false, message: "Unsupported VM type" };
//   }
// console.log("netKeynetKeynetKeynetKey",netKey);
// console.log("netValuenetValuenetValuenetValue",netValue);

//   /* ---------- PROXMOX ---------- */
//   const proxmoxService = ProxMoxService(
//     db,
//     { vmType: normalizedVmType },
//     ipAddress,
//   );

//   const token = await proxmoxService.generateAccessTicket();
//   if (!token || token.status !== "200") {
//     return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
//   }

//   const addNet = await proxmoxService.addVmNetwork(
//     vmid,
//     normalizedVmType,
//     netKey,
//     netValue,
//   );

//   console.log("existing addNet response:", addNet);

//   if (addNet?.status !== 200) {
//     return { success: false, message: "Failed to add network bridge. Please try again." };
//   }
// }
if (mode === "existing") {
  if (!label) {
    return {
      success: false,
      message:
        "No existing network found. Unable to add a network bridge.",
    };
  }

  networkname = label;
  finalLabel = label;

  const ethIndex = netKey.replace("net", "");

  // ---------- SOURCE NET VALUE ----------
  if (normalizedVmType === "qemu") {
    netValue = `virtio,bridge=${networkname}`;
  } else if (normalizedVmType === "lxc") {
    netValue = `name=eth${ethIndex},bridge=${networkname}`;
  } else {
    return { success: false, message: "Unsupported VM type" };
  }

  // ---------- TARGET VM FETCH ----------
  const [targetVmRow] = await db.sequelize.query(
    `SELECT vmid, componenttype FROM vm_config WHERE vmid=? LIMIT 1`,
    {
      replacements: [Targetvmid],
      type: db.sequelize.QueryTypes.SELECT,
    },
  );

  if (!targetVmRow) {
    return { success: false, message: "Target VM not found" };
  }

  const targetVmType = targetVmRow.componenttype.toLowerCase();

  const targetNetKey = targetHandle
    .replace("-target", "")
    .replace("-source", "");

  let targetNetValue;

  if (targetVmType === "qemu") {
    targetNetValue = `virtio,bridge=${networkname}`;
  } else if (targetVmType === "lxc") {
    const targetEthIndex = targetNetKey.replace("net", "");
    targetNetValue = `name=eth${targetEthIndex},bridge=${networkname}`;
  }

  // ---------- PROXMOX ----------
  const proxmoxService = ProxMoxService(
    db,
    { vmType: normalizedVmType },
    ipAddress,
  );

  const token = await proxmoxService.generateAccessTicket();
  if (!token || token.status !== "200") {
    return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
  }

  // 👉 SOURCE
  const addNetSource = await proxmoxService.addVmNetwork(
    vmid,
    normalizedVmType,
    netKey,
    netValue,
  );

  // 👉 TARGET
  const proxmoxServiceTarget = ProxMoxService(
    db,
    { vmType: targetVmType },
    ipAddress,
  );

  const addNetTarget = await proxmoxServiceTarget.addVmNetwork(
    targetVmRow.vmid,
    targetVmType,
    targetNetKey,
    targetNetValue,
  );

  if (
    addNetSource?.status !== 200 ||
    addNetTarget?.status !== 200
  ) {
    return {
      success: false,
      message: "Failed to apply existing network to both VMs",
    };
  }
}

      /* =========================================================
           MODE: STATIC
        ========================================================= */
        console.log("labellabellabellabellabel",label);
        
if (mode === "static") {
  if (staticVmbr) {
    const num = parseInt(staticVmbr, 10);

    if (isNaN(num)) {
      return { success: false, message: "Invalid number format" };
    }

    if (num < 50 || num > 999) {
      return { success: false, message: "Value must be between 50–999" };
    }

    networkname = `vmbr${num}`;
    finalLabel = networkname; // instead of label
  } else {
    networkname = null;
    finalLabel = "Network Id";
  }
}
console.log("staticVmbrstaticVmbrstaticVmbr",staticVmbr);

if (mode === "static" && staticVmbr) {
  const bridgeName = networkname;

  // 1. CHECK IF EXISTS
  const [existing] = await db.sequelize.query(
    `SELECT tempnetworkid, lock_status 
     FROM static_networks 
     WHERE networkname = ? 
     LIMIT 1`,
    {
      replacements: [bridgeName],
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (existing) {
    if (existing.lock_status === "Free") {
      await db.sequelize.query(
        `UPDATE static_networks
         SET lock_status='Locked',
             locked_at=NOW(),
             modifiedon=NOW()
         WHERE tempnetworkid=?`,
        {
          replacements: [existing.tempnetworkid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      return {
        success: false,
        message: `Network ${bridgeName} is already in use.`,
      };
    }
  } else {
    await db.sequelize.query(
      `INSERT INTO static_networks 
       (networkname, lock_status, locked_at, createdon)
       VALUES (?, 'Locked', NOW(), NOW())`,
      {
        replacements: [bridgeName],
        type: db.sequelize.QueryTypes.INSERT,
      }
    );
  }
}

      /* =========================================================
           FETCH VM CONFIG
        ========================================================= */
      const [vmRow] = await db.sequelize.query(
        `SELECT vmrequestid, network_bridge_json FROM vm_config WHERE vmid=? LIMIT 1`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!vmRow) {
        return { success: false, message: "VM config not found" };
      }

      /* =========================================================
           UPDATE BRIDGE JSON
        ========================================================= */
      let bridgeJson = {};
      if (vmRow.network_bridge_json) {
        try {
          bridgeJson = JSON.parse(vmRow.network_bridge_json);
        } catch {}
      }

      bridgeJson[netKey] = {
        networkid,
        networkname: finalLabel,
        value: netValue,
      };

      await db.sequelize.query(
        `UPDATE vm_config SET network_bridge_json=?, modifiedon=NOW() WHERE vmid=?`,
        {
          replacements: [JSON.stringify(bridgeJson), vmid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );

      /* =========================================================
           SCENARIO DIAGRAM
        ========================================================= */
      const [reqRow] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=? LIMIT 1`,
        {
          replacements: [vmRow.vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!reqRow?.scenariodiagram) {
        return { success: true, message: "No diagram found" };
      }

      let diagram = JSON.parse(reqRow.scenariodiagram);
      if (!diagram.edges) diagram.edges = [];

      /* =========================================================
           EDGE ID
        ========================================================= */
      // const edgeId = `xy-edge__${source}${sourceHandle}-${target}${targetHandle}`;
      const edgeId = `xy-edge__${source}-${sourceHandle}-${target}-${targetHandle}`;

      /* =========================================================
           BUILD EDGE
        ========================================================= */
      const updatedEdge = {
        type: "custom",
        style: {
          stroke: "#000",
          strokeWidth: 2,
        },
        source,
        sourceHandle,
        target,
        targetHandle,
        isAttacked: "Yes",
        data: {
          label: finalLabel,
          source,
          sourceHandle,
          target,
          targetHandle,
        },
        id: edgeId,
      };

      /* =========================================================
           UPDATE OR ADD EDGE
        ========================================================= */
      const edgeIndex = diagram.edges.findIndex((e) => e.id === edgeId);

      if (edgeIndex !== -1) {
        // UPDATE
        diagram.edges[edgeIndex] = updatedEdge;
      } else {
        // ADD
        diagram.edges.push(updatedEdge);
      }

      /* =========================================================
           SAVE DIAGRAM
        ========================================================= */
      await db.sequelize.query(
        `UPDATE vm_request SET scenariodiagram=?, modifiedon=NOW() WHERE vmrequestid=?`,
        {
          replacements: [JSON.stringify(diagram), vmRow.vmrequestid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );
      return {
        success: true,
        message:
          edgeIndex !== -1
            ? "Edge updated successfully"
            : "Network and edge added successfully",
        edge: updatedEdge,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.message,
      };
    }
  };


  const getCloningDelay = async (db) => {
  try {
    const [settings] = await db.sequelize.query(
      `SELECT cloning_delay FROM web_settings WHERE status = 1 LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT },
    );

    const delaySeconds =
      settings?.cloning_delay && Number.isFinite(settings.cloning_delay)
        ? settings.cloning_delay
        : 10;

    return delaySeconds * 1000; // convert to ms
  } catch (err) {
    console.error("Error fetching Termination Delay:", err);
    return 10000; // fallback to 10 sec
  }
};

const addRuntimeComponent =
  ({ db, ipAddress }) =>
  async (vmrequestid, scenarioid, newNode) => {
    try {
      const statusVal = "Initializing";
      /* ---------------- GET BASE VMID ---------------- */
      const [webSettings] = await db.sequelize.query(
        `SELECT base_clone_vmid FROM web_settings WHERE company_id=1 LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT },
      );
      const baseCloneVmid = parseInt(webSettings?.base_clone_vmid || 1000);
      /* ---------------- GET VM REQUEST ---------------- */
      const [vmRequest] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (!vmRequest) {
        return { success: false, message: "VM Request not found" };
      }
      const diagram = JSON.parse(vmRequest.scenariodiagram || "{}");
      /* ---------------- COMPONENT INFO ---------------- */
      const componentId = newNode.data.componentId;
      const [componentInfo] = await db.sequelize.query(
        `SELECT componenttype, network_bridge_name, vmid_name 
         FROM components WHERE componentid=?`,
        {
          replacements: [componentId],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (!componentInfo) {
        return { success: false, message: "Component not found" };
      }
      /* ---------------- NETWORK ALLOCATION ---------------- */
      const neededNetworks = newNode.data.networkport?.length || 0;
      let allocatedNetworks = [];
      if (neededNetworks > 0) {
        allocatedNetworks = await db.sequelize.query(
          `SELECT networkid, networkname  FROM networks  WHERE status='Available'  LIMIT ?`,
          {
            replacements: [neededNetworks],
            type: db.sequelize.QueryTypes.SELECT,
          },
        );
        if (allocatedNetworks.length < neededNetworks) {
          return { success: false, message: "No networks available" };
        }
        const ids = allocatedNetworks.map((n) => n.networkid);
        await db.sequelize.query(
          `UPDATE networks  SET status='In Use', modifiedon=NOW()  WHERE networkid IN (:ids)`,
          { replacements: { ids } },
        );
      }
      /* ---------------- BUILD BRIDGE JSON ---------------- */
      const prefixMap = JSON.parse(componentInfo.network_bridge_name || "{}");
      const network_bridge_json = {};
      if (newNode.data.networkport) {
  newNode.data.networkport = newNode.data.networkport.sort((a, b) => {
    const keyA = Object.keys(a)[0];
    const keyB = Object.keys(b)[0];
    return keyA.localeCompare(keyB);
  });
}
      newNode.data.networkport?.forEach((port, i) => {
        const key = Object.keys(port)[0];
        const prefix = prefixMap[key];
        const bridge = allocatedNetworks[i]?.networkname;
        if (prefix && bridge) {
          network_bridge_json[key] = `${prefix},bridge=${bridge}`;
        }
      });
      /* ---------------- INSERT VM_CONFIG ---------------- */
      const [insertId] = await db.sequelize.query(
        `INSERT INTO vm_config
        (scenarioid, vmrequestid, componentid, nodeid,
         componenttype, \`order\`,
         master_vmid, vmid,
         componentname, duration,
         network_bridge_json, status, createdon)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
        {
          replacements: [
            scenarioid,
            vmrequestid,
            componentId,
            newNode.id,
            componentInfo.componenttype,
            null,
            newNode.data.vmid,
            null,
            componentInfo.vmid_name,
            newNode.data.duration || 0,
            JSON.stringify(network_bridge_json),
            statusVal,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        },
      );
      const newVmid = insertId + baseCloneVmid;
      await db.sequelize.query(
        `UPDATE vm_config SET vmid=? WHERE vmconfigurationid=?`,
        {
          replacements: [newVmid, insertId],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );
      /* ---------------- PROXMOX ---------------- */
      const vmType = componentInfo.componenttype.toLowerCase();
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }
      /* ---------------- CLONE ---------------- */
      const cloneRes = await proxmoxService.cloneVM(
        vmType,
        newVmid,
        componentInfo.vmid_name,
        newNode.data.vmid,
      );
      if (!cloneRes || cloneRes.status !== 200) {
        await db.sequelize.query(
          `UPDATE vm_config SET status='Failed' WHERE vmconfigurationid=?`,
          { replacements: [insertId] },
        );
        return { success: false, message: "Clone failed" };
      }
      const delay = await getCloningDelay(db);
      await sleep(delay);

      /* ---------------- START ---------------- */
      const startVM = await proxmoxService.startVM(newVmid, vmType);
      if (!startVM || startVM.status !== 200) {
        let destroySuccess = false;
        try {
          // await proxmoxService.stopVM(newVmid, vmType).catch(() => { });
          const destroyRes = await proxmoxService.destroyVM(newVmid, vmType);
          if (destroyRes && destroyRes.status === 200) {
            destroySuccess = true;
          }
        } catch (err) {
          console.error("Destroy error:", err);
        }
        if (allocatedNetworks.length > 0) {
          const ids = allocatedNetworks.map((n) => n.networkid);
          await db.sequelize.query(
            `UPDATE networks  SET status='Available', modifiedon=NOW() WHERE networkid IN (:ids)`,

            { replacements: { ids } },
          );
        }
        const finalStatus = destroySuccess ? "Completed" : "Destroyed";
        await db.sequelize.query(
          `UPDATE vm_config  SET status=?, modifiedon=NOW() WHERE vmconfigurationid=?`,
          { replacements: [finalStatus, insertId] },
        );
        return {
          success: false,
          message: "Start failed → cleanup done",
        };
      }
      diagram.nodes.push({
        ...newNode,
        data: {
          ...newNode.data,
          vmid: newVmid,
          label: `${newVmid}- ${componentInfo.vmid_name}`,
          isOnline: "Yes",
        },
      });
      await db.sequelize.query(
        `UPDATE vm_request  SET scenariodiagram=?, modifiedon=NOW() WHERE vmrequestid=?`,

        {
          replacements: [JSON.stringify(diagram), vmrequestid],
          type: db.sequelize.QueryTypes.UPDATE,
        },
      );

      await db.sequelize.query(
        `UPDATE vm_config  SET status='Running', modifiedon=NOW() WHERE vmconfigurationid=?`,
        { replacements: [insertId] },
      );
      return {
        success: true,
        vmid: newVmid,
        message: "Component started successfully",
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  };

const stopDestroySingleComponent =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid,vmbrList) => {
    console.log("oooooooooooooooooooppppppppp",vmbrList);
    
    try {
      /* ---------------- GET COMPONENT ---------------- */
      const [vmConfig] = await db.sequelize.query(
        `SELECT * FROM vm_config
         WHERE vmrequestid=? AND vmid=? LIMIT 1`,
        {
          replacements: [vmrequestid, vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!vmConfig) {
        return { success: false, message: "Component not found" };
      }

      const { componenttype, network_bridge_json, vmconfigurationid } =
        vmConfig;
      const vmType = componenttype.toLowerCase();
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }

      /* ---------------- STOP ---------------- */
      let stopSuccess = false;
      try {
        const stopRes = await proxmoxService.stopVM(vmid, vmType);
        if (!stopRes || stopRes.status !== 200) {
          throw new Error("Stop failed");
        }
        stopSuccess = true;
      } catch (stopErr) {
        console.error("STOP FAILED → Rolling back", stopErr);
        /* ---- Rollback: Start again ---- */
        try {
          await proxmoxService.startVM(vmid, vmType);
        } catch (startErr) {
          console.error("Rollback start also failed", startErr);
        }

        await db.sequelize.query(
          `UPDATE vm_config
           SET status='Stopped', modifiedon=NOW()
           WHERE vmconfigurationid=?`,
          {
            replacements: [vmconfigurationid],
          },
        );

        return {
          success: false,
          message: "Stop failed — stop component restarted successfully",
        };
      }
      await sleep(await getTerminationDelay(db));
      /* ---------------- DESTROY ---------------- */
      try {
        const destroyRes = await proxmoxService.destroyVM(vmid, vmType);

        if (!destroyRes || destroyRes.status !== 200) {
          throw new Error("Destroy failed");
        }
      } catch (destroyErr) {
        console.error("DESTROY FAILED", destroyErr);

        // As requested → mark Destroyed even if API failed
        await db.sequelize.query(
          `UPDATE vm_config
           SET status='Destroyed', modifiedon=NOW()
           WHERE vmconfigurationid=?`,
          {
            replacements: [vmconfigurationid],
          },
        );

        return {
          success: false,
          message: "Destroy failed but status updated",
        };
      }

      /* ---------------- UPDATE STATUS ---------------- */
      await db.sequelize.query(
        `UPDATE vm_config
         SET status='Completed', modifiedon=NOW()
         WHERE vmconfigurationid=?`,
        {
          replacements: [vmconfigurationid],
        },
      );

      /* ---------------- RELEASE NETWORKS ---------------- */
      if (network_bridge_json) {
        const parsed = JSON.parse(network_bridge_json);

        const bridges = Object.values(parsed)
          .map((v) => {
            // NEW FORMAT (object)
            if (typeof v === "object" && v?.value) {
              const match = v.value.match(/bridge=([^,]+)/);
              return match ? match[1] : null;
            }

            // OLD FORMAT (string)
            if (typeof v === "string") {
              const match = v.match(/bridge=([^,]+)/);
              return match ? match[1] : null;
            }

            return null;
          })
          .filter(Boolean);
        if (bridges.length > 0) {
          await db.sequelize.query(
            `UPDATE networks
       SET status='Available', modifiedon=NOW()
       WHERE networkname IN (:bridges)`,
            { replacements: { bridges } },
          );
        }
      
if (vmbrList && vmbrList.length > 0) {
  await db.sequelize.query(
    `UPDATE static_networks
     SET lock_status='Free',
         released_at=NOW(),
         modifiedon=NOW()
     WHERE networkname IN (:bridges)`,
    {
      replacements: { bridges: vmbrList },
    }
  );
}

      }
      /* ---------------- UPDATE DIAGRAM ---------------- */
      const [vmRequest] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
//       if (vmRequest?.scenariodiagram) {
//         // const diagram = JSON.parse(vmRequest.scenariodiagram);
//         // diagram.nodes = diagram.nodes.filter((n) => n.data?.vmid != vmid);
//         // await db.sequelize.query(
//         //   `UPDATE vm_request
//         //    SET scenariodiagram=?, modifiedon=NOW()
//         //    WHERE vmrequestid=?`,
//         //   {
//         //     replacements: [JSON.stringify(diagram), vmrequestid],
//         //   },
//         // );
//         const diagram = JSON.parse(vmRequest.scenariodiagram);

// /* ---------------- FIND NODE ID ---------------- */
// const nodeToDelete = diagram.nodes.find(
//   (n) => n.data?.vmid == vmid
// );

// const nodeId = nodeToDelete?.id;

// /* ---------------- REMOVE NODE ---------------- */
// diagram.nodes = diagram.nodes.filter(
//   (n) => n.data?.vmid != vmid
// );

// /* ---------------- REMOVE RELATED EDGES ---------------- */
// if (nodeId && diagram.edges?.length) {
//   diagram.edges = diagram.edges.filter(
//     (e) => e.source !== nodeId && e.target !== nodeId
//   );
// }

// /* ---------------- EXTRA SAFETY (optional but recommended) ---------------- */
// const validNodeIds = new Set(diagram.nodes.map((n) => n.id));

// diagram.edges = (diagram.edges || []).filter(
//   (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
// );
//       }
if (vmRequest?.scenariodiagram) {
  try {
    const diagram = JSON.parse(vmRequest.scenariodiagram);

    /* ---------------- FIND NODE ID ---------------- */
    const nodeToDelete = diagram.nodes?.find(
      (n) => n.data?.vmid == vmid
    );

    const nodeId = nodeToDelete?.id;

    /* ---------------- REMOVE NODE ---------------- */
    diagram.nodes = (diagram.nodes || []).filter(
      (n) => n.data?.vmid != vmid
    );

    /* ---------------- REMOVE RELATED EDGES ---------------- */
    if (nodeId && diagram.edges?.length) {
      diagram.edges = diagram.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
    }

    /* ---------------- EXTRA SAFETY ---------------- */
    const validNodeIds = new Set(
      (diagram.nodes || []).map((n) => n.id)
    );

    diagram.edges = (diagram.edges || []).filter(
      (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    /* ---------------- UPDATE DB ---------------- */
    await db.sequelize.query(
      `UPDATE vm_request
       SET scenariodiagram = ?, modifiedon = NOW()
       WHERE vmrequestid = ?`,
      {
        replacements: [JSON.stringify(diagram), vmrequestid],
      }
    );

  } catch (err) {
    console.error("SCENARIO DIAGRAM UPDATE FAILED", err);
  }
}
      return {
        success: true,
        message: "Component stopped & destroyed successfully",
      };
    } catch (err) {
      console.error("FATAL ERROR", err);
      return { success: false, message: err.message };
    }
  };

const disconnectRuntimeNetworks =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid, netKey) => {
    try {
      /* ---------------- GET VM CONFIG ---------------- */
      const [vmConfig] = await db.sequelize.query(
        `SELECT componenttype, network_bridge_json
         FROM vm_config
         WHERE vmid=? AND vmrequestid=?
         LIMIT 1`,
        {
          replacements: [vmid, vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (!vmConfig) {
        return { success: false, message: "VM config not found" };
      }
      const { componenttype, network_bridge_json } = vmConfig;
      const vmType = componenttype.toLowerCase();
      /* ---------------- PROXMOX AUTH ---------------- */
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }
      const vmInfo = await proxmoxService.getVmNetworkInfo(vmid, vmType);
      if (!vmInfo?.data) {
        return { success: false, message: "VM network info not found" };
      }

      const config = vmInfo.data;

      /* ---------------- CHECK NETKEY ---------------- */
      if (!config[netKey]) {
        return {
          success: false,
          message: `${netKey} not found on VM`,
        };
      }
      // let netValue = config[netKey];

      // /* ---------------- APPEND TAG=4094 ---------------- */
      // if (!netValue.includes("tag=")) {
      //   netValue += ",tag=4094";
      // }
      let netValue = config[netKey];

      if (typeof netValue !== "string") {
        netValue = String(netValue);
      }

      if (!netValue.includes("tag=")) {
        netValue += ",tag=4094";
      }
      console.log(`Disconnecting ${netKey} → ${netValue}`);
      /* ---------------- DISCONNECT IN PROXMOX ---------------- */
      const res = await proxmoxService.disconnectVmNetwork(
        vmid,
        vmType,
        netKey,
        netValue,
      );

      if (!res || res.status !== 200) {
        return {
          success: false,
          message: "Disconnect API failed",
        };
      }
      /* =======================================================
           UPDATE vm_config.network_bridge_json
        ======================================================= */
      if (network_bridge_json) {
        const bridgeObj = JSON.parse(network_bridge_json);

        console.log("bridgeObj:", bridgeObj);

        if (bridgeObj[netKey]) {
          let value = bridgeObj[netKey];

          //  Handle object format
          if (typeof value === "object") {
            value = value.value || "";
          }

          //Safe includes
          if (!value.includes("tag=")) {
            value += ",tag=4094";
          }

          // Save back in same format
          if (typeof bridgeObj[netKey] === "object") {
            bridgeObj[netKey].value = value;
          } else {
            bridgeObj[netKey] = value;
          }

          await db.sequelize.query(
            `UPDATE vm_config
              SET network_bridge_json=:json,
              modifiedon=NOW()
              WHERE vmid=:vmid
              AND vmrequestid=:vmrequestid`,
            {
              replacements: {
                json: JSON.stringify(bridgeObj),
                vmid,
                vmrequestid,
              },
            },
          );
        }
      }
      /* =======================================================
           UPDATE SCENARIO DIAGRAM
        ======================================================= */
      const [reqRow] = await db.sequelize.query(
        `SELECT scenariodiagram
         FROM vm_request
         WHERE vmrequestid=?
         LIMIT 1`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (reqRow?.scenariodiagram) {
        const diagram = JSON.parse(reqRow.scenariodiagram);
        /* -------- UPDATE NODE PORT -------- */
        diagram.nodes.forEach((node) => {
          if (node?.data?.vmid == vmid) {
            node.data.networkport?.forEach((portObj) => {
              if (portObj[netKey]) {
                if (!portObj[netKey].includes("tag=")) {
                  portObj[netKey] += ",tag=4094";
                }
              }
            });
          }
        });
        /* -------- STOP RED DOT (EDGES) -------- */
        diagram.edges.forEach((edge) => {
          const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
          const targetNode = diagram.nodes.find((n) => n.id === edge.target);
          const isSourceMatch =
            sourceNode?.data?.vmid == vmid &&
            edge.sourceHandle?.startsWith(netKey);
          const isTargetMatch =
            targetNode?.data?.vmid == vmid &&
            edge.targetHandle?.startsWith(netKey);

          if (isSourceMatch || isTargetMatch) {
            edge.isAttacked = "No";
          }
        });
        /* -------- SAVE BACK -------- */
        await db.sequelize.query(
          `UPDATE vm_request SET scenariodiagram=:diagram, modifiedon=NOW() WHERE vmrequestid=:vmrequestid`,
          {
            replacements: {
              diagram: JSON.stringify(diagram),
              vmrequestid,
            },
          },
        );
      }
      return {
        success: true,
        message: `${netKey} disconnected successfully`,
        isAttacked: "No",
      };
    } catch (err) {
      console.error("disconnectRuntimeNetworks error:", err);
      return {
        success: false,
        message: err.message,
      };
    }
  };

const connectRuntimeNetwork =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid, netKey) => {
    try {
      /* ---------------- GET VM CONFIG ---------------- */
      const [vmConfig] = await db.sequelize.query(
        `SELECT componenttype, network_bridge_json FROM vm_config WHERE vmid=? AND vmrequestid=? LIMIT 1`,
        {
          replacements: [vmid, vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (!vmConfig) {
        return { success: false, message: "VM config not found" };
      }
      const { componenttype, network_bridge_json } = vmConfig;
      const vmType = componenttype.toLowerCase();
      /* ---------------- PROXMOX AUTH ---------------- */
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }
      /* ---------------- GET LIVE NETWORK INFO ---------------- */
      const vmInfo = await proxmoxService.getVmNetworkInfo(vmid, vmType);
      if (!vmInfo?.data) {
        return { success: false, message: "VM network info not found" };
      }
      const config = vmInfo.data;
      /* ---------------- MATCH NETKEY ---------------- */
      if (!config[netKey]) {
        return {
          success: false,
          message: `${netKey} not found on VM`,
        };
      }
      let netValue = config[netKey];
      /* ---------------- REMOVE TAG=4094 ---------------- */
      netValue = netValue.replace(/,?tag=\d+/g, "");
      /* ---------------- CONNECT IN PROXMOX ---------------- */
      const res = await proxmoxService.disconnectVmNetwork(
        vmid,
        vmType,
        netKey,
        netValue,
      );

      if (!res || res.status !== 200) {
        return {
          success: false,
          message: "Connect API failed",
        };
      }

      /* =======================================================
           UPDATE vm_config.network_bridge_json
        ======================================================= */
      // if (network_bridge_json) {
      //   const bridgeObj = JSON.parse(network_bridge_json);
      //   if (bridgeObj[netKey]) {
      //     bridgeObj[netKey] = bridgeObj[netKey].replace(/,?tag=\d+/g, "");

      //     await db.sequelize.query(
      //       `UPDATE vm_config
      //        SET network_bridge_json=:json,
      //            modifiedon=NOW()
      //        WHERE vmid=:vmid
      //          AND vmrequestid=:vmrequestid`,
      //       {
      //         replacements: {
      //           json: JSON.stringify(bridgeObj),
      //           vmid,
      //           vmrequestid,
      //         },
      //       },
      //     );
      //   }
      // }
      //  UPDATE SCENARIO DIAGRAM
if (network_bridge_json) {
  const bridgeObj = JSON.parse(network_bridge_json);

  if (bridgeObj[netKey]) {
    let value = bridgeObj[netKey];

    // ✅ handle object format
    if (typeof value === "object") {
      value = value.value || "";
    }

    // ✅ safe replace
    value = value.replace(/,?tag=\d+/g, "");

    // ✅ save back in same format
    if (typeof bridgeObj[netKey] === "object") {
      bridgeObj[netKey].value = value;
    } else {
      bridgeObj[netKey] = value;
    }

    await db.sequelize.query(
      `UPDATE vm_config
       SET network_bridge_json=:json,
           modifiedon=NOW()
       WHERE vmid=:vmid
         AND vmrequestid=:vmrequestid`,
      {
        replacements: {
          json: JSON.stringify(bridgeObj),
          vmid,
          vmrequestid,
        },
      }
    );
  }
}
      
      
      const [reqRow] = await db.sequelize.query(
        `SELECT scenariodiagram
         FROM vm_request
         WHERE vmrequestid=?
         LIMIT 1`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (reqRow?.scenariodiagram) {
        const diagram = JSON.parse(reqRow.scenariodiagram);

        /* -------- UPDATE NODE PORT -------- */
        diagram.nodes.forEach((node) => {
          if (node?.data?.vmid == vmid) {
            node.data.networkport?.forEach((portObj) => {
              // if (portObj[netKey]) {
              //   portObj[netKey] = portObj[netKey].replace(/,?tag=\d+/g, "");
              // }
              if (portObj[netKey]) {
  let value = portObj[netKey];

  if (typeof value === "object") {
    value = value.value || "";
  }

  value = value.replace(/,?tag=\d+/g, "");

  if (typeof portObj[netKey] === "object") {
    portObj[netKey].value = value;
  } else {
    portObj[netKey] = value;
  }
}
            });
          }
        });

        /* -------- RESUME RED DOT (EDGES) -------- */
        diagram.edges.forEach((edge) => {
          const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
          const targetNode = diagram.nodes.find((n) => n.id === edge.target);
          const isSourceMatch =
            sourceNode?.data?.vmid == vmid &&
            edge.sourceHandle?.startsWith(netKey);
          const isTargetMatch =
            targetNode?.data?.vmid == vmid &&
            edge.targetHandle?.startsWith(netKey);
          if (isSourceMatch || isTargetMatch) {
            edge.isAttacked = "Yes";
          }
        });

        /* -------- SAVE BACK -------- */
        await db.sequelize.query(
          `UPDATE vm_request SET scenariodiagram=:diagram, modifiedon=NOW() WHERE vmrequestid=:vmrequestid`,
          {
            replacements: {
              diagram: JSON.stringify(diagram),
              vmrequestid,
            },
          },
        );
      }

      return {
        success: true,
        message: `${netKey} connected successfully`,
      };
    } catch (err) {
      console.error("connectRuntimeNetwork error:", err);

      return {
        success: false,
        message: err.message,
      };
    }
  };

const unplugRuntimeNetwork =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid, netKey) => {
    try {
      /* ---------------- GET VM CONFIG ---------------- */
      const [vmConfig] = await db.sequelize.query(
        `SELECT componenttype, network_bridge_json FROM vm_config WHERE vmid=? AND vmrequestid=?`,
        {
          replacements: [vmid, vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (!vmConfig) return { success: false, message: "VM config not found" };
      const vmType = vmConfig.componenttype.toLowerCase();
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      /* ---------------- AUTH ---------------- */
      const token = await proxmoxService.generateAccessTicket();
      if (!token || token.status !== "200")
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      const vmInfo = await proxmoxService.getVmNetworkInfo(vmid, vmType);
      if (!vmInfo?.data?.[netKey])
        return { success: false, message: `${netKey} not found` };
      const netString = vmInfo.data[netKey];
      let mac,
        bridge,
        tag = "";
      if (vmType === "qemu") {
        mac = netString.match(/virtio=([^,]+)/)?.[1];
        bridge = netString.match(/bridge=([^,]+)/)?.[1];
        tag = netString.match(/tag=\d+/)?.[0] || "";
      }
      if (vmType === "lxc") {
        mac = netString.match(/hwaddr=([^,]+)/)?.[1];
        bridge = netString.match(/bridge=([^,]+)/)?.[1];
      }
      if (!mac) return { success: false, message: "MAC parse failed" };
      /* ---------------- BUILD VALUE ---------------- */
      let newValue;
      // QEMU = cable removed
      if (vmType === "qemu") {
        newValue =
          `virtio=${mac},bridge=${bridge}` +
          (tag ? `,${tag}` : "") +
          `,link_down=1`;
      }
      // LXC = remove bridge (detached interface)
      if (vmType === "lxc") {
        const ethIndex = netKey.replace("net", "");
        newValue = `name=eth${ethIndex},bridge=${bridge},hwaddr=${mac},link_down=1,type=veth`;
      }
      console.log("newValuenewValuenewValuenewValue", newValue);

      /* ---------------- CALL PROXMOX ---------------- */
      const res = await proxmoxService.unplugVmNetwork(
        vmid,
        vmType,
        netKey,
        mac,
        bridge,
      );

      if (!res || res.status !== 200)
        return { success: false, message: "Unplug API failed" };

      /* ================= UPDATE vm_config JSON ================= */
      console.log("vmConfigvmConfigvmConfig", vmConfig);

      if (vmConfig.network_bridge_json) {
        const obj = JSON.parse(vmConfig.network_bridge_json);
        // obj[netKey] = newValue;
        if (obj[netKey]) {
          if (typeof obj[netKey] === "object") {
            obj[netKey].value = newValue;
          } else {
            //string case
            obj[netKey] = newValue;
          }
        }
        await db.sequelize.query(
          `UPDATE vm_config SET network_bridge_json=:json, modifiedon=NOW() WHERE vmid=:vmid AND vmrequestid=:vmrequestid`,
          {
            replacements: {
              json: JSON.stringify(obj),
              vmid,
              vmrequestid,
            },
          },
        );
      }

      /* ================= UPDATE SCENARIO DIAGRAM ================= */
      const [reqRow] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (reqRow?.scenariodiagram) {
        const diagram = JSON.parse(reqRow.scenariodiagram);
        // update node ports
        diagram.nodes.forEach((node) => {
          if (node?.data?.vmid == vmid) {
            node.data.networkport?.forEach((p) => {
              if (p[netKey]) p[netKey] = newValue;
            });
          }
        });
        // remove attacked flag
        diagram.edges.forEach((edge) => {
          const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
          const targetNode = diagram.nodes.find((n) => n.id === edge.target);
          const match =
            (sourceNode?.data?.vmid == vmid &&
              edge.sourceHandle?.startsWith(netKey)) ||
            (targetNode?.data?.vmid == vmid &&
              edge.targetHandle?.startsWith(netKey));

          if (match) edge.isAttacked = "No";
        });

        await db.sequelize.query(
          `UPDATE vm_request SET scenariodiagram=:d, modifiedon=NOW() WHERE vmrequestid=:id`,
          {
            replacements: {
              d: JSON.stringify(diagram),
              id: vmrequestid,
            },
          },
        );
      }
      return { success: true, message: `${netKey} unplugged successfully` };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  };

const plugRuntimeNetwork =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid, netKey) => {
    try {
      /* ---------------- GET VM CONFIG ---------------- */
      const [vmConfig] = await db.sequelize.query(
        `SELECT componenttype, network_bridge_json
         FROM vm_config
         WHERE vmid=? AND vmrequestid=?
         LIMIT 1`,
        {
          replacements: [vmid, vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );
      if (!vmConfig) return { success: false, message: "VM config not found" };
      const vmType = vmConfig.componenttype.toLowerCase();
      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const token = await proxmoxService.generateAccessTicket();
      if (!token || token.status !== "200")
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      const vmInfo = await proxmoxService.getVmNetworkInfo(vmid, vmType);
      if (!vmInfo?.data?.[netKey])
        return { success: false, message: `${netKey} not found` };

      const netString = vmInfo.data[netKey];
      let mac,
        bridge,
        tag = "";
      if (vmType === "qemu") {
        mac = netString.match(/virtio=([^,]+)/)?.[1];
        bridge = netString.match(/bridge=([^,]+)/)?.[1];
        tag = netString.match(/tag=\d+/)?.[0] || "";
      }
      if (vmType === "lxc") {
        mac = netString.match(/hwaddr=([^,]+)/)?.[1];
        bridge = netString.match(/bridge=([^,]+)/)?.[1];
      }
      if (!mac || !bridge)
        return { success: false, message: "MAC/Bridge parse failed" };
      /* ---------------- BUILD VALUE ---------------- */
      let newValue;
      if (vmType === "qemu") {
        newValue =
          `virtio=${mac},bridge=${bridge}` +
          (tag ? `,${tag}` : "") +
          `,link_down=0`;
      }
      if (vmType === "lxc") {
        const ethIndex = netKey.replace("net", "");
        newValue = `name=eth${ethIndex},bridge=${bridge},hwaddr=${mac},link_down=0,type=veth`;
      }

      /* ---------------- CALL PROXMOX ---------------- */
      const res = await proxmoxService.plugVmNetwork(
        vmid,
        vmType,
        netKey,
        mac,
        bridge,
      );
      if (!res || res.status !== 200)
        return { success: false, message: "Plug API failed" };
      /* ================= UPDATE vm_config JSON ================= */
//       if (vmConfig.network_bridge_json) {
//         const obj = JSON.parse(vmConfig.network_bridge_json);
//         // obj[netKey] = newValue;
//         if (obj[netKey]) {
//   if (typeof obj[netKey] === "object") {
//     obj[netKey].value = newValue;
//   } else {
//     obj[netKey] = newValue;   
//   }
// }
//         await db.sequelize.query(
//           `UPDATE vm_config
//            SET network_bridge_json=:json, modifiedon=NOW()
//            WHERE vmid=:vmid AND vmrequestid=:vmrequestid`,
//           {
//             replacements: {
//               json: JSON.stringify(obj),
//               vmid,
//               vmrequestid,
//             },
//           },
//         );
//       }
if (vmConfig.network_bridge_json) {
  const obj = JSON.parse(vmConfig.network_bridge_json);

  if (obj[netKey]) {
    if (typeof obj[netKey] === "object") {
      obj[netKey].value = newValue;
    } else {
      obj[netKey] = newValue;
    }
  }

  await db.sequelize.query(
    `UPDATE vm_config
     SET network_bridge_json=:json, modifiedon=NOW()
     WHERE vmid=:vmid AND vmrequestid=:vmrequestid`,
    {
      replacements: {
        json: JSON.stringify(obj),
        vmid,
        vmrequestid,
      },
    }
  );
}
      /* ================= UPDATE SCENARIO DIAGRAM ================= */
      const [reqRow] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (reqRow?.scenariodiagram) {
        const diagram = JSON.parse(reqRow.scenariodiagram);

        // Update node ports
        diagram.nodes.forEach((node) => {
          if (node?.data?.vmid == vmid) {
            node.data.networkport?.forEach((p) => {
              if (p[netKey]) p[netKey] = newValue;
            });
          }
        });

        // Mark edge attacked
        diagram.edges.forEach((edge) => {
          const sourceNode = diagram.nodes.find((n) => n.id === edge.source);
          const targetNode = diagram.nodes.find((n) => n.id === edge.target);
          const match =
            (sourceNode?.data?.vmid == vmid &&
              edge.sourceHandle?.startsWith(netKey)) ||
            (targetNode?.data?.vmid == vmid &&
              edge.targetHandle?.startsWith(netKey));

          if (match) edge.isAttacked = "Yes";
        });
        await db.sequelize.query(
          `UPDATE vm_request
           SET scenariodiagram=:d, modifiedon=NOW()
           WHERE vmrequestid=:id`,
          {
            replacements: {
              d: JSON.stringify(diagram),
              id: vmrequestid,
            },
          },
        );
      }

      return { success: true, message: `${netKey} plugged successfully` };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  };

const stopComponent =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid) => {
    try {
      /* ---------------- GET COMPONENT ---------------- */
      const [vmConfig] = await db.sequelize.query(
        `SELECT * FROM vm_config
         WHERE vmrequestid=? AND vmid=? LIMIT 1`,
        {
          replacements: [vmrequestid, vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!vmConfig) {
        return { success: false, message: "Component not found" };
      }

      const { componenttype, vmconfigurationid } = vmConfig;

      const vmType = componenttype.toLowerCase();

      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();

      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }

      /* ---------------- STOP VM ---------------- */
      try {
        const stopRes = await proxmoxService.stopVM(vmid, vmType);
        console.log("stopResstopResstopResstopRes", stopRes);

        if (!stopRes || stopRes.status !== 200) {
          throw new Error("Stop failed");
        }
      } catch (stopErr) {
        console.error("STOP FAILED → Rolling back", stopErr);

        /* ---- Rollback: Start again ---- */
        try {
          await proxmoxService.startVM(vmid, vmType);
        } catch (startErr) {
          console.error("Rollback start also failed", startErr);
        }

        return {
          success: false,
          message: "Stop failed — VM restarted",
        };
      }

      /* ---------------- UPDATE COMPONENT STATUS ---------------- */
      await db.sequelize.query(
        `UPDATE vm_config
         SET status='Stopped', modifiedon=NOW()
         WHERE vmconfigurationid=?`,
        {
          replacements: [vmconfigurationid],
        },
      );

      /* ---------------- UPDATE DIAGRAM ---------------- */
      const [vmRequest] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (vmRequest?.scenariodiagram) {
        const diagram = JSON.parse(vmRequest.scenariodiagram);

        /* ---- Update node isOnline ---- */
        diagram.nodes = diagram.nodes.map((node) => {
          if (node?.data?.vmid == vmid) {
            node.data.isOnline = "No";
          }
          return node;
        });

        /* ---- Update edges isAttacked ---- */
        const nodeId = diagram.nodes.find((n) => n?.data?.vmid == vmid)?.id;

        if (nodeId) {
          diagram.edges = diagram.edges.map((edge) => {
            if (edge.source === nodeId || edge.target === nodeId) {
              edge.isAttacked = "No";
            }
            return edge;
          });
        }

        await db.sequelize.query(
          `UPDATE vm_request
           SET scenariodiagram=?, modifiedon=NOW()
           WHERE vmrequestid=?`,
          {
            replacements: [JSON.stringify(diagram), vmrequestid],
          },
        );
      }

      return {
        success: true,
        message: "Component stopped successfully",
      };
    } catch (err) {
      console.error("FATAL ERROR", err);
      return { success: false, message: err.message };
    }
  };

const startComponent =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid) => {
    try {
      const [vmConfig] = await db.sequelize.query(
        `SELECT * FROM vm_config
         WHERE vmrequestid=? AND vmid=? LIMIT 1`,
        {
          replacements: [vmrequestid, vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!vmConfig) {
        return { success: false, message: "Component not found" };
      }

      const { componenttype, vmconfigurationid } = vmConfig;
      const vmType = componenttype.toLowerCase();

      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();

      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }

      /* -------- START VM -------- */
      try {
        const startRes = await proxmoxService.startVM(vmid, vmType);

        if (!startRes || startRes.status !== 200) {
          throw new Error("Start failed");
        }
      } catch (startErr) {
        console.error("START FAILED → Rolling back", startErr);

        try {
          await proxmoxService.stopVM(vmid, vmType);
        } catch (stopErr) {
          console.error("Rollback stop failed", stopErr);
        }

        return {
          success: false,
          message: "Start failed — VM stopped",
        };
      }

      /* -------- UPDATE STATUS -------- */
      await db.sequelize.query(
        `UPDATE vm_config
         SET status='Running', modifiedon=NOW()
         WHERE vmconfigurationid=?`,
        { replacements: [vmconfigurationid] },
      );

      /* -------- UPDATE DIAGRAM -------- */
      const [vmRequest] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (vmRequest?.scenariodiagram) {
        const diagram = JSON.parse(vmRequest.scenariodiagram);

        let nodeId = null;

        diagram.nodes = diagram.nodes.map((node) => {
          if (node?.data?.vmid == vmid) {
            node.data.isOnline = "Yes";
            nodeId = node.id;
          }
          return node;
        });

        if (nodeId) {
          diagram.edges = diagram.edges.map((edge) => {
            if (edge.source === nodeId || edge.target === nodeId) {
              edge.isAttacked = "Yes";
            }
            return edge;
          });
        }

        await db.sequelize.query(
          `UPDATE vm_request
           SET scenariodiagram=?, modifiedon=NOW()
           WHERE vmrequestid=?`,
          {
            replacements: [JSON.stringify(diagram), vmrequestid],
          },
        );
      }

      return {
        success: true,
        message: "Component started successfully",
      };
    } catch (err) {
      console.error("FATAL ERROR", err);
      return { success: false, message: err.message };
    }
  };

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const restartComponent =
  ({ db, ipAddress }) =>
  async (vmrequestid, vmid) => {
    try {
      const [vmConfig] = await db.sequelize.query(
        `SELECT * FROM vm_config
         WHERE vmrequestid=? AND vmid=? LIMIT 1`,
        {
          replacements: [vmrequestid, vmid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!vmConfig) {
        return { success: false, message: "Component not found" };
      }

      const { componenttype } = vmConfig;
      const vmType = componenttype.toLowerCase();

      const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
      const tokenResult = await proxmoxService.generateAccessTicket();

      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: "We couldn't authenticate with the server.Please try after some time" };
      }

      /* -------- STOP VM -------- */
      try {
        await proxmoxService.stopVM(vmid, vmType);
      } catch (stopErr) {
        console.error("Restart stop failed", stopErr);
      }
      await new Promise((resolve) => setTimeout(resolve, 10000));
      /* -------- START VM AGAIN -------- */
      try {
        const startRes = await proxmoxService.startVM(vmid, vmType);
        if (!startRes || startRes.status !== 200) {
          throw new Error("Restart start failed");
        }
      } catch (startErr) {
        console.error("Restart failed → fallback start", startErr);

        try {
          await proxmoxService.startVM(vmid, vmType);
        } catch (err) {
          console.error("Fallback start also failed", err);
        }

        return {
          success: false,
          message: "Restart failed",
        };
      }

      /* -------- UPDATE DIAGRAM -------- */
      const [vmRequest] = await db.sequelize.query(
        `SELECT scenariodiagram FROM vm_request WHERE vmrequestid=?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (vmRequest?.scenariodiagram) {
        const diagram = JSON.parse(vmRequest.scenariodiagram);

        let nodeId = null;

        diagram.nodes = diagram.nodes.map((node) => {
          if (node?.data?.vmid == vmid) {
            node.data.isOnline = "Yes";
            nodeId = node.id;
          }
          return node;
        });

        if (nodeId) {
          diagram.edges = diagram.edges.map((edge) => {
            if (edge.source === nodeId || edge.target === nodeId) {
              edge.isAttacked = "Yes";
            }
            return edge;
          });
        }

        await db.sequelize.query(
          `UPDATE vm_request
           SET scenariodiagram=?, modifiedon=NOW()
           WHERE vmrequestid=?`,
          {
            replacements: [JSON.stringify(diagram), vmrequestid],
          },
        );
      }

      return {
        success: true,
        message: "Component restarted successfully",
      };
    } catch (err) {
      console.error("FATAL ERROR", err);
      return { success: false, message: err.message };
    }
  };

module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminatelearner,
  deleteScenarioLearner,
  generateProxmoxAccessToken,
  autoTerminateFailedScenarios,
  startScenarioLearner,
  restartscenarioLearner,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  pauseScenarioLearner,
  resumeScenarioLearner,
  getScenarioById,
  checkBackupStatus,
  markComponentRejected,
  save,
  vmDetails,
  getVmConfig,
  stopScenarioVM,
  addScenarioVmNetwork,
  deleteScenarioVmNetwork,
  ModifyScenarioVmNetwork,
  addRuntimeComponent,
  stopDestroySingleComponent,
  disconnectRuntimeNetworks,
  connectRuntimeNetwork,
  unplugRuntimeNetwork,
  plugRuntimeNetwork,
  stopComponent,
  startComponent,
  restartComponent,
};
