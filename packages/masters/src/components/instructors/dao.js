const MailTemplate = require("../../utils/mailUtility");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const list =
  ({ db }) =>
    async () => {
      let [res] = await db.sequelize.query(`SELECT  userid AS instructor_id,loginid, firstname,lastname,email,mobile,usertype,organization, address,profile,isverified,useruuid AS instructor_uuid, CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END AS status, profile, DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon FROM ad_users  WHERE usertype = "Instructor" ORDER BY firstname ASC;`);
      return res;
    };

const getById =
  ({ db }) =>
    async (useruuid) => {
      try {
        // 1. Get instructor details
        const instructorQuery = ` SELECT  userid AS instructor_id, loginid, CONCAT(firstname, ' ', lastname) AS Instructor_name, email, mobile, profile, address, organization, status, CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END AS status, profile, DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon FROM ad_users  WHERE useruuid = ? AND usertype = "Instructor" LIMIT 1 `;
        const [instructorResult] = await db.sequelize.query(instructorQuery, {
          replacements: [useruuid],
        });

        if (!instructorResult.length) return null;
        const instructor = instructorResult[0];

        // 2. Get student-instructor mappings
        const studentMapQuery = ` SELECT  lim.learner_id, CONCAT(l.firstname, ' ', l.lastname) AS learner_name, l.email, l.mobile, lim.instructor_id, l.status FROM learner_instructor_map lim JOIN ad_users u ON lim.instructor_id = u.userid JOIN learners l ON l.learner_id = lim.learner_id WHERE u.useruuid = ? ORDER BY learner_name ASC
      `;
        const [studentsResult] = await db.sequelize.query(studentMapQuery, {
          replacements: [useruuid],
        });

        // 3. Get total mapped student count
        const studentCountQuery = ` SELECT COUNT(*) AS mapped_student_count FROM learner_instructor_map lim JOIN ad_users u ON lim.instructor_id = u.userid WHERE u.useruuid = ?
      `;
        const [[countResult]] = await db.sequelize.query(studentCountQuery, {
          replacements: [useruuid],
        });

        // 4. Get instructor user ID
        const userIdQuery = `
        SELECT userid 
        FROM ad_users 
        WHERE useruuid = ? AND usertype = "Instructor" 
        LIMIT 1
      `;
        const [[user]] = await db.sequelize.query(userIdQuery, {
          replacements: [useruuid],
        });

        if (!user) throw new Error("Instructor not found");

        // 5. Get scenarios
        const scenariosQuery = ` SELECT  scenarioid, scenariotitle, scenariostatus, status, createdon FROM scenarios WHERE createdby = ? `;
        const [scenariosResult] = await db.sequelize.query(scenariosQuery, {
          replacements: [user.userid],
        });

        // 6. Return formatted final response object
        return {
          ...instructor,
          instructor_student_map: studentsResult,
          mapped_student_count: countResult.mapped_student_count,
          scenarios: scenariosResult,
          totalscenariocount: scenariosResult.length,
        };
      } catch (error) {
        console.error("Error fetching instructor by ID:", error.message);
        throw error;
      }
    };

