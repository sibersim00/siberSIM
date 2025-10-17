const MailTemplate=require('../../utils/mailUtility')
const bcrypt = require('bcryptjs');
const profile = ({ db }) => async (learner_sessionid) => {
  try{
  const [res] = await db.sequelize.query(`SELECT learner_id, learner_uuid, firstname, lastname, mobile, email, profile FROM learners WHERE learner_id = ?`,
    {
      replacements: [learner_sessionid],
      type: db.sequelize.QueryTypes.SELECT
    }
  );
  return res;
}
 catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, message: 'Internal Server Error' };
  }
};

const updateProfile = ({ db }) => async (body,learner_sessionid) => {
  const updateQuery = `UPDATE learners SET firstname=?, lastname=?, email=?, mobile=?, 
  modifiedon=CURRENT_TIMESTAMP WHERE learner_id=?`;
  const updateParams = [body.firstname, body.lastname, body.email, body.mobile, learner_sessionid];
  try {
    await db.sequelize.query(updateQuery, {
      replacements: updateParams,
      type: db.sequelize.QueryTypes.UPDATE,
    });
    return { statusCode: 200, message: "Profile Updated Successfully" };
  } catch (error) {
    console.error('Error Profile Update Submit:', error);
    return { statusCode: 500, message: 'Profile update failed due to internal server error' };
  }
};

const changePassword = ({ db, validation }) => async (body, learner_sessionid) => {
  const checkPasswordQuery = `SELECT password FROM learners WHERE learner_id = ?;`;
  const updatePasswordQuery = `UPDATE learners SET password = ? WHERE learner_id = ?;`;
  try {
    if (!learner_sessionid) {
      return { status: false, errors: ["Invalid learner ID."] };
    }
    const [existingLearner] = await db.sequelize.query(checkPasswordQuery, {
      replacements: [learner_sessionid],
      type: db.sequelize.QueryTypes.SELECT
    });
    if (!existingLearner) {
      return {status: false, errors: [validation?.messages?.invalid_password || "Learner not found."],
      };
    }
    const isMatch = await bcrypt.compare(body.oldPassword, existingLearner.password);
    if (!isMatch) {
      return { status: false, errors: ["Invalid old password."] };
    }
    if (!body.password) {
      return { status: false, errors: ["New password is required."] };
    }
    const hashedNewPassword = await bcrypt.hash(body.password, 10);
    const [result] = await db.sequelize.query(updatePasswordQuery, {
      replacements: [hashedNewPassword, learner_sessionid],
    });
    if (result && result.affectedRows > 0) {
      return {status: true, message: validation?.messages?.password_update || "Password updated successfully.",
      };
    } else {
      return {status: false, errors: [validation?.messages?.not_updated || "Password update failed."],
      };
    }
  } catch (error) {
    console.log("Update SIMUser error:", error);
    return {status: false, errors: [validation?.messages?.something_wrong_try_later || "Something went wrong. Please try again later."],
    };
  }
};

const updateProfileImage = ({ db, validation }) => async (body, learner_sessionid) => {
  try {
    const updateQuery = `UPDATE learners SET profile = ?, modifiedon = CURRENT_TIMESTAMP WHERE learner_id = ?`;
    await db.sequelize.query(updateQuery, {
      replacements: [body.profile, learner_sessionid],
      type: db.sequelize.QueryTypes.UPDATE,
    });
    return { status: true, message: validation.messages.update_profile_image_success };
  } catch (error) {
    console.log("Update SIMUser error:", error);
    return { status: false, errors: [validation.messages.something_wrong_try_later] };
  }
};

module.exports = {
  profile,
  updateProfile,
  changePassword,
  updateProfileImage
}