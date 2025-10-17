const dotenv = require('dotenv').config({ path: `${__dirname}/../../.env` });
if (dotenv.error) {
  console.log('dotenv file not found....')
  throw dotenv.error
}
const express = require("express");
const expressWs = require("express-ws");
const axios = require("axios");
const https = require("https");
const rateLimit = require('express-rate-limit');
const cors = require("cors");
const keys = require('./keys.js'); // adjust path if needed


const { WebSocket } = require("ws");
const authJwt = require("./middleware/authJwt_learner.js");
// const limiter = rateLimit({
//   windowMs: 2 * 60 * 1000, 
//   max: 10, 
//   message: { statusCode: 400, message: 'Too Manay requests from this IP, Please try again later' }
// });

const app = express();
expressWs(app);
const PORT = process.env.VNC_PORT;
// 🔧 Proxmox credentials (change as per your setup)
const PROXMOX_HOST = process.env.PROXMOX_HOST;
const PROXMOX_USER = process.env.PROXMOX_USERNAME;
const PROXMOX_PASS = process.env.PROXMOX_PASSWORD;
const PROXMOX_NODE = process.env.PROXMOX_CURRENT_NODE;



// cors
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = keys.WEB_ORIGIN.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// host header
app.use((req, res, next) => {
  const hostHeader = req.headers.host;
  const allowedHosts = keys.WEB_ORIGIN.split(',').map(url => {
    try {
      return new URL(url).host;
    } catch (e) {
      return "";
    }
  });

  if (allowedHosts.includes(hostHeader)) {
    next();
  } else {
    return res.status(400).send({
      statusCode: 400,
      message: "Invalid Host Header Request",
    });
  }
});
app.get("/health", (req, res) => res.json({ ok: true }));

// --- 1. Ticket endpoint (returns VNC ticket + port) ---
app.get("/ticket", authJwt.authenticateToken, async (req, res) => {
const vmid = req.query.vmid || req.params.vmid;
const vmType = req.query.vmType || req.params.vmType;
if (!vmid || !vmType) {
  return res.status(400).json({ error: "vmid and vmType are required" });
}

  try {
    // Login to Proxmox
    const loginRes = await axios.post(
      `${PROXMOX_HOST}/api2/json/access/ticket`,
      new URLSearchParams({ username: PROXMOX_USER, password: PROXMOX_PASS }),
      { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
    );

    const ticket = loginRes.data.data.ticket;
    const csrf = loginRes.data.data.CSRFPreventionToken;

    // Request VNC proxy
    const proxyRes = await axios.post(
      `${PROXMOX_HOST}/api2/json/nodes/${PROXMOX_NODE}/${vmType}/${vmid}/vncproxy`,
      new URLSearchParams({ websocket: 1 }),
      {
        headers: {
          Cookie: `PVEAuthCookie=${ticket}`,
          CSRFPreventionToken: csrf,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );

    res.json(proxyRes.data.data);
  } catch (err) {
    console.error("Ticket error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get VNC ticket" });
  }
});

// const wsConnections = {};  // track connections per IP
// const WS_LIMIT = 5;        // max 5 WS connections per IP
// const WINDOW_MS = 1 * 60 * 1000;  // 2 minutes

// setInterval(() => {
//   for (const ip in wsConnections) {
//     wsConnections[ip] = 0;
//   }
// }, WINDOW_MS);


// --- 2. WebSocket Proxy (/vnc) ---
app.ws("/vnc", async (ws, req) => {
  // const ip = req.socket.remoteAddress;
  // wsConnections[ip] = (wsConnections[ip] || 0) + 1;
  // if (wsConnections[ip] > WS_LIMIT) {
  //   ws.close(1008, 'Too many WebSocket connections from this IP');
  //   return;
  // }
  const { vmid, vmType} = req.query;
  let realVmid = vmid;
let cleanName = "";
if (vmid && vmid.includes(",")) {
  const parts = vmid.split(",");
  realVmid = parts[0];
  cleanName = parts[1] || "";
}
  
  if (!vmid || !vmType) {
    ws.close();
    // wsConnections[ip] -= 1;
    return;
  }




  try {
    // Login
    const loginRes = await axios.post(
      `${PROXMOX_HOST}/api2/json/access/ticket`,
      new URLSearchParams({ username: PROXMOX_USER, password: PROXMOX_PASS }),
      { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
    );

    const ticket = loginRes.data.data.ticket;
    const csrf = loginRes.data.data.CSRFPreventionToken;


    // Request VNC proxy
    const proxyRes = await axios.post(
      `${PROXMOX_HOST}/api2/json/nodes/${PROXMOX_NODE}/${vmType}/${realVmid}/vncproxy`,
      new URLSearchParams({ websocket: 1 }),
      {
        headers: {
          Cookie: `PVEAuthCookie=${ticket}`,
          CSRFPreventionToken: csrf,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );

    const { port, ticket: vncticket } = proxyRes.data.data;

    // Open WS to Proxmox
    const targetUrl = `${PROXMOX_HOST.replace(
      "https",
      "wss"
    )}/api2/json/nodes/${PROXMOX_NODE}/${vmType}/${realVmid}/vncwebsocket?port=${port}&vncticket=${encodeURIComponent(
      vncticket
    )}`;

    const proxmoxWs = new WebSocket(targetUrl, {
      rejectUnauthorized: false,
      headers: { Cookie: `PVEAuthCookie=${ticket}` },
    });

    proxmoxWs.on("open", () => console.log("Connected to siberSIM WS"));

    // Pipe traffic both ways
    proxmoxWs.on("message", (msg) => ws.send(msg));
    proxmoxWs.on("close", () => ws.close());
    proxmoxWs.on("error", (err) => {
      console.error("siberSIM WS error", err);
      ws.close();
    });

    ws.on("message", (msg) => proxmoxWs.send(msg));
    ws.on("close", () => proxmoxWs.close());
  } catch (err) {
    console.error(" Error setting up VNC proxy:", err.response?.data || err.message);
    ws.close();
  }
});


app.use((req, res) => {
  return res.status(404).send({
    statusCode: 404,
    message: "Oops! The page or resource you're looking for is not available.",
    error: `Cannot ${req.method} ${req.originalUrl}`,
    status: "Not Found",
    date: new Date(),
  });
});

app.listen(PORT, () => console.log(`🚀 Backend running on ws://localhost:${PORT}`));
