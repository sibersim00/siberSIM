const jwt = require("jsonwebtoken");
const keys = require("../keys");
const db = require("../db").db;
const crypto = require("./crypto");
const serialLicense = require("./serialLicense");
const generateAccessToken = async (hostname,userData) => {
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
    const refresh_token = jwt.sign(userData, keys.JWT_REFRESH_SECRET, {
      expiresIn: keys.JWT_REFRESH_EXPIRES_IN,
    });

    const access_token = jwt.sign(jwtObj, keys.JWT_SECURITY_KEY, {
      expiresIn: keys.JWT_EXPIRES_IN,
    });
    //USER LICENSE KEY LOGIC
    userData.license_key = null;
    let [result] = await db.sequelize.query(`SELECT * FROM web_settings WHERE domain_url = '${hostname}' LIMIT 1`, { type: db.sequelize.QueryTypes.SELECT });
    if(result?.license_key){
      userData.license_key = result.license_key
    }
    await db.sequelize.query(
  `INSERT INTO ad_user_refresh_tokens (
      userid,
      access_token,
      refresh_token,
      token_json,
      is_valid,
      logged_in,
      createdon
    ) VALUES (?, ?, ?, ?, ?,CURRENT_TIMESTAMP, NOW())`,
  {
    replacements: [userData.userid, access_token, refresh_token, JSON.stringify(userData), 1],
    type: db.sequelize.QueryTypes.INSERT,
  }
);
    return access_token;

  } catch (error) {
    console.error("Error generating access token:", error);
    throw error;
  }
};

// Make authenticateToken accept a route slug
const authenticateToken = (routeslug) => {
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
      const results = await db.sequelize.query(
        `SELECT * FROM ad_user_refresh_tokens 
         WHERE access_token = :access_token AND is_valid = 1`,
        {
          replacements: { access_token },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (results.length == 0) {
        return res.status(403).send({
          statusCode: 403,
          message: "You are not authorized to access this application.",
        });
      }

      const tokenRow = results[0];

      jwt.verify(access_token, keys.JWT_SECURITY_KEY, (err) => {
        if (err) {
          return res.status(401).send({
            statusCode: 401,
            message: "Session Terminated",
          });
        }
        const userData = JSON.parse(tokenRow.token_json || "{}");
        userData.user_count_limit  =0;
        userData.learner_limit = null;
        // License check
        if (!userData.issuper && userData.license_key) {
          const hostname = req.hostname;
          const licenseStatus = serialLicense.validateJWTLicense(
            hostname,
            userData.license_key
          );
          if (!licenseStatus) {
            return res.status(503).send({
              statusCode: 503,
              message:
                userData.usertype == "Admin"
                  ? "Access denied: Your license seems expired or not registered. Please update your license to continue."
                  : "Your access has expired or is not activated. Please contact your administrator for assistance.",
            });

          }
          userData.user_count_limit  = Number(licenseStatus.user_count)
          userData.manipulation  = licenseStatus.manipulation
          userData.learner_limit =
            licenseStatus.learner_limit === null || licenseStatus.learner_limit === undefined
              ? null
              : Number(licenseStatus.learner_limit);
        }


        if (routeslug && userData.menus) {
          let allowed = false;
          if (typeof routeslug === "string") {allowed = userData.menus.includes(routeslug);}
          else if (Array.isArray(routeslug)) { 
            if (routeslug.some(slug => slug.trim() == "")) {
              allowed = true;
            } else {
              allowed = routeslug.some(slug => userData.menus.includes(slug));
            }}
          if (!allowed) {
            return res.status(404).send({
              statusCode: 404,
              message:"You do not have the necessary permissions to perform this action.",
              status: "Not Found",
            });
          }
        }
        req.user = userData;
        next();
      });
    } catch (error) {
      console.error("Master Middleware Error:", error);
      return res.status(500).send({
        statusCode: 500,
        message: "Internal Server Error",
      });
    }
  };
};

