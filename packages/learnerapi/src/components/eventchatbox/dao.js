// Get messages by event and mark instructor/admin messages as seen
const getMessagesByEvent = ({ db }) =>
  async ({ eventlearnerid }) => {
    if (!eventlearnerid) {
      throw new Error("Missing eventlearnerid");
    }

    const result = await db.sequelize.query( `SELECT *, CASE  WHEN DATE(createdon) = CURDATE() THEN   CONCAT('Today at ', DATE_FORMAT(createdon, '%l:%i %p'))  WHEN DATE(createdon) = CURDATE() - INTERVAL 1 DAY THEN   CONCAT('Yesterday at ', DATE_FORMAT(createdon, '%l:%i %p'))  ELSE   DATE_FORMAT(createdon, '%b %e, %Y %l:%i %p')  END AS formatted_time   FROM event_learner_chats WHERE eventlearnerid = ?  ORDER BY createdon ASC`,
      {
        replacements: [eventlearnerid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    await db.sequelize.query( `UPDATE event_learner_chats SET status = 'seen' WHERE eventlearnerid = ? AND sender_type IN ('Admin', 'Instructor') AND status = 'sent';`,
      {
        replacements: [eventlearnerid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return result;
  };

// Get new messages after last message
const refreshByEvent = ({ db }) =>
  async ({ eventlearnerid, eventlearnerchatid }) => {
    if (!eventlearnerid || eventlearnerchatid === undefined) {
      throw new Error("Missing eventlearnerid or chat id");
    }

    const result = await db.sequelize.query( `SELECT *, CASE  WHEN DATE(createdon) = CURDATE() THEN   CONCAT('Today at ', DATE_FORMAT(createdon, '%l:%i %p'))  WHEN DATE(createdon) = CURDATE() - INTERVAL 1 DAY THEN   CONCAT('Yesterday at ', DATE_FORMAT(createdon, '%l:%i %p'))  ELSE   DATE_FORMAT(createdon, '%b %e, %Y %l:%i %p')  END AS formatted_time   FROM event_learner_chats  WHERE eventlearnerid = ?   AND eventlearnerchatid > ?  ORDER BY createdon ASC`,
      {
        replacements: [eventlearnerid, eventlearnerchatid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    await db.sequelize.query( `UPDATE event_learner_chats  SET status = 'seen'  WHERE eventlearnerid = ?  AND sender_type IN ('Admin', 'Instructor')  AND status = 'sent';`,
      {
        replacements: [eventlearnerid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );
    return result;
  };

// Send a chat message
const sendMessage = ({ db }) => async (body) => {
  const {
    eventlearnerid,
    eventid,
    learner_id,
    instructor_id,
    sender_type,
    message,
    attachment = null,
  } = body;

  await db.sequelize.query( `INSERT INTO event_learner_chats (eventlearnerid, eventid, learner_id, instructor_id, sender_type, message, attachment, status, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', CURRENT_TIMESTAMP)`,
    {
      replacements: [
        eventlearnerid,
        eventid,
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
    `SELECT * FROM event_learner_chats WHERE eventlearnerchatid = LAST_INSERT_ID()`,
    { type: db.sequelize.QueryTypes.SELECT }
  );

  return result; 
};


// Mark messages as seen
const markMessagesSeen = ({ db }) => async ({ eventid, learner_id, instructor_id, viewer_type }) => {
  try {
    const oppositeSenderType = viewer_type === "learner" ? "Instructor" : "Learner";

    const [result] = await db.sequelize.query(
      `UPDATE event_learner_chats
       SET status = 'seen'
       WHERE eventid = ? AND learner_id = ? AND instructor_id = ?
         AND sender_type = ? AND status != 'seen'`,
      {
        replacements: [eventid, learner_id, instructor_id, oppositeSenderType],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return result;
  } catch (error) {
    console.error("Error in markMessagesSeen:", error);
    throw new Error("Error while marking messages as seen.");
  }
};

module.exports = {
  getMessagesByEvent,
  refreshByEvent,
  sendMessage,
  markMessagesSeen,
};
