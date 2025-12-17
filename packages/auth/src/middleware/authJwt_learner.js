const jwt = require("jsonwebtoken");
const keys = require("./../keys.js");
const db = require("../db").db;
const crypto = require("../middleware/crypto");
const generateAccessToken = async (hostname,learnerData) => {
  try {
    const jwtObj = {
      key: crypto.cryptoEncrypt({
        learner_uuid: learnerData.learner_uuid, username: learnerData.firstname, logintime: new Date(),
      })
    };
    const refresh_token = jwt.sign(learnerData, keys.JWT_REFRESH_SECRET, {
      expiresIn: keys.JWT_REFRESH_EXPIRES_IN,
    });

    const access_token = jwt.sign(jwtObj, keys.JWT_SECURITY_KEY, {
      expiresIn: keys.JWT_EXPIRES_IN,
    });
    //USER LICENSE KEY LOGIC
    learnerData.license_key = null;
    let [result] = await db.sequelize.query(`SELECT * FROM web_settings WHERE domain_url = '${hostname}' LIMIT 1`, { type: db.sequelize.QueryTypes.SELECT });
    if(result?.license_key){
      learnerData.license_key = result.license_key
    }
    await db.sequelize.query(`INSERT INTO learner_refresh_tokens (learner_id, access_token, refresh_token,  token_json,  is_valid, logged_in, createdon) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NOW())`,
      {
        replacements: [learnerData.learner_id, access_token, refresh_token, JSON.stringify(learnerData), 1],
        type: db.sequelize.QueryTypes.INSERT,
      }
    );
    return access_token;
  } catch (error) {
    console.error("Error generating access token:", error);
    throw error;
  }
};
const authJwt = {
  generateAccessToken
};
module.exports = authJwt;
