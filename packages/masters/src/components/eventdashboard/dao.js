// --- Dashboard Stats with Optional EventID Filter ---
const getDashboardStats = ({ db, validation }) => async ({ userid, usertype, eventid }) => {
  try {
    let eventTeamsQuery = `
     SELECT 
    e.eventid,
    e.eventuuid,
    e.eventname,
    e.eventstarttime,
    e.eventendtime,
    el.eventlearnerid,
    el.team_name,
    el.learner_id,
    e.scenarioid,
    CONCAT(l.firstname, ' ', l.lastname) AS learnername,
    l.profile AS learner_profile,
    l.email as Email,
    l.mobile as Mobile,  
    el.status AS team_status,
    el.createdon AS team_createdon,
    el.startedon AS team_startedon,
    el.completedon AS team_completedon,
    au.userid AS instructor_id,
     IFNULL(ec.unseen_message_count, 0) AS unseen_message_count
FROM event_learners el
INNER JOIN events e ON el.eventid = e.eventid
INNER JOIN learners l ON el.learner_id = l.learner_id
LEFT JOIN ad_users au ON e.createdby = au.userid 
LEFT JOIN (
    SELECT 
        eventlearnerid, 
        COUNT(*) AS unseen_message_count
    FROM event_learner_chats
    WHERE status = 'sent'
    GROUP BY eventlearnerid
) ec ON ec.eventlearnerid = el.eventlearnerid
WHERE el.deletedon IS NULL
    `;

    const replacements = [];

    if (eventid) {
      eventTeamsQuery += ` AND e.eventid = ?`;
      replacements.push(eventid);
    }

    eventTeamsQuery += ` ORDER BY e.eventid, el.team_name`;

    const eventTeams = await db.sequelize.query(eventTeamsQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });

    return {
      eventTeams,
    };
  } catch (error) {
    console.error("DAO getDashboardStats Error:", error.message);
    throw error;
  }
};

// --- New: Fetch All Events for Dropdown/List ---
const getEventList = ({ db }) => async () => {
  try {
    const eventList = await db.sequelize.query(
      `SELECT eventid,eventuuid, eventname, status FROM events WHERE status IS NOT NULL`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    return eventList;
  } catch (error) {
    console.error("DAO getEventList Error:", error.message);
    throw error;
  }
};

const getTeamsByEventUUID = ({ db }) => async (eventuuid) => {
  try {
    const query = `
      SELECT 
  e.eventid,
  e.eventuuid,
  e.eventname,
  el.eventlearnerid,
  el.team_name,
  el.learner_id,
  CONCAT(l.firstname, ' ', l.lastname) AS learnername,
  l.profile                 AS learner_profile,
  l.email                   AS Email,
  l.mobile                  AS Mobile,
  el.status                 AS team_status,
  DATE_FORMAT(el.startedon, '%Y-%m-%d %H:%i:%s') AS team_startedon,
  DATE_FORMAT(el.completedon, '%Y-%m-%d %H:%i:%s') AS team_completedon,
  IFNULL(ec.unseen_message_count, 0) AS unseen_message_count,
  el.timer                  AS team_timer
FROM event_learners el
INNER JOIN events e       ON el.eventid = e.eventid
INNER JOIN learners l     ON el.learner_id = l.learner_id
LEFT JOIN (
  SELECT eventlearnerid, COUNT(*) AS unseen_message_count
  FROM event_learner_chats
  WHERE status = 'sent'
  GROUP BY eventlearnerid
) ec ON ec.eventlearnerid = el.eventlearnerid
WHERE el.deletedon IS NULL
  AND e.eventuuid = :eventuuid
ORDER BY
  CASE 
    WHEN el.status = 'Completed' THEN 1
    WHEN el.status = 'Start'     THEN 2
    WHEN el.status = 'Pending'   THEN 3
    ELSE 4
  END,
  CASE 
    WHEN el.status = 'Completed' THEN el.timer
    WHEN el.status = 'Start'     THEN el.startedon
    WHEN el.status = 'Pending'   THEN el.createdon
    ELSE NULL
  END ASC;

    `;

    const teams = await db.sequelize.query(query, {
      replacements: { eventuuid },
      type: db.sequelize.QueryTypes.SELECT,
    });

    return teams;
  } catch (error) {
    console.error("DAO getTeamsByEventUUID Error:", error.message);
    throw error;
  }
};


module.exports = {
  getDashboardStats,
  getEventList,
  getTeamsByEventUUID,
};
