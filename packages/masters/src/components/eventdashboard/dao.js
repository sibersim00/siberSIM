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
el.team_name ASC;
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
      `SELECT eventid,eventuuid, eventname, status FROM events WHERE status IS NOT NULL ORDER BY eventname ASC;`,
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
        l.profile AS learner_profile,
        l.email   AS Email,
        l.mobile  AS Mobile,

        /* 🔁 MOVED FROM event_learners → vm_request */
        IFNULL(vr.status, 'Pending') AS team_status,
        DATE_FORMAT(vr.startedon, '%Y-%m-%d %H:%i:%s') AS team_startedon,
        DATE_FORMAT(vr.completedon, '%Y-%m-%d %H:%i:%s') AS team_completedon,
        IFNULL(vr.timer, '00:00:00') AS team_timer,

        IFNULL(ec.unseen_message_count, 0) AS unseen_message_count

      FROM event_learners el
      INNER JOIN events e
        ON el.eventid = e.eventid
      INNER JOIN learners l
        ON el.learner_id = l.learner_id

      /* SESSION SOURCE */
      LEFT JOIN vm_request vr
        ON vr.vmrequestid = el.vmrequestid
       AND vr.eventid = el.eventid

      /* CHAT COUNT */
      LEFT JOIN (
        SELECT eventlearnerid, COUNT(*) AS unseen_message_count
        FROM event_learner_chats
        WHERE status = 'sent'
        GROUP BY eventlearnerid
      ) ec
        ON ec.eventlearnerid = el.eventlearnerid

      WHERE el.deletedon IS NULL
        AND e.eventuuid = :eventuuid

      ORDER BY
        CASE
          WHEN IFNULL(vr.status, 'Pending') = 'Completed' THEN 1
          WHEN IFNULL(vr.status, 'Pending') = 'Start'     THEN 2
          WHEN IFNULL(vr.status, 'Pending') = 'Pending'   THEN 3
          ELSE 4
        END,
        CASE
          WHEN IFNULL(vr.status, 'Pending') = 'Completed' THEN vr.timer
          WHEN IFNULL(vr.status, 'Pending') = 'Start'     THEN vr.startedon
          WHEN IFNULL(vr.status, 'Pending') = 'Pending'   THEN vr.createdon
          ELSE NULL
        END ASC
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
