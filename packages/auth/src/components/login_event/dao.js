const MailTemplate = require("../../utils/mailUtility");
const bcrypt = require("bcryptjs");

const checklogin =
  ({ db, keys, validation }) =>
  async ({ loginid, password, eventid }) => {
    try {
      // 1. Fetch learner info by username
      loginid = loginid.trim();
      password = password.trim();

      const [learner] = await db.sequelize.query(
        `SELECT learner_id, firstname, lastname, email, mobile, password, isverified 
       FROM learners  
       WHERE status = 'Active' AND BINARY username = ?`,
        {
          replacements: [loginid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!learner) {
        return {
          statusCode: 404,
          message: validation.messages.invalid_credentials,
        };
      }

      // 2. Check account verification
      if (learner.isverified === "No") {
        return {
          statusCode: 404,
          message: validation.messages.account_verification_pending,
        };
      }

      // 3. Check if learner is mapped to the event
      // const [mapping] = await db.sequelize.query(
      //   `SELECT eventid ,Loggedon,completedon
      //    FROM event_learners
      //    WHERE learner_id = ? AND eventid = ? AND deletedon IS NULL`,
      //   {
      //     replacements: [learner.learner_id, eventid],
      //     type: db.sequelize.QueryTypes.SELECT,
      //   }
      // );
      const [mapping] = await db.sequelize.query(
        `
  SELECT 
    el.eventlearnerid,
    el.vmrequestid,
    el.Loggedon,
    vr.completedon
  FROM event_learners el
  LEFT JOIN vm_request vr 
    ON vr.vmrequestid = el.vmrequestid
  WHERE el.learner_id = ?
    AND el.eventid = ?
    AND el.deletedon IS NULL
  LIMIT 1
  `,
        {
          replacements: [learner.learner_id, eventid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      console.log("mappingmappingmappingmapping", mapping);

      if (!mapping) {
        return {
          statusCode: 403,
          message: "You are not mapped to this event",
        };
      }
      if (mapping.completedon !== null) {
        return {
          statusCode: 403,
          message: "You have already completed this event",
        };
      }
      // 4. Check if current time is within event start and end time
      const [eventDetails] = await db.sequelize.query(
        `SELECT eventstarttime, eventendtime 
       FROM events 
       WHERE eventid = ? AND status IN ('Pending', 'Running')`,
        {
          replacements: [eventid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      const now = new Date();

      if (
        !eventDetails ||
        new Date(eventDetails.eventstarttime) > now ||
        new Date(eventDetails.eventendtime) < now
      ) {
        return {
          statusCode: 403,
          message: "Login not allowed outside the event time window",
        };
      }

      // 5. Compare password
      const isMatch = await bcrypt.compare(password, learner.password);

      if (isMatch) {
        // 6. Update Loggedon time in event_learners
        await db.sequelize.query(
          `UPDATE event_learners 
         SET Loggedon = NOW() 
         WHERE learner_id = ? AND eventid = ? AND deletedon IS NULL`,
          {
            replacements: [learner.learner_id, eventid],
          }
        );

        await db.sequelize.query(
          `UPDATE events 
   SET status = 'Running' 
   WHERE eventid = ? AND status != 'Running'`,
          {
            replacements: [eventid],
          }
        );
        // 7. Generate and update OTP
        const otp = 111111; // Replace with actual random OTP if needed

        await db.sequelize.query(
          `UPDATE learners 
         SET otp = ?, otptimeout = DATE_ADD(NOW(), INTERVAL ? MINUTE) 
         WHERE learner_id = ? AND status = 'Active'`,
          {
            replacements: [otp, keys.OTP_TIMEOUT, learner.learner_id],
          }
        );

        // 8. Send OTP email
        const payload = {
          learner_id: learner.learner_id.toString(),
          otp: otp.toString(),
          otp_timeout: keys.OTP_TIMEOUT,
        };
        new MailTemplate(db, "learner_otp_email", payload);

        // 9. Clean and return response
        delete learner.password;

        return {
          statusCode: 200,
          message: "Login successful, OTP sent",
          learner,
        };
      } else {
        return {
          statusCode: 404,
          message: validation.messages.invalid_credentials,
        };
      }
    } catch (error) {
      console.error("Error in checklogin function:", error);
      return { statusCode: 500, message: "Internal server error" };
    }
  };

const verifylogin =
  ({ db }) =>
  async ({ loginid, password, otp, eventid }) => {
    loginid = loginid.trim();
    password = password.trim();
    const [learner] = await db.sequelize.query(
      `SELECT
  l.learner_id,
  l.learner_uuid,
  l.firstname,
  l.lastname,
  l.email,
  l.mobile,
  l.password,
  l.profile,
  l.instructor_id,
  el.eventid,
  e.eventuuid
FROM
  learners l
INNER JOIN
  event_learners el ON l.learner_id = el.learner_id AND el.eventid = ${eventid}
 INNER JOIN 
  events e on e.eventid = el.eventid
WHERE
  l.status = 'Active'
  AND BINARY l.username = ?
  AND l.otp = '${otp}'
  AND l.otptimeout >= NOW();`,
      { replacements: [loginid, otp], type: db.sequelize.QueryTypes.SELECT }
    );
    if (!learner) {
      return { statusCode: 401, message: "Invalid credentials" };
    }

    console.log("learnerlearner", learner);
    const isMatch = await bcrypt.compare(password, learner.password);
    if (isMatch == true) {
      delete learner.password;
      if (learner) {
        await db.sequelize.query(
          `UPDATE learners set otp=null, otptimeout=null where learner_id = ? and status ='Active'`,
          { replacements: [learner.learner_id] }
        );
        // return learner;
        return { statusCode: 200, learner };
      }
    } else {
      return { statusCode: 401, message: "Invalid credentials" };
    }
  };
const verifyDirectLogin =
  ({ db, validation }) =>
  async ({ loginid, password, eventid }) => {
    try {
      loginid = loginid.trim();
      password = password.trim();
      // 1. Fetch learner and mapping info
      const [learner] = await db.sequelize.query(
        `SELECT
        l.learner_id,
        l.learner_uuid,
        l.firstname,
        l.lastname,
        l.email,
        l.mobile,
        l.password,
        l.profile,
        l.instructor_id,
        l.isverified,
        el.eventid,
        el.Loggedon,
        el.deletedon,
        e.eventuuid,
        e.eventstarttime,
        e.eventendtime,
        e.status as eventstatus
      FROM learners l
      LEFT JOIN event_learners el ON l.learner_id = el.learner_id AND el.eventid = ?
      LEFT JOIN events e ON e.eventid = el.eventid
      WHERE l.status = 'Active' AND BINARY l.username = ?`,
        {
          replacements: [eventid, loginid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      // 2. Check if learner exists
      if (!learner) {
        return {
          statusCode: 404,
          message:
            validation?.messages?.invalid_credentials || "Invalid credentials",
        };
      }
      const [mapping] = await db.sequelize.query(
        `
  SELECT 
    el.eventlearnerid,
    el.vmrequestid,
    el.Loggedon,
    vr.completedon
  FROM event_learners el
  LEFT JOIN vm_request vr 
    ON vr.vmrequestid = el.vmrequestid
  WHERE el.learner_id = ?
    AND el.eventid = ?
    AND el.deletedon IS NULL
  LIMIT 1
  `,
        {
          replacements: [learner.learner_id, eventid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      console.log("mappingmappingmappingmapping", mapping);

      if (!mapping) {
        return {
          statusCode: 403,
          message: "You are not mapped to this event",
        };
      }
      if (mapping.completedon !== null) {
        return {
          statusCode: 403,
          message: "You have already completed this event",
        };
      }

      // 7. Compare password
      const isMatch = await bcrypt.compare(password, learner.password);
      if (!isMatch) {
        return {
          statusCode: 404,
          message:
            validation?.messages?.invalid_credentials || "Invalid credentials",
        };
      }

      // 8. Update Loggedon
      await db.sequelize.query(
        `UPDATE event_learners  
       SET Loggedon = NOW() 
       WHERE learner_id = ? AND eventid = ? AND deletedon IS NULL`,
        {
          replacements: [learner.learner_id, eventid],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      // 9. Clean and return learner
      delete learner.password;
      return {
        statusCode: 200,
        message: "Login successful",
        learner,
      };
    } catch (error) {
      console.error("Error in verifyDirectLogin:", error);
      return { statusCode: 500, message: "Internal server error" };
    }
  };

const learnermenu =
  ({ db }) =>
  async ({ tutor_id }) => {
    return [
      {
        source: "/event-dashboard",
        path: "/components/events/dashboard",
        icon: "ti-home",
        type: "link",
        active: false,
        selected: false,
        title: "Dashboard",
        sub_path: "/components/events/view/vnc_event_view/[...slug]" 
      },
    ];
  };

const geteventlist =
  ({ db }) =>
  async () => {
    try {
      const query = `
      SELECT
        DATE(e.eventstarttime) AS event_date,
        e.eventid,
        e.eventname
      FROM
        events e
      WHERE
        e.status != 'Completed'
        AND NOW() BETWEEN e.eventstarttime AND e.eventendtime
      ORDER BY
        e.eventstarttime ASC
    `;

      const result = await db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      return { statusCode: 200, data: result };
    } catch (error) {
      console.error("DAO Error in geteventlist:", error);
      return { statusCode: 500, message: "Internal server error" };
    }
  };

module.exports = {
  checklogin,
  verifylogin,
  verifyDirectLogin,
  learnermenu,
  geteventlist,
};
