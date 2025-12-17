const { handleComponentFailure } = require("../../jobs/componentSetupJob");
const { sendProxmoxDownAlerts } = require("../../jobs/componentSetupJob");
const ProxMoxService = require("../../proxmox/services/proxmox/ProxMoxService");
const ERROR_MESSAGES = require("../../jobs/jobsConstants");
const constants = require("../../proxmox/services/proxmox/constants");
const NotiTemplate = require("../../utils/notiUtility");

const setVMRequestConfiguration =
  ({ db }) =>
  async (scenarioid, vmrequestid,requestedby_id,
            requestedby_role,) => {
    try {
      const statusVal = "Initializing";

      /* -------------------------------------------------------
         1. Base Clone VMID
      --------------------------------------------------------*/
      const [webSettings] = await db.sequelize.query(
        `SELECT base_clone_vmid FROM web_settings WHERE company_id = 1 LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT }
      );

      const baseCloneVmid = parseInt(webSettings?.base_clone_vmid || 1000);

      /* -------------------------------------------------------
         2. Fetch VM Request
      --------------------------------------------------------*/
      const [vmRequest] = await db.sequelize.query(
        // `SELECT vmrequestid,requestedby_id, requestedby_role, status
        //  FROM vm_request
        //  WHERE vmrequestid = ? AND status = 'Pending'
        //  LIMIT 1`,

          `SELECT vmrequestid, requestedby_id, requestedby_role FROM vm_request WHERE vmrequestid = ? AND status = ? ORDER BY vmrequestid DESC LIMIT 1`,
        {
          replacements: [vmrequestid,statusVal],
          type: db.sequelize.QueryTypes.SELECT,
        }

      );

      if (!vmRequest) {
        return {
          success: false,
          message: "VM request not found or already processed.",
        };
      }

      /* -------------------------------------------------------
         3. Fetch Scenario Config
      --------------------------------------------------------*/
      const [scenario] = await db.sequelize.query(
        `SELECT component_config, network_config
         FROM scenarios
         WHERE scenarioid = ?
           AND deletedon IS NULL
           AND scenariostatus = 'Publish'
           AND status = 'Active'`,
        {
          replacements: [scenarioid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!scenario?.component_config) {
        return {
          success: false,
          message: "Scenario configuration not found.",
        };
      }

      const componentConfig = JSON.parse(scenario.component_config);
      const networkConfig = JSON.parse(scenario.network_config || "[]");

      /* -------------------------------------------------------
         4. Network Allocation
      --------------------------------------------------------*/
      const requiredNetworks = networkConfig.length;

      if (!requiredNetworks) {
        return {
          success: false,
          message: "No network bridges configured for this scenario.",
        };
      }

      const availableNetworks = await db.sequelize.query(
        `SELECT networkid, networkname
         FROM networks
         WHERE status = 'Available'
           AND deletedon IS NULL
         ORDER BY networkid ASC
         LIMIT ?`,
        {
          replacements: [requiredNetworks],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (availableNetworks.length < requiredNetworks) {
        return {
          success: false,
          message: "Not enough available network bridges.",
        };
      }

      await db.sequelize.query(
        `UPDATE networks
         SET status = 'Occupied', modifiedon = NOW()
         WHERE networkid IN (:ids)`,
        {
          replacements: {
            ids: availableNetworks.map((n) => n.networkid),
          },
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      const networkMap = networkConfig.reduce((acc, key, idx) => {
        acc[key] = availableNetworks[idx];
        return acc;
      }, {});

      /* -------------------------------------------------------
         5. Prepare VM Config Rows
      --------------------------------------------------------*/
      for (const item of componentConfig) {
        const { vmid, order, componentid, nodeid, duration, network_ids } =
          item;

        const [component] = await db.sequelize.query(
          `SELECT componenttype, network_bridge_name, vmid_name
           FROM components
           WHERE componentid = ?`,
          {
            replacements: [componentid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (!component) {
          throw new Error("Component not found");
        }

        const prefixMap = JSON.parse(component.network_bridge_name || "{}");
        const bridgeJson = {};

        for (const [netKey, netVal] of Object.entries(network_ids || {})) {
          const prefix = prefixMap[netKey];
          const bridge = networkMap[netVal]?.networkname;
          if (prefix && bridge) {
            bridgeJson[netKey] = `${prefix},bridge=${bridge}`;
          }
        }

        const [insertId] = await db.sequelize.query(
          `INSERT INTO vm_config
           (scenarioid, vmrequestid, componentid, nodeid, componenttype,
            \`order\`, master_vmid, vmid, componentname, duration,
            network_bridge_json, status, createdon)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NOW())`,
          {
            replacements: [
              scenarioid,
              vmrequestid,
              componentid,
              nodeid,
              component.componenttype,
              order,
              vmid,
              component.vmid_name,
              duration,
              JSON.stringify(bridgeJson),
              statusVal,
            ],
            type: db.sequelize.QueryTypes.INSERT,
          }
        );

        const realVmid = insertId + baseCloneVmid;

        await db.sequelize.query(
          `UPDATE vm_config SET vmid = ? WHERE vmconfigurationid = ?`,
          {
            replacements: [realVmid, insertId],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      /* -------------------------------------------------------
         6. Update VM Request
      --------------------------------------------------------*/
      await db.sequelize.query(
        `UPDATE vm_request
         SET status = 'Initializing',
             vm_steps = 'Initializing',
             network_bridges = ?,
             modifiedon = NOW()
         WHERE vmrequestid = ?`,
        {
          replacements: [JSON.stringify(availableNetworks), vmrequestid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      return {
        success: true,
        message: "VM request configuration successful.",
      };
    } catch (err) {
      console.error("Error in DAO setVMRequestConfiguration:", err);
      return {
        success: false,
        message: "Unexpected error during VM request configuration.",
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

  // await db.sequelize.query(
  //   `UPDATE scenario_learner_session
  //    SET vm_steps = ?, modifiedon = NOW()
  //    WHERE scenariolearnersessionid = ?`,
  //   {
  //     replacements: [OP_FAILED, scenariolearnersessionid],
  //     type: db.sequelize.QueryTypes.UPDATE,
  //   }
  // );

  // 4. Insert log entry
  // await db.sequelize.query(
  //   `INSERT INTO scenario_learner_logs
  //     (scenariolearnersessionid, scenarioid, learner_id, scenariolearnerid, type, remark, status, createdon)
  //     SELECT
  //       sls.scenariolearnersessionid,
  //       sls.scenarioid,
  //       sls.learner_id,
  //       sls.scenariolearnerid,
  //       'System',
  //       'Failed to Stop and destroy the component',        
  //       'Operation Failed',
  //       NOW()
  //     FROM scenario_learner_session sls
  //     WHERE sls.scenariolearnersessionid = ?`,
  //   {
  //     replacements: [scenariolearnersessionid],
  //     type: db.sequelize.QueryTypes.INSERT,
  //   }
  // );
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




const updateCompleteTerminateVMRequest =
  ({ db, ipAddress }) =>
  async (vmrequestid, status, type) => {
    const RUNNING = "Running";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const FAILED = "Failed";
    const OP_FAILED = "Operation Failed";
    let hasFailed = false;

    const [session] = await db.sequelize.query(
      `SELECT vmrequestid, scenarioid, scenariodiagram,requestedby_id, requestedby_role,
              vm_steps, network_bridges
       FROM vm_request
       WHERE vmrequestid = ? LIMIT 1`,
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
            replacements: [
              JSON.stringify(scenariodiagram),
              vmrequestid,
            ],
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
          vmrequestid,
          err,
          session.scenarioid,
          session.requestedby_id,
          session.requestedby_role
        );
      }
    };
    let components = [];

    try {
      if (session.vm_steps !== RUNNING && session.vm_steps !== OP_FAILED) {
        return {
          success: false,
          message: `Session vm_steps must be '${RUNNING}' or '${OP_FAILED}' to terminate.`,
        };
      }

      // Fetch components
      components = await db.sequelize.query(
        `SELECT * FROM vm_config WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      // 1. Stop all components first
      //Create single tracking object

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

      // Destroy loop (only for stop success) & mark Completed

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
            `UPDATE vm_config SET status = ?, modifiedon = NOW() WHERE vmconfigurationid = ?`,

            {
              replacements: ["Completed", vmconfigurationid],
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
          `UPDATE vm_request SET vm_steps = ?, modifiedon = NOW() WHERE vmrequestid = ?`,
          {
            replacements: [DESTROYED, vmrequestid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
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
          `SELECT scenariodiagram FROM vm_request WHERE vmrequestid = ? LIMIT 1`,
          {
            replacements: [vmrequestid],
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
            `UPDATE vm_request
          SET scenariodiagram = ?, modifiedon = NOW()
          WHERE vmrequestid = ?`,
            {
              replacements: [
                JSON.stringify(scenariodiagram),
                vmrequestid,
              ],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }
      } catch (diagramErr) {
        console.error("Error while resetting isAttacked:", diagramErr);
      }
      //  ------------  MARK SNAPSHOTS AS DELETED  ------------
      try {
        // Extract VMIDs for this session
        const vmids = components.map((c) => c.vmid).filter((v) => v);

        if (vmids.length > 0) {
          await db.sequelize.query(
            `UPDATE vm_snapshots
              SET snapshot_status = 'Delete',
              deletedon = NOW()
              WHERE vmid IN (${vmids.map(() => "?").join(",")})
              AND deletedon IS NULL`,
            {
              replacements: vmids,
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }
      } catch (snapErr) {
        console.error("Error marking snapshots deleted:", snapErr);
      }
    }
  };


const deleteScenarioLearner =
  ({ db, ipAddress }) =>
  async (scenariolearnersessionid) => {
    const TERMINATED = "Terminated";
    const DESTROYED = "Destroyed";
    let hasFailed = false;

    // Fetch session info
    const [session] = await db.sequelize.query(
      `SELECT scenarioid, learner_id, vm_steps, network_bridges, scenariodiagram
       FROM scenario_learner_session
       WHERE scenariolearnersessionid = ? LIMIT 1`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!session) {
      return { success: false, message: "Invalid scenario learner session." };
    }

    // Reset diagram (mark nodes offline + remove attacks)
    let scenariodiagram;
    try {
      if (session.scenariodiagram) {
        scenariodiagram = JSON.parse(session.scenariodiagram);

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
    } catch (e) {
      console.error("Diagram update failed:", e);
    }

    // Helper to ensure failure logs/updates run only once
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
      // Fetch all VM components
      const components = await db.sequelize.query(
        `SELECT * FROM vm_configuration WHERE scenariolearnersessionid = ?`,
        {
          replacements: [scenariolearnersessionid],
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
        const vmType = componenttype.toLowerCase();
        const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || tokenResult.status !== "200") {
          return {
            success: false,
            message: "Could not connect to Proxmox server.",
          };
        }

        // ----------------------------
        //     DELETE LOGIC
        // ----------------------------
        if (vmType === "lxc") {
          // LXC → DIRECT DESTROY
          const destroyRes = await proxmoxService.destroyVM(vmid, vmType);

          if (destroyRes?.status === 200) {
            await db.sequelize.query(
              `UPDATE vm_configuration SET status='Completed', modifiedon=NOW()
               WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          } else {
            await handleFailureOnce(
              new Error(`LXC delete failed for ${componentname}`)
            );
          }
        } else if (vmType === "qemu") {
          // QEMU → STOP FIRST, THEN DESTROY
          const stopRes = await proxmoxService.stopVM(vmid, vmType);

          if (stopRes?.status !== 200) {
            await handleFailureOnce(
              new Error(`Stop failed for ${componentname}`)
            );
          }

          // Wait before destroy (using your delay config)
          await sleep(await getTerminationDelay(db));

          const destroyRes = await proxmoxService.destroyVM(vmid, vmType);

          if (destroyRes?.status === 200) {
            await db.sequelize.query(
              `UPDATE vm_configuration SET status='Completed', modifiedon=NOW()
               WHERE vmconfigurationid=?`,
              {
                replacements: [vmconfigurationid],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );
          } else {
            await handleFailureOnce(
              new Error(`Destroy failed for ${componentname}`)
            );
          }
        }
      }

      // ----------------------------
      // UPDATE SESSION STATUS
      // ----------------------------
      if (!hasFailed) {
        await db.sequelize.query(
          `UPDATE scenario_learner_session
           SET vm_steps=?, modifiedon=NOW()
           WHERE scenariolearnersessionid=?`,
          {
            replacements: [DESTROYED, scenariolearnersessionid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      // Release networks
      await releaseNetworks(db, session.network_bridges);

      return {
        success: true,
        message: "Scenario deleted successfully.",
      };
    } catch (err) {
      console.error("Error in deleteScenarioLearnerDAO:", err);
      await releaseNetworks(db, session.network_bridges);
      await handleFailureOnce(err);
      return { success: false, message: "Unexpected error occurred." };
    } finally {
      // Mark snapshots as deleted
      try {
        const comps = await db.sequelize.query(
          `SELECT vmid FROM vm_configuration WHERE scenariolearnersessionid=?`,
          {
            replacements: [scenariolearnersessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        const vmids = comps.map((c) => c.vmid).filter((v) => v);

        if (vmids.length > 0) {
          await db.sequelize.query(
            `UPDATE vm_snapshots
             SET snapshot_status='Delete', deletedon=NOW()
             WHERE vmid IN (${vmids.map(() => "?").join(",")})
             AND deletedon IS NULL`,
            {
              replacements: vmids,
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }
      } catch (e) {
        console.error("Snapshot delete update failed:", e);
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

      // Generate Proxmox ticket
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `Could not connect to the Proxmox server for VM ID ${vmid}.`,
        };
      }

      //Stop the VM
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

      //Wait before starting
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Start the VM again
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

const createSnapshot =
  ({ db, ipAddress }) =>
  async (vmid, vmType, vmstate) => {
    try {
      // Fetch config with componentname
      const vmConfig = await db.sequelize.query(
        `SELECT master_vmid, learner_id, scenarioid, componentname
         FROM vm_configuration
         WHERE vmid = ?
         LIMIT 1`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!vmConfig.length) {
        return { success: false, message: `VM ID ${vmid} not found.` };
      }

      const { master_vmid, learner_id, scenarioid, componentname } =
        vmConfig[0];

      // Fetch active snapshots (limit = 3)
      const activeSnapshots = await db.sequelize.query(
        `SELECT snapshot_name 
         FROM vm_snapshots
         WHERE vmid = ? AND deletedon IS NULL`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        }
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
        }
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
        const camelCase = parts
          .map((p, index) =>
            index === 0
              ? p.toLowerCase()
              : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
          )
          .join("");
        return camelCase;
      };
      const formattedComponentName = sanitizeComponentName(componentname);
      const snapname = `${formattedComponentName}-snapshot-${nextNumber}`;
      const proxmoxService = ProxMoxService(
        db,
        { vmType: vmType.toLowerCase() },
        ipAddress
      );

      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: `Proxmox connection failed.` };
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
          vmstate
        );
      }

      if (snapshotResult?.status !== 200) {
        return { success: false, message: `Snapshot creation failed.` };
      }
      await db.sequelize.query(
        `INSERT INTO vm_snapshots 
         (master_vmid, vmid, learner_id, scenarioid, component_type,
          snapshot_name, snapshot_status, createdon)
         VALUES (?, ?, ?, ?, ?, ?, 'Capture', NOW())`,
        {
          replacements: [
            master_vmid,
            vmid,
            learner_id,
            scenarioid,
            vmType.toUpperCase(),
            snapname,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        }
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
        ipAddress
      );

      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return {
          success: false,
          message: `Could not connect to the Proxmox server for VM ID ${vmid}.`,
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
        `UPDATE vm_snapshots
         SET 
            snapshot_status = 'Delete',
            deletedon = NOW()
         WHERE vmid = ? 
           AND snapshot_name = ?
         LIMIT 1`,
        {
          replacements: [vmid, snapname],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      return {
        success: true,
        message: `Snapshot '${snapname}' deleted successfully for VM ${vmid}.`,
      };
    } catch (err) {
      console.error(
        `Error deleting snapshot '${snapname}' for VM ${vmid}:`,
        err
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
        ipAddress
      );

      // Fetch snapshots in chronological order
      const snapshots = await db.sequelize.query(
        `SELECT snapshot_name
         FROM vm_snapshots
         WHERE vmid = ? AND deletedon IS NULL
         ORDER BY createdon ASC`,
        {
          replacements: [vmid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (snapshots.length === 0) {
        return { success: false, message: "No snapshots found." };
      }

      const snapshotNames = snapshots.map((s) => s.snapshot_name);
      const latestSnapshot = snapshotNames[snapshotNames.length - 1];

      // Generate Proxmox Token
      const tokenResult = await proxmoxService.generateAccessTicket();
      if (!tokenResult || tokenResult.status !== "200") {
        return { success: false, message: `Failed to connect to Proxmox.` };
      }

      // If selected snapshot IS the latest → restore directly
      if (snapname === latestSnapshot) {
        const result = await performRestore(
          vmid,
          vmType,
          snapname,
          startValue,
          ipAddress,
          db
        );

        if (result.success) {
          await db.sequelize.query(
            `UPDATE vm_snapshots
             SET snapshot_status = 'Restore'
             WHERE vmid = ? AND snapshot_name = ? AND deletedon IS NULL`,
            {
              replacements: [vmid, snapname],
              type: db.sequelize.QueryTypes.UPDATE,
            }
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

      // 1️⃣ Delete snapshots AFTER the selected one
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
          `UPDATE vm_snapshots
           SET snapshot_status = 'Delete', deletedon = NOW()
           WHERE vmid = ? AND snapshot_name = ?
           LIMIT 1`,
          {
            replacements: [vmid, sname],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      // 2️⃣ After deleting ≥ snapshots → restore the selected snapshot
      const restoreResult = await performRestore(
        vmid,
        vmType,
        snapname,
        startValue,
        ipAddress,
        db
      );

      if (restoreResult.success) {
        await db.sequelize.query(
          `UPDATE vm_snapshots
           SET snapshot_status = 'Restore'
           WHERE vmid = ? AND snapshot_name = ? AND deletedon IS NULL`,
          {
            replacements: [vmid, snapname],
            type: db.sequelize.QueryTypes.UPDATE,
          }
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
  db
) {
  const proxmoxService = ProxMoxService(
    db,
    { vmType: vmType.toLowerCase() },
    ipAddress
  );

  const tokenResult = await proxmoxService.generateAccessTicket();
  if (!tokenResult || tokenResult.status !== "200") {
    return { success: false, message: `Failed to connect to Proxmox.` };
  }

  let restoreResult;

  if (vmType.toLowerCase() === "lxc") {
    restoreResult = await proxmoxService.restoreLXCSnapshot(
      vmid,
      snapname,
      startValue
    );
  } else {
    restoreResult = await proxmoxService.restoreQEMUSnapshot(
      vmid,
      snapname,
      startValue
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

const pauseScenarioLearner =
  ({ db, ipAddress }) =>
  async (scenariolearnersessionid) => {
    try {
      // ------------------ FETCH COMPONENTS ------------------
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname
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

      // ------------------ UPDATE DIAGRAM ONLY IF ALL VMs PAUSED ------------------
      // if (allSuccess) {
      //   await updateScenarioDiagram(db, scenariolearnersessionid);
      // }

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
  async (scenariolearnersessionid) => {
    try {
      // ------------------ FETCH COMPONENTS ------------------
      const components = await db.sequelize.query(
        `SELECT vmid, componenttype, componentname
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
        // QEMU → Resume (unsuspend)
        if (vmType === "qemu") {
          resumeResult = await proxmoxService.resumeVM(vmid, vmType);
        }
        // LXC → Start (resume equivalent)
        else if (vmType === "lxc") {
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
        // ----------- SUCCESS CASE -----------
        if (resumeResult?.status === 200) {
          results.push({
            vmid,
            status: "success",
            message:
              vmType === "qemu"
                ? `VM ${vmid} resumed successfully`
                : `VM ${vmid} started successfully (LXC resume equivalent)`,
          });
        }
        // ----------- FAILURE CASE -----------
        else {
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

const fetchScenarioWithComponents = async (db, scenarioId) => {
  const rows = await db.sequelize.query(
    `SELECT * FROM scenarios WHERE scenarioid = :scenarioId`,
    {
      replacements: { scenarioId },
      type: db.sequelize.QueryTypes.SELECT,
    }
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
      }
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
            return { success: false, message: "Failed to connect to Proxmox." };
          }

          const backup = await proxmoxService.takeBackup(vmid);

          if (backup?.data) {
            const upid = backup.data.data;

            await db.sequelize.query(
              `INSERT INTO component_export (componentid, vmid,scenarioid, upid, status, createdon)
               VALUES (:componentid, :vmid,:scenarioid, :upid, 'Pending', NOW())`,
              {
                replacements: {
                  componentid: comp.componentid,
                  vmid: vmid,
                  scenarioid: scenarioId,
                  upid,
                },
                type: db.sequelize.QueryTypes.INSERT,
              }
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
        `SELECT vmid, file_name
   FROM component_export 
   WHERE scenarioid = :scenarioid`,
        {
          replacements: { scenarioid: scenarioId },
          type: db.sequelize.QueryTypes.SELECT,
        }
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
        { type: db.sequelize.QueryTypes.SELECT }
      );

      const proxmoxService = ProxMoxService(db, {}, ipAddress);

      for (const item of pendingItems) {
        const { upid, componentexportid } = item;

        try {
          const tokenResult = await proxmoxService.generateAccessTicket();
          if (!tokenResult || tokenResult.status !== "200") {
            console.log("Failed to authenticate with Proxmox");
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
                    console.log(
                      "Extracted Backup Filename:",
                      extractedFileName
                    );
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

          console.log(
            `UPID ${upid} => Status Updated: ${newStatus}` +
              (extractedFileName ? ` | File: ${extractedFileName}` : "") +
              (rejectReason ? ` | Reason: ${rejectReason}` : "")
          );

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
              }
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
                }
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
                }
              );

              console.log(
                `Scenario ${scenarioId} status updated → ${scenarioStatus} 
                (Completed: ${completedCount}, Running: ${runningCount}, Failed: ${failedCount})`
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

module.exports = {
  setVMRequestConfiguration,
  updateCompleteTerminateVMRequest,
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
};
