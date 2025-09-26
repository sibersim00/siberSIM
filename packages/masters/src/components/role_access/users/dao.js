const MailTemplate=require('../../../utils/mailUtility')
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
// Function to generate a UUID
const generateUUID = () => uuidv4();

const list = ({ db }) => async (id = null) => {
  try {
    const [res] = await db.sequelize.query(`SELECT  m.userid, m.orgid, m.loginid,CONCAT(m.firstname, ' ', m.lastname) AS name, m.firstname, m.lastname, m.email, m.mobile, CASE WHEN m.status = 'Active' THEN 'true' ELSE 'false' END AS status,m.profile,
       DATE_FORMAT(m.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
        DATE_FORMAT(m.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon 
      FROM ad_users m WHERE m.deletedon IS NULL AND isverified='Yes' AND m.usertype='Admin' AND (:id IS NULL OR m.userid = :id) ORDER BY name ASC `,
      {
        replacements: { id }
      }
    );
    return res;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

const create = ({ db, validation,keys }) => async (body, userId) => {
  try {
    const errors = [];
    if (body.mobile && body.mobile !== "") {
      let [check_admin_mobile] = await db.sequelize.query(`select * from ad_users where mobile=:_mobile and usertype='Admin' and deletedon is null `, {
        replacements: {
          _mobile: body.mobile
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if(check_admin_mobile){
        errors.push(validation.messages.mobile_duplicate);
      }
    }
    if (body.email && body.email !== "") {
      let [check_admin_email] = await db.sequelize.query(`select * from ad_users where email=:_email and usertype='Admin' and deletedon is null `, {
        replacements: {
          _email: body.email,
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if(check_admin_email){
        errors.push(validation.messages.email_duplicate);
      }
    }
    if (body.loginid && body.loginid !== "") {
      let [check_admin_username] = await db.sequelize.query(`select * from ad_users where loginid=:_loginid and usertype='Admin' and deletedon is null `, {
        replacements: {
          _loginid: body.loginid,
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if(check_admin_username){
        errors.push(validation.messages.username_duplicate);
      }
    }

  if (errors.length > 0) {
    return { statusCode: 400, errors: errors, message:"" };
  }
    // Proceed with insertion if loginid doesn't exist

    const hashedPassword = await bcrypt.hash(body.password, 10);

    let insertQuery = `INSERT INTO ad_users (useruuid,loginid, firstname, lastname, email, mobile, password, status, createdby, createdon,isverified) 
      VALUES (uuid(),?, ?, ?, ?, ?, ?, CASE WHEN ? = 'true' THEN 'Active' ELSE 'Inactive' END, ?, CURRENT_TIMESTAMP,'Yes');`;
    let queryParams = [body.loginid, body.firstname, body.lastname, body.email, body.mobile, hashedPassword,
      body.status, userId];
      
    let [res]=await db.sequelize.query(insertQuery, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.INSERT,
      RETURNING:'userid'
    });
    await db.sequelize.query(
      `INSERT INTO ad_userrolemap (userid, roleid, createdby, createdon) VALUES (:_userid, :_roleid,:_createdby, NOW())`,
      {
          replacements: {
              _userid: res,          
              _roleid: keys.ADMIN_ROLE_ID,
              _createdby: userId,
          }
      }
    );
    if (res) {
      let payload={
        userid: res
      }
      new MailTemplate(db,'welcome_email',payload);
      return { status: true, message: validation.messages.add_success };
    } else {
      return {
        status: false,
        errors: [validation.messages.something_wrong_try_later]
      };
    }
  } catch (error) {
    console.log("Create User error:", error);
    return { status: false };
  }
};

const update = ({ db, validation }) => async (body, session_userid) => {
  try {
    const errors = [];
    if (body.mobile && body.mobile !== "") {
      let [check_admin_mobile] = await db.sequelize.query(`select * from ad_users where mobile=:_mobile and userid!=:_id and usertype='Admin' and deletedon is null `, {
        replacements: {
          _mobile: body.mobile,
          _id: body.userid,
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if(check_admin_mobile){
        errors.push(validation.messages.mobile_duplicate);
      }
    }
    if (body.email && body.email !== "") {
      let [check_admin_email] = await db.sequelize.query(`select * from ad_users where email=:_email and userid!=:_id and usertype='Admin' and deletedon is null `, {
        replacements: {
          _email: body.email,
          _id: body.userid,
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if(check_admin_email){
        errors.push(validation.messages.email_duplicate);
      }
    }
    if (body.loginid && body.loginid !== "") {
      let [check_admin_username] = await db.sequelize.query(`select * from ad_users where loginid=:_loginid and userid!=:_id and usertype='Admin' and deletedon is null `, {
        replacements: {
          _loginid: body.loginid,
          _id: body.userid
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      if(check_admin_username){
        errors.push(validation.messages.username_duplicate);
      }
    }
    if (errors.length > 0) {
      return { statusCode: 400, errors: errors, message:"" };
    }

    // Proceed with update if loginid doesn't exist
    const mobile = body.mobile && body.mobile.toString().trim() !== ""  ? body.mobile.toString().trim()  : null;
     const updateQuery = `
      UPDATE ad_users SET  loginid = ?, firstname = ?, lastname = ?, email = ?, mobile = ?, status = CASE WHEN ? = 'true' THEN 'Active' ELSE 'Inactive' END, modifiedby = ?, modifiedon = CURRENT_TIMESTAMP WHERE userid = ?; `;
    let result = await db.sequelize.query(updateQuery, { replacements: [body.loginid, body.firstname, body.lastname, body.email, mobile, body.status, session_userid, body.userid] });

    if (result) {
      return { statusCode: 200, status: true, message: validation.messages.update_success };
    } else {
      return { statusCode: 500, status:  false, errors: [validation.messages.not_updated] };
    }
  } catch (error) {
    console.log("Update User error:", error);
    return { status: false, errors: [validation.messages.something_wrong_try_later] };
  }
};

const status = ({ db }) => async (body, loginId) => {
  const status = body.status == 'true' ? 'Active' : 'Inactive';
  let [res] = await db.sequelize.query(`UPDATE ad_users set status =:_status,modifiedby = now(), modifiedby = :_loginid where userid=:_id`, {
    replacements: {
      _id: body.userid,
      _loginid: loginId,
      _status: body.status == 'true' ? 'Active' : 'Inactive',
    }
  });
  return res;
}

const getProfile = ({ db }) => async (req) => {
  const userId = req?.user?.userid;
  let [res] = await db.sequelize.query(`select * from ad_users WHERE userid = ? and status='Active' and deletedon IS NULL`, {
    replacements: [userId],
    type: db.sequelize.QueryTypes.SELECT
  });
  return res;
}

const updateProfile = ({ db, validation }) => async (body, session_userid) => {
  try {
    const updateQuery = `
      UPDATE ad_users SET firstname = ?,  lastname = ?,  email = ?,   mobile = ?, modifiedby = ?,  modifiedon = CURRENT_TIMESTAMP  WHERE userid = ?; `;

    const [result] = await db.sequelize.query(updateQuery, {
      replacements: [body.firstname, body.lastname, body.email, body.mobile, session_userid, session_userid,],
      type: db.sequelize.QueryTypes.UPDATE,
    });

    return { status: true, message: validation.messages.update_success };

  } catch (error) {
    console.log("Update User error:", error);
    return { status: false, errors: [validation.messages.something_wrong_try_later] };
  }
};

const updateProfileImage = ({ db, validation }) => async (body, session_userid) => {
  try {
    const updateQuery = `
      UPDATE ad_users SET profile = ?, modifiedby = ?,  modifiedon = CURRENT_TIMESTAMP  WHERE userid = ?; `;

    const [result] = await db.sequelize.query(updateQuery, {
      replacements: [body.profile, session_userid, session_userid,],
      type: db.sequelize.QueryTypes.UPDATE,
    });

    return { status: true, message: validation.messages.update_profile_success };

  } catch (error) {
    console.log("Update User error:", error);
    return { status: false, errors: [validation.messages.something_wrong_try_later] };
  }
};

const changePassword = ({ db, validation }) => async (body, session_userid) => {
  // Check if loginid already exists for the given orgid, but exclude the current record
  const checkLoginIdQuery = `SELECT password FROM ad_users WHERE userid = ?;`;
  const updatePasswordQuery = ` UPDATE ad_users SET password = ?  WHERE userid = ?;`;
  try {
    const [existingUser] = await db.sequelize.query(checkLoginIdQuery, {
      replacements: [session_userid],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (!existingUser) {
      return {
        status: false,
        errors: [validation?.messages?.invalid_password || "User not found."],
      };
    }
    // Compare old password with stored hashed password
     const isMatch = await bcrypt.compare(body.oldPassword, existingUser.password);

     if (!isMatch) {
      return { status: false, errors: ["Invalid old password."] };
    }
    if (!body.password) {
          return { status: false, errors: ["New password is required."] };
        }
    
        const hashedNewPassword = await bcrypt.hash(body.password, 10);
    
        const [result] = await db.sequelize.query(updatePasswordQuery, {
          replacements: [hashedNewPassword, session_userid],
        });
    
        if (result && result.affectedRows > 0) {
          return {
            status: true,
            message: validation?.messages?.password_update || "Password updated successfully.",
          };
        } else {
          return {
            status: false,
            errors: [validation?.messages?.not_updated || "Password update failed."],
          };
        }
      } catch (error) {
        console.log("Update User error:", error);
        return {
          status: false,
          errors: [validation?.messages?.something_wrong_try_later || "Something went wrong. Please try again later."],
        };
      }
};

const resetpassword = ({ db }) =>  async (session_userid) => {
  const uuid = generateUUID();
  const uuidSubstring = uuid.slice(0, 6);
  const currentYear = new Date().getFullYear();
  const password = `${uuidSubstring}$${currentYear}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  let [res] = await db.sequelize.query(`UPDATE ad_users set password=:_password where userid=:_user_id`, {
    replacements: {
        _password: hashedPassword,
        _user_id: session_userid
    }
  });
  let payload={
    userid:session_userid,
    password : password
  }
  new MailTemplate(db,'admin_reset_password',payload);
    return res;
}

const mailConfirmation = ({ db,validation }) =>  async (body) => {
  try {
    let [check_user] = await db.sequelize.query(`select userid,email,isverified from ad_users where userid=:_userid and deletedon is null `, {
      replacements: {
        _userid: body.userid
      },
      type: db.sequelize.QueryTypes.SELECT
    });

    if(check_user){
      if(check_user.isverified=='No')
      {
        const updateQuery = `UPDATE ad_users SET isverified=? WHERE userid=?`;
        const updateParams = ['Yes',body.userid];
        await db.sequelize.query(updateQuery, {
          replacements: updateParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });

        let payload={
          learner_id:check_user
        }
        new MailTemplate(db,'user_account_confirmation_success',payload);
        return {'statusCode':200, 'message': validation.messages.user_mail_confirmed};
      }else{
        return {'statusCode':400, 'message': validation.messages.user_mail_confirmation};
      }
    }else{
      return {'statusCode':400, 'message': validation.messages.user_not_found};
    }
} catch (error) {
    console.error('Error System Config Submit:', error);
    throw error;
}
    
}

const resendMailUser = ({ db, validation }) => async (body) => {
	let checkLoginIdQuery = ` SELECT 1 FROM ad_users WHERE userid = ?;`;
	try {
			let [loginIdExists] = await db.sequelize.query(checkLoginIdQuery, {
					replacements: [body.user_id],
					type: db.sequelize.QueryTypes.SELECT
			});

			if (loginIdExists) {
          let payload={
            userid: body.user_id
        }
        new MailTemplate(db,'welcome_email',payload);
					return { status: true, message: validation.messages.resend_mail_success };
			} else {
					return {
							status: false,
							errors: [validation.messages.something_wrong_try_later]
					};
			}
	} catch (error) {
			console.log("resendMailUser error:", error);
			return { status: false };
	}
};

const userImport = ({ db }) => async ({ body, session_userid,orgid }) => {
  try {
    let createdby = session_userid;
    let password = '1100';
    const results = [];
    let hasDuplicate = false;

    // First Pass: Validate for duplicates
    for (const row of body) {
      const [check_user] = await db.sequelize.query(
        `SELECT * FROM ad_users WHERE (email = :_email OR mobile = :_mobile) AND deletedon IS NULL`,
        {
          replacements: {
            _email: row.email,
            _mobile: row.mobile,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (check_user) {
        row.status='error'
        row.message='The provided email/mobile is already registered. Please use a different one.'
        results.push(row);
        hasDuplicate = true;
      } else {
        row.status='valid'
        row.message='Valid for insertion.'
        results.push(row);
      }
    }

    // If any duplicate is found, return the errors without inserting
    if (hasDuplicate) {
      return {
        statusCode: 400,
        message: 'Duplicate entries found. No data has been inserted.',
        data:results,
      };
    }

    // Second Pass: Insert all data if validation passed
    for (const row of body) {
      const insertQuery = `INSERT INTO ad_users (orgid, loginid, firstname, lastname, email, mobile, password, createdby, createdon) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

      const queryParams = [orgid, row.loginid, row.firstname, row.lastname, row.email, row.mobile, password, createdby];

      const [res] = await db.sequelize.query(insertQuery, {
        replacements: queryParams,
        type: db.sequelize.QueryTypes.INSERT,
      });
    }
    return {
      statusCode: 200,
      message: 'All User created successfully.',
      data:[],
    };
  } catch (error) {
    console.error('Error Save User Submit:', error);
    throw error;
  }
};

module.exports = {
  list,
  create,
  update,
  status,
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
  resetpassword,
  mailConfirmation,
  resendMailUser,
  userImport
}