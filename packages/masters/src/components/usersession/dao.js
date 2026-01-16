// const listScenarios =
//   ({ db }) =>
//   async (usertype, session_userid) => {
//     let condition = `sl.status IN ('Initializing', 'Running','Pause')`;
//     if (usertype === "Instructor") {
//       condition += ` AND sl.instructor_id = :session_userid`;
//     }

//     const query = `
//     SELECT
//       sl.scenariolearnerid,
//       sl.scenariolearneruuid,
//       s.scenariotitle,
//       s.scenario_type,
//       sl.learner_id,
//       sl.instructor_id,
//       sl.scenarioid,
//       sl.currentsession_id,
//       sl.status AS scenario_learner_status,
//       CONCAT(l.firstname, ' ', l.lastname) AS learner_name,
//       CONCAT(inst.firstname, ' ', inst.lastname) AS instructor_name,
//       sls.status AS session_status,
//       sls.startedon,
//       sls.terminatedon,
//       sls.completedon,
//       sls.failedon,
//       sls.isnotitermination,
//       sls.vm_steps AS vm_step_status,
//       l.profile,
//       IFNULL(chat.unseen_message_count, 0) AS unseen_message_count
//     FROM scenario_learner sl
//     JOIN scenarios s ON s.scenarioid = sl.scenarioid
//     JOIN scenario_learner_session sls ON sls.scenariolearnersessionid = sl.currentsession_id
//     JOIN learners l ON l.learner_id = sl.learner_id
//     LEFT JOIN ad_users inst ON inst.userid = sl.instructor_id
//     LEFT JOIN (
//       SELECT scenariolearnerid, COUNT(*) AS unseen_message_count
//       FROM scenario_learner_chats
//       WHERE status = 'sent'
//       GROUP BY scenariolearnerid
//     ) AS chat ON chat.scenariolearnerid = sl.scenariolearnerid

//     WHERE ${condition}
//     ORDER BY sls.startedon DESC
//   `;

//     try {
//       const res = await db.sequelize.query(query, {
//         replacements: { session_userid },
//         type: db.sequelize.QueryTypes.SELECT,
//       });

//       return res;
//     } catch (error) {
//       console.error("Error fetching scenarios:", error.message);
//       throw error;
//     }
//   };

const listScenarios =
  ({ db }) =>
  async (usertype, session_userid) => {
    let condition = `vr.status IN ('Running', 'Pause','Start','Resume')`;

    if (usertype === "Instructor") {
      condition += ` AND vr.requestedby_role = 'Instructor'
                     AND vr.requestedby_id = :session_userid`;
    }

    const query = `
      SELECT                                           
        vr.vmrequestid,
        vr.vmrequestuuid,
        s.scenariotitle,
        s.scenario_type,
        vr.requestedby_id AS learner_id,
        CASE 
          WHEN vr.requestedby_role = 'Instructor' THEN vr.requestedby_id
          ELSE NULL
        END AS instructor_id,
        vr.scenarioid,
        vr.requestedby_role,
        vr.status AS scenario_status,
        vr.vm_steps AS vm_step_status,
        vr.startedon,
        vr.completedon,
        vr.terminatedon,
        vr.failedon,
        vr.isnotitermination,
        CONCAT(l.firstname, ' ', l.lastname) AS learner_name,
        CONCAT(inst.firstname, ' ', inst.lastname) AS instructor_name,
        l.profile,

        IFNULL(chat.unseen_message_count, 0) AS unseen_message_count

      FROM vm_request vr
      INNER JOIN scenarios s ON s.scenarioid = vr.scenarioid
      AND vr.requestedby_role != 'Admin' 

      LEFT JOIN learners l 
        ON l.learner_id = vr.requestedby_id
       AND vr.requestedby_role = 'Learner'

      LEFT JOIN ad_users inst 
        ON inst.userid = vr.requestedby_id
       AND vr.requestedby_role = 'Instructor'

      -- REPLACED CHAT JOIN (logic unchanged)
      LEFT JOIN (
        SELECT
          scenarioid,
          learner_id,
          COUNT(*) AS unseen_message_count
        FROM scenario_learner_chats
        WHERE status = 'sent'
          AND sender_type = 'Learner'
        GROUP BY scenarioid, learner_id
      ) chat
        ON chat.scenarioid = vr.scenarioid
       AND chat.learner_id = vr.requestedby_id

      WHERE ${condition}
      ORDER BY vr.startedon DESC
    `;

    try {
      const res = await db.sequelize.query(query, {
        replacements: { session_userid },
        type: db.sequelize.QueryTypes.SELECT,
      });

      return res;
    } catch (error) {
      console.error("Error fetching scenarios:", error.message);
      throw error;
    }
  };

