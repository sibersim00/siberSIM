const labSessionList =
  ({ db }) =>
  async (usertype, session_userid) => {
    let whereClause = `WHERE ls.deletedon IS NULL`;

    // If Instructor → show only instructor-created sessions
    const replacements = {};
    if (usertype === "Instructor") {
      whereClause += ` AND ls.createdby = :_session_userid`;
      replacements._session_userid = session_userid;
    }

    const [res] = await db.sequelize.query(
      `
    SELECT  ls.labid AS lab_id, ls.labuuid, ls.bookingname, DATE_FORMAT(ls.datetime, '%Y-%m-%d %H:%i:%s') AS datetime, ls.duration, ls.accesslevel, ls.personincharge, CONCAT(u.firstname, ' ', u.lastname) AS personincharge_name, ls.reservedseats, (  SELECT  CONCAT( '[', GROUP_CONCAT( CONCAT( '{"learner_id":"', l.learner_id, '","name":"', l.firstname, ' ', IFNULL(l.lastname,''), '"}' ) ), ']' ) FROM learners l WHERE JSON_CONTAINS( ls.allowedusers, CONCAT('"', l.learner_id, '"'), '$' ) ) AS allowed_user_details, CASE WHEN ls.status = 'Active' THEN 'true' ELSE 'false' END AS status, DATE_FORMAT(ls.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(ls.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon FROM lab_sessions ls LEFT JOIN ad_users u  ON u.userid = ls.personincharge ${whereClause} ORDER BY ls.bookingname ASC;
      `,
      { replacements }
    );
    return res;
  };

const save =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const errors = [];
      const startTime = new Date(body.datetime); // Start datetime
      const endTime = new Date(
        startTime.getTime() + body.duration * 60 * 60 * 1000
      );

      // -----------------------------------------
      // Overlap Seat Calculation
      // -----------------------------------------
      const MAX_SEATS = 20;

      const overlappingSessions = await db.sequelize.query(
        `
  SELECT reservedseats, datetime, duration
  FROM lab_sessions
  WHERE deletedon IS NULL
    AND (
        :new_start < DATE_ADD(datetime, INTERVAL duration HOUR)
        AND :new_end > datetime
    )
  `,
        {
          replacements: { new_start: startTime, new_end: endTime },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      let alreadyReserved = 0;

      // Sum seats of overlapping sessions
      overlappingSessions.forEach((session) => {
        alreadyReserved += session.reservedseats;
      });

      const availableSeats = MAX_SEATS - alreadyReserved;

      // Check if new request exceeds available seats
      if (body.reservedseats > availableSeats) {
        errors.push(
          `Only ${availableSeats} seats are available in this time slot.`
        );
      }

      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "" };
      }

      // -------------------------------
      // Duplicate Check: bookingname + datetime
      // -------------------------------
      if (body.bookingname && body.datetime) {
        const [existing] = await db.sequelize.query(
          `SELECT labid 
           FROM lab_sessions 
           WHERE bookingname = :_bookingname 
             AND datetime = :_datetime
             AND deletedon IS NULL`,
          {
            replacements: {
              _bookingname: body.bookingname.trim(),
              _datetime: body.datetime,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (existing) {
          errors.push(
            validation.messages.duplicate_lab ||
              "Lab session already exists for the selected time."
          );
        }
      }

      // If duplicates found -> return
      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "" };
      }

      // -------------------------------
      // Insert Lab Session
      // -------------------------------
      const insertQuery = `
        INSERT INTO lab_sessions (
          labuuid,
          bookingname,
          datetime,
          duration,
          accesslevel,
          personincharge,
          reservedseats,
          allowedusers,
          status,
          createdby,
          createdon
        ) VALUES (
          UUID(),
          :bookingname,
          :datetime,
          :duration,
          :accesslevel,
          :personincharge,
          :reservedseats,
          :allowedusers,
          'Active',
          :createdby,
          CURRENT_TIMESTAMP
        )
      `;

      await db.sequelize.query(insertQuery, {
        replacements: {
          bookingname: body.bookingname?.trim() || null,
          datetime: body.datetime || null,
          duration: body.duration || null,
          accesslevel: body.accesslevel || null,
          personincharge: body.personincharge || null,
          reservedseats: body.reservedseats || null,
          allowedusers: body.allowedusers
            ? JSON.stringify(body.allowedusers)
            : null,
          createdby: session_userid,
        },
      });

      return {
        statusCode: 200,
        message:
          validation.messages.add_labsession ||
          "Lab session added successfully.",
      };
    } catch (error) {
      console.error("Error saving lab session:", error.message);
      throw error;
    }
  };

