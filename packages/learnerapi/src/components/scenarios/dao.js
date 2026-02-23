const getAll =
  ({ db }) =>
    async (learner_sessionid) => {
      try {
        let result = await db.sequelize.query(
          `SELECT
  s.scenariouuid,
  s.scenarioidentification,
  s.scenarioid,
  s.scenariotitle,
  s.scenariolevel,
  s.scenarioimage,
  s.duration,
  s.status,
  s.scenariostatus,

  vr.isnotitermination,
  vr.vmrequestid AS vmrequestid,
  vr.vmrequestuuid,

  sc.categoryname AS scenariocategory_name,
  sc.scenariocategoryid AS scenariocategoryid,
  sc.categoryimage AS category_image,

  scc.scenariocategoryid AS scenariosubcategoryid,
  scc.categoryname AS scenariosubcategory_name,
  scc.categoryimage AS subcategory_image,
  scc.parentscenariocategoryid AS parentscenariocategoryid

FROM scenarios s

INNER JOIN scenario_categories sc
  ON sc.scenariocategoryid = s.scenariocategoryid

LEFT JOIN scenario_categories scc
  ON scc.scenariocategoryid = s.scenariosubcategoryid

LEFT JOIN vm_request vr
  ON vr.scenarioid = s.scenarioid
  AND vr.requestedby_id = ?
  AND vr.requestedby_role = 'Learner'
  AND vr.status IN ('Running','Initializing','Pause','Resume','Start')

WHERE
  s.deletedon IS NULL
  AND s.scenariostatus = 'Publish'
  AND s.status = 'Active'
  AND s.scenario_type = 'Public'

ORDER BY
  CASE
    WHEN s.modifiedon IS NOT NULL THEN s.modifiedon
    ELSE s.createdon
  END DESC;
`,
          {
            replacements: [learner_sessionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        return result;
      } catch (error) {
        console.log("sceanrios err==>", error);
      }
    };

const getByID =
  ({ db }) =>
    async (scenarioUUID, learner_id) => {
      try {
        let result = await db.sequelize.query(
          `SELECT
            vr.vmrequestid,
            vr.requestedby_id,
            vr.scenariodiagram,
  s.scenarioid,
  s.scenariouuid,
  s.scenariotitle,
  s.scenarioidentification,
  s.scenariodescription,
  s.scenariolevel,
  s.components,
  s.instruction_file,
  s.component_config,
  sc.categoryname AS scenariocategory_name,
  ssc.categoryname AS scenariosubcategory_name,
  s.duration,
  s.manipulation_flag,
  vr.status,
  vr.vm_steps,
  vr.timer,
  vr.isnotitermination,
  vr.isedit,
  vr.edit_by,

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
  IFNULL(chat.unseen_instructor_admin_message_count, 0)
    AS unseen_instructor_admin_message_count
FROM scenarios s

INNER JOIN scenario_categories sc
  ON s.scenariocategoryid = sc.scenariocategoryid

INNER JOIN scenario_categories ssc
  ON s.scenariosubcategoryid = ssc.scenariocategoryid

LEFT JOIN vm_request vr
  ON vr.scenarioid = s.scenarioid
  AND vr.requestedby_id = ?
  AND vr.requestedby_role = 'Learner'
  AND vr.status IN (
  'Pending',
    'Running',
    'Initializing',
    'Pause',
    'Resume',
    'Start'
  )
        LEFT JOIN (
  SELECT
    scenarioid,
    learner_id,
    COUNT(*) AS unseen_instructor_admin_message_count
  FROM scenario_learner_chats
  WHERE status = 'sent'
    AND sender_type IN ('Instructor','Admin')
  GROUP BY scenarioid, learner_id
) chat
  ON chat.scenarioid = s.scenarioid
 AND chat.learner_id = ?
WHERE
  s.scenariouuid = ? 
  AND s.deletedon IS NULL
ORDER BY vr.modifiedon DESC
LIMIT 1;
`,
          {
            replacements: [learner_id, learner_id, scenarioUUID],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        console.log("resultresultresultresult", result)
        if (result.length === 0 || !result[0].vmrequestid) {
          result = await db.sequelize.query(
            `
          SELECT
            s.scenarioid,
            s.scenariouuid,
            s.scenariotitle,
            s.scenariodiagram,
            s.scenarioidentification,
            s.scenariodescription,
            s.scenariolevel,
            s.components,
            s.manipulation_flag,
            s.instruction_file,
            s.component_config,
            sc.categoryname AS scenariocategory_name,
            ssc.categoryname AS scenariosubcategory_name,
            s.duration,
            'Pending' AS status,
            'Pending' AS vm_steps,
            '00:00:00' AS timer,
            '00:00:00' AS calculated_timer
          FROM scenarios s
          INNER JOIN scenario_categories sc
            ON s.scenariocategoryid = sc.scenariocategoryid
          INNER JOIN scenario_categories ssc
            ON s.scenariosubcategoryid = ssc.scenariocategoryid
          WHERE s.scenariouuid = ?
            AND s.deletedon IS NULL;
          `,
            {
              replacements: [scenarioUUID],
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
        }

        if (!result[0]) return null;

        let components = JSON.parse(result[0].component_config || "[]");

        // Initialize totals
        result[0].component_count = components.length;
        result[0].virtual_cpu = 0;
        result[0].virtual_memory = 0;
        result[0].storage_size = 0;

        // Map componentId to component details (including image)
        const componentDetails = {};

        await Promise.all(
          components.map(async (element) => {
            try {
              if (element.componentid) {
                const [rowData] = await db.sequelize.query(
                  `SELECT cores, memory, storage, componentimage FROM components WHERE componentid = ?`,
                  {
                    replacements: [element.componentid],
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                );

                if (rowData) {
                  componentDetails[element.componentid] = rowData;

                  result[0].virtual_cpu += rowData.cores || 0;
                  result[0].virtual_memory += rowData.memory || 0;
                  result[0].storage_size += parseInt(rowData.storage) || 0;
                }
              }
            } catch (err) {
              console.error(
                `Error fetching componentid ${element.componentid}:`,
                err
              );
            }
          })
        );

        // Update scenariodiagram node images using component images
        if (result[0].scenariodiagram) {
          try {
            let diagramObj = JSON.parse(result[0].scenariodiagram);

            if (diagramObj.nodes && Array.isArray(diagramObj.nodes)) {
              diagramObj.nodes = diagramObj.nodes.map((node) => {
                // componentid key might be componentId or componentid depending on case
                const compId = node.data?.componentId || node.data?.componentid;

                if (compId && componentDetails[compId]) {
                  node.data.image =
                    componentDetails[compId].componentimage || node.data.image;
                }

                return node;
              });
            }

            result[0].scenariodiagram = JSON.stringify(diagramObj);
          } catch (err) {
            console.error("Error parsing or updating scenariodiagram JSON:", err);
          }
        }

        return result;
      } catch (error) {
        console.error("Error fetching scenario by ID:", error);
        throw error;
      }
    };

const getPauselimit = async (db) => {
  try {
    const settings = await db.sequelize.query(
      `SELECT pause_limit FROM web_settings WHERE status = 1 LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const pauseLimitValue =
      settings?.[0]?.pause_limit && Number.isFinite(settings[0].pause_limit)
        ? settings[0].pause_limit
        : 5;

    return pauseLimitValue;
  } catch (err) {
    console.error("Error fetching pause_limit:", err);
    return 5; // fallback to default
  }
};

const startScenario =
  ({ db, validation }) =>
    async (body, user_count_limit) => {
      try {
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

        /* ---------------- ONE ACTIVE SCENARIO PER LEARNER ---------------- */
        const [activeScenario] = await db.sequelize.query(
          `SELECT vmrequestid
         FROM vm_request
         WHERE requestedby_id = :learner_id
         AND requestedby_role = 'Learner'
         AND status IN ('Initializing','Running','Start','Resume')
         LIMIT 1`,
          {
            replacements: { learner_id: body.learner_id },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (activeScenario) {
          return {
            statusCode: 400,
            message: validation.messages.ONE_ACTIVE_SCENARIO,
          };
        }

        /* ---------------- PAUSE LIMIT ---------------- */
        const pauseLimit = await getPauselimit(db);

        const [pausedCountResult] = await db.sequelize.query(
          `SELECT COUNT(*) AS pausedCount
         FROM vm_request
         WHERE requestedby_id = :learner_id
         AND requestedby_role = 'Learner'
         AND status = 'Pause'`,
          {
            replacements: { learner_id: body.learner_id },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if ((pausedCountResult?.pausedCount || 0) >= pauseLimit) {
          return {
            statusCode: 400,
            message: `You have reached the maximum pause limit (${pauseLimit}).`,
          };
        }
        let vmrequestid;
        await db.sequelize.query(
          `INSERT INTO vm_request
           (vmrequestuuid,scenarioid, requestedby_id, requestedby_role, status, vm_steps, timer, startedon)
           VALUES (UUID(),?, ?, 'Learner', 'Initializing', 'Initializing', ?, CURRENT_TIMESTAMP)`,
          {
            replacements: [body.scenarioid, body.learner_id, body.timer],
            type: db.sequelize.QueryTypes.INSERT,
          }
        );

        const [idResult] = await db.sequelize.query(
          `SELECT LAST_INSERT_ID() AS vmrequestid`,
          { type: db.sequelize.QueryTypes.SELECT }
        );

        vmrequestid = idResult?.vmrequestid;

        /* ---------------- LOG ---------------- */
        await insertLog(db, {
          vmrequestid: vmrequestid,
          scenarioid: body.scenarioid,
          learner_id: body.learner_id,
          status: "Start",
          type: "Learner",
          remark: "Scenario started by SIMUser",
        });

        return {
          statusCode: 200,
          message: validation.messages.CONFIGURATION_STARTED,
          vmrequestid,
        };
      } catch (error) {
        console.error("startScenario error:", error);
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

const updateSessionStatus =
  ({ db, validation }) =>
    async (body) => {
      try {
        const { vmrequestid, scenarioid, learner_id, status, timer } = body;

        // 🧠 STEP 1: Block Resume if another VM is Running / Initializing
        if (status === "Resume") {
          const [activeVM] = await db.sequelize.query(
            `
          SELECT vmrequestid
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

          if (activeVM) {
            return {
              statusCode: 400,
              message:
                "You cannot resume this scenario while another scenario is running. Please pause the running scenario first.",
            };
          }
        }

        // 🧱 STEP 2: Update vm_request (single source of truth)
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

        // 🧱 STEP 3: Insert VM log
        await insertLog(db, {
          vmrequestid,
          scenarioid,
          requestedby_id: learner_id,
          requestedby_role: "Learner",
          status,
          remark: `Scenario status changed to ${status} by SIMUser`,
        });

        // 🧠 STEP 4: Update diagram based on state
        if (status === "Pause") {
          await updateScenarioDiagram(db, vmrequestid);
        }

        if (status === "Resume") {
          await updateScenarioDiagramOnResume(db, vmrequestid);
        }

        return {
          statusCode: 200,
          message: validation.messages.CONFIGURATION_STARTED,
          vmrequestid,
        };
      } catch (error) {
        console.error("Error updating VM request status:", error);
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

const getSessionStatus =
  ({ db }) =>
    async (vmrequestid) => {
      try {
        const [result] = await db.sequelize.query(
          `SELECT vm_steps FROM vm_request WHERE vmrequestid = ?`,
          {
            replacements: [vmrequestid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        return result;
      } catch (error) {
        console.error("getSessionStatus DAO Error:", error);
        throw error;
      }
    };

// pending
const getMessagesByScenario =
  ({ db, validation }) =>
    async ({ scenariolearnerid }) => {
      if (!scenariolearnerid) {
        throw new Error(validation.messages.MISSING_SCENARIOLEARNERID);
      }
      try {
        const result = await db.sequelize.query(
          `SELECT *, CASE WHEN DATE(createdon) = CURDATE() THEN CONCAT('Today at ', DATE_FORMAT(createdon, '%l:%i %p')) WHEN DATE(createdon) = CURDATE() - INTERVAL 1 DAY THEN CONCAT('Yesterday at ', DATE_FORMAT(createdon, '%l:%i %p')) ELSE DATE_FORMAT(createdon, '%b %e, %Y %l:%i %p') END AS formatted_time FROM scenario_learner_chats WHERE scenariolearnerid = ? ORDER BY createdon ASC`,
          {
            replacements: [scenariolearnerid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        await db.sequelize.query(
          `UPDATE scenario_learner_chats SET status = 'seen' WHERE scenariolearnerid = ? AND sender_type IN ('Admin', 'Instructor') AND status = 'sent'`,
          {
            replacements: [scenariolearnerid],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
        return result;
      } catch (error) {
        console.error("Error fetching or updating messages:", error);
        throw new Error(validation.messages.INTERNAL_SERVER_ERROR);
      }
    };

const sendMessage =
  ({ db, validation }) =>
    async (body, sender_id) => {
      try {
        const {
          scenariolearnerid,
          scenarioid,
          learner_id,
          instructor_id,
          sender_type,
          message,
          attachment = null,
        } = body;
        await db.sequelize.query(
          `INSERT INTO scenario_learner_chats (scenariolearnerid,scenarioid, learner_id, instructor_id,sender_type, message, attachment, status, createdon) VALUES (?,?, ?, ?, ?, ?, ?, 'sent', CURRENT_TIMESTAMP)`,
          {
            replacements: [
              scenariolearnerid,
              scenarioid,
              learner_id,
              instructor_id,
              sender_type,
              message,
              attachment,
            ],
            type: db.sequelize.QueryTypes.INSERT,
          }
        );
        const [result] = await db.sequelize.query(
          `SELECT * FROM scenario_learner_chats WHERE scenariolearnerchatid = LAST_INSERT_ID()`,
          { type: db.sequelize.QueryTypes.SELECT }
        );
        return {
          statusCode: 200,
          message: validation.messages.MESSAGE_SENT,
          data: result,
        };
      } catch (error) {
        console.error("Error:", error.message);
        return { statusCode: 500, message: "Internal Server Error" };
      }
    };

const markMessagesSeen =
  ({ db }) =>
    async ({ scenarioid, learner_id, instructor_id, viewer_type }) => {
      try {
        const oppositeSenderType =
          viewer_type === "learner" ? "Instructor" : "Learner";
        const [result] = await db.sequelize.query(
          `UPDATE scenario_learner_chats SET status = 'seen' WHERE scenarioid = ? AND learner_id = ? AND instructor_id = ? AND sender_type = ? AND status != 'seen'`,
          {
            replacements: [
              scenarioid,
              learner_id,
              instructor_id,
              oppositeSenderType,
            ],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
        return result;
      } catch (error) {
        console.error("Error:", error.message);
        return { statusCode: 500, message: "Internal Server Error" };
      }
    };
const getLogs =
  ({ db }) =>
    async (scenariouuid, learner_id) => {
      try {
        const result = await db.sequelize.query(
          `
        SELECT
          vrl.status,
          DATE_FORMAT(vrl.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
          vrl.requestedby_role AS type,
          vrl.remark,
          IFNULL(
            DATE_FORMAT(vr.startedon, '%Y-%m-%d %H:%i:%s'),
            ''
          ) AS startedon
        FROM vm_request_logs vrl
        INNER JOIN vm_request vr
          ON vr.vmrequestid = vrl.vmrequestid
        INNER JOIN scenarios s
          ON s.scenarioid = vrl.scenarioid
        WHERE s.scenariouuid = ?
          AND vrl.requestedby_id = ?
        ORDER BY vrl.createdon DESC
        `,
          {
            replacements: [scenariouuid, learner_id],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        return result;
      } catch (error) {
        console.error("Error fetching VM scenario logs:", error);
        throw error;
      }
    };

const getTabList =
  ({ db }) =>
    async () => {
      try {
        const [res] = await db.sequelize.query(`SELECT 
        scenariotabid,
        tab_name,
        tab_status,
        event_status,
        tab_type,
        widget_url,
        tab_ordering,
        createdon,
        modifiedon
      FROM scenario_tabs`);
        return res;
      } catch (error) {
        console.error("Error fetching scenario tab list:", error);
        throw error;
      }
    };

const getPaused =
  ({ db }) =>
    async (learner_id) => {
      try {
        const result = await db.sequelize.query(
          `
        SELECT 
          vr.vmrequestid,
          vr.scenarioid,
          vr.requestedby_id AS learner_id,
          vr.status,
          vr.createdon,
          vr.modifiedon,
          s.scenariotitle AS scenario_name,
          s.scenariouuid,
          s.scenarioimage
        FROM vm_request vr
        INNER JOIN scenarios s 
          ON s.scenarioid = vr.scenarioid
        WHERE 
          vr.requestedby_id = ?
          AND vr.requestedby_role = 'Learner'
          AND vr.status IN ('Pause', 'Running')
        ORDER BY 
          CASE 
            WHEN vr.modifiedon IS NOT NULL THEN vr.modifiedon
            ELSE vr.createdon
          END DESC
        `,
          {
            replacements: [learner_id],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        return result || [];
      } catch (error) {
        console.error("Error in dao.getPaused:", error);
        throw error;
      }
    };

const canResumeScenario =
  ({ db, validation }) =>
    async (body, user_count_limit) => {
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
          AND status IN ('Initializing', 'Running','Start','Resume')
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

  //   const changeEditStatus =
  // ({ db }) =>
  // async (body) => {
  //   try {
  //     const { vmrequestid } = body;
  //     const [row] = await db.sequelize.query( `SELECT isedit FROM vm_request WHERE vmrequestid=? LIMIT 1`,
  //       {
  //         replacements: [vmrequestid],
  //         type: db.sequelize.QueryTypes.SELECT,
  //       }
  //     );

  //     if (!row) { return { statusCode: 404, message: "VM Request not found", }; }
  //     if (row.isedit === "true") { return { statusCode: 400, message: "Someone is already editing this scenario. You cannot edit now.", data: { locked: true }, }; }
  //     await db.sequelize.query(
  //       `UPDATE vm_request 
  //        SET isedit='true', modifiedon=CURRENT_TIMESTAMP 
  //        WHERE vmrequestid=?`,
  //       {
  //         replacements: [vmrequestid],
  //         type: db.sequelize.QueryTypes.UPDATE,
  //       }
  //     );

  //     return {
  //       statusCode: 200,
  //       message: "Edit lock acquired",
  //       data: { locked: false },
  //     };
  //   } catch (error) {
  //     console.error("DAO changeEditStatus error:", error);
  //     throw error;
  //   }
  // };

const changeEditStatus =
  ({ db }) =>
  async (body, loginId) => {
    const { vmrequestid } = body;

    const [row] = await db.sequelize.query(
      `SELECT isedit, edit_by 
       FROM vm_request 
       WHERE vmrequestid=? 
       LIMIT 1`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!row) {
      return { statusCode: 404, message: "Not found" };
    }
    if (
      row.isedit === "true" &&
      row.edit_by &&
      row.edit_by !== loginId
    ) {
      return {
        statusCode: 400,
        message: "Someone else is editing this scenario",
        data: { locked: true },
      };
    }

    await db.sequelize.query(
      `UPDATE vm_request
       SET isedit='true',
           edit_by=?,
           modifiedon=CURRENT_TIMESTAMP
       WHERE vmrequestid=?`,
      {
        replacements: [loginId, vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return {
      statusCode: 200,
      message: "Edit lock acquired",
      data: { locked: false },
    };
  };


const releaseEditLock =
  ({ db }) =>
  async (body) => {
    const { vmrequestid } = body;
    await db.sequelize.query(
      `UPDATE vm_request 
       SET isedit='false' 
       WHERE vmrequestid=?`,
      {
        replacements: [vmrequestid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return {
      statusCode: 200,
      message: "Edit lock released",
    };
  };


module.exports = {
  getAll,
  getByID,
  startScenario,
  getMessagesByScenario,
  sendMessage,
  markMessagesSeen,
  updateSessionStatus,
  getSessionStatus,
  getLogs,
  getTabList,
  getPaused,
  canResumeScenario,
  changeEditStatus,
  releaseEditLock

};
