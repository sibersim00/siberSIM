const jwt = require("jsonwebtoken");
const  keys  = require("../keys");
const db = require('../db').db;
const crypto = require("./crypto");

const generateAccessToken = async (learnerData) => {
  try {
    const jwtObj = {
      key: crypto.cryptoEncrypt({
        learner_uuid: learnerData.learner_uuid, username: learnerData.firstname, logintime: new Date(),
      }),
    };
    const refresh_token = jwt.sign(learnerData, keys.JWT_REFRESH_SECRET, {
      expiresIn: keys.JWT_REFRESH_EXPIRES_IN,
    });

    const access_token = jwt.sign(jwtObj, keys.JWT_SECURITY_KEY, {
      expiresIn: keys.JWT_EXPIRES_IN,
    });
    await db.sequelize.query(`INSERT INTO learner_refresh_tokens (learner_id, access_token, refresh_token, token_json, is_valid, logged_in, createdon) VALUES (?, ?, ?, ?, ?,CURRENT_TIMESTAMP, NOW())`,
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
const authenticateToken = async (req, res, next) => {
  const authorizationToken = req.headers["authorization"];
  if (!authorizationToken) {
    return res.status(403).send({statusCode: 403, message: "You are not authorized to access this application."});
  }
  const tokenParts = authorizationToken.split(" ");
  const access_token = tokenParts[1];
  try {
    const results = await db.sequelize.query(`SELECT * FROM learner_refresh_tokens WHERE access_token = :access_token AND is_valid = 1`,
      {
        replacements: { access_token },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (results.length === 0) {
      return res.status(403).send({statusCode: 403, message: "You are not authorized to access this application.",});
    }
    const tokenRow = results[0]; 
    jwt.verify(access_token, keys.JWT_SECURITY_KEY, (err) => {
      if (err) {
        return res.status(401).send({statusCode: 401, message: "Session Terminated",});
      }
      const learnerData = JSON.parse(tokenRow.token_json || "{}");
      req.learneruser = learnerData;
      console.log("requesting user",req.learneruser)
      next();
    });
  } catch (error) {
    console.error("Learner Middleware Error:", error);
    return res.status(500).send({statusCode: 500, message: "Internal Server Error",});
  }
};
const refreshToken = async (req, res, next) => {
  const authorizationToken = req.headers['authorization'];
  if (!authorizationToken)
    return res.status(403).send({ statusCode: 403, message: "You are not authorized to access this application." });
  const tokenParts = authorizationToken.split(' ');
  const access_token = tokenParts[1];
  let validatedToken = await db.sequelize.query(`SELECT * FROM learner_refresh_tokens WHERE access_token = :access_token AND is_valid = 1`,
    {
      replacements: { access_token },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  if (validatedToken.length > 0 && validatedToken[0].is_valid) {
    jwt.verify(validatedToken[0].refresh_token, keys.JWT_REFRESH_SECRET, async (err, data) => {
      if (err) {
        return res.status(403).send({ statusCode: 403, message: "You are not authorized to access this applications." });
      } else {
        await db.sequelize.query(`UPDATE learner_refresh_tokens SET is_valid = 0, logged_out = NOW() WHERE access_token = :access_token`,
          {
            replacements: { access_token },
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
        let learnerData = JSON.parse(validatedToken[0].token_json);
        learnerData.date = new Date();
        let new_access_token = await generateAccessToken(learnerData);
        return res.status(200).send({statusCode: 200, message: '', data: crypto.cryptoEncrypt({accessToken: new_access_token})});
      }
    });
  } else {
    return res.status(403).send({ statusCode: 403, message: "You are not authorized to access this application." });
  }
};

const clearToken = async (req, res, next) => {
  const authorizationToken = req.headers["authorization"];
  if (!authorizationToken) {
    return res.status(403).send({statusCode: 403, message: "You are not authorized to access this application."});
  }
  const tokenParts = authorizationToken.split(" ");
  const access_token = tokenParts[1];
  try {
    await db.sequelize.query(
  `UPDATE learner_refresh_tokens SET is_valid = 0, logged_out = NOW() WHERE access_token = ?`,
  {
    replacements: [access_token],
    type: db.sequelize.QueryTypes.UPDATE,
  }
);
    return res.status(200).send({statusCode: 200, message: "Logged out successfully."});
  } catch (err) {
    return res.status(500).send({statusCode: 500, message: "Failed to clear token"});
  }
};

module.exports = {
  authenticateToken,
  generateAccessToken,
  refreshToken,
  clearToken,
};