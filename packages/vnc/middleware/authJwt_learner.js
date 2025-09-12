
const jwt = require("jsonwebtoken");
const keys = require("../keys.js");

const authenticateToken = async (req, res, next) => {
  const authorizationToken = req.headers["authorization"];
  if (!authorizationToken) {
    return res.status(403).send({
      statusCode: 403,
      message: "You are not authorized to access this application.",
    });
  }

  const tokenParts = authorizationToken.split(" ");
  const extract_token = tokenParts[1];

  let access_token = extract_token.replace(/^"|"$/g, "").trim();

  try {
    jwt.verify(access_token, keys.JWT_SECURITY_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          statusCode: 401,
          message: "Session Terminated",
        });
      }
      req.learneruser = decoded; // attach decoded token payload
      next();
    });
  } catch (error) {
    console.error("Learner Middleware Error:", error);
    return res.status(500).send({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  authenticateToken,
};
