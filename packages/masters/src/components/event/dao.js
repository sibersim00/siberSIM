const MailTemplate = require("../../utils/mailUtility");
const bcrypt = require("bcryptjs");

// const getAll =
//   ({ db }) =>
//   async () => {
//     try {
//       const eventlist = `SELECT e.eventid, e.eventuuid, e.eventname, e.eventdescription, e.scenarioid, e.eventstarttime, e.eventendtime,e.status, s.scenariotitle ,
//       DATE_FORMAT(e.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
//       DATE_FORMAT(e.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
//       from events e
//       LEFT JOIN scenarios s on s.scenarioid = e.scenarioid`;
//       let [res] = await db.sequelize.query(eventlist);
//       return res;
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       throw new Error("An error occurred. Please try again later.");
//     }
//   };

const getAll =
  ({ db }) =>
  async () => {
    try {
      const eventlist = `
        SELECT 
          e.eventid, 
          e.eventuuid, 
          e.eventname, 
          e.eventdescription, 
          e.scenarioid, 
          DATE_FORMAT(e.eventstarttime, '%Y-%m-%d %H:%i:%s') AS eventstarttime,
          DATE_FORMAT(e.eventendtime, '%Y-%m-%d %H:%i:%s') AS eventendtime,
          e.status, 
          s.scenariotitle,
          DATE_FORMAT(e.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
          DATE_FORMAT(e.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
        FROM events e
        LEFT JOIN scenarios s ON s.scenarioid = e.scenarioid
      `;

      let [res] = await db.sequelize.query(eventlist);
      return res;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("An error occurred. Please try again later.");
    }
  };


