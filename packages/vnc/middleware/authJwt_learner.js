
// const jwt = require("jsonwebtoken");
// const keys = require("../keys.js");

// const authenticateToken = async (req, res, next) => {
//   const authorizationToken = req.headers["authorization"];
//   if (!authorizationToken) {
//     return res.status(403).send({
//       statusCode: 403,
//       message: "You are not authorized to access this application.",
//     });
//   }

//   const tokenParts = authorizationToken.split(" ");
//   const extract_token = tokenParts[1];

//   let access_token = extract_token.replace(/^"|"$/g, "").trim();

//   try {
//     jwt.verify(access_token, keys.JWT_SECURITY_KEY, (err, decoded) => {
//       if (err) {
//         return res.status(401).send({
//           statusCode: 401,
//           message: "Session Terminated",
//         });
//       }
//       req.learneruser = decoded; // attach decoded token payload
//       next();
//     });
//   } catch (error) {
//     console.error("Learner Middleware Error:", error);
//     return res.status(500).send({
//       statusCode: 500,
//       message: "Internal Server Error",
//     });
//   }
// };








// const proxmoxConfigMiddleware = ({ db }) => async (req, res, next) => {
//   console.log("dbdbdbdbdbdbdbdbdbdbdbdb",db);
  
//   try {
//     if (!cachedConfig) {
//        const [rows] = await db.db.sequelize.query(
//         `SELECT proxmox_host, proxmox_username, proxmox_password, proxmox_current_node
//          FROM web_settings WHERE status = 1 LIMIT 1`,
//         { type: db.db.sequelize.QueryTypes.SELECT }
//       );
//       console.log("rowsrowsroddddddwsrowsrowsrows",rows);
      

//       if (!rows) throw new Error("Proxmox config not found in web_settings");

//       cachedConfig = {
//         PROXMOX_HOST: rows.proxmox_host,
//         PROXMOX_USER: rows.proxmox_username,
//         PROXMOX_PASS: rows.proxmox_password,
//         PROXMOX_NODE: rows.proxmox_current_node,
//       };
//     }

//     req.proxmox = cachedConfig;
//     next();
//   } catch (err) {
//     console.error("Failed to load Proxmox config:", err);
//     return res.status(500).json({ error: "Proxmox configuration unavailable" });
//   }
// };

// let cachedConfig = null;

// function clearProxmoxConfigCache() {
//   cachedConfig = null;
// }










// module.exports = {
//   authenticateToken,
//   proxmoxConfigMiddleware, 
//   clearProxmoxConfigCache
// };



const jwt = require("jsonwebtoken");
const keys = require("../keys.js");

let cachedConfig = null;

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
      req.learneruser = decoded;
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

//  Per-VM node lookup, lives here now
async function getVmNode(db, vmid) {
  const [row] = await db.db.sequelize.query(
    `SELECT vr.node_name    
     FROM vm_request vr
     JOIN vm_config vc ON vc.vmrequestid = vr.vmrequestid
     WHERE vc.vmid = ?
     ORDER BY vr.modifiedon DESC
     LIMIT 1`,
    {
      replacements: [vmid],
      type: db.db.sequelize.QueryTypes.SELECT,
    },
  );
  return row?.node_name || null;
}

const proxmoxConfigMiddleware = ({ db }) => async (req, res, next) => {
  try {
    if (!cachedConfig) {
      const [rows] = await db.db.sequelize.query(
        `SELECT proxmox_host, proxmox_username, proxmox_password, proxmox_current_node
         FROM web_settings WHERE status = 1 LIMIT 1`,
        { type: db.db.sequelize.QueryTypes.SELECT }
      );

      if (!rows) throw new Error("Proxmox config not found in web_settings");

      cachedConfig = {
        PROXMOX_HOST: rows.proxmox_host,
        PROXMOX_USER: rows.proxmox_username,
        PROXMOX_PASS: rows.proxmox_password,
        PROXMOX_NODE: rows.proxmox_current_node, // fallback only
      };
    }

    //  Resolve the VM-specific node for THIS request, every time
    const vmid = req.query.vmid || req.params.vmid;
    let resolvedNode = cachedConfig.PROXMOX_NODE; // fallback

    if (vmid) {
      // handle "vmid,name" format used in /vnc route
      const realVmid = vmid.includes(",") ? vmid.split(",")[0] : vmid;
      const vmNode = await getVmNode(db, realVmid);
      if (vmNode) resolvedNode = vmNode;
    }

    req.proxmox = {
      ...cachedConfig,
      PROXMOX_NODE: resolvedNode, //  overridden per-request
    };

    next();
  } catch (err) {
    console.error("Failed to load Proxmox config:", err);
    return res.status(500).json({ error: "Proxmox configuration unavailable" });
  }
};

function clearProxmoxConfigCache() {
  cachedConfig = null;
}

module.exports = {
  authenticateToken,
  proxmoxConfigMiddleware,
  clearProxmoxConfigCache,
};