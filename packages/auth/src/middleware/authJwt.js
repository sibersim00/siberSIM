const jwt = require("jsonwebtoken");
const keys = require("../keys");
const db = require("../db").db;
const crypto = require("./crypto");
const generateAccessToken = async (userData) => {
  try {
    // Step 1: Encrypt payload for access_token
    const jwtObj = {
      key: crypto.cryptoEncrypt({
        useruuid: userData.useruuid,
        username: userData.username,
        logintime: new Date(),
      }),
    };

    // Step 2: Generate tokens
    const refresh_token = jwt.sign(userData, keys.JWT_REFRESH_SECRET, {expiresIn: keys.JWT_REFRESH_EXPIRES_IN});

    const access_token = jwt.sign(jwtObj, keys.JWT_SECURITY_KEY, {expiresIn: keys.JWT_EXPIRES_IN,});
    await db.sequelize.query(
      `INSERT INTO ad_user_refresh_tokens (userid,access_token,refresh_token,token_json, is_valid,logged_in,createdon) VALUES (?, ?, ?, ?, ?,CURRENT_TIMESTAMP, NOW())`,
      {
        replacements: [
          userData.userid,
          access_token,
          refresh_token,
          JSON.stringify(userData),
          1,
        ],
        type: db.sequelize.QueryTypes.INSERT,
      }
    );

    return access_token;
  } catch (error) {
    console.error("Error generating access token:", error);
    throw error;
  }
};

const authenticateToken = (routeslug = "") => {
  return async (req, res, next) => {
    const authorizationToken = req.headers["authorization"];
    
    if (!authorizationToken) {
      return res.status(403).send({
        statusCode: 403,
        message: "You are not authorized to access this application.",
      });
    }

    const tokenParts = authorizationToken.split(" ");
    const access_token = tokenParts[1];

    try {
      // Validate token existence and is_valid = 1 in MySQL
      const [results] = await db.query(
        `SELECT * FROM ad_user_refresh_tokens WHERE access_token = ? AND is_valid = 1`,
        [access_token]
      );

      if (results.length === 0) {
        return res.status(403).send({
          statusCode: 403,
          message: "You are not authorized to access this application.",
        });
      }

      const tokenRow = results[0];

      jwt.verify(access_token, keys.JWT_SECURITY_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({
            statusCode: 401,
            message: "Session Terminated",
          });
        }

        // Token is valid, parse user data
        const userData = JSON.parse(tokenRow.token_json || "{}");
        const menuSlugArray = userData.menuslugs || [];

        if (routeslug === "" || menuSlugArray.includes(routeslug)) {
          req.user = userData;
          next();
        } else {
          return res.status(404).send({
            statusCode: 404,
            message:
              "You do not have the necessary permissions to perform this action on this record.",
            status: "Not Found",
          });
        }
      });
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(500).send({
        statusCode: 500,
        message: "Internal Server Error",
      });
    }
  };
};
const refreshToken = async (req, res, next) => {
  const authorizationToken = req.headers["authorization"];
  if (!authorizationToken) {
    return res.status(403).send({
      statusCode: 403,
      message: "You are not authorized to access this application.",
    });
  }

  const token = authorizationToken.split(" ");
  const access_token = token[1];

  try {
    const [rows] = await db.query(
      `SELECT * FROM ad_user_refresh_tokens WHERE access_token = ? AND is_valid = 1`,
      [access_token]
    );

    if (rows.length === 0) {
      return res.status(403).send({
        statusCode: 403,
        message: "You are not authorized to access this application.",
      });
    }

    const tokenData = rows[0];

    jwt.verify(
      tokenData.refresh_token,
      keys.JWT_REFRESH_SECRET,
      async (err) => {
        if (err) {
          return res.status(403).send({
            statusCode: 403,
            message: "You are not authorized to access this application.",
          });
        }

        const userData = JSON.parse(tokenData.token_json || "{}");
        userData.date = new Date(); // update login time or activity

        // Generate a new access token
        const new_access_token = await generateAccessToken(userData);

        const responseData = {
          statusCode: 200,
          message: "",
          data: { accessToken: new_access_token },
        };

        if (userData.isdevice) {
          return res.status(200).send(crypto.cryptoEncrypt(responseData));
        } else {
          return res.status(200).send({
            statusCode: 200,
            message: "",
            data: crypto.cryptoEncrypt({ accessToken: new_access_token }),
          });
        }
      }
    );
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).send({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};
const clearToken = async (req, res, next) => {
  const authorizationToken = req.headers["authorization"];
  if (!authorizationToken) {
    return res.status(403).send({
      statusCode: 403,
      message: "You are not authorized to access this application.",
    });
  }
  const tokenParts = authorizationToken.split(" ");
  const access_token = tokenParts[1];
  try {
    const result = await db.sequelize.query(`UPDATE ad_user_refresh_tokens SET is_valid = 0, logged_out = CURRENT_TIMESTAMP WHERE BINARY access_token = ?`,{
      replacements: [access_token],
      type: db.sequelize.QueryTypes.UPDATE,
    });
    return res.status(200).send({
      statusCode: 200,
      message: "Token Clear Successfully",
    });
  } catch (err) {
    console.error("Error clearing token:", err);
    return res.status(500).send({
      statusCode: 500,
      message: "Failed to clear token",
    });
  }
  
};

module.exports = {
  authenticateToken,
  generateAccessToken,
  refreshToken,
  clearToken
};