const save = ({ db }) => async (body, userid) => {
  try {
    const existingEvents = await db.sequelize.query(
      `SELECT * FROM events WHERE eventname = :eventname and scenarioid = :scenarioid`,
      {
        replacements: { eventname: body.eventname, scenarioid: body.scenarioid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (existingEvents.length > 0) {
      return { statusCode: 400 }; // DAO returns only statusCode
    }

    await db.sequelize.query(
      `INSERT INTO events (eventuuid, eventname, eventdescription, scenarioid, eventstarttime, eventendtime, status, createdby, createdon)
       VALUES (UUID(), :eventname, :eventdescription, :scenarioid, :eventstarttime, :eventendtime, :status, :userid, NOW())`,
      {
        replacements: {
          eventname: body.eventname,
          eventdescription: body.eventdescription,
          scenarioid: body.scenarioid,
          eventstarttime: body.eventstarttime,
          eventendtime: body.eventendtime,
          status: body.status || 'Pending',
          userid,
        },
      }
    );

    return { statusCode: 200 };
  } catch (error) {
    console.error("Error saving event:", error);
    return { statusCode: 500 };
  }
};


const update = ({ db }) => async (body, userid) => {
  try {
    // Check if event exists
    const existingEvent = await db.sequelize.query(
      `SELECT * FROM events WHERE eventid = :eventid`,
      {
        replacements: { eventid: body.eventid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (existingEvent.length === 0) {
      return { statusCode: 404 };
    }

    // Check for duplicate event name
    const duplicate = await db.sequelize.query(
      `SELECT * FROM events WHERE eventname = :eventname AND scenarioid = :scenarioid AND eventid != :eventid `,
      {
        replacements: { eventname: body.eventname,scenarioid: body.scenarioid, eventid: body.eventid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (duplicate.length > 0) {
      return { statusCode: 400 };
    }
 
    // Perform the update
    await db.sequelize.query(
      `UPDATE events SET eventname = :eventname, eventdescription = :eventdescription, scenarioid = :scenarioid, eventstarttime = :eventstarttime, eventendtime = :eventendtime, status = :status, modifiedby = :userid, modifiedon = NOW()
       WHERE eventid = :eventid`,
      {
        replacements: {
          eventid: body.eventid,
          eventname: body.eventname,
          eventdescription: body.eventdescription,
          scenarioid: body.scenarioid,
          eventstarttime: body.eventstarttime,
          eventendtime: body.eventendtime,
          status: body.status || 'Pending',
          userid,
        },
      }
    );

    return { statusCode: 200 };

  } catch (error) {
    console.error("Error updating event:", error);
    return { statusCode: 500 };
  }
};

const addParticipants =
  ({ db, validation }) =>
  async (body, userid) => {
    try {
      const errors = [];

      async function checkDuplicate(field, value) {
        if (!value || value === "") return false;
        const query = `SELECT * FROM learners WHERE ${field} = :value AND deletedon IS NULL`;
        const replacements = { value };
        const [existing] = await db.sequelize.query(query, {
          replacements,
          type: db.sequelize.QueryTypes.SELECT,
        });

        return !!existing;
      }

      const mobile =
        body.mobile && body.mobile.toString().trim() !== ""
          ? body.mobile.toString().trim()
          : null;

      if (await checkDuplicate("mobile", mobile)) {
        errors.push(validation.messages.mobile_duplicate);
      }
      if (await checkDuplicate("email", body.email)) {
        errors.push(validation.messages.email_duplicate);
      }
      if (await checkDuplicate("username", body.username)) {
        errors.push(validation.messages.username_duplicate);
      }

      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "Username or Email already exist" };
      }

      const hashedPassword = await bcrypt.hash(body.password, 10);
      const insertLearnerQuery = `
        INSERT INTO learners (
          learner_uuid,
          firstname,
          lastname,
          email,
          mobile,
          username,
          password,
          isverified,
          createdby,
          createdon
        ) VALUES (
          UUID(),
          ?, ?, ?, ?, ?, ?, 'yes', ?, CURRENT_TIMESTAMP
        )
      `;

      const insertParams = [
        body.firstname,
        body.lastname,
        body.email,
        mobile,
        body.username,
        hashedPassword,
        userid,
      ];

      const [result, metadata] = await db.sequelize.query(insertLearnerQuery, {
        replacements: insertParams,
        type: db.sequelize.QueryTypes.INSERT,
      });

      // Get the inserted learner_id
      const learner_id = metadata?.insertId || result;
      const eventid = body.eventid;

      if (!learner_id || !eventid) {
        return {
          statusCode: 400,
          errors: ["Failed to get learner ID or event ID"],
          message: "",
        };
      }

      // Insert into event_learners
      const insertMappingQuery = `
        INSERT INTO event_learners (
          learner_id, eventid,team_name,
          team_description, createdby, createdon
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await db.sequelize.query(insertMappingQuery, {
        replacements: [
          learner_id,
          eventid,
          body.team_name,
          body.team_description,
          userid,
        ],
        type: db.sequelize.QueryTypes.INSERT,
      });

      return {
        statusCode: 200,
      };
    } catch (error) {
      console.error("Error Save Student Submit:", error);
      throw error;
    }
  };

const addLearnerEvent =
  ({ db, validation }) =>
  async (body, userid) => {
    try {
      const eventid = body.eventid;
      const learner_id = Array.isArray(body.learner_id)
        ? body.learner_id[0]?.learner_id
        : body.learner_id;

      if (!learner_id || !eventid) {
        return {
          statusCode: 400,
          errors: ["Invalid learner_id or eventid"],
          message: "",
        };
      }
      const insertQuery = `
        INSERT INTO event_learners (
          learner_id, eventid,team_name,team_description, createdby, createdon
        ) VALUES (?, ?, ?,?,?, CURRENT_TIMESTAMP)
      `;

      await db.sequelize.query(insertQuery, {
        replacements: [learner_id, eventid,body.team_name,body.team_description, userid],
        type: db.sequelize.QueryTypes.INSERT,
      });

      return {
        statusCode: 200,
        message:
          validation.messages?.add_success || "Mapping added successfully",
      };
    } catch (error) {
      console.error("Error in addLearnerEvent:", error);
      throw error;
    }
  };

const getLearnersByEvent =
  ({ db }) =>
  async (eventid) => {
    try {
      const query = `
      SELECT 
        elm.eventlearnerid,
        elm.learner_id,
        l.firstname,
        l.lastname,
        l.email,
        l.mobile,
        l.username,
        elm.team_name,
        elm.team_description,
        elm.eventlearnerid
      FROM event_learners elm
      INNER JOIN learners l ON elm.learner_id = l.learner_id
      WHERE elm.eventid = :eventid AND elm.deletedon IS NULL
      ORDER BY elm.eventlearnerid DESC, 
      CASE WHEN elm.modifiedon IS NOT NULL THEN elm.modifiedon ELSE elm.createdon END DESC 
    `;

      const results = await db.sequelize.query(query, {
        replacements: { eventid },
        type: db.sequelize.QueryTypes.SELECT,
      });
      return {
        statusCode: 200,
        message: "Learners fetched successfully",
        data: results, // this is now an array of learner records
      };
    } catch (error) {
      console.error("Error in getLearnersByEvent DAO:", error);
      throw error;
    }
  };

const deleteLearnerFromEvent =
  ({ db }) =>
  async ({ eventlearnerid }) => {
    try {
      const query = `
      UPDATE event_learners
      SET deletedon = CURRENT_TIMESTAMP
      WHERE eventlearnerid = :eventlearnerid
        
        AND deletedon IS NULL
    `;

      await db.sequelize.query(query, {
        replacements: { eventlearnerid },
      });

      return {
        statusCode: 200,
        message: "Learner successfully removed from the event.",
      };
    } catch (error) {
      console.error("Error in deleteLearnerFromEvent DAO:", error);
      throw error;
    }
  };

const updateParticipant =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const { learner_id, firstname, lastname, email, mobile, username,eventlearnerid,team_name,team_description } = body;

      if (!learner_id) {
        return {
          statusCode: 400,
          errors: ["Missing learner_id"],
          message: "",
        };
      }

      const errors = [];

      async function checkDuplicate(field, value) {
        if (!value || value === "") return false;
        const query = `
        SELECT * FROM learners 
        WHERE ${field} = :value 
          AND learner_id != :learner_id 
          AND deletedon IS NULL
      `;
        const replacements = { value, learner_id };

        const [existing] = await db.sequelize.query(query, {
          replacements,
          type: db.sequelize.QueryTypes.SELECT,
        });

        return !!existing;
      }

      if (await checkDuplicate("mobile", mobile)) {
        errors.push(validation.messages.mobile_duplicate);
      }
      if (await checkDuplicate("email", email)) {
        errors.push(validation.messages.email_duplicate);
      }
      if (await checkDuplicate("username", username)) {
        errors.push(validation.messages.username_duplicate);
      }

      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "" };
      }

      const updateQuery = `
      UPDATE learners SET
        firstname = ?, 
        lastname = ?, 
        email = ?, 
        mobile = ?, 
        username = ?, 
        modifiedby = ?, 
        modifiedon = CURRENT_TIMESTAMP
      WHERE learner_id = ?
    `;

      await db.sequelize.query(updateQuery, {
        replacements: [
          firstname,
          lastname,
          email,
          mobile,
          username,
          session_userid,
          learner_id,
        ],
        type: db.sequelize.QueryTypes.UPDATE,
      });



   const updateEventLearnerQuery = `
      UPDATE event_learners SET
        team_name = ?, 
        team_description = ?, 
        modifiedby = ?, 
        modifiedon = CURRENT_TIMESTAMP
      WHERE eventlearnerid = ?
    `;
      await db.sequelize.query(updateEventLearnerQuery, {
        replacements: [
          team_name,
          team_description,
          session_userid,
          eventlearnerid
        ],
        type: db.sequelize.QueryTypes.UPDATE,
      });



      return {
        statusCode: 200,
        message:
          validation.messages.update_success ||
          "Participant updated successfully",
      };
    } catch (error) {
      console.error("Error in updateParticipant DAO:", error);
      throw error;
    }
  };

module.exports = {
  getAll,
  save,
  update,
  addParticipants,
  addLearnerEvent,
  getLearnersByEvent,
  deleteLearnerFromEvent,
  updateParticipant,
};