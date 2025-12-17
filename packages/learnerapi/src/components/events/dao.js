const getAll = ({ db }) => async ({ learner_id, eventid }) => {
  try {
    const result = await db.sequelize.query(
      `SELECT e.eventid, e.eventuuid, e.eventname, el.eventlearnerid, el.status, el.vm_steps, el.team_name, el.team_description, el.startedon,
              COALESCE(el.scenariodiagram, s.scenariodiagram) AS scenariodiagram, el.learner_id, el.completedon,
              s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenarioidentification, s.scenariolevel, s.duration, s.scenariodescription,
              s.instruction_file, s.component_config, sc.categoryname AS scenariocategory_name, scc.categoryname AS scenariosubcategory_name,
              CASE WHEN el.startedon IS NOT NULL THEN SEC_TO_TIME(GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), e.eventendtime)))
                   ELSE SEC_TO_TIME(GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), e.eventendtime))) END AS reverse_timer,
              IFNULL(chat_instructor_admin.unseen_instructor_admin_message_count, 0) AS unseen_instructor_admin_message_count
       FROM event_learners el
       INNER JOIN events e ON e.eventid = el.eventid
       INNER JOIN learners l ON l.learner_id = el.learner_id
       INNER JOIN scenarios s ON s.scenarioid = e.scenarioid
       INNER JOIN scenario_categories sc ON sc.scenariocategoryid = s.scenariocategoryid
       INNER JOIN scenario_categories scc ON scc.scenariocategoryid = s.scenariosubcategoryid
       LEFT JOIN (
         SELECT elc.eventlearnerid, COUNT(*) AS unseen_instructor_admin_message_count
         FROM event_learner_chats elc
         INNER JOIN event_learners elr ON elc.eventlearnerid = elr.eventlearnerid
         WHERE elc.status = 'sent' AND elc.sender_type IN ('Instructor', 'Admin')
         GROUP BY elc.eventlearnerid
       ) AS chat_instructor_admin ON chat_instructor_admin.eventlearnerid = el.eventlearnerid
       WHERE el.learner_id = ? AND el.eventid = ? AND s.deletedon IS NULL;`,
      {
        replacements: [learner_id, eventid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    for (let item of result) {
      item.virtual_cpu = 0;
      item.virtual_memory = 0;
      item.storage_size = 0;

      try {
        const components = JSON.parse(item.component_config || "[]");
        item.component_count = components.length;

        // Sum totals and cache details for images
        const componentDetails = {};

        for (const comp of components) {
          if (comp.componentid) {
            const [rowData] = await db.sequelize.query(
              `SELECT cores, memory, storage, componentimage FROM components WHERE componentid = ?`,
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

        // Update scenariodiagram node images
        if (item.scenariodiagram) {
          let diagramObj = JSON.parse(item.scenariodiagram);

          if (diagramObj.nodes && Array.isArray(diagramObj.nodes)) {
            diagramObj.nodes = diagramObj.nodes.map((node) => {
              const compId = node.data?.componentId || node.data?.componentid;
              if (compId && componentDetails[compId]) {
                node.data.image = componentDetails[compId].componentimage || node.data.image;
              }
              return node;
            });
          }

          item.scenariodiagram = JSON.stringify(diagramObj);
        }
      } catch (err) {
        console.error("Error processing component_config or scenariodiagram for event:", err);
      }
    }

    return result;
  } catch (error) {
    console.log("Scenario fetch error =>", error);
    throw error;
  }
};




const startEvent = ({ db, validation }) => async (body) => {
    try {
      const [existing] = await db.sequelize.query(`SELECT eventlearnerid,eventid FROM event_learners WHERE eventlearnerid = :eventlearnerid LIMIT 1`,
        {
          replacements: {eventlearnerid: body.eventlearnerid},
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (!existing) {
        return { statusCode: 404, message: validation.messages.event_not_found};
      }
      let updateFields = [];
      let replacements = [];
      if (body.status) {
        updateFields.push("status = ?");
        replacements.push(body.status);
        if (body.status === "Start") {
          updateFields.push("startedon = CURRENT_TIMESTAMP");
        } else if (body.status === "Completed") {
          updateFields.push("completedon = CURRENT_TIMESTAMP");
        }
      }
      if (body.timer !== undefined) {
        updateFields.push("timer = ?");
        replacements.push(body.timer);
      }
      updateFields.push("modifiedon = CURRENT_TIMESTAMP");
      const updateQuery = `UPDATE event_learners SET ${updateFields.join(", ")} WHERE eventlearnerid = ?`;
      replacements.push(body.eventlearnerid);
      await db.sequelize.query(updateQuery, {
        replacements,
        type: db.sequelize.QueryTypes.UPDATE,
      });
      await insertEventLog(db, {eventlearnerid: body.eventlearnerid,eventid: existing.eventid, learner_id: body.learner_id, instructor_id: body.instructor_id || null, type: "Learner", remark: `Event started by learner`, status: "Start",});
      return {statusCode: 200, message: validation.messages.event_updated, eventlearnerid: body.eventlearnerid};
    } catch (error) {
      console.error("Error in updating event_learners:", error);
      throw error;
    }
  };



async function insertEventLog(db, logData) {
  console.log("logDatalogDatalogData",logData)
  const logQuery = `INSERT INTO event_learner_logs (eventlearnerid,eventid, learner_id, instructor_id, type, remark, status, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
  const logParams = [logData.eventlearnerid,logData.eventid || null, logData.learner_id, logData.instructor_id, logData.type, logData.remark, logData.status];
  await db.sequelize.query(logQuery, {
    replacements: logParams,
    type: db.sequelize.QueryTypes.INSERT,
  });
}

const updateEventLearnerStatus = ({ db, validation }) => async ({ status, eventlearnerid, instructor_id = null }) => {
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
      return { statusCode: 404, message: validation.messages.event_not_found };
    }

    await db.sequelize.query(
      `UPDATE event_learners 
       SET status = ?, 
           modifiedon = CURRENT_TIMESTAMP, 
           completedon = CASE WHEN ? = 'Completed' THEN CURRENT_TIMESTAMP ELSE completedon END, 
           timer = CASE WHEN ? IN ('Pause', 'Completed', 'Terminated') THEN TIMEDIFF(CURRENT_TIMESTAMP, startedon) ELSE timer END 
       WHERE eventlearnerid = ?`,
      {
        replacements: [status, status, status, eventlearnerid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    // Always log with fetched data
    await insertEventLog(db, {
      eventlearnerid,
      eventid: existing.eventid,
      learner_id: existing.learner_id,
      instructor_id,
      type: "Learner",
      remark: `Event status changed to ${status} by learner`,
      status
    });

    return { statusCode: 200, message: validation.messages.event_updated, eventlearnerid };
  } catch (error) {
    console.error("Error updating event learner status:", error);
    throw error;
  }
};


const getEventStatus = ({ db }) => async (eventlearnerid) => {
    try {
      const [result] = await db.sequelize.query(`SELECT status, vm_steps FROM event_learners WHERE eventlearnerid = ?`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("getEventStatus DAO Error:", error);
      throw error;
    }
  };

const getLogs = ({ db, validation}) => async (eventlearnerid) => {
    try {
      const result = await db.sequelize.query(`SELECT ell.eventlearnerid, ell.status, DATE_FORMAT(ell.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, ell.type, ell.remark, IFNULL(DATE_FORMAT(el.startedon, '%Y-%m-%d %H:%i:%s'), '') AS startedon FROM event_learner_logs ell INNER JOIN event_learners el ON el.eventlearnerid = ell.eventlearnerid WHERE ell.eventlearnerid = ? ORDER BY ell.createdon DESC`,
        {
          replacements: [eventlearnerid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
       return {statusCode: 200, message: validation.messages.event_logs_fetched, data: result};
    } catch (error) {
      console.error("Error fetching logs by eventlearnerid:", error);
      throw error;
    }
  };

module.exports = {
  getAll,
  startEvent,
  updateEventLearnerStatus,
  getEventStatus,
  getLogs,
};