// const getUserSessionById =
//   ({ db }) =>
//   async (scenariolearneruuid) => {
//     const query = `
//   SELECT
//     sl.scenariolearnerid,
//     sl.scenariolearneruuid,
//     sls.scenariolearnersessionid,
//     sls.scenariolearnersessionuuid,
//     sls.scenariodiagram,
//     s.scenarioid,
//     s.scenariouuid,
//     s.scenariotitle,
//     s.scenarioidentification,
//     s.scenariodescription,
//     s.scenariolevel,
//     s.instruction_file,
//     s.component_config,
//     s.components,
//     sc.categoryname AS scenariocategory_name,
//     ssc.categoryname AS scenariosubcategory_name,
//     s.duration,
//     sls.isnotitermination,
//     sls.status,
//     sl.learner_id,
//     l.firstname,
//     l.lastname,
//     l.email,
//     l.mobile,
//     IFNULL(chat.unseen_message_count, 0) AS unseen_message_count
//   FROM scenario_learner sl
//   INNER JOIN scenarios s ON s.scenarioid = sl.scenarioid
//   INNER JOIN scenario_categories sc ON s.scenariocategoryid = sc.scenariocategoryid
//   INNER JOIN scenario_categories ssc ON s.scenariosubcategoryid = ssc.scenariocategoryid
//   LEFT JOIN scenario_learner_session sls ON sls.scenariolearnersessionid = sl.currentsession_id
//   LEFT JOIN learners l ON l.learner_id = sl.learner_id
//   LEFT JOIN (
//     SELECT scenariolearnerid, COUNT(*) AS unseen_message_count
//     FROM scenario_learner_chats
//     WHERE status = 'sent' AND sender_type = 'Learner'
//     GROUP BY scenariolearnerid
//   ) AS chat ON chat.scenariolearnerid = sl.scenariolearnerid

//   WHERE sl.scenariolearneruuid = ?
//     AND s.deletedon IS NULL

//   ORDER BY s.scenariotitle ASC
// `;

//     try {
//       const result = await db.sequelize.query(query, {
//         replacements: [scenariolearneruuid],
//         type: db.sequelize.QueryTypes.SELECT,
//       });

//       let components = JSON.parse(result[0].component_config);
//       result[0].component_count = components.length;
//       result[0].virtual_cpu = 0;
//       result[0].virtual_memory = 0;
//       result[0].storage_size = 0;
//       result[0].component_images = [];
//       const componentDetails = {};
//       // Use Promise.all to handle asynchronous loop
//       await Promise.all(
//         components.map(async (element) => {
//           try {
//             if (element.componentid) {
//               let [rowData] = await db.sequelize.query(
//                 `SELECT cores, memory, storage, componentimage
//                  FROM components
//                  WHERE componentid = ?`,
//                 {
//                   replacements: [element.componentid],
//                   type: db.sequelize.QueryTypes.SELECT,
//                 }
//               );

//               if (rowData) {
//                 console.log("dddddddddddddddddd");

//                 componentDetails[element.componentid] = rowData;

