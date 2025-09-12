const MailTemplate = require("../../utils/mailUtility");
const NotiTemplate = require("../../utils/notiUtility");
const bcrypt = require("bcryptjs");
const organizationList = ({ db }) => async (id) => {
  const [result] = await db.sequelize.query(`SELECT getOrganizations(${id}) as data`, { type: db.sequelize.QueryTypes.SELECT });
  let data = [];
  if (result.data != undefined && result.data != null) {
    data = JSON.parse(result.data)
  }
  return data;
}

const getCompanyWebSetting = ({ db }) => async () => {
  const [result] = await db.sequelize.query(`SELECT otp_verification ,name, system_name FROM web_settings WHERE company_id = 1 LIMIT 1`, { type: db.sequelize.QueryTypes.SELECT });
  return result || null;
};
const checklogin = ({ db, keys, validation }) => async ({ loginid, password, orgid }) => {
  loginid = loginid.trim();
  password = password.trim();
  try {
    // Fetch learner details including the hashed password
    const [user] = await db.sequelize.query(`SELECT userid, orgid, loginid, firstname, lastname, email, mobile, profile, password,isverified 
             FROM ad_users 
             WHERE status = 'Active' and usertype='Instructor' AND BINARY loginid = ? AND orgid = ?`,
      { replacements: [loginid, orgid], type: db.sequelize.QueryTypes.SELECT }
    );

    // If no learner found, return error
    if (!user) {
      return { statusCode: 404, message: validation.messages.invalid_credentials };
    }

    if (user.isverified == 'No') {
      return { statusCode: 404, message: validation.messages.account_verification_pending };
    }

    // Compare provided password with hashed password from database
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch == true) {
      // Generate OTP (Use random OTP for production)
      const otp = 111111; // Math.floor(100000 + Math.random() * 900000); // Uncomment for random OTP

      // Update OTP in the database with timeout
      await db.sequelize.query(`UPDATE ad_users SET otp = ?, otptimeout = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE userid = ? AND status = 'Active' and  usertype='Instructor'`,
        { replacements: [otp, keys.OTP_TIMEOUT, user.userid] }
      );

      // Send OTP via email
      let payload = {
        userid: user.userid.toString(),
        otp: otp.toString(),
        otp_timeout: keys.OTP_TIMEOUT
      }
      delete user.password;
      new MailTemplate(db, 'otp_email', payload);
      // Remove password before returning user details
      delete user.password;
      return {
        statusCode: 200,
        message: "Login successful, OTP sent",
        user,
      };
    } else {
      return { statusCode: 401, message: validation.messages.invalid_credentials };
    }
  } catch (error) {
    console.error("Error in checklogin function:", error);
    return { statusCode: 500, message: "Internal server error" };
  }
};
const verifylogin = ({ db }) => async ({ loginid, password, orgid, otp }) => {
  loginid = loginid.trim();
  password = password.trim();

  const [user] = await db.sequelize.query(
    `SELECT userid, useruuid, orgid, loginid, firstname, lastname, email, mobile, profile, password, usertype 
     FROM ad_users 
     WHERE status ='Active' AND isverified='Yes' AND usertype='Instructor' 
     AND BINARY loginid = ? AND orgid = ? AND otp = ? AND otptimeout >= NOW()`,
    { replacements: [loginid, orgid, otp], type: db.sequelize.QueryTypes.SELECT }
  );

  if (!user) {
    return { statusCode: 401, message: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    delete user.password;

    // Clear OTP info
    await db.sequelize.query(
      `UPDATE ad_users SET otp = NULL, otptimeout = NULL 
       WHERE userid = ? AND status = 'Active' AND usertype = 'Instructor'`,
      { replacements: [user.userid] }
    );

    return { statusCode: 200, user }; // accessToken removed
  } else {
    return { statusCode: 401, message: "Invalid credentials" };
  }
};

const verifyDirectLogin = ({ db }) => async ({ loginid, password, orgid }) => {
  loginid = loginid.trim();
  password = password.trim();

  const [user] = await db.sequelize.query(
    `SELECT userid, useruuid, orgid, loginid, firstname, lastname, email, mobile, profile, password, usertype 
     FROM ad_users 
     WHERE status ='Active' AND isverified='Yes' AND usertype='Instructor' 
     AND BINARY loginid = ? AND orgid = ?`,
    { replacements: [loginid, orgid], type: db.sequelize.QueryTypes.SELECT }
  );

  if (!user) {
    return { statusCode: 401, message: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    delete user.password;
    return { statusCode: 200, user }; // accessToken removed
  } else {
    return { statusCode: 401, message: "Invalid credentials" };
  }
};

const userrolemenu = ({ db }) => async ({ userid }) => {
  const [menus] = await db.sequelize.query(`select m.menuid,m.parentmenuid,m.displaymenuname as title,m.singularmenuname as subtitle,m.icon,m.menupath as path,m.source,'false' as active,'false' as selected,case when menutype = 'Tree Menu' then 'sub' else 'link' end as type,m.menutype from ad_menus m where m.status = 'Active' order by m.orderno asc `);
  const [rolemenu] = await db.sequelize.query(`select ar.menuid from ad_userrolemap au inner join ad_rolemenumap ar on ar.roleid =au.roleid where au.userid=${userid} group by ar.menuid`);
  const menuHierarchy = buildMenuHierarchy(menus, rolemenu);
  return menuHierarchy;
}

function buildMenuHierarchy(data, rolemenu, parentId = null) {
  const children = data
    .filter(item => item.parentmenuid === parentId && rolemenu.some(mapping => mapping.menuid === item.menuid))
    .map(item => ({
      ...item,
      children: buildMenuHierarchy(data, rolemenu, item.menuid),
    }));
  return children.length > 0 ? children : null;
}

const generateRewrites = ({ db }) => async () => {
  let [menus] = await db.sequelize.query(`select source,menupath as destination from ad_menus where source != '' and menupath!='' and status = 'Active'`);
  menus.push({
    source: '/programs/configure/:slug*',
    destination: '/components/programs/configure/:slug*'
  });
  menus.push({
    source: '/programs/examination/:slug*',
    destination: '/components/programs/examination/:slug*'
  });
  menus.push({
    source: '/profile',
    destination: '/components/profile'
  });
  menus.push({
    source: "/instructors",
    destination: "/components/tutor/manage",
  });
  return menus;
}

const checkforgot = ({ db, keys }) => async ({ loginid, orgid }) => {
  loginid = loginid.trim();

  const [user] = await db.sequelize.query(`select userid,orgid,loginid,firstname,lastname,email,mobile,profile from ad_users au where status ='Active' and usertype='Instructor' and isverified='Yes' and BINARY loginid = ? and orgid = ? `,
    { replacements: [loginid, orgid], type: db.sequelize.QueryTypes.SELECT });
  if (user) {
    //const otp = Math.floor(Math.random() * 900000) + 100000;
    const otp = 111111;
    //sendOTP(user.mobile,user.email);
    await db.sequelize.query(`UPDATE ad_users set otp=?, otptimeout=date_add(now(),INTERVAL ` + keys.OTP_TIMEOUT + ` minute) where userid = ? and status ='Active' and usertype='Instructor'`,
      { replacements: [otp, user.userid] });
    let payload = {
      userid: user.userid.toString(),
      otp: otp.toString(),
      otp_timeout: keys.OTP_TIMEOUT
    }
    new MailTemplate(db, 'otp_email_forgot', payload);
  }
  return user;
}

const verifyforgot = ({ db }) => async ({ loginid, password, orgid, otp }) => {
  loginid = loginid.trim();
 

  const [user] = await db.sequelize.query(`select userid,orgid,loginid,firstname,lastname,email,mobile,profile from ad_users au where status ='Active' and isverified='Yes' and usertype='Instructor' and BINARY loginid = ? and orgid = ? and otp= '${otp}' and otptimeout >= now() `,
    { replacements: [loginid, orgid, otp], type: db.sequelize.QueryTypes.SELECT });
  if (user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.sequelize.query(`UPDATE ad_users set password=?, otp=null, otptimeout=null where userid = ? and status ='Active' and usertype='Instructor'`, { replacements: [hashedPassword, user.userid] });
    let payload = {
      userid: user.userid.toString()
    }
    new MailTemplate(db, 'new_password_updated', payload);
  }
  return user;
}

const register = ({ db, validation, keys }) => async (body) => {
  try {
    const errors = [];
    if (body.mobile && body.mobile !== "") {
      let [check_learner_mobile] = await db.sequelize.query(`
        select * from ad_users where mobile = :_mobile and usertype = 'Instructor' and deletedon is null
      `, {
        replacements: {
          _mobile: body.mobile
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if (check_learner_mobile) {
        errors.push(validation.messages.mobile_duplicate);
      }
    }

    if (body.email && body.email !== "") {
      [check_learner_email] = await db.sequelize.query(`
        select * from ad_users  where email = :_email and usertype = 'Instructor'  and deletedon is null
      `, {
        replacements: {
          _email: body.email
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if (check_learner_email) {
        errors.push(validation.messages.email_duplicate);
      }
    }
    if (body.username && body.username !== "") {
      [check_learner_username] = await db.sequelize.query(`
        select * from ad_users  where loginid = :_username and usertype = 'Instructor' and deletedon is null
      `, {
        replacements: {
          _username: body.username
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if (check_learner_username) {
        errors.push(validation.messages.username_duplicate);
      }
    }

    if (errors.length > 0) {
      return { statusCode: 400, errors: errors, message: "" };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Define the insert query and its corresponding positional placeholders
    const insertQuery = `
      INSERT INTO ad_users 
      (useruuid,loginid, firstname, lastname, email, mobile, password, organization, address,usertype,createdon) 
      VALUES (UUID(),?, ?, ?, ?, ?, ?, ?, ?,"Instructor",NOW())
    `;
    const mobile = body.mobile.trim() === "" ? null : body.mobile;
    // Make sure that queryParams is an array of values in the correct order
    const queryParams = [
      body.username, body.firstname, body.lastname, body.email, mobile, hashedPassword, body.organization, body.address
    ];

    // Insert the new user into the database
    let [res] = await db.sequelize.query(insertQuery, {
      replacements: queryParams,  // passing the queryParams array for positional replacement
      type: db.sequelize.QueryTypes.INSERT
    });

    let payload = {
      instructor_id: res,
      password: body.password
    };
    await db.sequelize.query(
      `INSERT INTO ad_userrolemap (userid, roleid, status, createdon) VALUES (:_userid,  :_roleid, 'Active', NOW())`,
      {
        replacements: {
          _userid: res,
          _roleid: keys.INSTRUCTOR_ROLE_ID
        }
      }
    );
    new MailTemplate(db, 'instructor_welcome_mail', payload);

    return { 'statusCode': 200, 'message': validation.messages.add_success };

  } catch (error) {
    console.error('Error Save Instructor Submit:', error);
    throw error;
  }
}

const verifyById = ({ db, validation }) => async (instructor_id) => {

  let [check_learner] = await db.sequelize.query(`select loginid,useruuid from ad_users where userid=:_id and usertype='Instructor' and deletedon is null `, {
    replacements: {
      _id: instructor_id,
    },
    type: db.sequelize.QueryTypes.SELECT
  });

  if (check_learner) {
    let payload = {
      instructor_id: instructor_id
    }
    //new MailTemplate(db,'instructor_verification_done',payload);
    return { 'statusCode': 200, 'message': validation.messages.verification_email };
  } else {
    return { 'statusCode': 400, 'message': validation.messages.instructor_not_found };
  }
}

const verifySuccessById = ({ db, validation }) => async (instructor_useruuid) => {
  let [check_instructor] = await db.sequelize.query(`select userid,loginid,useruuid,isverified from ad_users where useruuid=:_id and usertype='Instructor' and deletedon is null `, {
    replacements: {
      _id: instructor_useruuid,
    },
    type: db.sequelize.QueryTypes.SELECT
  });
  if (check_instructor) {
    if (check_instructor.isverified == 'Yes') {
      return { 'statusCode': 200, 'message': validation.messages.already_verification_email };
    } else {
      let [res] = await db.sequelize.query(`UPDATE ad_users set isverified='Yes' where useruuid=:_id`, {
        replacements: {
          _id: instructor_useruuid
        }
      });
      let payload = {
        instructor_id: check_instructor.userid
      }
      const noti = new NotiTemplate(db, 'welcome_instructor', payload, 'Instructor', check_instructor.userid);
      await noti.send();
      return { 'statusCode': 200, 'message': validation.messages.verification_success_email };
    }

  } else {
    return { 'statusCode': 400, 'message': validation.messages.instructor_not_found };
  }
}

module.exports = {
  organizationList,
  getCompanyWebSetting,
  checklogin,
  verifylogin,
  verifyDirectLogin,
  userrolemenu,
  generateRewrites,
  checkforgot,
  verifyforgot,
  verifyById,
  verifySuccessById,
  register,
};
