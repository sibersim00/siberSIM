const MailTemplate = require('../../utils/mailUtility')
const bcrypt = require('bcryptjs');
const serialLicense = require("../../middleware/serialLicense");

const organizationList = ({ db }) => async (id) => {
  const [result] = await db.sequelize.query(`SELECT getOrganizations(${id}) as data`, { type: db.sequelize.QueryTypes.SELECT });
  let data = [];
  if (result.data != undefined && result.data != null) {
    data = JSON.parse(result.data)
  }
  return data;
}

// const getCompanyWebSetting = ({ db }) => async (hostname) => {
//   let [result] = await db.sequelize.query(`SELECT * FROM web_settings WHERE domain_url = '${hostname}' LIMIT 1`, { type: db.sequelize.QueryTypes.SELECT });
//   if(result?.license_key){
//     let licenseStatus = serialLicense.checkValidate(hostname,result?.license_key);
//     console.log("licenseStatus===============>",licenseStatus);
//     if(licenseStatus.isKeyValid && licenseStatus.isHost && licenseStatus.isStart && !licenseStatus.isExp){
//       result.licenseStatus=licenseStatus;
//       return {status : true, message : "", data : result, redirect : false}
//     } else if(licenseStatus.isKeyValid && licenseStatus.isHost && !licenseStatus.isStart && !licenseStatus.isExp){
//       return {status : true, message : "", data : {licenseStatus:licenseStatus}, redirect : false}
//     } else {
//       return {status : true, message : "", data : licenseStatus, redirect : true}
//     }
//   }else{
//     return {status : true, message : "", data : null, redirect : true}
//   }
// };