//                 result[0].virtual_cpu += rowData.cores || 0;
//                 result[0].virtual_memory += rowData.memory || 0;
//                 result[0].storage_size += parseInt(rowData.storage) || 0;

//                 if (rowData.componentimage) {
//                   result[0].component_images.push(rowData.componentimage);
//                 }
//               }
//             }
//           } catch (err) {
//             console.error(
//               `Error fetching componentid ${element.componentid}:`,
//               err
//             );
//           }
//         })
//       );
//       if (result[0].scenariodiagram) {
//         try {
//           const diagramObj = JSON.parse(result[0].scenariodiagram);

//           if (diagramObj.nodes && Array.isArray(diagramObj.nodes)) {
//             diagramObj.nodes = diagramObj.nodes.map((node) => {
//               const componentId =
//                 node.data?.componentId || node.data?.componentid;

//               if (componentId && componentDetails[componentId]) {
//                 // Replace node.data.image with componentimage from DB
//                 node.data.image = componentDetails[componentId].componentimage;
//               }
//               return node;
//             });
//           }

//           // Convert back to string to keep the same structure
//           result[0].scenariodiagram = JSON.stringify(diagramObj);
//         } catch (err) {
//           console.error("Error parsing or updating scenariodiagram JSON:", err);
//         }
//       }

//       return result;
//     } catch (error) {
//       console.error("Error fetching scenario by ID:", error.message);
//       throw error;
//     }
//   };

