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
        `
        SELECT
          vrl.remark,
          vrl.status AS log_status,
          vrl.requestedby_role AS type,
          DATE_FORMAT(vrl.createdon, '%Y-%m-%d %H:%i:%s') AS log_date,

          vr.status AS session_status,

          CASE
            WHEN vr.status = 'Completed'
              THEN DATE_FORMAT(vr.completedon, '%Y-%m-%d %H:%i:%s')
            WHEN vr.status = 'Terminated'
              THEN DATE_FORMAT(vr.terminatedon, '%Y-%m-%d %H:%i:%s')
            ELSE NULL
          END AS session_status_date

        FROM vm_request_logs vrl
        INNER JOIN vm_request vr
          ON vr.vmrequestid = vrl.vmrequestid
        INNER JOIN scenarios s
          ON s.scenarioid = vrl.scenarioid

        WHERE vrl.status = 'Operation Failed'
        ORDER BY vrl.createdon DESC
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
        LEFT JOIN vm_config vc 
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
      v.vmrequestid
    FROM components c
    INNER JOIN vm_config v
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
        SELECT master_vmid,scenarioid,vmrequestid
        FROM vm_config
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
  generateProxmoxAccessToken,
  stopAndDestroyFailedScenarios,
  getOperationFailedLogs,
  getSnapshotsByVmid,
  getComponentByVmid,
  getOriginalVmid,
  saveCustomComponent
};
