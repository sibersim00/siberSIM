const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;
const axios = require("axios");

const getPauselimit = async (db) => {
  try {
    const settings = await db.sequelize.query(
      `SELECT pause_limit FROM web_settings WHERE status = 1 LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    return Number.isFinite(settings?.[0]?.pause_limit)
      ? settings[0].pause_limit
      : 5;
  } catch (err) {
    console.error("Error fetching pause_limit:", err);
    return 5;
  }
};

const calculateElapsedTimer = (startedon, previousTimer = "00:00:00") => {
  const [ph, pm, ps] = (previousTimer || "00:00:00").split(":").map(Number);
  const previousSeconds = ph * 3600 + pm * 60 + ps;

  // Calculate seconds since startedon
  const startTime = new Date(startedon).getTime();
  const now = Date.now();
  const elapsedSinceStart = Math.floor((now - startTime) / 1000);

  const totalSeconds = previousSeconds + elapsedSinceStart;

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const executeVictimAction = async ({ db, victim, action }) => {
  try {
    if (action === "terminate") {
      await axios.post(
        `${EVENTLEARNER_API_URL}/vmconfigs/update-complete-terminate`,
        {
          vmrequestid: victim.vmrequestid,
          status: "Terminated",
          type: "auto",
        }
      );

      await db.sequelize.query(
        `UPDATE vm_request
         SET status = 'Terminated',
             vm_steps = 'Destroyed',
             terminatedon = NOW()
         WHERE vmrequestid = ?`,
        { replacements: [victim.vmrequestid] }
      );

      await db.sequelize.query(
        `UPDATE vm_config
         SET status = 'Destroyed'
         WHERE vmrequestid = ?
         AND status IN ('Running','Hibernate')`,
        { replacements: [victim.vmrequestid] }
      );

    } else if (action === "pause") {
      const [sessionData] = await db.sequelize.query(
        `SELECT timer FROM vm_request
         WHERE vmrequestid = ?
         ORDER BY vmrequestid DESC
         LIMIT 1`,
        {
          replacements: [victim.vmrequestid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      const calculatedTimer = calculateElapsedTimer(
        victim.startedon,
        sessionData?.timer || "00:00:00"
      );

      await axios.post(
        `${EVENTLEARNER_API_URL}/vmconfigs/pause-scenario-learner`,
        {
          vmrequestid: victim.vmrequestid,
          learner_id: victim.requestedby_id,
        }
      );

      await db.sequelize.query(
        `UPDATE vm_request
         SET status = 'Pause',
             vm_steps = 'Running'
         WHERE vmrequestid = ?
         AND status IN ('Start','Resume')`,
        { replacements: [victim.vmrequestid] }
      );

      await db.sequelize.query(
        `UPDATE vm_config
         SET status = 'Hibernate'
         WHERE vmrequestid = ?
         AND status = 'Running'`,
        { replacements: [victim.vmrequestid] }
      );

      await db.sequelize.query(
        `UPDATE vm_request
         SET timer = ?,
             status = 'Pause'
         WHERE vmrequestid = ?
         ORDER BY vmrequestid DESC
         LIMIT 1`,
        { replacements: [calculatedTimer, victim.vmrequestid] }
      );
    }
  } catch (err) {
    console.error(`executeVictimAction [${action}] failed:`, err.message);
  }
};


/* ============================================================
   checkLabScenarioAccess - NO API calls here anymore
   Only returns victim + action for caller to handle
   ============================================================ */
const checkLabScenarioAccess = async ({ db, body, user_count_limit }) => {
  const learnerId = body.learner_id;
  const limit = isNaN(Number(user_count_limit)) ? 0 : Number(user_count_limit);

  /* ---------------- GET ACTIVE LAB ---------------- */
  const [lab] = await db.sequelize.query(
    `SELECT *
      FROM lab_sessions
      WHERE status = 'Active'
      AND deletedon IS NULL
      AND NOW() >= datetime
      AND NOW() < DATE_ADD(datetime, INTERVAL duration HOUR)
      ORDER BY datetime ASC
      LIMIT 1`,
    { type: db.sequelize.QueryTypes.SELECT }
  );

  /* ---------------- GET ACTIVE USERS ---------------- */
  const activeUsers = await db.sequelize.query(
    `SELECT vmrequestid, requestedby_id, startedon
     FROM vm_request
     WHERE status IN ('Start','Resume')
     AND vm_steps = 'Running'
     ORDER BY startedon DESC`,
    { type: db.sequelize.QueryTypes.SELECT }
  );

  const totalActive = activeUsers.length;
  /* ---------------- NO LAB CASE ---------------- */
  if (!lab) {
    if (limit > 0 && totalActive >= limit) {
      return {
        allow: false,
        statusCode: 400,
        message: `Maximum ${limit} active users reached`,
      };
    }
    return { allow: true, bypassLimit: false, victim: null, action: null };
  }

  /* ---------------- PARSE USERS ---------------- */
  let allowedUsers = [];
  try {
    const parsed = JSON.parse(lab.allowedusers || "[]");
    allowedUsers = Array.isArray(parsed) ? parsed : String(parsed).split(",");
  } catch {
    allowedUsers = [];
  }

  const allowedUsersNormalized = allowedUsers.map(String);
  const isLabUser = allowedUsersNormalized.includes(String(learnerId));
  const reservedSeats = Number(lab.reservedseats || 0);

  const activeLabUsers = activeUsers.filter((u) =>
    allowedUsersNormalized.includes(String(u.requestedby_id))
  );

  const activeNonLabUsers = activeUsers.filter(
    (u) => !allowedUsersNormalized.includes(String(u.requestedby_id))
  );

  /* ======================= LAB USER ======================== */
  if (isLabUser) {
    if (totalActive < limit) {
      return { allow: true, bypassLimit: false, victim: null, action: null };
    }
    if (activeNonLabUsers.length > 0) {
      /* SELECT VICTIM */
      let victim = null;
      const pauseLimit = await getPauselimit(db);
      for (const user of activeNonLabUsers) {
        const pausedCountResult = await db.sequelize.query(
          `SELECT COUNT(*) as count
           FROM vm_request
           WHERE requestedby_id = ?
           AND status = 'Pause'`,
          {
            replacements: [user.requestedby_id],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        const pausedCount = pausedCountResult[0]?.count || 0;

        if (pausedCount >= pauseLimit) {
          victim = user;
          break;
        }
      }

      // fallback
      if (!victim) {
        victim = activeNonLabUsers[0];
      }

      if (!victim?.vmrequestid) {
        return {
          allow: false,
          statusCode: 400,
          message: "No running scenario found",
        };
      }

      /* DECIDE ACTION: terminate or pause */
      const pausedCountResult = await db.sequelize.query(
        `SELECT COUNT(*) as count
         FROM vm_request
         WHERE requestedby_id = ?
         AND status = 'Pause'`,
        {
          replacements: [victim.requestedby_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      const pausedCount = pausedCountResult[0]?.count || 0;
      const action = pausedCount >= pauseLimit ? "terminate" : "pause";
      // Return victim + action — NO API calls here
      return { allow: true, bypassLimit: true, victim, action };
    }
    return {
      allow: false,
      statusCode: 400,
      message: "All active users are lab users",
    };
  }

  /* ================= NON LAB USER ================= */
  if (limit > 0 && totalActive >= limit) {
    return {
      allow: false,
      statusCode: 400,
      message: `Maximum ${limit} active users reached`,
    };
  }

  const remainingSeats = reservedSeats - activeLabUsers.length;

  if (remainingSeats <= 0) {
    return {
      allow: false,
      statusCode: 400,
      message: "Seats are reserved for lab users",
    };
  }

  return { allow: true, bypassLimit: false, victim: null, action: null };
};


module.exports = { checkLabScenarioAccess,executeVictimAction };