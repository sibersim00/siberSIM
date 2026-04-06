const listScenarios =
  ({ db }) =>
    async (usertype, session_userid) => {
      console.log("usertypeusertypeusertype",usertype);
      console.log("session_userid",session_userid);
      

      let condition = `vr.status IN ('Pause','Start','Resume')`;

      // if (usertype === "Instructor") {
      //   condition += ` AND vr.requestedby_role = 'Learner'
      //                AND vr.requestedby_id = :session_userid`;
      // }
      if (usertype === "Instructor") {
  condition += ` AND vr.requestedby_role = 'Learner'
                 AND l.instructor_id = :session_userid`;
}

      const query = `
        SELECT vr.vmrequestid, vr.vmrequestuuid, vr.eventid, s.scenariotitle, s.scenario_type, vr.isedit, vr.requestedby_id AS learner_id, CASE  WHEN vr.requestedby_role = 'Instructor' THEN vr.requestedby_id ELSE NULL END AS instructor_id, vr.scenarioid, vr.requestedby_role, vr.status AS scenario_status, vr.vm_steps AS vm_step_status, vr.startedon, vr.completedon, vr.terminatedon, vr.failedon, vr.isnotitermination, CONCAT(l.firstname, ' ', l.lastname) AS learner_name, CONCAT(inst.firstname, ' ', inst.lastname) AS user_name, l.profile, IFNULL(chat.unseen_message_count, 0) AS unseen_message_count FROM vm_request vr INNER JOIN scenarios s ON s.scenarioid = vr.scenarioid LEFT JOIN learners l  ON l.learner_id = vr.requestedby_id AND vr.requestedby_role IN ('Learner' ,'Event')   LEFT JOIN ad_users inst  ON inst.userid = vr.requestedby_id AND vr.requestedby_role IN ('Admin', 'Instructor') LEFT JOIN ( SELECT scenarioid, learner_id, COUNT(*) AS unseen_message_count FROM scenario_learner_chats WHERE status = 'sent' AND sender_type = 'Learner' GROUP BY scenarioid, learner_id ) chat ON chat.scenarioid = vr.scenarioid AND chat.learner_id = vr.requestedby_id WHERE ${condition} ORDER BY vr.startedon DESC `;

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


const getUserSessionById =
  ({ db }) =>
    async (vmrequestuuid) => {
      const query = ` SELECT vr.vmrequestid, vr.vmrequestuuid, vr.scenariodiagram, vr.status, vr.vm_steps, vr.isedit,vr.edit_by, vr.timer, vr.isnotitermination, s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenarioidentification, s.scenariodescription, s.scenariolevel, s.instruction_file, s.component_config, s.components, s.duration, sc.categoryname AS scenariocategory_name, ssc.categoryname AS scenariosubcategory_name, l.learner_id, l.firstname, l.lastname, l.email, l.mobile, IFNULL(chat.unseen_message_count, 0) AS unseen_message_count FROM vm_request vr INNER JOIN scenarios s ON s.scenarioid = vr.scenarioid INNER JOIN scenario_categories sc  ON s.scenariocategoryid = sc.scenariocategoryid INNER JOIN scenario_categories ssc  ON s.scenariosubcategoryid = ssc.scenariocategoryid LEFT JOIN learners l  ON l.learner_id = vr.requestedby_id AND vr.requestedby_role = 'Learner' LEFT JOIN ( SELECT scenarioid, learner_id, COUNT(*) AS unseen_message_count FROM scenario_learner_chats WHERE status = 'sent' AND sender_type = 'Learner' GROUP BY scenarioid, learner_id ) chat ON chat.scenarioid = vr.scenarioid AND chat.learner_id = vr.requestedby_id WHERE vr.vmrequestuuid = ? AND s.deletedon IS NULL LIMIT 1 `;

      try {
        const result = await db.sequelize.query(query, {
          replacements: [vmrequestuuid],
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (!result.length) return [];
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
        const [result] = await db.sequelize.query( `UPDATE scenario_learner_chats SET status = 'seen' WHERE scenarioid = ? AND learner_id = ? AND instructor_id = ?  AND sender_type = ? AND status != 'seen' `,
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
        const [request] = await db.sequelize.query( ` SELECT vmrequestid, scenarioid, requestedby_id, requestedby_role, status FROM vm_request WHERE vmrequestid = :vmrequestid
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
        await db.sequelize.query( ` UPDATE vm_request SET status = 'Terminated', isnotitermination = 'No', terminatedon = :now, modifiedon = :now WHERE vmrequestid = :vmrequestid AND status != 'Completed' `,
          {
            replacements: { vmrequestid, now },
            type: db.sequelize.QueryTypes.UPDATE,
            transaction,
          }
        );
        // 3️⃣ Insert log into vm_request_logs
        await db.sequelize.query( ` INSERT INTO vm_request_logs ( vmrequestid, scenarioid, requestedby_id, requestedby_role, status, remark, createdon ) VALUES ( :vmrequestid, :scenarioid, :requestedby_id, :requestedby_role, 'Terminated', :remark, :now ) `,
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


const getLogs =
  ({ db }) =>
    async (vmrequestid) => {
      try {
        const result = await db.sequelize.query( ` SELECT vrl.status, DATE_FORMAT(vrl.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, vrl.requestedby_role AS type, vrl.remark, IFNULL(DATE_FORMAT(vr.startedon, '%Y-%m-%d %H:%i:%s'), '') AS startedon FROM vm_request_logs vrl INNER JOIN vm_request vr ON vr.vmrequestid = vrl.vmrequestid WHERE vrl.vmrequestid = ? ORDER BY vrl.createdon DESC `,
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
        message: "This scenario is currently being edited by another user. To avoid conflicts, editing is temporarily locked",
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
        `UPDATE temp_networks
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
  listScenarios,
  getMessagesByScenario,
  sendMessage,
  markMessagesSeen,
  notitermination,
  terminateScenario,
  getUserSessionById,
  getLogs,
  changeEditStatus,
  releaseEditLock,
  deleteBridgeFromScenario
};
