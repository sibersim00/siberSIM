const getAll =
  ({ db }) =>
  async (user_id) => {
    try {
      let result = await db.sequelize.query(
        `
          SELECT 
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
            vr.vmrequestid AS scenariolearnersessionid,

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
           AND vr.requestedby_role = 'Admin'

          WHERE 
            s.deletedon IS NULL
            AND s.scenariostatus = 'Publish'
            AND s.status = 'Active'
            AND s.scenario_type = 'Public'

          ORDER BY 
            CASE 
              WHEN s.modifiedon IS NOT NULL 
              THEN s.modifiedon 
              ELSE s.createdon 
            END DESC;
          `,
        {
          replacements: [user_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      return result;
    } catch (error) {
      console.log("admin scenarios err==>", error);
      throw error;
    }
  };

// const getByID =
//   ({ db }) =>
//     async (scenarioUUID, learner_id) => {
//       try {
//         let result = await db.sequelize.query(
//           `SELECT sl.scenariolearnerid, sls.scenariolearnersessionid, sls.scenariolearnersessionuuid,
//               COALESCE(sls.scenariodiagram, s.scenariodiagram) AS scenariodiagram,
//               s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenarioidentification, s.scenariodescription,
//               s.scenariolevel, s.instruction_file, s.component_config, sc.categoryname AS scenariocategory_name,
//               ssc.categoryname AS scenariosubcategory_name, s.duration, sls.status, sls.vm_steps, sls.timer,
//               sls.isnotitermination,
//               CASE
//                 WHEN sls.status = 'Start' THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, sls.startedon, NOW()))
//                 WHEN sls.status = 'Resume' AND sls.resumeon IS NOT NULL THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, sls.resumeon, NOW()) + TIME_TO_SEC(sls.timer))
//                 ELSE sls.timer
//               END AS calculated_timer,
//               IFNULL(chat_instructor_admin.unseen_instructor_admin_message_count, 0) AS unseen_instructor_admin_message_count
//        FROM scenario_learner sl
//        INNER JOIN scenarios s ON s.scenarioid = sl.scenarioid
//        INNER JOIN scenario_categories sc ON s.scenariocategoryid = sc.scenariocategoryid
//        INNER JOIN scenario_categories ssc ON s.scenariosubcategoryid = ssc.scenariocategoryid
//        LEFT JOIN scenario_learner_session sls ON sls.scenariolearnersessionid = sl.currentsession_id
//        LEFT JOIN (
//          SELECT slc.scenariolearnerid, COUNT(*) AS unseen_instructor_admin_message_count
//          FROM scenario_learner_chats slc
//          INNER JOIN scenario_learner sl2 ON slc.scenariolearnerid = sl2.scenariolearnerid
//          WHERE slc.status = 'sent' AND slc.sender_type IN ('Instructor', 'Admin') AND sl2.learner_id = ?
//          GROUP BY slc.scenariolearnerid
//        ) AS chat_instructor_admin ON chat_instructor_admin.scenariolearnerid = sl.scenariolearnerid
//        WHERE s.scenariouuid = ? AND sl.learner_id = ? AND s.deletedon IS NULL
//        ORDER BY s.scenarioid DESC;`,
//           {
//             replacements: [learner_id, scenarioUUID, learner_id],
//             type: db.sequelize.QueryTypes.SELECT,
//           }
//         );

//         if (result.length === 0) {
//           result = await db.sequelize.query(
//             `SELECT s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenariodiagram, s.scenarioidentification,
//                 s.scenariodescription, s.scenariolevel, s.instruction_file, s.component_config, sc.categoryname AS scenariocategory_name,
//                 ssc.categoryname AS scenariosubcategory_name, s.duration, 'Pending' as status
//          FROM scenarios s
//          INNER JOIN scenario_categories sc ON s.scenariocategoryid = sc.scenariocategoryid
//          INNER JOIN scenario_categories ssc ON s.scenariosubcategoryid = ssc.scenariocategoryid
//          WHERE s.scenariouuid = ? AND s.deletedon IS NULL
//          ORDER BY s.scenarioid DESC;`,
//             {
//               replacements: [scenarioUUID],
//               type: db.sequelize.QueryTypes.SELECT,
//             }
//           );
//         }

//         if (!result[0]) return null;

//         let components = JSON.parse(result[0].component_config || "[]");

//         // Initialize totals
//         result[0].component_count = components.length;
//         result[0].virtual_cpu = 0;
//         result[0].virtual_memory = 0;
//         result[0].storage_size = 0;

//         // Map componentId to component details (including image)
//         const componentDetails = {};

//         await Promise.all(
//           components.map(async (element) => {
//             try {
//               if (element.componentid) {
//                 const [rowData] = await db.sequelize.query(
//                   `SELECT cores, memory, storage, componentimage FROM components WHERE componentid = ?`,
//                   {
//                     replacements: [element.componentid],
//                     type: db.sequelize.QueryTypes.SELECT,
//                   }
//                 );

//                 if (rowData) {
//                   componentDetails[element.componentid] = rowData;

//                   result[0].virtual_cpu += rowData.cores || 0;
//                   result[0].virtual_memory += rowData.memory || 0;
//                   result[0].storage_size += parseInt(rowData.storage) || 0;
//                 }
//               }
//             } catch (err) {
//               console.error(
//                 `Error fetching componentid ${element.componentid}:`,
//                 err
//               );
//             }
//           })
//         );

//         // Update scenariodiagram node images using component images
//         if (result[0].scenariodiagram) {
//           try {
//             let diagramObj = JSON.parse(result[0].scenariodiagram);

//             if (diagramObj.nodes && Array.isArray(diagramObj.nodes)) {
//               diagramObj.nodes = diagramObj.nodes.map((node) => {
//                 // componentid key might be componentId or componentid depending on case
//                 const compId = node.data?.componentId || node.data?.componentid;

//                 if (compId && componentDetails[compId]) {
//                   node.data.image =
//                     componentDetails[compId].componentimage || node.data.image;
//                 }

//                 return node;
//               });
//             }

//             result[0].scenariodiagram = JSON.stringify(diagramObj);
//           } catch (err) {
//             console.error("Error parsing or updating scenariodiagram JSON:", err);
//           }
//         }

//         return result;
//       } catch (error) {
//         console.error("Error fetching scenario by ID:", error);
//         throw error;
//       }
//     };

const getByID =
  ({ db }) =>
  async (scenarioUUID, requestedby_id) => {
    try {
      let result = await db.sequelize.query(
        `
       SELECT
  vr.vmrequestid,
  vr.status,
  vr.vm_steps,
  vr.timer,
  vr.isnotitermination,
  vr.network_bridges,
  COALESCE(vr.scenariodiagram, s.scenariodiagram) AS scenariodiagram,
  s.scenarioid,
  s.scenariouuid,
  s.scenariotitle,
  s.scenarioidentification,
  s.scenariodescription,
  s.scenariolevel,
  s.instruction_file,
  s.component_config,
  s.duration,
  sc.categoryname  AS scenariocategory_name,
  ssc.categoryname AS scenariosubcategory_name,
   CASE
                WHEN vr.status = 'Start' THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, vr.startedon, NOW()))
                WHEN vr.status = 'Resume' AND vr.resumeon IS NOT NULL THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, vr.resumeon, NOW()) + TIME_TO_SEC(vr.timer))
                ELSE vr.timer
              END AS calculated_timer
FROM scenarios s
INNER JOIN scenario_categories sc
  ON sc.scenariocategoryid = s.scenariocategoryid
INNER JOIN scenario_categories ssc
  ON ssc.scenariocategoryid = s.scenariosubcategoryid
/* ✅ Latest vm_request per scenario per user */
LEFT JOIN vm_request vr
  ON vr.vmrequestid = (
    SELECT v2.vmrequestid
    FROM vm_request v2
    WHERE v2.scenarioid = s.scenarioid
      AND v2.requestedby_id = ?
    ORDER BY v2.vmrequestid DESC
    LIMIT 1
  )
WHERE s.scenariouuid = ?
  AND s.deletedon IS NULL
ORDER BY s.scenarioid DESC;
        `,
        {
          replacements: [requestedby_id, scenarioUUID],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      /* ---------- fallback if no vm_request ---------- */
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

      /* ---------- component aggregation (same as old code) ---------- */
      let components = JSON.parse(result[0].component_config || "[]");

      result[0].component_count = components.length;
      result[0].virtual_cpu = 0;
      result[0].virtual_memory = 0;
      result[0].storage_size = 0;

      const componentDetails = {};

      await Promise.all(
        components.map(async (element) => {
          if (!element.componentid) return;

          const [rowData] = await db.sequelize.query(
            `
            SELECT cores, memory, storage, componentimage
            FROM components
            WHERE componentid = ?
            `,
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
        })
      );

      /* ---------- update diagram images ---------- */
      if (result[0].scenariodiagram) {
        try {
          let diagramObj = JSON.parse(result[0].scenariodiagram);

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

          result[0].scenariodiagram = JSON.stringify(diagramObj);
        } catch (err) {
          console.error("Diagram parse/update error:", err);
        }
      }

      return result;
    } catch (error) {
      console.error("Error fetching scenario by ID:", error);
      throw error;
    }
  };

const { v4: uuidv4 } = require("uuid");

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
  async (body) => {
    try {
      const {
        scenarioid,
        requestedby_id,
        requestedby_role,
        status,
        vm_steps,
        timer,
        // scenariodiagram,
        network_bridges,
        isnotitermination,
      } = body;
      if (!requestedby_id || !requestedby_role) {
        return {
          statusCode: 400,
          message: "Invalid user context",
        };
      }
      const pauseLimit = await getPauselimit(db);
      const [activeVM] = await db.sequelize.query(
        `
        SELECT vmrequestid, status
        FROM vm_request
        WHERE requestedby_id = :requestedby_id
          AND requestedby_role = :requestedby_role
          AND status IN ('Resume','Initializing', 'Running','start')
        LIMIT 1
        `,
        {
          replacements: { requestedby_id, requestedby_role },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (activeVM) {
        return {
          statusCode: 400,
          message: validation.messages.ONE_ACTIVE_SCENARIO,
        };
      }

      // Pause count check
      const [pausedCountResult] = await db.sequelize.query(
        `
        SELECT COUNT(*) AS pausedCount
        FROM vm_request
        WHERE requestedby_id = :requestedby_id
          AND requestedby_role = :requestedby_role
          AND status = 'Pause'
        `,
        {
          replacements: { requestedby_id, requestedby_role },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      const pausedCount = pausedCountResult?.pausedCount || 0;

      if (pausedCount >= pauseLimit) {
        return {
          statusCode: 400,
          message: `You have reached the maximum pause limit (${pauseLimit}). Please Terminate or complete a scenario before starting a new one.`,
        };
      }

      // Insert vm_request
      await db.sequelize.query(
        `
        INSERT INTO vm_request
        (
          scenarioid,
          requestedby_id,
          requestedby_role,
          status,
          vm_steps,
          timer,
          network_bridges,
          isnotitermination
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        {
          replacements: [
            scenarioid,
            requestedby_id,
            requestedby_role,
            status,
            vm_steps,
            timer,
            // scenariodiagram,
            network_bridges,
            isnotitermination,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        }
      );

      // Get ID
      const [vmResult] = await db.sequelize.query(
        `SELECT LAST_INSERT_ID() AS vmrequestid`,
        { type: db.sequelize.QueryTypes.SELECT }
      );

      const vmrequestid = vmResult?.vmrequestid;

      // Log entry
      await insertLog(db, {
        vmrequestid,
        scenarioid,
        requestedby_id,
        requestedby_role,
        status:"Start",
        remark: "Scenario started",
      });

      return {
        statusCode: 200,
        message: validation.messages.CONFIGURATION_STARTED,
        vmrequestid,
      };
    } catch (error) {
      console.error("Error in startScenario DAO:", error);
      throw error;
    }
  };

async function insertLog(db, logData) {
  const logQuery = `INSERT INTO vm_request_logs (vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon) VALUES (?, ?, ?, ?, ?, ?, NOW())`;

  const logParams = [
    logData.vmrequestid,
    logData.scenarioid,
    logData.requestedby_id,
    logData.requestedby_role,
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
      // STEP 1: Block Resume if another VM is Running/Initializing
      if (body.status === "Resume") {
        const [activeVM] = await db.sequelize.query(
          `SELECT vmrequestid
           FROM vm_request
           WHERE requestedby_id = :requestedby_id
             AND requestedby_role = :requestedby_role
             AND status IN ('Initializing', 'Running','Start','Resume')
             AND vmrequestid != :current_vmrequestid
           LIMIT 1`,
          {
            replacements: {
              requestedby_id: body.requestedby_id,
              requestedby_role: body.requestedby_role,
              current_vmrequestid: body.vmrequestid,
            },
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
      //STEP 2: Update vm_request table (same as scenario_learner_session)
      await db.sequelize.query(
        `UPDATE vm_request
SET
  status = ?,
  modifiedon = CURRENT_TIMESTAMP,

  terminatedon =
    CASE WHEN ? = 'Terminated'
      THEN CURRENT_TIMESTAMP
      ELSE terminatedon
    END,

  completedon =
    CASE WHEN ? = 'Completed'
      THEN CURRENT_TIMESTAMP
      ELSE completedon
    END,

  startedon =
    CASE
      WHEN ? IN ('Start', 'Resume') AND startedon IS NULL
      THEN CURRENT_TIMESTAMP
      ELSE startedon
    END,
    resumeon = CASE WHEN ? = 'Resume' THEN CURRENT_TIMESTAMP ELSE resumeon END, 

  timer =
    CASE
      WHEN ? IN ('Pause', 'Completed', 'Terminated')
      THEN ?
      ELSE timer
    END,

  isnotitermination =
    CASE
      WHEN ? IN ('Completed', 'Terminated')
      THEN 'No'
      ELSE isnotitermination
    END

WHERE vmrequestid = ?;
`,
        {
          replacements: [
            body.status, // status
            body.status, // terminatedon
            body.status, // completedon
            body.status, // startedon (Start/Resume)
            body.status, // timer condition
            body.status,
            body.timer, // timer value
            body.status, // isnotitermination
            body.vmrequestid,
          ],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      //STEP 3: Log the action (unchanged conceptually)
      await insertLog(db, {
        scenarioid: body.scenarioid,
        requestedby_id: body.requestedby_id,
        requestedby_role: body.requestedby_role,
        status: body.status,
        vmrequestid: body.vmrequestid,
        type: "VM",
        remark: `VM status changed to ${body.status} by SIMUser`,
      });

      //  STEP 4: Pause / Resume diagram handling (SAME FLOW)
      if (body.status === "Pause") {
        await updateScenarioDiagram(db, body.vmrequestid);
      }

      if (body.status === "Resume") {
        await updateScenarioDiagramOnResume(db, body.vmrequestid);
      }

      return {
        statusCode: 200,
        message: validation.messages.CONFIGURATION_STARTED,
        vmrequestid: body.vmrequestid,
      };
    } catch (error) {
      console.error("Error updating vm_request:", error);
      throw error;
    }
  };

async function updateScenarioDiagram(db, vmrequestid) {
  try {
    const [diagramRow] = await db.sequelize.query(
      `SELECT scenariodiagram
       FROM vm_request
       WHERE vmrequestid = ?
       LIMIT 1`,
      {
        replacements: [vmrequestid],
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
        `UPDATE vm_request
         SET scenariodiagram = ?, modifiedon = NOW()
         WHERE vmrequestid = ?`,
        {
          replacements: [JSON.stringify(scenariodiagram), vmrequestid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
    }
  } catch (err) {
    console.error("Error updating VM scenario diagram:", err);
  }
}

async function updateScenarioDiagramOnResume(db, vmrequestid) {
  try {
    const [diagramRow] = await db.sequelize.query(
      `SELECT scenariodiagram
       FROM vm_request
       WHERE vmrequestid = ?
       LIMIT 1`,
      {
        replacements: [vmrequestid],
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
        `UPDATE vm_request
         SET scenariodiagram = ?, modifiedon = NOW()
         WHERE vmrequestid = ?`,
        {
          replacements: [JSON.stringify(scenariodiagram), vmrequestid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
    }
  } catch (err) {
    console.error("Error updating VM scenario diagram on resume:", err);
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
      let result = await db.sequelize.query(
        `SELECT sll.status, DATE_FORMAT(sll.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, sll.type, sll.remark, IFNULL(DATE_FORMAT(sls.startedon, '%Y-%m-%d %H:%i:%s'), '') AS startedon FROM scenario_learner_logs sll INNER JOIN scenarios s ON s.scenarioid = sll.scenarioid INNER JOIN scenario_learner_session sls ON sls.scenariolearnersessionid = sll.scenariolearnersessionid WHERE s.scenariouuid = ? AND sll.learner_id = ? ORDER BY sll.createdon DESC;`,
        {
          replacements: [scenariouuid, learner_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error fetching scenario logs:", error);
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

// dao.js (partial)

const getPaused =
  ({ db }) =>
  async (learner_id) => {
    try {
      const result = await db.sequelize.query(
        `SELECT 
           sl.scenariolearnerid,
           sl.scenarioid,
           sl.learner_id,
           sl.instructor_id,
           sl.currentsession_id,
           sl.status,
           sl.createdon,
           sl.modifiedon,
           s.scenariotitle AS scenario_name,
           s.scenariouuid
         FROM scenario_learner sl
         LEFT JOIN scenarios s ON s.scenarioid = sl.scenarioid
         WHERE sl.learner_id = ?
           AND sl.status = 'Pause'
         ORDER BY 
           CASE 
             WHEN sl.modifiedon IS NOT NULL THEN sl.modifiedon 
             ELSE sl.createdon 
           END DESC`,
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
};
