const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const constants = require("../../services/proxmox/constants");
const NotiTemplate = require("../../utils/notiUtility");


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
    return 10000; // fallback to 10 secs
  }
};

const generateProxmoxAccessToken =
  ({ db, payload }) =>
  async (ip_address) => {
    const proxmox = ProxMoxService(db, payload, ip_address);
    const result = await proxmox.generateAccessTicket();
    const ticket = result?.data?.ticket;

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

const stopAndDestroyFailedScenarios =
  ({ db, ipAddress }) =>
  async () => {
    const OP_FAILED = "Operation Failed";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const COMPLETED = "Completed";
    let allComponentsFixed = true;

    try {
      const sessions = await db.sequelize.query(
        `SELECT vmrequestid,scenarioid,requestedby_id
         FROM vm_request 
         WHERE vm_steps = ?`,
        {
          replacements: [OP_FAILED],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!sessions.length) {
        return { success: true, message: "No Failed Scenarios to process." };
      }

      for (const { vmrequestid, scenarioid, requestedby_id } of sessions) {
        const components = await db.sequelize.query(
          `SELECT * 
           FROM vm_config
           WHERE vmrequestid = ? and status!="Completed"`,
          {
            replacements: [vmrequestid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        for (const component of components) {
          const {
            vmid,
            componenttype,
            componentname,
            vmconfigurationid,
            status,
          } = component;
          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

          if (status === COMPLETED) {
            console.log(`Skipping ${componentname} (status: ${status})`);
            continue;
          }

          const tokenResult = await proxmoxService.generateAccessTicket();
          if (tokenResult?.status !== "200") {
            console.log(`Token failed for ${componentname}, skipping...`);
            allComponentsFixed = false; // mark failure
            continue;
          }

          let stopOK = false;
          let destroyOK = false;

          if (status === STOPPED) {
            const stopRes = await proxmoxService.stopVM(vmid, vmType);
            stopOK = stopRes?.status === 200;
            if (stopOK) await sleep(await getTerminationDelay(db));
            else allComponentsFixed = false; // failed stop
          }

          if (status === DESTROYED || stopOK) {
            const destroyRes = await proxmoxService.destroyVM(vmid, vmType);
            destroyOK = destroyRes?.status === 200;
            if (!destroyOK) allComponentsFixed = false; // failed destroy
          }

          let newStatus;
          if (stopOK && destroyOK) newStatus = COMPLETED;
          else if (destroyOK) newStatus = COMPLETED;
          else if (stopOK && !destroyOK) newStatus = DESTROYED;
          else newStatus = STOPPED;

          await db.sequelize.query(
            `UPDATE vm_config 
            SET status = ?, modifiedon = NOW() 
            WHERE vmconfigurationid = ?`,
            {
              replacements: [newStatus, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );
        }

        // After loop finishes → update scenario session
        const scenarioFinalStatus = allComponentsFixed ? DESTROYED : OP_FAILED;

        await db.sequelize.query(
          `UPDATE vm_request 
            SET vm_steps = ?, modifiedon = NOW() 
            WHERE vmrequestid = ?`,
          {
            replacements: [scenarioFinalStatus, vmrequestid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      return { success: true, message: "All Failed Scenarios processed." };
    } catch (err) {
      console.error("Error in stopAndDestroyFailedScenarios:", err);
      return {
        success: false,
        message: "Error occurred while processing failed scenarios.",
      };
    }
  };

const stopAndDestroyFailedEvents =
  ({ db, ipAddress }) =>
  async () => {
    const OP_FAILED = "Operation Failed";
    const STOPPED = "Stopped";
    const DESTROYED = "Destroyed";
    const COMPLETED = "Completed";

    try {
      // 1️⃣ Get all failed VM requests
      const vmRequests = await db.sequelize.query( ` SELECT vr.vmrequestid, vr.scenarioid, el.eventid, el.learner_id FROM vm_request vr INNER JOIN event_learners el ON el.vmrequestid = vr.vmrequestid WHERE vr.vm_steps = ? `,
        {
          replacements: [OP_FAILED],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!vmRequests.length) {
        return { success: true, message: "No Failed Events to process." };
      }

      for (const {
        vmrequestid,
        scenarioid,
        eventid,
        learner_id,
      } of vmRequests) {
        let allComponentsFixed = true;

        // 2️⃣ Fetch components for this VM request
        const components = await db.sequelize.query(
          `
          SELECT *
          FROM vm_config
          WHERE vmrequestid = ?
            AND status != ?
          `,
          {
            replacements: [vmrequestid, COMPLETED],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        for (const component of components) {
          const {
            vmid,
            componenttype,
            componentname,
            vmconfigurationid,
            status,
          } = component;

          const vmType = componenttype.toLowerCase();
          const proxmoxService = ProxMoxService(db, { vmType }, ipAddress);

          if (status === COMPLETED) continue;

          const tokenResult = await proxmoxService.generateAccessTicket();
          if (tokenResult?.status !== "200") {
            allComponentsFixed = false;
            continue;
          }

          let stopOK = false;
          let destroyOK = false;

          // Stop VM if needed
          if (status !== STOPPED && status !== DESTROYED) {
            const stopRes = await proxmoxService.stopVM(vmid, vmType);
            stopOK = stopRes?.status === 200;
            if (!stopOK) allComponentsFixed = false;
            else await sleep(await getTerminationDelay(db));
          } else {
            stopOK = true;
          }

          // Destroy VM
          if (stopOK) {
            const destroyRes = await proxmoxService.destroyVM(vmid, vmType);
            destroyOK = destroyRes?.status === 200;
            if (!destroyOK) allComponentsFixed = false;
          }

          const newStatus =
            stopOK && destroyOK ? COMPLETED :
            destroyOK ? COMPLETED :
            stopOK ? DESTROYED :
            STOPPED;

          await db.sequelize.query(
            `
            UPDATE vm_config
            SET status = ?, modifiedon = NOW()
            WHERE vmconfigurationid = ?
            `,
            {
              replacements: [newStatus, vmconfigurationid],
              type: db.sequelize.QueryTypes.UPDATE,
            }
          );

          // Notification (unchanged)
          await new NotiTemplate(
            db,
            "proxmox_terminate",
            { userid: 0, scenarioid, learner_id, eventid },
            "Admin",
            0
          );
        }

        // 3️⃣ Update VM request final state
        const finalVmStep = allComponentsFixed ? DESTROYED : OP_FAILED;

        await db.sequelize.query(
          `
          UPDATE vm_request
          SET
            vm_steps = ?,
            status = ?,
            modifiedon = NOW()
          WHERE vmrequestid = ?
          `,
          {
            replacements: [
              finalVmStep,
              allComponentsFixed ? COMPLETED : OP_FAILED,
              vmrequestid,
            ],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      return { success: true, message: "All Failed Events processed." };
    } catch (err) {
      console.error("Error in stopAndDestroyFailedEvents:", err);
      return {
        success: false,
        message: "Error occurred while processing failed events.",
      };
    }
  };

const getOperationFailedLogs =
  ({ db }) =>
  async () => {
    try {
      const result = await db.sequelize.query( ` SELECT vr.vm_steps, DATE_FORMAT(vr.startedon, '%Y-%m-%d %H:%i:%s') AS started_on, vr.status AS session_status, CONCAT(l.firstname, ' ', l.lastname) AS learner_name, s.scenariotitle AS scenario_name, DATE_FORMAT( CASE WHEN vr.status = 'Completed' THEN vr.completedon WHEN vr.status = 'Terminated' THEN vr.terminatedon ELSE vr.failedon END, '%Y-%m-%d %H:%i:%s' ) AS end_date FROM vm_request vr INNER JOIN scenarios s ON s.scenarioid = vr.scenarioid INNER JOIN learners l ON l.learner_id = vr.requestedby_id WHERE vr.vm_steps = 'Operation Failed' AND vr.requestedby_role = 'Learner' ORDER BY vr.startedon DESC `,
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


const getEventOperationFailedLogs =
  ({ db }) =>
  async () => {
    try {
      const result = await db.sequelize.query( ` SELECT el.eventlearnerid, vr.vm_steps, DATE_FORMAT(vr.startedon, '%Y-%m-%d %H:%i:%s') AS started_on, vr.status AS session_status, CONCAT(l.firstname, ' ', l.lastname) AS learner_name, e.eventname AS event_name, DATE_FORMAT( CASE WHEN vr.status = 'Completed' THEN vr.completedon WHEN vr.status = 'Terminated' THEN vr.terminatedon ELSE vr.failedon END, '%Y-%m-%d %H:%i:%s' ) AS end_date FROM vm_request vr INNER JOIN event_learners el ON el.vmrequestid = vr.vmrequestid INNER JOIN events e ON e.eventid = el.eventid INNER JOIN learners l ON l.learner_id = el.learner_id WHERE vr.vm_steps = 'Operation Failed' ORDER BY vr.startedon DESC `,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error fetching Event Operation Failed logs:", error);
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

module.exports = {
  generateProxmoxAccessToken,
  stopAndDestroyFailedScenarios,
  stopAndDestroyFailedEvents,
  getOperationFailedLogs,
  getEventOperationFailedLogs,
  getSnapshotsByVmid,
};
