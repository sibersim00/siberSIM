const { handleComponentFailure } = require("../../eventjob/componentSetupJob");
const { sendProxmoxDownAlerts } = require("../../eventjob/componentSetupJob");
const ProxMoxService = require("../../proxmox/services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../../eventjob/jobsConstants");
const constants = require("../../proxmox/services/proxmox/constants");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

const setEventLearnerConfiguration =
  ({ db }) =>
  async (scenarioid, learnerid, eventlearnerid, vmrequestid) => {
    try {
      const statusVal = "Initializing";

      const [webSettings] = await db.sequelize.query(
        `SELECT base_clone_vmid FROM web_settings WHERE company_id = 1 LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      const [learnerData] = await db.sequelize.query(
        `SELECT *
        FROM vm_request
        WHERE vmrequestid = ?
          AND vm_steps = ?
        LIMIT 1
        `,
        {
          replacements: [vmrequestid, statusVal],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      console.log("learnerDatalearnerData", learnerData);

      if (!learnerData) {
        await handleComponentFailure(
          db,
          scenarioid,
          learnerData?.requestedby_id || null,
          // learnerData?.eventlearnerid || null,
          statusVal,
          vmrequestid,
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
          vmrequestid,
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
          vmrequestid,
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
          vmrequestid,
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
        console.log("fffffffffffffffffffffffffffffff");

        preparedComponents.push({
          scenarioid,
          vmrequestid,
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
          const insertQuery = `INSERT INTO vm_config (scenarioid,vmrequestid, componentid, nodeid, componenttype, \`order\`, master_vmid, vmid, componentname, duration, network_bridge_json, status, createdon) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
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

          const vmconfigurationid = configInsert;
          const realVmid = vmconfigurationid + baseCloneVmid;
          await db.sequelize.query(
            `UPDATE vm_config SET vmid = ? WHERE vmconfigurationid = ?`,
            {
              replacements: [realVmid, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
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
          eventlearnerid,
          statusVal,
          vmrequestid,
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

async function markOperationFailedAndNotify(
  db,
  eventlearnerid,
  vmrequestid,
  err,
  learner_id
) {
  const OP_FAILED = "Operation Failed";
  console.error("Operation failed:", err?.message || err);
  // 1. Send notification & email alert
  await sendProxmoxDownAlerts(db, learner_id);

  await new NotiTemplate(db, "proxmox_terminate", { userid: 0 }, "Admin", 0);

  // 2. Mark scenario session as failed
  await db.sequelize.query(
    `UPDATE vm_request
     SET vm_steps = ?, modifiedon = NOW()
     WHERE vmrequestid = ?`,
    {
      replacements: [OP_FAILED, vmrequestid],
      type: db.sequelize.QueryTypes.UPDATE,
    }
  );

  // 4. Insert log entry
  // await db.sequelize.query(
  //   `INSERT INTO event_learner_logs
  //     (eventlearnerid,eventid, learner_id, type, remark, status, createdon)
  //     SELECT
  //       sls.eventlearnerid,
  //       sls.eventid,
  //       sls.learner_id,
  //       'System',
  //       'Failed to Stop and destroy the component',
  //       'Operation Failed',
  //       NOW()
  //     FROM event_learners sls
  //     WHERE sls.eventlearnerid = ?`,
  //   {
  //     replacements: [eventlearnerid],
  //     type: db.sequelize.QueryTypes.INSERT,
  //   }
  // );

  await db.sequelize.query(
    `
  INSERT INTO vm_request_logs
    (vmrequestid, scenarioid, requestedby_id, requestedby_role, remark, status, createdon)
  SELECT
    vr.vmrequestid,
    vr.scenarioid,
    vr.requestedby_id,
    'System',
    'Failed to Stop and destroy the component',    
    'Operation Failed',
    NOW()
  FROM vm_request vr
  WHERE vr.vmrequestid = ?
  `,
    {
      replacements: [vmrequestid],
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
  async (eventlearnerid, status, type, vmrequestid) => {
    console.log("Update Terminate......");
    let hasFailed = false;

    const [session] = await db.sequelize.query(
      `SELECT * FROM vm_request WHERE vmrequestid = ? LIMIT 1`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    let scenariodiagram;
    if (session?.scenariodiagram) {
      try {
        scenariodiagram = JSON.parse(session.scenariodiagram);
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
          }
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
          eventlearnerid,
          vmrequestid,
          err,
          session.learner_id
        );
      }
    };

    try {
      const components = await db.sequelize.query(
        `SELECT * FROM vm_config WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
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
          console.log(
            `Skipping VM ${componentname} (${vmid}) as it is already Completed`
          );
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
            message: `Could not connect to the siberSIM server while destroying components.`,
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
            `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
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
          console.log(
            `Skipping VM ${componentname} (${vmid}) as it is already Completed`
          );
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
            message: `Could not connect to the siberSIM server while destroying components.`,
          };
        }

        const destroyResult = await proxmoxService.destroyVM(
          vmid,
          componenttype.toLowerCase()
        );

        if (destroyResult?.status === 200 && destroyResult?.data) {
          vmConfig[vmid].destroy = true;
          await db.sequelize.query(
            `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
            {
              replacements: ["Completed", vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
          await db.sequelize.query(
            `UPDATE vm_request SET status = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
            {
              replacements: ["Destroyed", vmrequestid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        } else {
          await db.sequelize.query(
            `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,
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
          `UPDATE vm_request SET modifiedon = NOW() WHERE vmrequestid = ?`,
          {
            replacements: [vmrequestid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );

        // Update scenario diagram
        const [diagramRow] = await db.sequelize.query(
          `SELECT scenariodiagram FROM vm_request WHERE vmrequestid = ? LIMIT 1`,
          {
            replacements: [vmrequestid],
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
              `UPDATE vm_request
               SET scenariodiagram = ?,
               modifiedon = NOW(),
               status = ?
               ${status === "Completed" ? ", completedon = NOW()" : ""}
               WHERE vmrequestid = ?`,
              {
                replacements: [
                  JSON.stringify(scenariodiagram),
                  status,
                  vmrequestid,
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
      }
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
          }
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
          request.learner_id
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
        }
      );

      // Loop over components and delete based on type
      for (const {
        vmid,
        componenttype,
        componentname,
        vmconfigurationid,
      } of components) {
        console.log("vmconfigurationidvmconfigurationid", vmconfigurationid);

        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          return {
            success: false,
            message: "Could not connect to Proxmox server.",
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
              }
            );
            await db.sequelize.query(
              `UPDATE vm_request SET vm_steps='Destroyed', modifiedon=NOW()
                 WHERE vmrequestid=?`,
              {
                replacements: [vmrequestid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          } else {
            await db.sequelize.query(
              `UPDATE vm_config SET status='Destroyed', modifiedon=NOW()
                 WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
            await handleFailureOnce(
              new Error(`LXC delete failed for ${componentname}`)
            );
          }
        } else if (vmType === "qemu") {
          const stopRes = await proxmoxService.stopVM(vmid, vmType);
          if (stopRes?.status !== 200) {
            await handleFailureOnce(
              new Error(`Stop failed for ${componentname}`)
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
              }
            );
            await db.sequelize.query(
              `UPDATE vm_request SET vm_steps='Destroyed', modifiedon=NOW()
                 WHERE vmrequestid=?`,
              {
                replacements: [vmrequestid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          } else {
            await db.sequelize.query(
              `UPDATE vm_config SET status='Destroyed', modifiedon=NOW()
                 WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
            await handleFailureOnce(
              new Error(`Destroy failed for ${componentname}`)
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
          }
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
          { replacements: [vmrequestid], type: db.sequelize.QueryTypes.SELECT }
        );

        const vmids = comps.map((c) => c.vmid).filter((v) => v);

        if (vmids.length > 0) {
          await db.sequelize.query(
            `UPDATE vm_snapshots
               SET snapshot_status='Delete', deletedon=NOW()
               WHERE vmid IN (${vmids
                 .map(() => "?")
                 .join(",")}) AND deletedon IS NULL`,
            { replacements: vmids, type: db.sequelize.QueryTypes.UPDATE }
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
          }
        );
      } catch (logErr) {
        console.error("Failed to insert VM request log:", logErr);
      }
    }
  };

const restartEventLearner =
  ({ db, ipAddress }) =>
  async (vmrequestid) => {
    console.log("vmrequestidvmrequestidvmrequestid", vmrequestid);

    try {
      // Fetch all components for this event learner
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname, vmconfigurationid
         FROM vm_config
         WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      console.log("componentscomponentscomponents", components);

      if (!components.length) {
        return {
          success: false,
          message: "No components found for this event learner.",
        };
      }

      // Stop each component
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
            message: `Could not connect to the siberSIM server for ${componentname}.`,
          };
        }

        const stopResult = await proxmoxService.stopVM(
          vmid,
          componenttype.toLowerCase()
        );

        // Always mark as Stopped whether stop succeeds or fails
        await db.sequelize.query(
          `UPDATE vm_config
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

      // Wait for 10 seconds
      await new Promise((resolve) => setTimeout(resolve, 10000));

      //  Start each component
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
            message: `Could not connect to the siberSIM server for ${componentname}.`,
          };
        }

        const startResult = await proxmoxService.startVM(
          vmid,
          componenttype.toLowerCase()
        );

        if (startResult?.status === 200) {
          //Mark as Running
          await db.sequelize.query(
            `UPDATE vm_config 
             SET status = 'Running', modifiedon = NOW() 
             WHERE vmconfigurationid = ?`,
            {
              replacements: [vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        } else {
          // Mark as Starting if start failed
          await db.sequelize.query(
            `UPDATE vm_config 
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
          message: "Successfully connected to the siberSIM server.",
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
            "Login to the siberSIM server failed. Please check the username, password, and permissions.",
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
          "Unable to connect to the siberSIM server. Please ensure it is online and reachable.",
        error: error.toString(),
        data: null,
      };
    }
  };

const pauseScenarioLearner =
  ({ db, ipAddress }) =>
  async (eventlearnerid, vmrequestid) => {
    try {
      // ------------------ FETCH COMPONENTS ------------------
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname
         FROM vm_config
         WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!components.length) {
        return {
          success: false,
          message: "No VM components found for this session.",
        };
      }

      // Track status of all components
      let allSuccess = true;
      let results = [];

      // ------------------ LOOP THROUGH EACH COMPONENT ------------------
      for (const { vmid, componenttype, componentname } of components) {
        const vmType = componenttype.toLowerCase();

        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        // Generate token
        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          allSuccess = false;
          results.push({
            vmid,
            status: "failed",
            message: `Proxmox connection failed for VM ${vmid}`,
          });
          continue;
        }

        let pauseResult;

        // QEMU → pause
        if (vmType === "qemu") {
          pauseResult = await proxmoxService.pauseVM(vmid, vmType);
        }
        // LXC → stop (pause equivalent)
        else if (vmType === "lxc") {
          pauseResult = await proxmoxService.stopVM(vmid, vmType);
        } else {
          allSuccess = false;
          results.push({
            vmid,
            status: "failed",
            message: `Invalid VM type ${vmType} for VM ${vmid}`,
          });
          continue;
        }

        if (pauseResult?.status === 200) {
          results.push({
            vmid,
            status: "success",
            message:
              vmType === "qemu"
                ? `VM ${vmid} paused successfully`
                : `VM ${vmid} stopped successfully (LXC pause equivalent)`,
          });
        } else {
          allSuccess = false;
          results.push({
            vmid,
            status: "failed",
            message:
              vmType === "qemu"
                ? `Failed to pause VM ${vmid}`
                : `Failed to stop VM ${vmid}`,
          });
        }
      }
      return {
        success: allSuccess,
        message: allSuccess
          ? "All VMs paused successfully."
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
  async (eventlearnerid, vmrequestid) => {
    try {
      // ------------------ FETCH COMPONENTS ------------------
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname
         FROM vm_config
         WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!components.length) {
        return {
          success: false,
          message: "No VM components found for this session.",
        };
      }

      // Track status for all VMs
      let allSuccess = true;
      let results = [];

      // ------------------ LOOP FOR EACH VM ------------------
      for (const { vmid, componenttype, componentname } of components) {
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);
        // Generate token
        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          allSuccess = false;
          results.push({
            vmid,
            status: "failed",
            message: `Proxmox connection failed for VM ${vmid}`,
          });
          continue;
        }
        let resumeResult;
        if (vmType === "qemu") {
          resumeResult = await proxmoxService.resumeVM(vmid, vmType);
        } else if (vmType === "lxc") {
          resumeResult = await proxmoxService.startVM(vmid, vmType);
        } else {
          allSuccess = false;
          results.push({
            vmid,
            status: "failed",
            message: `Invalid VM type ${vmType} for VM ${vmid}`,
          });
          continue;
        }
        if (resumeResult?.status === 200) {
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
          results.push({
            vmid,
            status: "failed",
            message:
              vmType === "qemu"
                ? `Failed to resume VM ${vmid}`
                : `Failed to start VM ${vmid}`,
          });
        }
      }
      return {
        success: allSuccess,
        message: allSuccess
          ? "All VMs resumed successfully."
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

module.exports = {
  setEventLearnerConfiguration,
  updateCompleteTerminate,
  deleteScenarioLearner,
  restartEventLearner,
  autoTerminateExpiredEvents,
  generateProxmoxAccessToken,
  pauseScenarioLearner,
  resumeScenarioLearner,
};