const getCompanyWebSetting = ({ db }) => async (hostname) => {
  let [result] = await db.sequelize.query(
    `SELECT * FROM web_settings WHERE domain_url = '${hostname}' LIMIT 1`,
    { type: db.sequelize.QueryTypes.SELECT }
  );
  if (result?.license_key) {
    let oldLicenseKey = result.license_key; 
    let licenseStatus = serialLicense.checkValidate(hostname, result?.license_key);
  if (licenseStatus.isExp) {
      const [latestLicense] = await db.sequelize.query(
        `SELECT license_key FROM license_logs WHERE status = 'New' ORDER BY createdon DESC LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      console.log("latestLicenselatestLicenselatestLicense",latestLicense ?.license_key)
      let newLicenseKey = latestLicense ?.license_key;
     if (latestLicense?.license_key) {
        await db.sequelize.query(`UPDATE license_logs SET status = 'Expired' WHERE license_key = :oldKey`,
          { replacements: { oldKey: oldLicenseKey } }
        );
        await db.sequelize.query(`UPDATE license_logs SET status = 'Active'  WHERE license_key = :newKey`,
          { replacements: { newKey: newLicenseKey } }
        );
        await db.sequelize.query(
          `UPDATE web_settings SET license_key = :license_key, modifiedon = NOW() WHERE id = :id`,
          {
            replacements: { license_key: latestLicense.license_key, id: result.id }
          }
        );
        result.license_key = latestLicense.license_key;
        licenseStatus = serialLicense.checkValidate( hostname, latestLicense.license_key );
      }
    }
 // ⬇EXISTING LOGIC (UNCHANGED)
    if (licenseStatus.isKeyValid && licenseStatus.isHost && licenseStatus.isStart && !licenseStatus.isExp) {
      result.licenseStatus = licenseStatus;
      return { status: true, message: "", data: result, redirect: false };
    }
    else if (licenseStatus.isKeyValid && licenseStatus.isHost && !licenseStatus.isStart && !licenseStatus.isExp) {
      return { status: true, message: "", data: { licenseStatus }, redirect: false };
    }
    else {
      return { status: true, message: "", data: licenseStatus, redirect: true };
    }
  }
  else {
    return { status: true, message: "", data: null, redirect: false };
  }
};



const checklogin = ({ db, keys }) => async ({ loginid, password, orgid }) => {
  try {
    // Trim input values to avoid leading/trailing spaces
    loginid = loginid.trim();
    password = password.trim();

    // Fetch user details including the hashed password
    const [user] = await db.sequelize.query(
      `SELECT userid, orgid, loginid, firstname, lastname, email, mobile, profile, password 
       FROM ad_users 
       WHERE status = 'Active' AND usertype='Admin' AND BINARY loginid = ? AND orgid = ?`,
      { replacements: [loginid, orgid], type: db.sequelize.QueryTypes.SELECT }
    );

    // If no user found, return error
    if (!user) {
      return { statusCode: 404, message: "SIMUser not found" };
    }

    // Compare provided password with hashed password from database
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch === true) {
      const otp = 111111; // For testing, use random in prod

      // Update OTP in database with timeout
      await db.sequelize.query(
        `UPDATE ad_users 
         SET otp = ?, otptimeout = DATE_ADD(NOW(), INTERVAL ? MINUTE) 
         WHERE userid = ? AND usertype='Admin' AND status = 'Active'`,
        { replacements: [otp, keys.OTP_TIMEOUT, user.userid] }
      );

      // Send OTP via email
      let payload = {
        userid: user.userid.toString(),
        otp: otp.toString(),
        otp_timeout: keys.OTP_TIMEOUT
      };
      delete user.password;
      new MailTemplate(db, 'otp_email', payload);

      return {
        statusCode: 200,
        message: "Login successful. OTP has been sent.",
        user,
      };
    } else {
      return { statusCode: 401, message: "Invalid credentials" };
    }
  } catch (error) {
    console.error("Error in checklogin function:", error);
    return { statusCode: 500, message: "Internal server error" };
  }
};

const verifylogin = ({ db }) => async ({ loginid, password, orgid, otp }) => {

  loginid = loginid.trim();
  password = password.trim();


  const [user] = await db.sequelize.query(`select userid,useruuid,orgid,loginid,firstname,lastname,email,mobile,profile,password,usertype from ad_users au where status ='Active' AND usertype='Admin' AND BINARY loginid = ?  and orgid = ? and otp= '${otp}' and otptimeout >= now() `,
    { replacements: [loginid, orgid, otp], type: db.sequelize.QueryTypes.SELECT });

  if (!user) {
    return { statusCode: 401, message: "Invalid credentials" };
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch == true) {
    delete user.password;
    await db.sequelize.query(`UPDATE ad_users set otp=null, otptimeout=null where userid = ? and usertype='Admin' AND status ='Active'`, { replacements: [user.userid] });
    return { statusCode: 200, user };
  } else {
    return { statusCode: 401, message: "Invalid credentials" };
  }

}

const verifyDirectLogin = ({ db }) => async ({ loginid, password, orgid }) => {
  loginid = loginid.trim();
  password = password.trim();


  const [user] = await db.sequelize.query(`select userid,useruuid,orgid,loginid,firstname,lastname,email,mobile,profile,password,usertype from ad_users au where status ='Active' AND usertype='Admin' AND BINARY loginid = ?  and orgid = ?  `,
    { replacements: [loginid, orgid], type: db.sequelize.QueryTypes.SELECT });

  if (!user) {
    return { statusCode: 401, message: "Invalid credentials" };
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch == true) {
    delete user.password;

    return { statusCode: 200, user };
  } else {
    return { statusCode: 401, message: "Invalid credentials" };
  }

}

const userrolemenu = ({ db }) => async ({ userid }) => {
  const [menus] = await db.sequelize.query(`select m.menuid,m.parentmenuid,m.displaymenuname as title,m.singularmenuname as subtitle,m.icon,m.menupath as path,m.submenupath as sub_path,m.source,'false' as active,'false' as selected,case when menutype = 'Tree Menu' then 'sub' else 'link' end as type,m.menutype,m.orderno from ad_menus m where m.status = 'Active' order by m.orderno asc `);
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
  // password = password.trim();

  const [user] = await db.sequelize.query(`select userid,orgid,loginid,firstname,lastname,email,mobile,profile from ad_users au where status ='Active' AND usertype='Admin' and BINARY loginid = ? and orgid = ? `,
    { replacements: [loginid, orgid], type: db.sequelize.QueryTypes.SELECT });
  if (user) {
    //const otp = Math.floor(Math.random() * 900000) + 100000;
    const otp = 111111;
    //sendOTP(user.mobile,user.email);
    await db.sequelize.query(`UPDATE ad_users set otp=?, otptimeout=date_add(now(),INTERVAL ` + keys.OTP_TIMEOUT + ` minute) where userid = ? and  usertype='Admin' AND status ='Active'`,
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

  const [user] = await db.sequelize.query(`select userid,orgid,loginid,firstname,lastname,email,mobile,profile from ad_users au where status ='Active' and usertype='Admin' and BINARY loginid = ? and orgid = ? and otp= '${otp}' and otptimeout >= now() `,
    { replacements: [loginid, orgid, otp], type: db.sequelize.QueryTypes.SELECT });
  if (user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.sequelize.query(`UPDATE ad_users set password=?, otp=null, otptimeout=null where userid = ? and status ='Active'`, { replacements: [hashedPassword, user.userid] });
    let payload = {
      userid: user.userid.toString()
    }
    new MailTemplate(db, 'new_password_updated', payload);
  }
  return user;
}

module.exports = {

  organizationList,
  getCompanyWebSetting,
  checklogin,
  verifyDirectLogin,
  verifylogin,
  userrolemenu,
  generateRewrites,
  checkforgot,
  verifyforgot,
}