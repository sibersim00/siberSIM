const getAdminLogs = async ({ db }) => {
  const [logs] = await db.sequelize.query(`
    SELECT 
      u.userid,
      u.useruuid,
      u.loginid,
      u.firstname,
      u.lastname,
      u.email,
      u.mobile,
      u.usertype,
      urt.access_token,
      urt.refresh_token,
      DATE_FORMAT(urt.logged_in, '%Y-%m-%d %H:%i:%s') AS last_login,
        DATE_FORMAT(urt.logged_out, '%Y-%m-%d %H:%i:%s') AS last_logout,
        urt.createdon
    FROM ad_users u
    INNER JOIN (
      SELECT userid, MAX(createdon) AS latest_createdon
      FROM ad_user_refresh_tokens
      GROUP BY userid
    ) latest_log ON u.userid = latest_log.userid
    INNER JOIN ad_user_refresh_tokens urt
      ON u.userid = urt.userid AND urt.createdon = latest_log.latest_createdon
    WHERE u.status = 'Active' AND u.usertype = 'Admin'
    ORDER BY urt.createdon DESC
  `);
  return logs;
};

const getInstructorLogs = async ({ db }) => {
  const [logs] = await db.sequelize.query(`
    SELECT 
      u.userid,
      u.useruuid,
       u.loginid,
      u.firstname,
      u.lastname,
      u.email,
      u.mobile,
      u.usertype,
      urt.access_token,
      urt.refresh_token,
     DATE_FORMAT(urt.logged_in, '%Y-%m-%d %H:%i:%s') AS last_login,
        DATE_FORMAT(urt.logged_out, '%Y-%m-%d %H:%i:%s') AS last_logout,
       urt.createdon
    FROM ad_users u
    INNER JOIN (
      SELECT userid, MAX(createdon) AS latest_createdon
      FROM ad_user_refresh_tokens
      GROUP BY userid
    ) latest_log ON u.userid = latest_log.userid
    INNER JOIN ad_user_refresh_tokens urt
      ON u.userid = urt.userid AND urt.createdon = latest_log.latest_createdon
    WHERE u.status = 'Active' AND u.usertype = 'Instructor'
    ORDER BY urt.createdon DESC
  `);
  return logs;
};

const getLearnerLogs = async ({ db }) => {
  const [logs] = await db.sequelize.query(`
    SELECT 
      l.learner_id,
      l.learner_uuid,
      l.firstname,
      l.lastname,
      l.username,
      l.email,
      l.mobile,
      lrt.access_token,
      lrt.refresh_token,
       DATE_FORMAT(lrt.logged_in, '%Y-%m-%d %H:%i:%s') AS last_login,
        DATE_FORMAT(lrt.logged_out, '%Y-%m-%d %H:%i:%s') AS last_logout,
      lrt.createdon
    FROM learners l
    INNER JOIN (
      SELECT learner_id, MAX(createdon) AS latest_createdon
      FROM learner_refresh_tokens
      GROUP BY learner_id
    ) latest_log ON l.learner_id = latest_log.learner_id
    INNER JOIN learner_refresh_tokens lrt
      ON l.learner_id = lrt.learner_id AND lrt.createdon = latest_log.latest_createdon
    WHERE l.status = 'Active'
    ORDER BY lrt.createdon DESC
  `);
  return logs;
};

module.exports = {
  getAdminLogs,
  getInstructorLogs,
  getLearnerLogs
};