const getUserSessionById =
  ({ db }) =>
  async (vmrequestuuid) => {
    const query = `
      SELECT
        vr.vmrequestid,
        vr.vmrequestuuid,
        vr.scenariodiagram,
        vr.status,
        vr.vm_steps,
        vr.timer,
        vr.isnotitermination,

        s.scenarioid,
        s.scenariouuid,
        s.scenariotitle,
        s.scenarioidentification,
        s.scenariodescription,
        s.scenariolevel,
        s.instruction_file,
        s.component_config,
        s.components,
        s.duration,

        sc.categoryname AS scenariocategory_name,
        ssc.categoryname AS scenariosubcategory_name,

        l.learner_id,
        l.firstname,
        l.lastname,
        l.email,
        l.mobile,

        IFNULL(chat.unseen_message_count, 0) AS unseen_message_count

      FROM vm_request vr
      INNER JOIN scenarios s ON s.scenarioid = vr.scenarioid
      INNER JOIN scenario_categories sc 
        ON s.scenariocategoryid = sc.scenariocategoryid
      INNER JOIN scenario_categories ssc 
        ON s.scenariosubcategoryid = ssc.scenariocategoryid
      LEFT JOIN learners l 
        ON l.learner_id = vr.requestedby_id
       AND vr.requestedby_role = 'Learner'
     LEFT JOIN (
  SELECT
    scenarioid,
    learner_id,
    COUNT(*) AS unseen_message_count
  FROM scenario_learner_chats
  WHERE status = 'sent'
    AND sender_type = 'Learner'
  GROUP BY scenarioid, learner_id
) chat
ON chat.scenarioid = vr.scenarioid
AND chat.learner_id = vr.requestedby_id

      WHERE vr.vmrequestuuid = ?
        AND s.deletedon IS NULL

      LIMIT 1
    `;

    try {
      const result = await db.sequelize.query(query, {
        replacements: [vmrequestuuid],
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (!result.length) return [];

      /** ---------------- Component Calculations (UNCHANGED) ---------------- */

      let components = JSON.parse(result[0].component_config);
      result[0].component_count = components.length;
      result[0].virtual_cpu = 0;
      result[0].virtual_memory = 0;
      result[0].storage_size = 0;
      result[0].component_images = [];

      const componentDetails = {};

      await Promise.all(
        components.map(async (element) => {
          if (!element.componentid) return;

          const [rowData] = await db.sequelize.query(
            `SELECT cores, memory, storage, componentimage
             FROM components
             WHERE componentid = ?`,
            {
              replacements: [element.componentid],
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (!rowData) return;

          componentDetails[element.componentid] = rowData;

          result[0].virtual_cpu += rowData.cores || 0;
          result[0].virtual_memory += rowData.memory || 0;
          result[0].storage_size += parseInt(rowData.storage) || 0;

          if (rowData.componentimage) {
            result[0].component_images.push(rowData.componentimage);
          }
        })
      );

      /** ---------------- Diagram Image Injection (UNCHANGED) ---------------- */

      if (result[0].scenariodiagram) {
        try {
          const diagramObj = JSON.parse(result[0].scenariodiagram);

          if (Array.isArray(diagramObj.nodes)) {
            diagramObj.nodes = diagramObj.nodes.map((node) => {
              const componentId =
                node.data?.componentId || node.data?.componentid;

              if (componentId && componentDetails[componentId]) {
                node.data.image = componentDetails[componentId].componentimage;
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
      console.error("Error fetching scenario by ID:", error.message);
      throw error;
    }
  };

const notitermination =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      // Step 1: Get current value from DB
      const [result] = await db.sequelize.query(
        `SELECT isnotitermination FROM vm_request WHERE vmrequestid = :vmrequestid`,
        {
          replacements: {
            vmrequestid: body.vmrequestid,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      const currentValue = result?.isnotitermination || "No";
      const newValue = currentValue === "Yes" ? "No" : "Yes";
      // Step 2: Update the value in DB
      await db.sequelize.query(
        `UPDATE vm_request 
           SET isnotitermination = :newValue, modifiedon = NOW() 
           WHERE vmrequestid = :vmrequestid`,
        {
          replacements: {
            newValue,
            vmrequestid: body.vmrequestid,
          },
        }
      );

      // Step 3: Insert into chat log only if changing to 'Yes'
      if (newValue === "Yes") {
        const insertQuery = `
            INSERT INTO scenario_learner_chats 
            ( scenarioid, learner_id, instructor_id, message, sender_type)
            VALUES (?, ?, ?, ?,'Instructor')
          `;
        const queryParams = [
          body.scenarioid,
          body.learner_id,
          session_userid,
          validation.messages.noti_termination_msg,
        ];
        await db.sequelize.query(insertQuery, {
          replacements: queryParams,
          type: db.sequelize.QueryTypes.INSERT,
        });
      }

      return {
        statusCode: 200,
        message: validation.messages.noti_termination,
      };
    } catch (error) {
      throw error;
    }
  };

// dao for chatbox

// Get messages by scenario
const getMessagesByScenario =
  ({ db }) =>
  async ({ scenarioid, learner_id, instructor_id }) => {
    if (!scenarioid || !learner_id || !instructor_id) {
      throw new Error("Missing scenarioid, learner_id, or instructor_id");
    }

    const result = await db.sequelize.query(
      `SELECT * FROM scenario_learner_chats
       WHERE scenarioid = ? AND learner_id = ? AND instructor_id = ?
       ORDER BY createdon ASC`,
      {
        replacements: [scenarioid, learner_id, instructor_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    return result;
  };

// Send a chat message
const sendMessage =
  ({ db }) =>
  async (body, sender_id) => {
    const {
      scenarioid,
      learner_id,
      instructor_id,
      sender_type,
      message,
      attachment = null,
    } = body;

    await db.sequelize.query(
      `INSERT INTO scenario_learner_chats
        (scenarioid, learner_id, instructor_id, sender_type, message, attachment, status, createdon)
       VALUES (?, ?, ?, ?, ?, ?, 'sent', CURRENT_TIMESTAMP)`,
      {
        replacements: [
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

    return { statusCode: 200, message: "Message sent successfully" };
  };

const markMessagesSeen =
  ({ db }) =>
  async ({ scenarioid, learner_id, instructor_id, viewer_type }) => {
    try {
      const oppositeSenderType =
        viewer_type === "learner" ? "Instructor" : "Learner";
      const [result] = await db.sequelize.query(
        `UPDATE scenario_learner_chats
SET status = 'seen'
    
WHERE scenarioid = ? AND learner_id = ? AND instructor_id = ? 
  AND sender_type = ? AND status != 'seen'
`,
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
      console.error("Error in markMessagesSeen:", error);
      throw new Error("An error occurred while marking messages as seen.");
    }
  };

// const terminateScenario =
//   ({ db }) =>
//   async (
//     scenariolearnersessionid,
//     type,
//     usertype,
//     remark = "Terminated",
//     session_userid
//   ) => {
//     const transaction = await db.sequelize.transaction();
//     try {
//       // 1. Fetch session details
//       const [session] = await db.sequelize.query(
//         `
//       SELECT scenariolearnerid, learner_id, scenarioid
//       FROM scenario_learner_session
//       WHERE scenariolearnersessionid = :scenariolearnersessionid
//       `,
//         {
//           replacements: { scenariolearnersessionid },
//           type: db.sequelize.QueryTypes.SELECT,
//           transaction,
//         }
//       );

//       if (!session) {
//         throw new Error("Scenario learner session not found");
//       }

//       const now = new Date();

//       // 2. Update scenario_learner_session
//       await db.sequelize.query(
//         `
//       UPDATE scenario_learner_session
//       SET status = 'Terminated', isnotitermination = 'No',terminatedon = :now, modifiedon = :now
//       WHERE scenariolearnersessionid = :scenariolearnersessionid
//       AND status != 'Completed'
//       `,
//         {
//           replacements: { now, scenariolearnersessionid },
//           type: db.sequelize.QueryTypes.UPDATE,
//           transaction,
//         }
//       );

//       // 3. Update scenario_learner
//       await db.sequelize.query(
//         `
//       UPDATE scenario_learner
//       SET status = 'Terminated', modifiedon = :now
//       WHERE scenariolearnerid = :scenariolearnerid
//       AND status != 'Completed'
//       `,
//         {
//           replacements: { now, scenariolearnerid: session.scenariolearnerid },
//           type: db.sequelize.QueryTypes.UPDATE,
//           transaction,
//         }
//       );

//       // 4. Insert log into scenario_learner_logs
//       await db.sequelize.query(
//         `
//       INSERT INTO scenario_learner_logs (
//         scenariolearnersessionid,
//         scenarioid,
//         learner_id,
//         scenariolearnerid,
//         instructor_id,
//         type,
//         remark,
//         status,
//         createdon
//       ) VALUES (
//         :scenariolearnersessionid,
//         :scenarioid,
//         :learner_id,
//         :scenariolearnerid,
//         :instructor_id,
//         :type,
//         :remark,
//         'Terminated',
//         :now
//       )
//       `,
//         {
//           replacements: {
//             scenariolearnersessionid,
//             scenarioid: session.scenarioid,
//             learner_id: session.learner_id,
//             scenariolearnerid: session.scenariolearnerid,
//             instructor_id: session_userid,
//             type,
//             remark: `Terminated by ${type}`,
//             now,
//           },
//           type: db.sequelize.QueryTypes.INSERT,
//           transaction,
//         }
//       );

//       await transaction.commit();
//       return { success: true, message: "Termination successful" };
//     } catch (err) {
//       await transaction.rollback();
//       console.error("Terminate error:", err.message);
//       throw err;
//     }
//   };

const terminateScenario =
  ({ db }) =>
  async (
    vmrequestid,
    type,
    usertype, 
    remark = "Terminated",
    session_userid
  ) => {
    const transaction = await db.sequelize.transaction();

    try {
      // 1️⃣ Fetch VM request details
      const [request] = await db.sequelize.query(
        `
        SELECT
          vmrequestid,
          scenarioid,
          requestedby_id,
          requestedby_role,
          status
        FROM vm_request
        WHERE vmrequestid = :vmrequestid
        `,
        {
          replacements: { vmrequestid },
          type: db.sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (!request) {
        throw new Error("VM request not found");
      }

      if (request.status === "Completed") {
        throw new Error("Completed scenario cannot be terminated");
      }

      const now = new Date();

      // 2️⃣ Update vm_request
      await db.sequelize.query(
        `
        UPDATE vm_request
        SET
          status = 'Terminated',
          isnotitermination = 'No',
          terminatedon = :now,
          modifiedon = :now
        WHERE vmrequestid = :vmrequestid
          AND status != 'Completed'
        `,
        {
          replacements: { vmrequestid, now },
          type: db.sequelize.QueryTypes.UPDATE,
          transaction,
        }
      );

      // 3️⃣ Insert log into vm_request_logs
      await db.sequelize.query(
        `
        INSERT INTO vm_request_logs (
          vmrequestid,
          scenarioid,
          requestedby_id,
          requestedby_role,
          status,
          remark,
          createdon
        ) VALUES (
          :vmrequestid,
          :scenarioid,
          :requestedby_id,
          :requestedby_role,
          'Terminated',
          :remark,
          :now
        )
        `,
        {
          replacements: {
            vmrequestid,
            scenarioid: request.scenarioid,
            requestedby_id: session_userid || request.requestedby_id,
            requestedby_role: usertype || request.requestedby_role,
            remark: `Terminated by ${type}`,
            now,
          },
          type: db.sequelize.QueryTypes.INSERT,
          transaction,
        }
      );

      await transaction.commit();

      return {
        success: true,
        message: "Scenario terminated successfully",
      };
    } catch (err) {
      await transaction.rollback();
      console.error("Terminate error:", err.message);
      throw err;
    }
  };

// const getLogs =
//   ({ db }) =>
//   async (scenariolearneruuid, session_userid) => {
//     try {
//       let result = await db.sequelize.query(
//         `SELECT
//     sll.status,
//     DATE_FORMAT(sll.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
//     sll.type,
//     sll.remark,
//     IFNULL(DATE_FORMAT(sls.startedon, '%Y-%m-%d %H:%i:%s'), '') AS startedon
// FROM scenario_learner_logs sll
// INNER JOIN scenarios s ON s.scenarioid = sll.scenarioid
// INNER JOIN scenario_learner_session sls ON sls.scenariolearnersessionid = sll.scenariolearnersessionid
// INNER JOIN scenario_learner sl ON sl.scenariolearnerid = sll.scenariolearnerid
// WHERE sl.scenariolearneruuid  = ?
//           ORDER BY sll.createdon DESC;
//           `,
//         {
//           replacements: [scenariolearneruuid, session_userid],
//           type: db.sequelize.QueryTypes.SELECT,
//         }
//       );
//       return result;
//     } catch (error) {
//       console.error("Error fetching scenario logs:", error);
//       throw error;
//     }
//   };
const getLogs =
  ({ db }) =>
  async (vmrequestid) => {
    try {
      const result = await db.sequelize.query(
        `
        SELECT
          vrl.status,
          DATE_FORMAT(vrl.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
          vrl.requestedby_role AS type,
          vrl.remark,
          IFNULL(DATE_FORMAT(vr.startedon, '%Y-%m-%d %H:%i:%s'), '') AS startedon
        FROM vm_request_logs vrl
        INNER JOIN vm_request vr ON vr.vmrequestid = vrl.vmrequestid
        WHERE vrl.vmrequestid = ?
        ORDER BY vrl.createdon DESC
        `,
        {
          replacements: [vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      return result || [];
    } catch (error) {
      console.error("Error fetching vm request logs:", error);
      throw error;
    }
  };

module.exports = {
  listScenarios,
  getMessagesByScenario,
  sendMessage,
  markMessagesSeen,
  notitermination,
  terminateScenario,
  getUserSessionById,
  getLogs,
};
