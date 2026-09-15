const MailTemplate = require("../../utils/mailUtility");
const bcrypt = require("bcryptjs");
const constants = require("../../services/proxmox/constants");
const { v4: uuidv4 } = require("uuid");
const generateUUID = () => uuidv4();


const getAll =
  ({ db }) =>
  async (session_userid, usertype) => {
    if (usertype == "Admin" || usertype == "WebhookUser") {
      let [res] = await db.sequelize
        .query(`SELECT  t.learner_id, t.learner_uuid, t.firstname, t.lastname, t.isverified, CASE WHEN t.mobile = 0 THEN '' ELSE t.mobile END AS mobile, t.email, t.profile, t.username, DATE_FORMAT(t.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(t.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon, CASE WHEN t.status = 'Active' THEN 'true' ELSE 'false' END AS status FROM learners t WHERE t.deletedon IS NULL ORDER BY t.firstname ASC`);
      return res;
    } else {
      let res = await db.sequelize.query(
        `select t.learner_id,t.learner_uuid,t.firstname,t.lastname,t.isverified,CASE WHEN t.mobile = 0 THEN '' ELSE t.mobile 
      END AS mobile,t.email,t.profile,t.username,
       DATE_FORMAT(t.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
      DATE_FORMAT(t.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon,   
      CASE WHEN t.status = 'Active' THEN 'true' ELSE 'false' END AS status
        from learners t  
        inner join learner_instructor_map lim on lim.learner_id = t.learner_id and lim.deletedon is null and lim.instructor_id =:_userid 
       
        group by t.learner_id
        ORDER by CASE WHEN t.modifiedon IS NOT NULL then t.modifiedon ELSE t.createdon END  DESC`,
        {
          replacements: {
            _userid: session_userid,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return res;
    }
  };

const statusChange =
  ({ db, validation }) =>
    async (body) => {
      try {
        const status = body.status === "true" ? "Active" : "Inactive";
        const updateQuery = ` UPDATE learners SET status =?, modifiedon=CURRENT_TIMESTAMP,modifiedby=? WHERE learner_uuid=?`;
        const queryParams = [status, body.userid, body.learner_uuid];

        await db.sequelize.query(updateQuery, {
          replacements: queryParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });

        return { statusCode: 200, message: validation.messages.status_change };
      } catch (error) {
        console.error("Error System Config Submit:", error);
        throw error;
      }
    };


const save = ({ db, validation }) =>
  async (body, session_userid, usertype) => {
    try {
      const errors = [];

      // Helper to check duplicates in learners table
      async function checkDuplicate(field, value, excludeLearnerId = null) {
        if (!value || value === "") return false;
        let query = `SELECT * FROM learners WHERE ${field} = :value AND deletedon IS NULL`;
        const replacements = { value };

        if (excludeLearnerId) {
          query += ` AND learner_id != :excludeLearnerId`;
          replacements.excludeLearnerId = excludeLearnerId;
        }

        const [existing] = await db.sequelize.query(query, {
          replacements,
          type: db.sequelize.QueryTypes.SELECT,
        });

        return !!existing;
      }

      // Sanitize mobile input
      const mobile = body.mobile && body.mobile.toString().trim() !== ""
        ? body.mobile.toString().trim()
        : null;

      // Determine instructor_id: use body.instructor_id if given, else null
      const instructorId = session_userid;

      if (body.learner_id) {
        // UPDATE case

        // Validate duplicates excluding current learner_id
        if (await checkDuplicate("mobile", body.mobile, body.learner_id)) {
          errors.push(validation.messages.mobile_duplicate);
        }
        if (await checkDuplicate("email", body.email, body.learner_id)) {
          errors.push(validation.messages.email_duplicate);
        }
        if (await checkDuplicate("username", body.username, body.learner_id)) {
          errors.push(validation.messages.username_duplicate);
        }

        if (errors.length > 0) {
          return { statusCode: 400, errors, message: "" };
        }

        // Update including instructor_id if you want to allow updating it
        const updateQuery = `
          UPDATE learners 
          SET firstname = ?, lastname = ?, email = ?, mobile = ?, username = ?, instructor_id = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ?
          WHERE learner_id = ?
        `;
        const updateParams = [
          body.firstname,
          body.lastname,
          body.email,
          mobile,
          body.username,
          instructorId,  // Added instructor_id here
          session_userid,
          body.learner_id,
        ];
        await db.sequelize.query(updateQuery, {
          replacements: updateParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });
        // If usertype is Instructor, add learner_instructor_map if not exists
        if (usertype === "Instructor") {
          const [existingMapping] = await db.sequelize.query(
            `
            SELECT * FROM learner_instructor_map 
            WHERE learner_id = :learner_id AND instructor_id = :instructor_id AND deletedon IS NULL
            `,
            {
              replacements: {
                learner_id: body.learner_id,
                instructor_id: session_userid,
              },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (!existingMapping) {
            const insertMappingQuery = `
              INSERT INTO learner_instructor_map (learner_id, instructor_id, createdby, createdon)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `;

            const mappingParams = [body.learner_id, session_userid, session_userid];

            await db.sequelize.query(insertMappingQuery, {
              replacements: mappingParams,
              type: db.sequelize.QueryTypes.INSERT,
            });
          }
        }

        return { statusCode: 200, message: validation.messages.update_success };
      } else {
        // INSERT case
        if (await checkDuplicate("mobile", body.mobile)) {
          errors.push(validation.messages.mobile_duplicate);
        }
        if (await checkDuplicate("email", body.email)) {
          errors.push(validation.messages.email_duplicate);
        }
        if (await checkDuplicate("username", body.username)) {
          errors.push(validation.messages.username_duplicate);
        }
        if (errors.length > 0) {
          return { statusCode: 400, errors, message: "" };
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Insert including instructor_id column
        const insertQuery = ` INSERT INTO learners ( learner_uuid, firstname, lastname, email, mobile, username, password, instructor_id, createdby, createdon ) VALUES ( UUID(), ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP ) `;

        const insertParams = [
          body.firstname,
          body.lastname,
          body.email,
          mobile,
          body.username,
          hashedPassword,
          instructorId,  // Added instructor_id here
          session_userid,
        ];

        const [result] = await db.sequelize.query(insertQuery, {
          replacements: insertParams,
          type: db.sequelize.QueryTypes.INSERT,
        });

        const insertedLearnerId = result && result.insertId ? result.insertId : result;

        // Map learner to instructor if usertype is Instructor

        const insertMappingQuery = `
              INSERT INTO learner_instructor_map (learner_id, instructor_id, createdby, createdon)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `;

        const mappingParams = [insertedLearnerId, session_userid, session_userid];

        await db.sequelize.query(insertMappingQuery, {
          replacements: mappingParams,
          type: db.sequelize.QueryTypes.INSERT,
        });


        // Send welcome email
        const payload = {
          learner_id: insertedLearnerId,
          password: body.password,
        };

        new MailTemplate(db, "learner_welcome_email", payload);

        return { statusCode: 200, message: validation.messages.add_success };
      }
    } catch (error) {
      console.error("Error Save Student Submit:", error);
      throw error;
    }
  };

const update =
  ({ db, validation }) =>
    async (body, session_userid, usertype) => {
      const errors = [];
      if (body.mobile && body.mobile !== "") {
        let [check_learner_mobile] = await db.sequelize.query(
          `
      select * from learners where mobile = :_mobile and learner_uuid!=:_learner_uuid and  deletedon is null
    `,
          {
            replacements: {
              _mobile: body.mobile,
              _learner_uuid: body.learner_uuid,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_learner_mobile) {
          errors.push(validation.messages.mobile_duplicate);
        }
      }

      if (body.email && body.email !== "") {
        let [check_learner_email] = await db.sequelize.query(
          `
      select * from learners where email = :_email  and learner_uuid!=:_learner_uuid and  deletedon is null
    `,
          {
            replacements: {
              _email: body.email,
              _learner_uuid: body.learner_uuid,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_learner_email) {
          errors.push(validation.messages.email_duplicate);
        }
      }

      if (body.username && body.username !== "") {
        let [check_learner_email] = await db.sequelize.query(
          `
      select * from learners where username = :_username  and learner_uuid!=:_learner_uuid and  deletedon is null
    `,
          {
            replacements: {
              _username: body.username,
              _learner_uuid: body.learner_uuid,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_learner_email) {
          errors.push(validation.messages.username_duplicate);
        }
      }

      if (errors.length > 0) {
        return { statusCode: 400, errors: errors, message: "" };
      }
      const mobile =
        body.mobile && body.mobile.toString().trim() !== ""
          ? body.mobile.toString().trim()
          : null;
      const updateQuery = `UPDATE learners SET firstname=?, lastname=?,  email=?, mobile=?,modifiedon=CURRENT_TIMESTAMP,modifiedby=? WHERE learner_uuid=?`;
      const updateParams = [
        body.firstname,
        body.lastname,
        body.email,
        mobile,
        session_userid,
        body.learner_uuid,
      ];
      try {
        await db.sequelize.query(updateQuery, {
          replacements: updateParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });

        // check if the mapping present or not for instructor
        if (usertype == "Instructor") {
          let [learnerRes] = await db.sequelize.query(
            `select learner_id from learners  where  learner_uuid=:_id`,
            {
              replacements: {
                _id: body.learner_uuid,
              },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          let check_learner_instructor_mapping = await db.sequelize.query(
            `
            select * from learner_instructor_map where learner_id = :_learner_id and instructor_id = :_instructor_id and deletedon is null
          `,
            {
              replacements: {
                _learner_id: learnerRes.learner_id,
                _instructor_id: session_userid,
              },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (check_learner_instructor_mapping.length === 0) {
            // add mapping

            const insertMappedQuery = `INSERT INTO learner_instructor_map (learner_id,instructor_id,createdby,createdon) VALUES (?,?,?,CURRENT_TIMESTAMP)`;

            const mappedQueryParams = [
              learnerRes.learner_id,
              session_userid,
              session_userid,
            ];

            await db.sequelize.query(insertMappedQuery, {
              replacements: mappedQueryParams,
              type: db.sequelize.QueryTypes.INSERT,
            });
          }
        }

        return { statusCode: 200, message: validation.messages.update_success };
      } catch (error) {
        console.error("Error System Config Submit:", error);
        throw error;
      }
    };

const resetpassword =
  ({ db }) =>
    async (id) => {
      try {
        const uuid = generateUUID();
        const uuidSubstring = uuid.slice(0, 6);
        const currentYear = new Date().getFullYear();
        const password = `${uuidSubstring}$${currentYear}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [res] = await db.sequelize.query(
          `UPDATE learners SET password = :_password WHERE learner_id = :_learner_id`,
          {
            replacements: {
              _password: hashedPassword,
              _learner_id: id,
            },
          }
        );

        const payload = {
          learner_id: id,
          password: password,
        };
        new MailTemplate(db, "learner_reset_password", payload);

        return res;
      } catch (error) {
        console.error("Error resetting password:", error);
        throw new Error("Failed to reset password.");
      }
    };

const getMappedInstructor =
  ({ db }) =>
    async (id) => {
      try {
        const res = await db.sequelize.query(
          `SELECT learnerinstructorid, learner_id, instructor_id, CONCAT(au.firstname, " ", au.lastname)  AS instructor_name
         FROM learner_instructor_map lim
         LEFT JOIN ad_users au ON au.userid = lim.instructor_id AND au.deletedon IS NULL
         WHERE lim.deletedon IS NULL AND lim.learner_id = :_id`,
          {
            replacements: { _id: id },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        // Since only one instructor per learner, return the first entry or null
        return res[0] || null;
      } catch (error) {
        console.error("Error fetching mapped instructor:", error);
        throw new Error("Failed to retrieve mapped instructor.");
      }
    };

const saveMappedInstructors =
  ({ db }) =>
    async (learner_id, instructorlist, session_userid) => {
      //DELETE EXISTING MAPPING
      await db.sequelize.query(
        `DELETE FROM learner_instructor_map WHERE learner_id = :learner_id`,
        { replacements: { learner_id } }
      );
      for (const item of instructorlist) {
        await db.sequelize.query(
          `INSERT INTO learner_instructor_map (learner_id, instructor_id, createdby, createdon)VALUES (:learner_id, :instructor_id, :createdby, NOW())`,
          {
            replacements: {
              learner_id,
              instructor_id: item.instructor_id,
              createdby: session_userid,
            },
          }
        );
        await db.sequelize.query(`UPDATE learners  SET instructor_id = :instructor_id,  modifiedby = :modifiedby,  modifiedon = NOW()  WHERE learner_id = :learner_id`,
          {
            replacements: {
              learner_id,
              instructor_id: item.instructor_id,
              modifiedby: session_userid,
            },
          }
        );
      }
    };

const mailConfirmation = ({ db, validation }) => async (learner_id) => {
  try {
    let [check_learner] = await db.sequelize.query(
      `select learner_id,learner_uuid,isverified from learners where learner_id=:_id and deletedon is null `,

      {
        replacements: {
          _id: learner_id,
        },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (check_learner) {
      if (check_learner.isverified == 'No') {
        const updateQuery = `UPDATE learners SET isverified=? WHERE learner_id=?`;
        const updateParams = ['Yes', learner_id];
        await db.sequelize.query(updateQuery, {
          replacements: updateParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });
        let payload = {
          learner_id: learner_id
        }
        new MailTemplate(db, "learner_account_confirmation_success", payload);
        return { 'statusCode': 200, 'message': validation.messages.verification_email };
      } else {
        return { 'statusCode': 400, 'message': validation.messages.learner_not_found };
      }
    } else {
      return { 'statusCode': 400, 'message': validation.messages.learner_not_found };
    }
  } catch (error) {
    console.error('Error System Config Submit:', error);
    throw error;
  }

}

const normalizeImportRow = (row, index) => ({
  rowNumber: row.rowNumber || index + 2,
  firstname: String(row.firstname || '').trim(),
  lastname: String(row.lastname || '').trim(),
  email: String(row.email || '').trim().toLowerCase(),
  mobile: row.mobile == null ? '' : String(row.mobile).trim(),
  username: String(row.username || '').trim(),
  status: row.status || 'Active',
});

const getExistingImportValues = async (db, field, values) => {
  if (!values.length) return new Set();
  const rows = await db.sequelize.query(
    `SELECT ${field} FROM learners WHERE LOWER(${field}) IN (:values) AND deletedon IS NULL`,
    {
      replacements: { values: values.map((value) => value.toLowerCase()) },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  return new Set(rows.map((row) => String(row[field]).toLowerCase()));
};

const addDuplicateIssues = (row, issues, seen, existingEmails, existingMobiles, existingUsernames) => {
  const fields = [
    ['email', row.email.toLowerCase(), existingEmails, 'email'],
    ['mobile', row.mobile.toLowerCase(), existingMobiles, 'mobile number'],
    ['username', row.username.toLowerCase(), existingUsernames, 'username'],
  ];
  fields.forEach(([field, value, existing, label]) => {
    if (!value) return;
    if (existing.has(value)) issues.push({ field, message: `This ${label} is already registered.` });
    else if (seen[field].has(value)) issues.push({ field, message: `This ${label} is repeated in the file.` });
    seen[field].add(value);
  });
};

const verifyLearnerImport = ({ db, validation }) => async (body) => {
  const rows = body.map(normalizeImportRow);
  const emails = [...new Set(rows.map((row) => row.email).filter(Boolean))];
  const mobiles = [...new Set(rows.map((row) => row.mobile).filter(Boolean))];
  const usernames = [...new Set(rows.map((row) => row.username).filter(Boolean))];
  const [existingEmails, existingMobiles, existingUsernames] = await Promise.all([
    getExistingImportValues(db, 'email', emails),
    getExistingImportValues(db, 'mobile', mobiles),
    getExistingImportValues(db, 'username', usernames),
  ]);
  const seen = { email: new Set(), mobile: new Set(), username: new Set() };
  const result = { success: [], errors: [], total: rows.length };
  const rowSchema = validation.importRowSchema;

  rows.forEach((row) => {
    const issues = [];
    const checked = rowSchema.validate(row, { abortEarly: false });
    if (checked.error) checked.error.details.forEach((detail) => {
      issues.push({ field: detail.path[0] || 'row', message: detail.message });
    });
    addDuplicateIssues(row, issues, seen, existingEmails, existingMobiles, existingUsernames);
    const verifiedRow = { ...row, issues };
    result[issues.length ? 'errors' : 'success'].push(verifiedRow);
  });
  return result;
};

const learnerImportLegacy =
  ({ db }) =>
    async ({ body, session_userid }) => {
      try {
        let createdby = session_userid;
        let password = "1100";
        const results = [];
        let hasDuplicate = false;

        // First Pass: Validate for duplicates
        for (const row of body) {
          const [check_learner] = await db.sequelize.query(
            `SELECT * FROM learners WHERE (email = :_email OR mobile = :_mobile) AND deletedon IS NULL`,
            {
              replacements: {
                _email: row.email,
                _mobile: row.mobile,
              },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (check_learner) {
            row.status = "error";
            row.message =
              "The provided email/mobile is already registered. Please use a different one.";
            results.push(row);
            hasDuplicate = true;
          } else {
            row.status = "valid";
            row.message = "Valid for insertion.";
            results.push(row);
          }
        }

        // If any duplicate is found, return the errors without inserting
        if (hasDuplicate) {
          return {
            statusCode: 400,
            message: "Duplicate entries found. No data has been inserted.",
            data: results,
          };
        }

        // Second Pass: Insert all data if validation passed
        for (const row of body) {
          const insertQuery = `INSERT INTO learners (learner_uuid, firstname, lastname, email, mobile, username, password,isverified,is_password_reset, createdby, createdon) 
                           VALUES (UUID(), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

          const queryParams = [
            row.firstname,
            row.lastname,
            row.email,
            row.mobile,
            row.username,
            password,
            "Yes",
            "True",
            createdby,
          ];

          const [res] = await db.sequelize.query(insertQuery, {
            replacements: queryParams,
            type: db.sequelize.QueryTypes.INSERT,
          });

          // Trigger welcome email
          const payload = { learner_id: res };
          new MailTemplate(db, "learner_welcome_email", payload);
        }

        return {
          statusCode: 200,
          message: "All Learners created successfully.",
          data: [],
        };
      } catch (error) {
        console.error("Error Save Learner Submit:", error);
        throw error;
      }
    };


const learnerImport = ({ db, validation }) => async ({ body, session_userid }) => {
  const verification = await verifyLearnerImport({ db, validation })(body);
  if (verification.errors.length) {
    return {
      statusCode: 400,
      message: 'Some learners are no longer valid. Review the errors and verify the file again.',
      data: verification,
    };
  }
  const imported = [];
  const transaction = await db.sequelize.transaction();
  try {
    for (const row of verification.success) {
      imported.push(await insertImportedLearner(db, row, session_userid, transaction));
    }
    await transaction.commit();
    imported.forEach(({ learnerId, generatedPassword }) => {
      new MailTemplate(db, 'learner_welcome_email', { learner_id: learnerId, password: generatedPassword });
    });
    return {
      statusCode: 200,
      message: `${imported.length} learner${imported.length === 1 ? '' : 's'} imported successfully.`,
      data: { imported: imported.length },
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Error importing learners:', error);
    throw error;
  }
};

const insertImportedLearner = async (db, row, session_userid, transaction) => {
  const generatedPassword = `${row.firstname}@${row.username}`;
  const password = await bcrypt.hash(generatedPassword, 10);
  const [result] = await db.sequelize.query(
    `INSERT INTO learners (learner_uuid, firstname, lastname, email, mobile, username, password, instructor_id, status, isverified,is_password_reset, createdby, createdon)
     VALUES (UUID(), :firstname, :lastname, :email, :mobile, :username, :password, :instructor_id, :status, :isverified, :is_password_reset, :createdby, CURRENT_TIMESTAMP)`,
    {
      replacements: {
        firstname: row.firstname, lastname: row.lastname || null, email: row.email,
        mobile: row.mobile || null, username: row.username, password,
        instructor_id: session_userid, status: row.status, isverified: "Yes",is_password_reset:"True", createdby: session_userid,
      },
      type: db.sequelize.QueryTypes.INSERT,
      transaction,
    }
  );
  const learnerId = result && result.insertId ? result.insertId : result;
  await db.sequelize.query(
    `INSERT INTO learner_instructor_map (learner_id, instructor_id, createdby, createdon)
     VALUES (:learner_id, :instructor_id, :createdby, CURRENT_TIMESTAMP)`,
    { replacements: { learner_id: learnerId, instructor_id: session_userid, createdby: session_userid }, transaction }
  );
  return { learnerId, generatedPassword };
};

const getById = ({ db }) => async (learner_uuid) => {
  const [
    [learnerData],
    quizzes,
    sessions,
    [currentScenario],
    [scenarioCount],
    [eventCount],
    [quizAccuracyStats],
    events,
    [eventStats],
    eventScenarioSummary
  ] = await Promise.all([
    // Learner Info
    db.sequelize.query(
      `SELECT
    l.learner_id,
    l.learner_uuid,
    l.firstname,
    l.lastname,
    l.profile,
    CASE WHEN l.mobile = 0 THEN '' ELSE l.mobile END AS mobile,
    l.email,
    l.username,
    l.isverified AS isverified,
    l.status,
    l.createdon AS enrollmentDate,
     -- Instructor name
    CONCAT(au.firstname, ' ', au.lastname) AS instructor_name,
    GREATEST(
      COALESCE(sl.last_session_end, '1970-01-01'),
      COALESCE(el.last_event_end, '1970-01-01')
    ) AS last_session_end

    FROM learners l

-- Join with instructor table
LEFT JOIN ad_users au ON l.instructor_id = au.userid

-- Join with scenario_learner for session end
/* LEFT JOIN (
    SELECT learner_id, MAX(modifiedon) AS last_session_end
    FROM scenario_learner
    GROUP BY learner_id
) sl ON sl.learner_id = l.learner_id */

LEFT JOIN (
    SELECT requestedby_id AS learner_id,
           MAX(modifiedon) AS last_session_end
    FROM vm_request
    WHERE requestedby_role = 'Learner'
    GROUP BY requestedby_id
) sl ON sl.learner_id = l.learner_id


-- Join with event_learners for event completion
LEFT JOIN (
    SELECT
        requestedby_id AS learner_id,
        MAX(completedon) AS last_event_end
    FROM vm_request
    WHERE requestedby_role = 'Learner'
      AND completedon IS NOT NULL
    GROUP BY requestedby_id
) el 
ON el.learner_id = l.learner_id

-- Filter by learner UUID
WHERE l.learner_uuid = :_id
LIMIT 1;
`,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),

    // Quizzes
    db.sequelize.query(`SELECT slq.scenariolearnarquizid, s.scenariotitle AS scenario_title, slq.total_questions, slq.total_correct_answers, slq.total_answers, slq.startedon, slq.endedon FROM scenario_learner_quiz slq INNER JOIN scenarios s ON slq.scenarioid = s.scenarioid INNER JOIN learners l ON slq.learner_id = l.learner_id WHERE l.learner_uuid = :_id ORDER BY slq.endedon DESC`,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),
    db.sequelize.query(` SELECT vr.vmrequestid, s.scenariotitle AS scenario_title, vr.timer, vr.vm_steps, vr.status, vr.startedon, vr.completedon, vr.terminatedon FROM vm_request vr INNER JOIN learners l  ON l.learner_id = vr.requestedby_id INNER JOIN scenarios s  ON s.scenarioid = vr.scenarioid WHERE l.learner_uuid = :_id AND vr.requestedby_role = 'Learner' AND vr.status IN ('Completed', 'Terminated') ORDER BY vr.startedon DESC `,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),
    db.sequelize.query(
      `
  SELECT
  s.scenariotitle AS title,
  vr.vm_steps,
  vr.startedon
  FROM vm_request vr
  INNER JOIN learners l 
  ON l.learner_id = vr.requestedby_id
  INNER JOIN scenarios s 
  ON s.scenarioid = vr.scenarioid
  WHERE l.learner_uuid = :_id
  AND vr.requestedby_role = 'Learner'
  AND vr.status IN ('Start', 'Running', 'Resume')
  ORDER BY vr.startedon DESC
  LIMIT 1
  `,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),

    // Total Scenarios
    // db.sequelize.query(
    //   `SELECT COUNT(DISTINCT scenarioid) AS total_scenarios
    //    FROM scenario_learner
    //    WHERE learner_id = (
    //      SELECT learner_id FROM learners WHERE learner_uuid = :_id
    //    )`,
    //   {
    //     replacements: { _id: learner_uuid },
    //     type: db.sequelize.QueryTypes.SELECT,
    //   }
    // ),
    db.sequelize.query(` SELECT COUNT(DISTINCT vr.scenarioid) AS total_scenarios FROM vm_request vr INNER JOIN learners l  ON l.learner_id = vr.requestedby_id WHERE l.learner_uuid = :_id AND vr.requestedby_role = 'Learner' `,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),

    // Total Events
    db.sequelize.query(`SELECT COUNT(DISTINCT eventid) AS total_events FROM event_learners WHERE learner_id = ( SELECT learner_id FROM learners WHERE learner_uuid = :_id
       )`,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),

    // Quiz Accuracy Stats
    db.sequelize.query(`SELECT COALESCE(SUM(slq.total_questions), 0) AS total_quiz_questions, COALESCE(SUM(slq.total_correct_answers), 0) AS total_correct_answers FROM scenario_learner_quiz slq INNER JOIN learners l ON slq.learner_id = l.learner_id WHERE l.learner_uuid = :_id`,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),

    // Learner Events
    db.sequelize.query(`SELECT
    e.eventname,
    e.eventdescription,
    e.eventstarttime,
    e.eventendtime,
    e.status AS event_status,
   vr.status AS learner_status,       
    vr.vm_steps,
    vr.timer,
    vr.startedon,
    vr.completedon,
    el.team_name,
    el.team_description,

    s.scenariotitle
FROM event_learners el
INNER JOIN events e 
    ON el.eventid = e.eventid
INNER JOIN scenarios s 
    ON e.scenarioid = s.scenarioid
INNER JOIN vm_request vr
    ON vr.eventid = el.eventid
   AND vr.requestedby_id = el.learner_id
   AND vr.requestedby_role = 'Learner'

WHERE el.learner_id = (
    SELECT learner_id 
    FROM learners 
    WHERE learner_uuid = :_id
)
ORDER BY vr.startedon DESC;
`,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),

    // Event Stats (completion, avg time, ranks)
    db.sequelize.query(`SELECT
    COUNT(DISTINCT el.eventid) AS total,
    SUM(
        CASE 
            WHEN vr.status = 'Completed' THEN 1 
            ELSE 0 
        END
    ) AS completed,
    AVG(
        TIMESTAMPDIFF(
            SECOND,
            vr.startedon,
            vr.completedon
        )
    ) AS avg_time_seconds
FROM event_learners el
LEFT JOIN vm_request vr
    ON vr.eventid = el.eventid
   AND vr.requestedby_id = el.learner_id
   AND vr.requestedby_role = 'Learner'
WHERE el.learner_id = (
    SELECT learner_id
    FROM learners
    WHERE learner_uuid = :_id
);
`,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),

    // Event count by scenario
    db.sequelize.query(`SELECT
    s.scenariotitle AS scenario,
    COUNT(DISTINCT e.eventid) AS total_events,
    SUM(
        CASE 
            WHEN vr.status = 'Completed' THEN 1 
            ELSE 0 
        END
    ) AS completed_events
FROM event_learners el
JOIN events e 
    ON el.eventid = e.eventid
JOIN scenarios s 
    ON e.scenarioid = s.scenarioid
LEFT JOIN vm_request vr
    ON vr.eventid = el.eventid
   AND vr.requestedby_id = el.learner_id
   AND vr.requestedby_role = 'Learner'

WHERE el.learner_id = (
    SELECT learner_id
    FROM learners
    WHERE learner_uuid = :_id
)
GROUP BY s.scenariotitle;
`,
      {
        replacements: { _id: learner_uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    ),
  ]);

  // Quiz Accuracy
  const totalQuestions = quizAccuracyStats?.total_quiz_questions || 0;
  const totalCorrect = quizAccuracyStats?.total_correct_answers || 0;
  const quizAccuracy = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  // Event Stats
  const totalEvents = eventStats?.total || 0;
  const completedEvents = eventStats?.completed || 0;
  const avgTimeMinutes = eventStats?.avg_time_seconds
    ? Math.round(eventStats.avg_time_seconds / 60)
    : 0;
  const completionRate = totalEvents > 0
    ? Math.round((completedEvents / totalEvents) * 100)
    : 0;

  return {
    ...learnerData,
    quizzes: quizzes || [],
    sessions: sessions || [],
    currentScenario: currentScenario || null,
    totalScenarios: scenarioCount?.total_scenarios || 0,
    totalEvents: eventCount?.total_events || 0,
    quizStats: {
      totalQuestions,
      totalCorrect,
      accuracy: quizAccuracy,
    },
    events: events || [],
    eventStats: {
      total: totalEvents,
      completed: completedEvents,
      avgTimeMinutes,
      completionRate,
      bestRank: eventStats?.best_rank || null,
      worstRank: eventStats?.worst_rank || null,
      avgRank: eventStats?.avg_rank ? parseFloat(eventStats.avg_rank.toFixed(2)) : null,
    },
    eventScenarioSummary: eventScenarioSummary || [],
  };
};


const deleteById =
  ({ db }) =>
    async (session_userid) => {
      let [res] = await db.sequelize.query(
        `UPDATE learners set status='Inactive', deletedon=now() where learner_uuid=:_id`,
        {
          replacements: {
            _id: session_userid,
          },
        }
      );

      let [learnerRes] = await db.sequelize.query(
        `select learner_id from learners  where  learner_uuid=:_id`,
        {
          replacements: {
            _id: session_userid,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      let check_learner_instructor_mapping = await db.sequelize.query(
        `select * from learner_instructor_map where learner_id = :_learner_id  and deletedon is null`,
        {
          replacements: {
            _learner_id: learnerRes.learner_id,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (check_learner_instructor_mapping.length > 0) {
        await db.sequelize.query(
          `UPDATE learner_instructor_map set deletedon=now() where learner_id=:_id`,
          {
            replacements: {
              _id: learnerRes.learner_id,
            },
          }
        );
      }
      return res;
    };

module.exports = {
  getAll,
  update,
  statusChange,
  mailConfirmation,
  resetpassword,
  getMappedInstructor,
  save,
  saveMappedInstructors,
  learnerImport,
  verifyLearnerImport,
  deleteById,
  getById,
};
