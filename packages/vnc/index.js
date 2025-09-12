const dotenv = require('dotenv').config({path:`${__dirname}/../../.env`});  
if (dotenv.error) { console.log('dotenv file not found....')
    throw dotenv.error
}
const express = require("express");
const expressWs = require("express-ws");
const axios = require("axios");
const https = require("https");
const cors = require("cors");
const { WebSocket } = require("ws");
const authJwt = require("./middleware/authJwt_learner.js");
 
const app = express();
expressWs(app);
const PORT = process.env.VNC_PORT;
// 🔧 Proxmox credentials (change as per your setup)
const PROXMOX_HOST = process.env.PROXMOX_HOST;
const PROXMOX_USER = process.env.PROXMOX_USERNAME;
const PROXMOX_PASS = process.env.PROXMOX_PASSWORD;
const PROXMOX_NODE = process.env.PROXMOX_CURRENT_NODE;
app.use(cors({ origin: true, credentials: true }));
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
 
// --- 2. WebSocket Proxy (/vnc) ---
app.ws("/vnc", async (ws, req) => {
  const { vmid, vmType } = req.query;
  if (!vmid) {
    ws.close();
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
 
    const { port, ticket: vncticket } = proxyRes.data.data;
 
    // Open WS to Proxmox
    const targetUrl = `${PROXMOX_HOST.replace(
      "https",
      "wss"
    )}/api2/json/nodes/${PROXMOX_NODE}/${vmType}/${vmid}/vncwebsocket?port=${port}&vncticket=${encodeURIComponent(
      vncticket
    )}`;
 
    const proxmoxWs = new WebSocket(targetUrl, {
      rejectUnauthorized: false,
      headers: { Cookie: `PVEAuthCookie=${ticket}` },
    });
 
    proxmoxWs.on("open", () => console.log("Connected to Proxmox WS"));
 
    // Pipe traffic both ways
    proxmoxWs.on("message", (msg) => ws.send(msg));
    proxmoxWs.on("close", () => ws.close());
    proxmoxWs.on("error", (err) => {
      console.error("Proxmox WS error", err);
      ws.close();
    });
 
    ws.on("message", (msg) => proxmoxWs.send(msg));
    ws.on("close", () => proxmoxWs.close());
  } catch (err) {
    console.error(" Error setting up VNC proxy:", err.response?.data || err.message);
    ws.close();
  }
});
 
app.listen(PORT, () => console.log(`🚀 Backend running on ws://localhost:${PORT}`));
 