const save =
  ({ db, validation, keys }) =>
    async (body, session_userid) => {
      try {
        const errors = [];
        if (body.mobile && body.mobile !== "") {
          let [check_instructor_mobile] = await db.sequelize.query(
            `select * from ad_users where mobile=:_mobile and usertype='Instructor' and deletedon is null `,
            {
              replacements: {
                _mobile: body.mobile,
              },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          if (check_instructor_mobile) {
            errors.push(validation.messages.mobile_duplicate);
          }
        }
        if (body.email && body.email !== "") {
          let [check_instructor_email] = await db.sequelize.query(
            `select * from ad_users where email=:_email and usertype='Instructor' and deletedon is null `,
            {
              replacements: {
                _email: body.email,
              },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          if (check_instructor_email) {
            errors.push(validation.messages.email_duplicate);
          }
        }
        if (body.loginid && body.loginid !== "") {
          let [check_instructor_username] = await db.sequelize.query(
            `select * from ad_users where loginid=:_loginid and usertype='Instructor' and deletedon is null `,
            {
              replacements: {
                _loginid: body.loginid,
              },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          if (check_instructor_username) {
            errors.push(validation.messages.username_duplicate);
          }
        }
        if (errors.length > 0) {
          return { statusCode: 400, errors: errors, message: "" };
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);
        const mobile =
          body.mobile && body.mobile.toString().trim() !== ""
            ? body.mobile.toString().trim()
            : null;

        const insertQuery = `INSERT INTO ad_users (useruuid,loginid, firstname, lastname, email, mobile, password, organization, address,usertype, createdby, createdon) VALUES (UUID(),?,?,?,?,?,?,?,?,"Instructor",?,CURRENT_TIMESTAMP)`;
        const queryParams = [
          body.loginid,
          body.firstname,
          body.lastname,
          body.email,
          mobile,
          hashedPassword,
          body.organization,
          body.address,
          session_userid,
        ];

        let [result] = await db.sequelize.query(insertQuery, {
          replacements: queryParams,
          type: db.sequelize.QueryTypes.INSERT,
          RETURNING: "userid",
        });
        await db.sequelize.query(
          `INSERT INTO ad_userrolemap (userid, roleid,createdby, createdon) VALUES (:_userid, :_roleid, :_createdby, NOW())`,
          {
            replacements: {
              _userid: result,
              _roleid: keys.INSTRUCTOR_ROLE_ID,
              _createdby: session_userid,
            },
          }
        );

        let payload = {
          instructor_id: result,
          password: body.password,
        };
        new MailTemplate(db, "instructor_welcome_mail", payload);

        return { statusCode: 200, message: validation.messages.add_success };
      } catch (error) {
        console.error("Error Save SIMManager Submit:", error);
        throw error;
      }
    };

const update =
  ({ db, validation }) =>
    async (body, session_userid) => {
      const errors = [];
      if (body.mobile && body.mobile !== "") {
        let [check_instructor_mobile] = await db.sequelize.query(
          `select * from ad_users where mobile=:_mobile and userid!=:_id and usertype='Instructor' and deletedon is null `,
          {
            replacements: {
              _mobile: body.mobile,
              _id: body.instructor_id,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_instructor_mobile) {
          errors.push(validation.messages.mobile_duplicate);
        }
      }
      if (body.email && body.email !== "") {
        let [check_instructor_email] = await db.sequelize.query(
          `select * from ad_users where email=:_email and userid!=:_id and usertype='Instructor' and deletedon is null `,
          {
            replacements: {
              _email: body.email,
              _id: body.instructor_id,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_instructor_email) {
          errors.push(validation.messages.email_duplicate);
        }
      }
      if (body.loginid && body.loginid !== "") {
        let [check_instructor_username] = await db.sequelize.query(
          `select * from ad_users where loginid=:_loginid and userid!=:_id and usertype='Instructor' and deletedon is null `,
          {
            replacements: {
              _loginid: body.loginid,
              _id: body.instructor_id,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_instructor_username) {
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
      const updateQuery = `UPDATE ad_users SET loginid=?, firstname=?, lastname=?, email=?, mobile=?, organization=?, address=?, modifiedon=CURRENT_TIMESTAMP,modifiedby=? WHERE userid=?`;
      const updateParams = [
        body.loginid,
        body.firstname,
        body.lastname,
        body.email,
        mobile,
        body.organization,
        body.address,
        session_userid,
        body.instructor_id,
      ];
      try {
        await db.sequelize.query(updateQuery, {
          replacements: updateParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });
        return { statusCode: 200, message: validation.messages.update_success };
      } catch (error) {
        console.error("Error System Config Submit:", error);
        throw error;
      }
    };

const statusChange =
  ({ db, validation }) =>
    async (body) => {
      try {
        const status = body.status == "true" ? "Active" : "Inactive";
        const updateQuery = ` UPDATE ad_users SET status =?, modifiedon=CURRENT_TIMESTAMP WHERE userid=?`;
        const queryParams = [status, body.instructor_id];
        let [res] = await db.sequelize.query(updateQuery, {
          replacements: queryParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });
        return { statusCode: 200, message: validation.messages.status_change };
      } catch (error) {
        console.error("Error System Config Submit:", error);
        throw error;
      }
    };

const deleteById =
  ({ db }) =>
    async (instructor_id) => {
      let [res] = await db.sequelize.query(
        `UPDATE ad_users set status='Inactive', deletedon=now() where userid=:_id`,
        {
          replacements: {
            _id: instructor_id,
          },
        }
      );
      return res;
    };

const sendVerification =
  ({ db, validation }) =>
    async (instructor_id) => {
      let [check_learner] = await db.sequelize.query(
        `select loginid,useruuid from ad_users where userid=:_id and usertype='Instructor' and deletedon is null `,
        {
          replacements: {
            _id: instructor_id,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (check_learner) {
        let payload = {
          instructor_id: instructor_id,
        };
        new MailTemplate(db, "instructor_account_verification", payload);
        return {
          statusCode: 200,
          message: validation.messages.verification_email,
        };
      } else {
        return {
          statusCode: 400,
          message: validation.messages.instructor_not_found,
        };
      }
    };

const resetPassword =
  ({ db }) =>
    async (instructor_id) => {
      const generateUUID = () => uuidv4();
      const uuid = generateUUID();
      const uuidSubstring = uuid.slice(0, 6);
      const currentYear = new Date().getFullYear();
      const password = `${uuidSubstring}$${currentYear}`;
      const hashedPassword = await bcrypt.hash(password, 10);

      let [res] = await db.sequelize.query(
        `UPDATE ad_users set password=:_password where userid=:_instructor_id`,
        {
          replacements: {
            _password: hashedPassword,
            _instructor_id: instructor_id,
          },
        }
      );
      let payload = {
        instructor_id: instructor_id,
        password: password,
      };
      new MailTemplate(db, "instructor_reset_password", payload);
      return res;
    };

module.exports = {
  list,
  getById,
  save,
  update,
  statusChange,
  deleteById,
  sendVerification,
  resetPassword,
};
