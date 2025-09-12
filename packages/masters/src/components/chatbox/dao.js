
// Get messages by scenario and mark instructor/admin messages as seen
const getMessagesByScenario = ({ db }) =>
  async ({ scenariolearnerid }) => {
    if (!scenariolearnerid) {
      throw new Error("Missing scenariolearnerid");
    }

    // Step 1: Fetch messages
    const result = await db.sequelize.query(
      `SELECT *, CASE
           WHEN DATE(createdon) = CURDATE() THEN 
                CONCAT('Today at ', DATE_FORMAT(createdon, '%l:%i %p'))
           WHEN DATE(createdon) = CURDATE() - INTERVAL 1 DAY THEN 
                CONCAT('Yesterday at ', DATE_FORMAT(createdon, '%l:%i %p'))
         ELSE 
               DATE_FORMAT(createdon, '%b %e, %Y %l:%i %p')  -- e.g., May 20, 2025 2:30 PM
       END AS formatted_time 
       FROM scenario_learner_chats
       WHERE scenariolearnerid = ? 
       ORDER BY createdon ASC`,
      {
        replacements: [scenariolearnerid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // Step 2: Update status to 'seen' for messages from Instructor/Admin
    await db.sequelize.query(
      `UPDATE scenario_learner_chats
         SET status = 'seen'
        WHERE scenariolearnerid = ?
       AND sender_type = 'Learner'
       AND status = 'sent';`,
      {
        replacements: [scenariolearnerid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return result;
  };


// Get messages by scenario
const refreshByScenario = ({ db }) =>
  async ({ scenariolearnerid, scenariolearnerchatid }) => {
    if (!scenariolearnerid || scenariolearnerchatid === undefined) {
      throw new Error("Missing scenariolearnerid");
    }

    const result = await db.sequelize.query(
      `SELECT *,  CASE
           WHEN DATE(createdon) = CURDATE() THEN 
                CONCAT('Today at ', DATE_FORMAT(createdon, '%l:%i %p'))
           WHEN DATE(createdon) = CURDATE() - INTERVAL 1 DAY THEN 
                 CONCAT('Yesterday at ', DATE_FORMAT(createdon, '%l:%i %p'))
           ELSE 
               DATE_FORMAT(createdon, '%b %e, %Y %l:%i %p')  -- e.g., May 20, 2025 2:30 PM
       END AS formatted_time FROM scenario_learner_chats
       WHERE scenariolearnerid = ? 
       AND scenariolearnerchatid > ?
       ORDER BY createdon ASC
       `,
      {
        replacements: [scenariolearnerid, scenariolearnerchatid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );


    await db.sequelize.query(
      `UPDATE scenario_learner_chats
       SET status = 'seen'
       WHERE scenariolearnerid = ?
       AND sender_type = 'Learner'
       AND status = 'sent';`,
      {
        replacements: [scenariolearnerid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return result;
  };

// Send a chat message
const sendMessage = ({ db }) => async (body) => {
  const {
    scenariolearnerid,
    scenarioid,
    learner_id,
    instructor_id,
    sender_type,
    message,
    attachment = null,
  } = body;

  // Insert the new message
  await db.sequelize.query(
    `INSERT INTO scenario_learner_chats
      (scenariolearnerid, scenarioid, learner_id, instructor_id, sender_type, message, attachment, status, createdon)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', CURRENT_TIMESTAMP)`,
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

  // Retrieve the inserted row using LAST_INSERT_ID()
  const [result] = await db.sequelize.query(
    `SELECT * FROM scenario_learner_chats WHERE scenariolearnerchatid = LAST_INSERT_ID()`,
    { type: db.sequelize.QueryTypes.SELECT }
  );

  return { statusCode: 200, message: "Message sent successfully", data: result };
};



const markMessagesSeen = ({ db }) => async ({ scenarioid, learner_id, instructor_id, viewer_type }) => {
  try {
    const oppositeSenderType = viewer_type === "learner" ? "Instructor" : "Learner";

    const [result] = await db.sequelize.query(
      `UPDATE scenario_learner_chats
SET status = 'seen'
WHERE scenarioid = ? AND learner_id = ? AND instructor_id = ? 
  AND sender_type = ? AND status != 'seen'
`,
      {
        replacements: [scenarioid, learner_id, instructor_id, oppositeSenderType],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );


    return result;

  } catch (error) {
    console.error("Error in markMessagesSeen:", error);
    throw new Error("An error occurred while marking messages as seen.");
  }
};



module.exports = {
  getMessagesByScenario,
  refreshByScenario,
  sendMessage,
  markMessagesSeen,
};
