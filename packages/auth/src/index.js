const dotenv = require("dotenv").config({ path: `${__dirname}/../../../.env` });
if (dotenv.error) {
  console.log("dotenv file not found....");
  throw dotenv.error;
}
var http = require("http");
var express = require("express");
const cors = require("cors");
const db = require("./db").db;
const router = require("./router");
const keys = require("./keys.js");
const crypto = require("./middleware/crypto.js");
const { validator } = require("./middleware");
const iocContainer = { express, db, keys, crypto, validator };
var app = express();
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = keys.WEB_ORIGIN.split(",");
 
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/authapi", router(iocContainer));
app.get("/authapi/health", (req, res) => {
  return res.status(200).send({ uptime: process.uptime(), message: "Ok", date: new Date() });
});
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
const { errorLogger } = require("./middleware");
app.use(errorLogger);
  app.use((req, res, next) => {
    return res.status(404).send({statusCode:404, message: "Oops! The page or resource you're looking for is not available.", error:`Cannot ${req.method} ${req.originalUrl}`, status: 'Not Found', date: new Date() });
});
const server = http.createServer(app);
server.listen(keys.AUTH_PORT, async () => {});
server.on("listening", () => {
  console.log(`Auth Service Started On Port - ${keys.AUTH_PORT}`);
});