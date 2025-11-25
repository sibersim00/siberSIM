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
        `SELECT * FROM vm_configuration WHERE scenariolearnersessionid = ?`,
        {
          replacements: [scenariolearnersessionid],
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
      //  ------------  MARK SNAPSHOTS AS DELETED  ------------
      try {
        // Extract VMIDs for this session
        const vmids = components.map((c) => c.vmid).filter((v) => v);

        if (vmids.length > 0) {
          await db.sequelize.query(
            `UPDATE snapshot_details
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
         FROM snapshot_details
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
          FROM snapshot_details
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
        `INSERT INTO snapshot_details 
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
        `UPDATE snapshot_details
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
         FROM snapshot_details
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
            `UPDATE snapshot_details
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
          `UPDATE snapshot_details
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
          `UPDATE snapshot_details
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
      if (allSuccess) {
        await updateScenarioDiagram(db, scenariolearnersessionid);
      }

      return {
        success: allSuccess,
        message: allSuccess
          ? "All VMs paused successfully."
          : "Some VMs failed to pause.",
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

async function updateScenarioDiagram(db, scenariolearnersessionid) {
  try {
    const [diagramRow] = await db.sequelize.query(
      `SELECT scenariodiagram 
       FROM scenario_learner_session 
       WHERE scenariolearnersessionid = ? LIMIT 1`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (diagramRow?.scenariodiagram) {
      let scenariodiagram = JSON.parse(diagramRow.scenariodiagram);

      // Set all nodes offline
      scenariodiagram.nodes?.forEach((node) => {
        if (node?.data?.isOnline) node.data.isOnline = "No";
      });

      // Remove all attacks
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
  } catch (err) {
    console.error("Error updating scenario diagram:", err);
  }
}

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

      // ------------------ UPDATE DIAGRAM ONLY IF ALL VMs RESUMED ------------------
      if (allSuccess) {
        await updateScenarioDiagramOnResume(db, scenariolearnersessionid);
      }

      return {
        success: allSuccess,
        message: allSuccess
          ? "All VMs resumed successfully."
          : "Some VMs failed to resume.",
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

async function updateScenarioDiagramOnResume(db, scenariolearnersessionid) {
  try {
    const [diagramRow] = await db.sequelize.query(
      `SELECT scenariodiagram 
       FROM scenario_learner_session 
       WHERE scenariolearnersessionid = ? LIMIT 1`,
      {
        replacements: [scenariolearnersessionid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (diagramRow?.scenariodiagram) {
      let scenariodiagram = JSON.parse(diagramRow.scenariodiagram);
      scenariodiagram.nodes?.forEach((node) => {
        if (node?.data?.isOnline) node.data.isOnline = "Yes";
      });
      scenariodiagram.edges?.forEach((edge) => {
        if (edge?.isAttacked) edge.isAttacked = "Yes";
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
  } catch (err) {
    console.error("Error updating scenario diagram on resume:", err);
  }
}

module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminatelearner,
  generateProxmoxAccessToken,
  autoTerminateFailedScenarios,
  startScenarioLearner,
  restartscenarioLearner,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  pauseScenarioLearner,
  resumeScenarioLearner,
};
