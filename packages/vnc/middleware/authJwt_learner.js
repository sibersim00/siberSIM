
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








const proxmoxConfigMiddleware = ({ db }) => async (req, res, next) => {
  console.log("dbdbdbdbdbdbdbdbdbdbdbdb",db);
  
  try {
    if (!cachedConfig) {
       const [rows] = await db.db.sequelize.query(  // 👈 db.db.sequelize
        `SELECT proxmox_host, proxmox_username, proxmox_password, proxmox_current_node
         FROM web_settings WHERE status = 1 LIMIT 1`,
        { type: db.db.sequelize.QueryTypes.SELECT }
      );
      console.log("rowsrowsroddddddwsrowsrowsrows",rows);
      

      if (!rows) throw new Error("Proxmox config not found in web_settings");

      cachedConfig = {
        PROXMOX_HOST: rows.proxmox_host,
        PROXMOX_USER: rows.proxmox_username,
        PROXMOX_PASS: rows.proxmox_password,
        PROXMOX_NODE: rows.proxmox_current_node,
      };
    }

    req.proxmox = cachedConfig;
    next();
  } catch (err) {
    console.error("Failed to load Proxmox config:", err);
    return res.status(500).json({ error: "Proxmox configuration unavailable" });
  }
};

let cachedConfig = null;

function clearProxmoxConfigCache() {
  cachedConfig = null;
}










module.exports = {
  authenticateToken,
  proxmoxConfigMiddleware, 
  clearProxmoxConfigCache
};
