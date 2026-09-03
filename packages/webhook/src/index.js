const dotenv = require("dotenv").config({ path: `${__dirname}/../../../.env` });
if (dotenv.error) throw dotenv.error;
const http = require("http");
const express = require("express");
const cors = require("cors");
const { db } = require("./db");
const keys = require("./keys");
const validator = require("./middleware/validator");
const authenticate = require("./middleware/authenticate");
const requireWebhookLicense = require("./middleware/licenseCapability");
const { audit } = require("./middleware/audit");
const router = require("./router");

if (!keys.WEBHOOK_JWT_SECRET || !keys.WEBHOOK_INTERNAL_KEY)
  throw new Error(
    "WEBHOOK_JWT_SECRET and WEBHOOK_INTERNAL_KEY must be configured.",
  );
const app = express();
const allowedOrigins = keys.WEB_ORIGIN.split(",")
  .map((item) => item.trim())
  .filter(Boolean);
app.disable("x-powered-by");
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.includes(origin)),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
const ioc = {
  express,
  db,
  keys,
  validator,
  authenticate,
  requireWebhookLicense,
  audit,
};
app.get("/webhookapi/health", (_req, res) =>
  res.send({ uptime: process.uptime(), message: "Ok", date: new Date() }),
);
app.use("/webhookapi", router(ioc));
app.use((error, _req, res, _next) => {
  console.error("Webhook service error:", error.message);
  if (!res.headersSent)
    res
      .status(502)
      .send({
        statusCode: 502,
        message: "Unable to process the webhook request.",
      });
});
app.use((req, res) =>
  res
    .status(404)
    .send({
      statusCode: 404,
      message: "Resource not found.",
      error: `Cannot ${req.method} ${req.originalUrl}`,
    }),
);
http
  .createServer(app)
  .listen(keys.WEBHOOK_PORT, () =>
    console.log(`Webhook Service Started On Port - ${keys.WEBHOOK_PORT}`),
  );