const update =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const errors = [];
      const startTime = new Date(body.datetime);
      const endTime = new Date(
        startTime.getTime() + body.duration * 60 * 60 * 1000
      );

      // --------------------------------
      // Check if lab session exists
      // --------------------------------
      const [existingLab] = await db.sequelize.query(
        `SELECT labid 
         FROM lab_sessions 
         WHERE labid = :_id AND deletedon IS NULL`,
        {
          replacements: { _id: body.lab_id },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existingLab) {
        return {
          statusCode: 404,
          message:
            validation.messages.data_not_found || "Lab session not found.",
        };
      }

      // -----------------------------------------
      // Time Overlap Check excluding current
      // -----------------------------------------
      const MAX_SEATS = 20;

      const overlappingSessions = await db.sequelize.query(
        `
  SELECT reservedseats
  FROM lab_sessions
  WHERE deletedon IS NULL
    AND labid != :_id
    AND (
        :new_start < DATE_ADD(datetime, INTERVAL duration HOUR)
        AND :new_end > datetime
    )
  `,
        {
          replacements: {
            _id: body.lab_id,
            new_start: startTime,
            new_end: endTime,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      let alreadyReserved = 0;

      overlappingSessions.forEach((s) => {
        alreadyReserved += s.reservedseats;
      });

      const availableSeats = MAX_SEATS - alreadyReserved;

      if (body.reservedseats > availableSeats) {
        errors.push(
          `Only ${availableSeats} seats are available in this time slot.`
        );
      }

      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "" };
      }

      // -----------------------------------------
      // Duplicate bookingname + datetime check
      // -----------------------------------------
      const [existing] = await db.sequelize.query(
        `SELECT labid FROM lab_sessions
         WHERE bookingname = :_bookingname
           AND datetime = :_datetime
           AND deletedon IS NULL
           AND labid != :_id`,
        {
          replacements: {
            _bookingname: body.bookingname.trim(),
            _datetime: body.datetime,
            _id: body.lab_id,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (existing) {
        errors.push(
          validation.messages.duplicate_lab ||
            "Lab session already exists for the selected time."
        );
      }

      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "" };
      }

      // --------------------------------
      // Update Query
      // --------------------------------
      const updateQuery = `
        UPDATE lab_sessions
        SET bookingname = :bookingname,
            datetime = :datetime,
            duration = :duration,
            accesslevel = :accesslevel,
            personincharge = :personincharge,
            reservedseats = :reservedseats,
            allowedusers = :allowedusers,
            status = :status,
            modifiedby = :modifiedby,
            modifiedon = CURRENT_TIMESTAMP
        WHERE labid = :lab_id
      `;

      await db.sequelize.query(updateQuery, {
        replacements: {
          lab_id: body.lab_id,
          bookingname: body.bookingname?.trim() || null,
          datetime: body.datetime || null,
          duration: body.duration || null,
          accesslevel: body.accesslevel || null,
          personincharge: body.personincharge || null,
          reservedseats: body.reservedseats || null,
          allowedusers: body.allowedusers
            ? JSON.stringify(body.allowedusers)
            : null,
          status: body.status || "Active",
          modifiedby: session_userid,
        },
      });

      return {
        statusCode: 200,
        message:
          validation.messages.update_labsession ||
          "Lab session updated successfully.",
      };
    } catch (error) {
      console.error("Error updating lab session:", error.message);
      throw error;
    }
  };

const deleteById =
  ({ db }) =>
  async (body, session_userid) => {
    try {
      const labId = body.lab_id;

      // 1. Check if lab session exists & not already deleted
      const [existing] = await db.sequelize.query(
        `
        SELECT labid 
        FROM lab_sessions
        WHERE labid = :labId AND deletedon IS NULL
        `,
        {
          replacements: { labId },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existing) {
        return {
          status: false,
          message: "Lab session not found or already deleted.",
        };
      }

      // 2. Soft delete lab session
      await db.sequelize.query(
        `
        UPDATE lab_sessions
        SET deletedon = NOW(), modifiedby = :modifiedBy
        WHERE labid = :labId
        `,
        {
          replacements: {
            labId,
            modifiedBy: session_userid,
          },
        }
      );

      return {
        status: true,
        message: "Lab session deleted successfully.",
      };
    } catch (error) {
      console.error("Error in deleteById (lab):", error);
      throw new Error("Failed to delete lab session due to database error.");
    }
  };

const changeStatus =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const status = body.status === "true" ? "Active" : "Inactive";

      // --- Check if the lab session exists ---
      const [existingLab] = await db.sequelize.query(
        `SELECT labid 
         FROM lab_sessions 
         WHERE labid = ? 
           AND deletedon IS NULL`,
        {
          replacements: [body.lab_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existingLab) {
        return {
          statusCode: 404,
          message:
            validation.messages.data_not_found || "Lab session not found.",
        };
      }

      // --- Update lab session status ---
      await db.sequelize.query(
        `
        UPDATE lab_sessions 
        SET status = ?, 
            modifiedby = ?, 
            modifiedon = CURRENT_TIMESTAMP
        WHERE labid = ?
        `,
        {
          replacements: [status, session_userid, body.lab_id],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      return {
        statusCode: 200,
        message:
          validation.messages.status_change ||
          "Lab session status updated successfully.",
      };
    } catch (error) {
      console.error("Error updating lab session status:", error);
      throw error;
    }
  };

module.exports = {
  labSessionList,
  save,
  update,
  deleteById,
  changeStatus,
};
