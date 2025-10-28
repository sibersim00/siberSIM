const MailTemplate = require("../../utils/mailUtility");
const NotiTemplate = require("../../utils/notiUtility");
const bcrypt = require("bcryptjs");
const checklogin =
  ({ db, keys, validation }) =>
  async ({ loginid, password }) => {
    loginid = loginid.trim();
    password = password.trim();

    try {
      // Fetch learner details including the hashed password
      const [learner] = await db.sequelize.query(
        `SELECT learner_id, firstname, lastname, email, mobile, password,isverified  FROM learners  WHERE status = 'Active'  AND BINARY username = ?`,
        { replacements: [loginid], type: db.sequelize.QueryTypes.SELECT }
      );

      // If no learner found, return error
      if (!learner) {
        return {
          statusCode: 404,
          message: validation.messages.invalid_credentials,
        };
      }
      // If learner not verified found, return error
      if (learner.isverified == "No") {
        return {
          statusCode: 404,
          message: validation.messages.account_verification_pending,
        };
      }
      // Compare provided password with hashed password from database
      const isMatch = await bcrypt.compare(password, learner.password);

      if (isMatch == true) {
        // Generate OTP (Use random OTP for production)
        const otp = 111111; // Math.floor(100000 + Math.random() * 900000); // Uncomment for random OTP

        // Update OTP in the database with timeout
        await db.sequelize.query(
          `UPDATE learners  SET otp = ?, otptimeout = DATE_ADD(NOW(), INTERVAL ? MINUTE)  WHERE learner_id = ? AND status = 'Active'`,
          { replacements: [otp, keys.OTP_TIMEOUT, learner.learner_id] }
        );

        // Send OTP via email
        const payload = {
          learner_id: learner.learner_id.toString(),
          otp: otp.toString(),
          otp_timeout: keys.OTP_TIMEOUT,
        };
        new MailTemplate(db, "learner_otp_email", payload);
        // Remove password before returning user details
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
  async ({ loginid, password, otp }) => {
    loginid = loginid.trim();
    password = password.trim();

    const [learner] = await db.sequelize.query(
      `SELECT learner_id, learner_uuid, firstname, lastname, email, mobile, password, profile, instructor_id, 'Learner' as type
       FROM learners
       WHERE status = 'Active' AND BINARY username = ? AND otp = ? AND otptimeout >= NOW()`,
      {
        replacements: [loginid, otp],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!learner) {
      return { statusCode: 401, message: "Invalid credentials" };
    }

    const isMatch = await bcrypt.compare(password, learner.password);
    if (!isMatch) {
      return { statusCode: 401, message: "Invalid credentials" };
    }

    delete learner.password;

    await db.sequelize.query(
      `UPDATE learners SET otp = NULL, otptimeout = NULL WHERE learner_id = ? AND status = 'Active'`,
      { replacements: [learner.learner_id] }
    );

    return { statusCode: 200, learner };
  };


const verifyDirectLogin =
  ({ db }) =>
  async ({ loginid, password }) => {
    loginid = loginid.trim();
    password = password.trim();

    const [learner] = await db.sequelize.query(
      `SELECT learner_id, learner_uuid, firstname, lastname, email, mobile, password, profile, instructor_id, 'Learner' as type
       FROM learners
       WHERE status = 'Active' AND BINARY username = ?`,
      {
        replacements: [loginid],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!learner) {
      return { statusCode: 401, message: "Invalid credentials" };
    }

    const isMatch = await bcrypt.compare(password, learner.password);
    if (!isMatch) {
      return { statusCode: 401, message: "Invalid credentials" };
    }

    delete learner.password;
    return { statusCode: 200, learner };
  };


const checkforgot =
  ({ db, keys }) =>
  async ({ loginid }) => {
    loginid = loginid.trim();

    const [learner] = await db.sequelize.query(
      `select learner_id,firstname,lastname,email,mobile from learners where status ='Active' and BINARY username = ?`,
      { replacements: [loginid], type: db.sequelize.QueryTypes.SELECT }
    );
    if (learner) {
      //const otp = Math.floor(Math.random() * 900000) + 100000;
      const otp = 111111;
      //sendOTP(tutor.mobile,user.email);
      await db.sequelize.query(
        `UPDATE learners set otp=?, otptimeout=date_add(now(),INTERVAL ` +
          keys.OTP_TIMEOUT +
          ` minute) where learner_id = ? and status ='Active'`,
        { replacements: [otp, learner.learner_id] }
      );
      let payload = {
        learner_id: learner.learner_id.toString(),
        otp: otp.toString(),
        otp_timeout: keys.OTP_TIMEOUT,
      };
      new MailTemplate(db, "learner_otp_email_forgot", payload);
    }
    return learner;
  };

const verifyforgot =
  ({ db }) =>
  async ({ loginid, password, otp }) => {
    loginid = loginid.trim();

    const [learner] = await db.sequelize.query(
      `select learner_id,firstname,lastname,email,mobile from learners where status ='Active' and BINARY username = ? and otp= '${otp}' and otptimeout >= now() `,
      { replacements: [loginid, otp], type: db.sequelize.QueryTypes.SELECT }
    );

    if (learner) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.sequelize.query(
        `UPDATE learners set password=?, otp=null, otptimeout=null where learner_id = ? and status ='Active'`,
        { replacements: [hashedPassword, learner.learner_id] }
      );
      let payload = {
        learner_id: learner.learner_id.toString(),
      };
      new MailTemplate(db, "learner_new_password_updated", payload);
    }
    return learner;
  };

const learnermenu =
  ({ db }) =>
  async ({ tutor_id }) => {
    return [
      {
        source: "/dashboard",
        path: "/components/dashboard/dashboard",
        icon: "ti-home",
        type: "link",
        active: false,
        selected: false,
        title: "Dashboard",
      },
      {
        source: "/scenarios",
        path: "/components/scenarios",
        icon: "ti ti-map",
        type: "link",
        active: false,
        selected: false,
        title: "Scenarios",
      },
      {
        source: "/faqs",
        path: "/components/faqs",
        icon: "ti ti-help-alt",
        type: "link",
        active: false,
        selected: false,
        title: "FAQs",
      },
      // {
      //   source: "/customscenarios",
      //   path: "/components/customscenarios",
      //   icon: "ti ti-dropbox",
      //   type: "link",
      //   active: false,
      //   selected: false,
      //   title: "Custom Scenarios",
      // },
    ];
  };
const register =
  ({ db, validation, keys }) =>
  async (body) => {
    try {
      const errors = [];
      if (body.mobile && body.mobile !== "") {
        let [check_learner_mobile] = await db.sequelize.query(
          `select * from learners where mobile=:_mobile and deletedon is null `,
          {
            replacements: {
              _mobile: body.mobile,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_learner_mobile) {
          errors.push(validation.messages.mobile_duplicate);
        }
      }

      if (body.email && body.email !== "") {
        [check_learner_email] = await db.sequelize.query(
          `select * from learners where email=:_email and deletedon is null `,
          {
            replacements: {
              _email: body.email,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_learner_email) {
          errors.push(validation.messages.email_duplicate);
        }
      }

      if (body.username && body.username !== "") {
        [check_learner_username] = await db.sequelize.query(
          `select * from learners where username=:_username and deletedon is null `,
          {
            replacements: {
              _username: body.username,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (check_learner_username) {
          errors.push(validation.messages.username_duplicate);
        }
      }
      if (errors.length > 0) {
        return { statusCode: 400, errors: errors, message: "" };
      }
      // **Hash the password before storing it**
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const insertQuery = `INSERT INTO learners (learner_uuid,firstname, lastname, email, mobile,username,password,createdon) VALUES (UUID(),?,?,?,?,?,?,NOW())`;
      const mobile = (body.mobile + "").trim() === "" ? null : body.mobile;
      const queryParams = [
        body.firstname,
        body.lastname,
        body.email,
        mobile,
        body.username,
        hashedPassword,
      ];

      let [res] = await db.sequelize.query(insertQuery, {
        replacements: queryParams,
        type: db.sequelize.QueryTypes.INSERT,
        RETURNING: "learner_id",
      });
      const insertedLearnerId = res && res.insertId ? res.insertId : res;
      const insertMappingQuery = `
              INSERT INTO learner_instructor_map (learner_id, instructor_id, createdby, createdon)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `;

      const mappingParams = [
        insertedLearnerId,
        keys.ADMIN_USER_ID,
        keys.ADMIN_USER_ID,
      ];
      await db.sequelize.query(insertMappingQuery, {
        replacements: mappingParams,
        type: db.sequelize.QueryTypes.INSERT,
      });
      let payload = {
        learner_id: res,
        password: body.password,
      };
      new MailTemplate(db, "learner_welcome_email", payload);
      return { statusCode: 200, message: validation.messages.add_success };
    } catch (error) {
      console.error("Error Save Student Submit:", error);
      throw error;
    }
  };
const verifySuccessById =
  ({ db, validation }) =>
  async (learner_uuid) => {
    let [check_learner] = await db.sequelize.query(
      `select learner_id,learner_uuid,isverified from learners where learner_uuid=:_id and deletedon is null `,
      {
        replacements: {
          _id: learner_uuid,
        },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (check_learner) {
      if (check_learner.isverified == "Yes") {
        return {
          statusCode: 200,
          message: validation.messages.already_verification_email,
        };
      } else {
        let [res] = await db.sequelize.query(
          `UPDATE learners set isverified='Yes' where learner_uuid=:_id`,
          {
            replacements: {
              _id: learner_uuid,
            },
          }
        );
        let payload = {
          learner_id: check_learner.learner_id,
        };
        const noti = new NotiTemplate(db, "welcome_learner",payload, "Learner", check_learner.learner_id);
await noti.send();
        return {
          statusCode: 200,
          message: validation.messages.verification_success_email,
        };
      }
    } else {
      return {
        statusCode: 400,
        message: validation.messages.learner_not_found,
      };
    }
  }
module.exports = {
  checklogin,
  verifylogin,
  verifyDirectLogin,
  checkforgot,
  verifyforgot,
  learnermenu,
  register,
  verifySuccessById,
};
