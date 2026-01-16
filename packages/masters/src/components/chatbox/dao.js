
// Get messages by scenario and mark instructor/admin messages as seen
const getMessagesByScenario = ({ db }) =>
  async ({ learner_id,scenarioid }) => {


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
       WHERE learner_id = ? AND scenarioid =?
       ORDER BY createdon ASC`,
      {
        replacements: [learner_id,scenarioid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // Step 2: Update status to 'seen' for messages from Instructor/Admin
    await db.sequelize.query(
      `UPDATE scenario_learner_chats
         SET status = 'seen'
        WHERE learner_id = ? AND scenarioid =?
       AND sender_type = 'Learner'
       AND status = 'sent';`,
      {
        replacements: [learner_id,scenarioid],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return result;
  };


// Get messages by scenario
const refreshByScenario = ({ db }) =>
  async ({ learner_id,scenarioid, scenariolearnerchatid }) => {


    const result = await db.sequelize.query(
      `SELECT *,  CASE
           WHEN DATE(createdon) = CURDATE() THEN 
                CONCAT('Today at ', DATE_FORMAT(createdon, '%l:%i %p'))
           WHEN DATE(createdon) = CURDATE() - INTERVAL 1 DAY THEN 
                 CONCAT('Yesterday at ', DATE_FORMAT(createdon, '%l:%i %p'))
           ELSE 
               DATE_FORMAT(createdon, '%b %e, %Y %l:%i %p')  -- e.g., May 20, 2025 2:30 PM
       END AS formatted_time FROM scenario_learner_chats
       WHERE learner_id = ? AND scenarioid =? 
       AND scenariolearnerchatid > ?
       ORDER BY createdon ASC
       `,
      {
        replacements: [learner_id,scenarioid, scenariolearnerchatid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );


    await db.sequelize.query(
      `UPDATE scenario_learner_chats
       SET status = 'seen'
       WHERE learner_id = ? AND scenarioid =?
       AND sender_type = 'Learner'
       AND status = 'sent';`,
      {
        replacements: [learner_id,scenarioid ],
        type: db.sequelize.QueryTypes.UPDATE,
      }
    );

    return result;
  };

// Send a chat message
const sendMessage = ({ db }) => async (body) => {
  const {
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
