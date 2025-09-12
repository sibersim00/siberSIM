const jwt = require("jsonwebtoken");
const keys = require("../keys");

const db = require('../db');
const crypto = require("../middleware/crypto");

const generateAccessToken = async (learnerData) => {
  try {
    const jwtObj = {
      key: crypto.cryptoEncrypt({
        learner_uuid: learnerData.learner_uuid,
        username: learnerData.firstname,
        logintime: new Date(),
      }),
    };

    const refresh_token = jwt.sign(learnerData, keys.JWT_REFRESH_SECRET, {
      expiresIn: keys.JWT_REFRESH_EXPIRES_IN,
    });

    const access_token = jwt.sign(jwtObj, keys.JWT_SECURITY_KEY, {
      expiresIn: keys.JWT_EXPIRES_IN,
    });

    await db.sequelize.query(
      `INSERT INTO learner_refresh_tokens (
        learner_id,
        access_token,
        refresh_token,
        token_json,
        is_valid,
        createdon
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      {
        replacements: [
          learnerData.learner_id,
          access_token,
          refresh_token,
          JSON.stringify(learnerData), // Flat object stored
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
      const [results] = await db.query(
        `SELECT * FROM learner_refresh_tokens WHERE access_token = ? AND is_valid = 1`,
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

        const learner = JSON.parse(tokenRow.token_json || "{}");
        const menuSlugArray = learner.menuslugs || [];

        if (routeslug === "" || menuSlugArray.includes(routeslug)) {
          req.userLearner = learner;
          next();
        } else {
          return res.status(404).send({
            statusCode: 404,
            message: "You do not have the necessary permissions to perform this action on this record.",
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

  const tokenParts = authorizationToken.split(" ");
  const access_token = tokenParts[1];

  try {
    const [rows] = await db.query(
      `SELECT * FROM learner_refresh_tokens WHERE access_token = ? AND is_valid = 1`,
      [access_token]
    );

    if (rows.length === 0) {
      return res.status(403).send({
        statusCode: 403,
        message: "You are not authorized to access this application.",
      });
    }

    const tokenData = rows[0];
    const learner = JSON.parse(tokenData.token_json || "{}");
    jwt.verify(tokenData.refresh_token, keys.JWT_REFRESH_SECRET, async (err) => {
      if (err) {
        return res.status(403).send({
          statusCode: 403,
          message: "You are not authorized to access this application.",
        });
      }

      learner.date = new Date(); // Optional: update last activity timestamp

      const new_access_token = await generateAccessToken(learner);

      const responseData = {
        statusCode: 200,
        message: "",
        data: { accessToken: new_access_token },
      };

      if (learner.isdevice) {
        return res.status(200).send(crypto.cryptoEncrypt(responseData));
      } else {
        return res.status(200).send(crypto.cryptoEncrypt({
          statusCode: 200,
          message: "",
          data: { accessToken: new_access_token }
        }));
      }
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).send({
      statusCode: 500,
      message: "Internal Server Error"
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
    await db.query(
      `DELETE FROM learner_refresh_tokens WHERE access_token = ?`,
      [access_token]
    );

    return res.status(200).send({
      statusCode: 200,
      message: "Token cleared successfully"
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
  ({ db }) =>
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
  generateAccessToken,
  authenticateToken,
  refreshToken,
  clearToken,
  logout
};
