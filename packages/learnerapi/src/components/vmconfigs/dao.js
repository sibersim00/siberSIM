const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const constants = require("../../services/proxmox/constants");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

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
  scenarioid,
  learnerid,
  vmrequestid,
}) {
  try {
    await db.sequelize.query(
      `UPDATE vm_request SET vm_steps = 'Failed', modifiedon = NOW(), failedon = NOW() WHERE vmrequestid = ?`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    await db.sequelize.query(
      `UPDATE vm_request SET status = 'Failed', modifiedon = NOW() WHERE vmrequestid = ?`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    await db.sequelize.query(
      `INSERT INTO vm_request_logs (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon) 
       VALUES (?, ?, ?, 'System', 'Failed', 'Failed to call Jobs', NOW())`,
      {
        replacements: [vmrequestid, scenarioid, learnerid],
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

        // STOP phase
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
          }
        }

        // DESTROY phase
        for (const component of components) {
          const { vmid, componenttype, componentname, vmconfigurationid } =
            component;
          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

          try {
            const tokenResult = await proxmoxService.generateAccessTicket();
            if (!tokenResult || tokenResult.status !== "200") {
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
          }
        }

        // Release network bridges
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
      const result = await db.sequelize.query( `SELECT vrl.remark, vrl.status AS log_status, vrl.type, DATE_FORMAT(vrl.createdon, '%Y-%m-%d %H:%i:%s') AS log_date, vr.status AS session_status,  CASE WHEN vr.status = 'Completed' THEN DATE_FORMAT(vr.completedon, '%Y-%m-%d %H:%i:%s')  WHEN vr.status = 'Terminated' THEN DATE_FORMAT(vr.terminatedon, '%Y-%m-%d %H:%i:%s')  ELSE NULL END AS session_status_date  FROM vm_request_logs vrl  INNER JOIN scenarios s ON s.scenarioid = vrl.scenarioid  INNER JOIN vm_request vr ON vr.vmrequestid = vrl.vmrequestid  WHERE vrl.status = 'Operation Failed'  ORDER BY vrl.createdon DESC`,
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

const getSnapshotsByVmid =
  ({ db }) =>
    async (vmid) => {
      try {
        const rows = await db.sequelize.query( ` SELECT  sd.snapshotid, sd.vmid, sd.snapshot_name, sd.snapshot_status, sd.createdon, vc.componentname, vc.componenttype, s.scenariotitle FROM vm_snapshots sd LEFT JOIN vm_config vc  ON sd.vmid = vc.vmid LEFT JOIN scenarios s ON vc.scenarioid = s.scenarioid WHERE sd.vmid = ? AND sd.deletedon IS NULL ORDER BY sd.createdon ASC; `,
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
  const [res] = await db.sequelize.query( ` SELECT c.componentid, c.componentname, c.componenttype, c.vmid, c.componentcategoryid, c.network_ports, c.cores, c.memory, c.storage, c.vmid_name, v.scenarioid, v.status AS vm_status, vr.requestedby_id AS learner_id, cc.status AS custom_request_status FROM components c INNER JOIN vm_config v ON c.vmid = v.master_vmid INNER JOIN vm_request vr ON vr.vmrequestid = v.vmrequestid LEFT JOIN custom_component cc ON cc.clone_vmid = v.vmid AND cc.status = 'pending' WHERE v.vmid = :vmid AND v.status != 'Destroyed' AND c.deletedon IS NULL LIMIT 1
    `,
    {
      replacements: { vmid },
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


const getNextVmid = ({ db }) => async (transaction) => {
  const [webSetting] = await db.sequelize.query(
    `
      SELECT template_clone_vmid
      FROM web_settings
      WHERE status = 1
      LIMIT 1
    `,
    {
      type: db.sequelize.QueryTypes.SELECT,
      transaction,
    }
  );

  if (!webSetting?.template_clone_vmid) {
    throw new Error("template_clone_vmid not configured in web_settings");
  }

  const baseVmid = Number(webSetting.template_clone_vmid);
  const [lastComponent] = await db.sequelize.query(
    `
      SELECT MAX(vmid) AS lastVmid
      FROM custom_component
      FOR UPDATE
    `,
    {
      type: db.sequelize.QueryTypes.SELECT,
      transaction,
    }
  );
  const nextVmid = lastComponent?.lastVmid
    ? Number(lastComponent.lastVmid) + 1
    : baseVmid + 1;   //  IMPORTANT CHANGE


  return nextVmid;
};

const saveCustomComponent = ({ db }) => async (data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      componentname,
      componentcategoryid,
      duration,
      clone_vmid,     
      componentimage,
      scenarioid,
      learner_id,
      componenttype,
      createdby
    } = data;

    //  Generate ONLY vmid
    const vmid = await getNextVmid({ db })(transaction);

    // 1️⃣ Fetch approval flag
    const [settings] = await db.sequelize.query(
      `
          SELECT component_approval
          FROM web_settings
          WHERE status = 1
          LIMIT 1
        `,
      {
        type: db.sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    const approvalFlag = settings?.component_approval === "true";
    const approvalMessage = approvalFlag
      ? "Auto approval process"
      : "Admin approval process";

    // 🔹 Fetch original MASTER VMID from vm_configuration
    const [vmConfig] = await db.sequelize.query(
      `
      SELECT master_vmid
      FROM vm_config
      WHERE vmid = ?
      LIMIT 1
    `,
      {
        replacements: [clone_vmid], // cloned VMID (11494)
        type: db.sequelize.QueryTypes.SELECT,
        transaction,
      }
    );
    if (!vmConfig?.master_vmid) {
      throw new Error("Master VMID not found in vm_configuration");
    }
    const master_vmid = vmConfig.master_vmid;
    const [insertResult] = await db.sequelize.query( ` INSERT INTO custom_component  ( customcomponentuuid, componentname, scenarioid, learner_id, componentcategoryid, master_vmid, clone_vmid, vmid, componenttype, duration, componentimage, status, componentStatus, createdby, createdon ) VALUES ( UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', ?, NOW() ) `,
      {
        replacements: [
          componentname,
          scenarioid,
          learner_id,
          componentcategoryid,
          master_vmid,
          clone_vmid,
          vmid,
          componenttype,
          duration,
          componentimage,
          createdby,
        ],
        type: db.sequelize.QueryTypes.INSERT,
        transaction,
      }
    );
    const customcomponentid = insertResult;
    await transaction.commit();

    return {
      success: true,
      approvalFlag,
      master_vmid,
      clone_vmid, // frontend value
      vmid,       // generated value
      customcomponentid,
      message: approvalMessage,
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const rejectPendingCustomComponentIfVmStopped =
  ({ db }) =>
    async ({ vmid }) => {
      try {
        // 1️⃣ Check VM status
        const [vm] = await db.sequelize.query(
          `
          SELECT status
          FROM vm_config
          WHERE vmid = :vmid
          LIMIT 1
          `,
          {
            replacements: { vmid },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (!vm) {
          return { updated: false, reason: "VM_NOT_FOUND" };
        }

        if (vm.status !== "Stopped") {
          return { updated: false, reason: "VM_NOT_STOPPED" };
        }

        // 2️⃣ Reject pending custom components
        const [result] = await db.sequelize.query( ` UPDATE custom_component SET status = 'reject', reject_reason = 'VM was stopped. Request automatically rejected.', modifiedon = NOW() WHERE clone_vmid = :vmid AND status = 'pending' `,
          {
            replacements: { vmid },
          }
        );

        return {
          updated: true,
          affectedRows: result?.affectedRows || 0,
        };
      } catch (error) {
        console.error(
          "Error rejecting pending custom components:",
          error
        );
        throw error;
      }
    };

  const deleteBridgeFromScenario = ({ db }) => async (payload) => { 
  const {
    vmrequestid,
    edgeId,
    bridge,
    sourceNodeId,
    targetNodeId,
    sourceHandle,
    targetHandle,
  } = payload;

  // Get existing diagram
  const [vmRequest] = await db.sequelize.query(
    `SELECT scenariodiagram FROM vm_request WHERE vmrequestid = :vmrequestid`,
    {
      replacements: { vmrequestid },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (!vmRequest?.scenariodiagram) {
    throw new Error("Scenario diagram not found");
  }

  let diagram = JSON.parse(vmRequest.scenariodiagram);

  // Remove edge
  diagram.edges = diagram.edges.filter((e) => e.id !== edgeId);

  // Remove bridge from nodes
  diagram.nodes = diagram.nodes.map((node) => {
    if (
      node.id === sourceNodeId ||
      node.id === targetNodeId
    ) {
      if (node.data?.networkport) {
        node.data.networkport = node.data.networkport.map((portObj) => {
          const key = Object.keys(portObj)[0]; // net0, net1

          if (key === sourceHandle.replace("-source", "") ||
              key === targetHandle.replace("-target", "")) {

            // remove bridge from string
            return {
              [key]: portObj[key].replace(`,bridge=${bridge}`, ""),
            };
          }

          return portObj;
        });
      }
    }

    return node;
  });

  // Update DB
  await db.sequelize.query(
    `UPDATE vm_request 
     SET scenariodiagram = :diagram, modifiedon = NOW()
     WHERE vmrequestid = :vmrequestid`,
    {
      replacements: {
        diagram: JSON.stringify(diagram),
        vmrequestid,
      },
    }
  );
   await db.sequelize.query(
        `UPDATE static_networks
         SET lock_status = 'Free',
             released_at = NOW(),
             modifiedon = NOW()
         WHERE networkname = :bridge
           AND lock_status = 'Locked'`,
        {
          replacements: { bridge },
        }
      );

  return diagram;
};

module.exports = {
  generateProxmoxAccessToken,
  setScenarioLearnerConfigurationOnFailure,
  stopAndDestroyFailedScenarios,
  getOperationFailedLogs,
  getSnapshotsByVmid,
  getComponentByVmid,
  getNextVmid,
  saveCustomComponent,
  rejectPendingCustomComponentIfVmStopped,
  deleteBridgeFromScenario
};