const authenticateTokenold = async (req, res, next) => {
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
    const results = await db.sequelize.query(
      `SELECT * FROM ad_user_refresh_tokens WHERE access_token = :access_token AND is_valid = 1`,
      {
        replacements: { access_token },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    console.log("results===========>",results);
    if (results.length === 0) {
      return res.status(403).send({
        statusCode: 403,
        message: "You are not authorized to access this application.",
      });
    }

    const tokenRow = results[0];

    jwt.verify(access_token, keys.JWT_SECURITY_KEY, (err) => {
      if (err) {
        return res.status(401).send({
          statusCode: 401,
          message: "Session Terminated",
        });
      }

      const userData = JSON.parse(tokenRow.token_json || "{}");
      if(!userData.issuper && userData.license_key){
        let hostname = req.hostname;
        const licenseStatus = serialLicense.validateJWTLicense(hostname,userData.license_key);
        if (!licenseStatus) { 
          return res.status(503).send({
          statusCode: 503,
          message: userData.usertype =='Admin' ? "Access denied: Your license seems expired or not registered. Please update your license to continue." : "Your access has expired or is not activated. Please contact your administrator for assistance.",
        });
        }
      }
      req.user = userData;
      next();
    });
  } catch (error) {
    console.error("Master Middleware Error:", error);
    return res.status(500).send({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};

const validateLicenseToken = async (req, res, next) => {
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
    const results = await db.sequelize.query(
      `SELECT * FROM ad_user_refresh_tokens WHERE access_token = :access_token AND is_valid = 1`,
      {
        replacements: { access_token },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    console.log("results===========>",results);
    if (results.length === 0) {
      return res.status(403).send({
        statusCode: 403,
        message: "You are not authorized to access this application.",
      });
    }

    const tokenRow = results[0];

    jwt.verify(access_token, keys.JWT_SECURITY_KEY, (err) => {
      if (err) {
        return res.status(401).send({
          statusCode: 401,
          message: "Session Terminated",
        });
      }

      const userData = JSON.parse(tokenRow.token_json || "{}");
      req.user = userData;
      next();
    });
  } catch (error) {
    console.error("Master Middleware Error:", error);
    return res.status(500).send({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};

const refreshToken = async (req, res, next) => {
  const authorizationToken = req.headers['authorization'];

  if (!authorizationToken)
    return res.status(403).send({ statusCode: 403, message: "You are not authorized to access this application." });

  const tokenParts = authorizationToken.split(' ');
  const access_token = tokenParts[1];

  let validatedToken = await db.sequelize.query(
    `SELECT * FROM ad_user_refresh_tokens WHERE access_token = :access_token AND is_valid = 1`,
    {
      replacements: { access_token },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (validatedToken.length > 0 && validatedToken[0].is_valid) {
    jwt.verify(validatedToken[0].refresh_token, keys.JWT_REFRESH_SECRET, async (err, data) => {
      if (err) {
        return res.status(403).send({ statusCode: 403, message: "You are not authorized to access this application." });
      } else {
        await db.sequelize.query(
          `UPDATE ad_user_refresh_tokens
           SET is_valid = 0, logged_out = NOW()
           WHERE access_token = :access_token`,
          {
            replacements: { access_token },
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );

        let userData = JSON.parse(validatedToken[0].token_json);
        userData.date = new Date();
        const hostname = req?.hostname;
        console.log("req=========>",hostname);
        let new_access_token = await generateAccessToken(hostname,userData);

        return res.status(200).send({
          statusCode: 200,
          message: '',
          data: crypto.cryptoEncrypt({accessToken: new_access_token})
        });
      }
    });
  } else {
    return res.status(403).send({ statusCode: 403, message: "You are not authorized to access this application." });
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
    await db.sequelize.query(`UPDATE ad_user_refresh_tokens SET is_valid = 0, logged_out = NOW() WHERE access_token = ?`,
  {
    replacements: [access_token],
    type: db.sequelize.QueryTypes.UPDATE,
  }
);
    return res.status(200).send({
      statusCode: 200,
      message: "Logged out successfully."
    });
  } catch (err) {
    console.error("Error clearing token:", err);
    return res.status(500).send({
      statusCode: 500,
      message: "Failed to clear token"
    });
  }
};

const logout =
  async (req, res) => {
    const authorizationToken = req.headers["authorization"];
    if (!authorizationToken) {
      return {
        statusCode: 403,
        message: "Access token is missing.",
      };
    }
    const tokenParts = authorizationToken.split(" ");
    const access_token = tokenParts[1];
    if (!access_token) {
      return {
        statusCode: 403,
        message: "Access token is invalid.",
      };
    }
    try {
      const [affectedRows] = await db.sequelize.query(
        `UPDATE ad_user_refresh_tokens 
       SET is_valid = 0, 
           logged_out = CURRENT_TIMESTAMP 
       WHERE access_token = :access_token`,
        {
          replacements: { access_token },
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );
      if (affectedRows === 0) {
        return {
          statusCode: 404,
          message: "Token not found or already logged out.",
        };
      }
      return {
        statusCode: 200,
        message: "Logged out successfully.",
      };
    } catch (err) {
      console.error("Logout error:", err);
      return {
        statusCode: 500,
        message: "Logout failed.",
      };
    }
  };

module.exports = {
  authenticateToken,
  generateAccessToken,
  validateLicenseToken,
  refreshToken,
  clearToken,
  logout,
  authenticateTokenold,
};

