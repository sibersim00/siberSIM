const getAll =
  ({ db }) =>
  async ({ learner_id, eventid }) => {
    try {
      /* ===================== QUERY 1 : WITH VM REQUEST ===================== */

      let result = await db.sequelize.query(
        `
        SELECT
          e.eventid,
          e.eventuuid,
          e.eventname,

          el.eventlearnerid,
          el.learner_id,
          el.team_name,
          el.team_description,
          el.loggedon,

          vr.vmrequestid,
          vr.vmrequestuuid,
          vr.status,
          vr.vm_steps,
          vr.startedon,
          vr.completedon,
          vr.timer,

          CASE
            WHEN vr.status = 'Start' THEN
              SEC_TO_TIME(TIMESTAMPDIFF(SECOND, vr.startedon, NOW()))
            WHEN vr.status = 'Resume'
                 AND vr.resumeon IS NOT NULL THEN
              SEC_TO_TIME(
                TIMESTAMPDIFF(SECOND, vr.resumeon, NOW()) +
                TIME_TO_SEC(vr.timer)
              )
            ELSE vr.timer
          END AS calculated_timer,

          COALESCE(vr.scenariodiagram, s.scenariodiagram) AS scenariodiagram,

          s.scenarioid,
          s.scenariouuid,
          s.scenariotitle,
          s.scenarioidentification,
          s.scenariolevel,
          s.duration,
          s.scenariodescription,
          s.instruction_file,
          s.component_config,

          sc.categoryname AS scenariocategory_name,
          scc.categoryname AS scenariosubcategory_name,

          SEC_TO_TIME(
            GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), e.eventendtime))
          ) AS reverse_timer

        FROM event_learners el
        INNER JOIN events e ON e.eventid = el.eventid
        INNER JOIN scenarios s ON s.scenarioid = e.scenarioid
        INNER JOIN scenario_categories sc
          ON sc.scenariocategoryid = s.scenariocategoryid
        INNER JOIN scenario_categories scc
          ON scc.scenariocategoryid = s.scenariosubcategoryid
        INNER JOIN vm_request vr
          ON vr.vmrequestid = el.vmrequestid
            AND vr.status IN (
  'Pending',
    'Running',
    'Initializing',
    'Pause',
    'Resume',
    'Start',
    'Completed',
    'Failed'
  )
        WHERE
          el.learner_id = ?
          AND el.eventid = ?
          AND s.deletedon IS NULL

        ORDER BY vr.modifiedon DESC
        LIMIT 1
        `,
        {
          replacements: [learner_id, eventid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      console.log("resultresultresultresultresult", result);

      /* ===================== QUERY 2 : FALLBACK (PENDING) ===================== */

      if (result.length === 0 || !result[0].vmrequestid) {
        result = await db.sequelize.query(
          `
          SELECT
            e.eventid,
            e.eventuuid,
            e.eventname,

            el.eventlearnerid,
            el.learner_id,
            el.team_name,
            el.team_description,
            el.loggedon,

            NULL AS vmrequestid,
            NULL AS vmrequestuuid,
            'Pending' AS status,
            'Pending' AS vm_steps,
            '00:00:00' AS timer,
            '00:00:00' AS calculated_timer,

            s.scenariodiagram,
            s.scenarioid,
            s.scenariouuid,
            s.scenariotitle,
            s.scenarioidentification,
            s.scenariolevel,
            s.duration,
            s.scenariodescription,
            s.instruction_file,
            s.component_config,

            sc.categoryname AS scenariocategory_name,
            scc.categoryname AS scenariosubcategory_name,

            SEC_TO_TIME(
              GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), e.eventendtime))
            ) AS reverse_timer

          FROM event_learners el
          INNER JOIN events e ON e.eventid = el.eventid
          INNER JOIN scenarios s ON s.scenarioid = e.scenarioid
          INNER JOIN scenario_categories sc
            ON sc.scenariocategoryid = s.scenariocategoryid
          INNER JOIN scenario_categories scc
            ON scc.scenariocategoryid = s.scenariosubcategoryid

          WHERE
            el.learner_id = ?
            AND el.eventid = ?
            AND s.deletedon IS NULL
          `,
          {
            replacements: [learner_id, eventid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
      }

      /* ===================== COMPONENT & DIAGRAM LOGIC (UNCHANGED) ===================== */

      for (let item of result) {
        item.virtual_cpu = 0;
        item.virtual_memory = 0;
        item.storage_size = 0;

        try {
          const components = JSON.parse(item.component_config || "[]");
          item.component_count = components.length;

          const componentDetails = {};

          for (const comp of components) {
            if (comp.componentid) {
              const [rowData] = await db.sequelize.query(
                `
                SELECT cores, memory, storage, componentimage
                FROM components
                WHERE componentid = ?
                `,
                {
                  replacements: [comp.componentid],
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              if (rowData) {
                componentDetails[comp.componentid] = rowData;
                item.virtual_cpu += rowData.cores || 0;
                item.virtual_memory += rowData.memory || 0;
                item.storage_size += parseInt(rowData.storage) || 0;
              }
            }
          }

          if (item.scenariodiagram) {
            const diagramObj = JSON.parse(item.scenariodiagram);

            if (Array.isArray(diagramObj.nodes)) {
              diagramObj.nodes = diagramObj.nodes.map((node) => {
                const compId = node.data?.componentId || node.data?.componentid;
                if (compId && componentDetails[compId]) {
                  node.data.image =
                    componentDetails[compId].componentimage || node.data.image;
                }
                return node;
              });
            }

            item.scenariodiagram = JSON.stringify(diagramObj);
          }
        } catch (err) {
          console.error("Diagram/component parse error:", err);
        }
      }

      return result;
    } catch (error) {
      console.error("Event scenario fetch error =>", error);
      throw error;
    }
  };

const startEvent =
  ({ db, validation }) =>
  async (body ) => {
    console.log("gggggggggggg",body)
    try {
      /* ---------------- ACTIVE USER LIMIT ---------------- */
      const [activeUsersResult] = await db.sequelize.query(
        `SELECT COUNT(*) AS activeUsers
         FROM vm_request
         WHERE status IN ('Start','Resume')
         AND vm_steps = 'Running'`
      );

      const activeUsers = Number(activeUsersResult?.[0]?.activeUsers || 0);
      const limit = Number(body.user_count_limit || 0);

      if (limit > 0 && activeUsers >= limit) {
        return {
          statusCode: 500,
          message: `The maximum number of concurrent scenario users (${limit}) has been reached.`,
        };
      }

      /* ---------------- VALIDATE EVENT LEARNER---------------- */
      const existing = await db.sequelize.query(
        `SELECT eventlearnerid, eventid, learner_id
       FROM event_learners
       WHERE eventlearnerid = :eventlearnerid
       LIMIT 1`,
        {
          replacements: { eventlearnerid: body.eventlearnerid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      console.log("existing", existing);
      if (!existing.length) {
        return {
          statusCode: 404,
          message: validation.messages.event_not_found,
        };
      }

      const { eventid, learner_id } = existing[0];
      const [eventData] = await db.sequelize.query(
        `SELECT scenarioid
       FROM events
       WHERE eventid = :eventid
       LIMIT 1`,
        {
          replacements: { eventid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      const scenarioid = eventData?.scenarioid || null;

      /* ---------------- INSERT INTO VM_REQUEST ---------------- */
      await db.sequelize.query(
        `INSERT INTO vm_request
       (vmrequestuuid,scenarioid, eventid, requestedby_id, requestedby_role,
        status, vm_steps, timer, startedon, createdon)
       VALUES
       (UUID(),?, ?, ?, 'Event',
        'Start', 'Initializing', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        {
          replacements: [scenarioid, eventid, learner_id, body.timer || null],
          type: db.sequelize.QueryTypes.INSERT,
        }
      );

      /* ---------------- GET VMREQUESTID ---------------- */
      const [vmResult] = await db.sequelize.query(
        `SELECT LAST_INSERT_ID() AS vmrequestid`,
        { type: db.sequelize.QueryTypes.SELECT }
      );

      const vmrequestid = vmResult.vmrequestid;

      /* ---------------- UPDATE EVENT_LEARNERS ---------------- */
      await db.sequelize.query(
        `
 UPDATE event_learners
  SET
    vmrequestid = ?,
    modifiedon = CURRENT_TIMESTAMP
  WHERE eventlearnerid = ?
  `,
        {
          replacements: [vmrequestid, body.eventlearnerid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      /* ---------------- LOG ---------------- */
      await insertLog(db, {
        vmrequestid,
        scenarioid,
        requestedby_id: learner_id,
        requestedby_role: "Event",
        status: "Start",
        remark: "Event VM started by learner",
      });

      return {
        statusCode: 200,
        message: validation.messages.event_updated,
        eventlearnerid: body.eventlearnerid,
        vmrequestid,
      };
    } catch (error) {
      console.error("Error in startEvent:", error);
      throw error;
    }
  };

async function insertLog(db, logData) {
  const logQuery = `
    INSERT INTO vm_request_logs
    (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const logParams = [
    logData.vmrequestid || null,
    logData.scenarioid,
    logData.requestedby_id || logData.learner_id,
    logData.requestedby_role || logData.type || "Learner",
    logData.status,
    logData.remark,
  ];

  await db.sequelize.query(logQuery, {
    replacements: logParams,
    type: db.sequelize.QueryTypes.INSERT,
  });
}

const updateEventLearnerStatus =
  ({ db, validation }) =>
  async ({
    status,
    eventlearnerid,
    vmrequestid,
    timer,
    scenarioid,
    learner_id,
  }) => {
    try {
      // Fetch missing details from DB
      
      const [existing] = await db.sequelize.query(
        `SELECT eventid, learner_id 
       FROM event_learners 
       WHERE eventlearnerid = ? LIMIT 1`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existing) {
        return {
          statusCode: 404,
          message: validation.messages.event_not_found,
        };
      }
      await db.sequelize.query(
        `
        UPDATE vm_request
        SET
          status = ?,
          modifiedon = CURRENT_TIMESTAMP,
          startedon   = CASE WHEN ? = 'Start' AND startedon IS NULL THEN CURRENT_TIMESTAMP ELSE startedon END,
          resumeon    = CASE WHEN ? = 'Resume' THEN CURRENT_TIMESTAMP ELSE resumeon END,
          completedon = CASE WHEN ? = 'Completed' THEN CURRENT_TIMESTAMP ELSE completedon END,
          terminatedon= CASE WHEN ? = 'Terminated' THEN CURRENT_TIMESTAMP ELSE terminatedon END,
          timer       = CASE WHEN ? IN ('Pause','Completed','Terminated') THEN ? ELSE timer END,
          isnotitermination = CASE WHEN ? IN ('Completed','Terminated') THEN 'No' ELSE isnotitermination END
        WHERE vmrequestid = ?
        `,
        {
          replacements: [
            status,
            status,
            status,
            status,
            status,
            status,
            timer,
            status,
            vmrequestid,
          ],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      await insertLog(db, {
        vmrequestid,
        scenarioid,
        requestedby_id: learner_id,
        requestedby_role: "Event",
        status: status,
        remark: `Event status changed to ${status} by learner`,
      });

      console.log("statusstatusstatusstatusstatus",status);
      
      if (status === "Pause") {
        await updateScenarioDiagram(db, vmrequestid);
      }

      if (status === "Resume") {
        await updateScenarioDiagramOnResume(db, vmrequestid);
      }

      return {
        statusCode: 200,
        message: validation.messages.event_updated,
        eventlearnerid,
      };
    } catch (error) {
      console.error("Error updating event learner status:", error);
      throw error;
    }
  };

async function updateScenarioDiagram(db, vmrequestid) {
  try {
    const [row] = await db.sequelize.query(
      `
      SELECT scenariodiagram
      FROM vm_request
      WHERE vmrequestid = ? LIMIT 1
      `,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    console.log("Insidedddddddddupdate");
    
    if (!row?.scenariodiagram) return;
    let diagram = JSON.parse(row.scenariodiagram);
    diagram.nodes?.forEach((n) => {
      if (n?.data?.isOnline) n.data.isOnline = "No";
    });
    diagram.edges?.forEach((e) => {
      if (e?.isAttacked) e.isAttacked = "No";
    });
    await db.sequelize.query(
      `
      UPDATE vm_request
      SET scenariodiagram = ?, modifiedon = NOW()
      WHERE vmrequestid = ?
      `,
      {
        replacements: [JSON.stringify(diagram), vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );
  } catch (err) {
    console.error("Error updating scenario diagram:", err);
  }
}

async function updateScenarioDiagramOnResume(db, vmrequestid) {
  try {
    const [row] = await db.sequelize.query(
      `
      SELECT scenariodiagram
      FROM vm_request
      WHERE vmrequestid = ? LIMIT 1
      `,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!row?.scenariodiagram) return;

    let diagram = JSON.parse(row.scenariodiagram);

    diagram.nodes?.forEach((n) => {
      if (n?.data?.isOnline) n.data.isOnline = "Yes";
    });

    diagram.edges?.forEach((e) => {
      if (e?.isAttacked) e.isAttacked = "Yes";
    });

    await db.sequelize.query(
      `
      UPDATE vm_request
      SET scenariodiagram = ?, modifiedon = NOW()
      WHERE vmrequestid = ?
      `,
      {
        replacements: [JSON.stringify(diagram), vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );
  } catch (err) {
    console.error("Error updating scenario diagram on resume:", err);
  }
}

const getEventStatus =
  ({ db }) =>
  async (vmrequestid) => {
    try {
      const [result] = await db.sequelize.query(
        `SELECT status, vm_steps FROM vm_request WHERE vmrequestid = ?`,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("getEventStatus DAO Error:", error);
      throw error;
    }
  };

const getLogs =
  ({ db, validation }) =>
  async (eventlearnerid) => {
    try {
      const result = await db.sequelize.query(
        `SELECT ell.eventlearnerid, ell.status, DATE_FORMAT(ell.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, ell.type, ell.remark, IFNULL(DATE_FORMAT(el.startedon, '%Y-%m-%d %H:%i:%s'), '') AS startedon FROM event_learner_logs ell INNER JOIN event_learners el ON el.eventlearnerid = ell.eventlearnerid WHERE ell.eventlearnerid = ? ORDER BY ell.createdon DESC`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return {
        statusCode: 200,
        message: validation.messages.event_logs_fetched,
        data: result,
      };
    } catch (error) {
      console.error("Error fetching logs by eventlearnerid:", error);
      throw error;
    }
  };

const canResumeScenario =
  ({ db, validation }) =>
  async (body ,user_count_limit) => {
    try {
      const { learner_id, vmrequestid } = body;

       /* ---------------- ACTIVE USER LIMIT ---------------- */
        const [activeUsersResult] = await db.sequelize.query(
          `SELECT COUNT(*) AS activeUsers
         FROM vm_request
         WHERE status IN ('Start','Resume')
         AND vm_steps = 'Running'`
        );

        const activeUsers = Number(activeUsersResult?.[0]?.activeUsers || 0);
        const limit = Number(user_count_limit || 0);

        if (limit > 0 && activeUsers >= limit) {
          return {
            statusCode: 500,
            message: `The maximum number of concurrent scenario users (${limit}) has been reached.`,
          };
        }

      const [activeScenario] = await db.sequelize.query(
        `
        SELECT scenarioid
        FROM vm_request
        WHERE requestedby_id = :learner_id
          AND requestedby_role = 'Learner'
          AND status IN ('Initializing', 'Running')
          AND vmrequestid != :vmrequestid
        LIMIT 1
        `,
        {
          replacements: { learner_id, vmrequestid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (activeScenario) {
        return {
          statusCode: 400,
          message:
            "Another scenario is already running. Please pause it before resuming this one.",
        };
      }

      return {
        statusCode: 200,
        message: "Resume allowed",
      };
    } catch (error) {
      console.error("Error in canResumeScenario DAO:", error.message);
      return {
        statusCode: 500,
        message: "Internal server error while checking scenario resume status",
      };
    }
  };

module.exports = {
  getAll,
  startEvent,
  updateEventLearnerStatus,
  getEventStatus,
  getLogs,
  canResumeScenario,
};
