const dotenv = require('dotenv').config({path:`${__dirname}/../../../.env`});  
if (dotenv.error) { console.log('dotenv file not found....')
    throw dotenv.error
}

var http = require('http');
var express = require('express');
const cors = require('cors');
const db = require('./db').db;
const router = require('./router');
const crypto = require("./middleware/crypto.js");
const {  validator,authJwt } = require("./middleware");
const keys = require('./keys.js');
var app = express();
const corsOptions = {  
    origin: function (origin, callback) {
        const allowedOrigins = keys.WEB_ORIGIN.split(',');
        if (!origin || allowedOrigins.includes(origin)) {      
            callback(null, true);    
        } else {      
            callback(new Error('Not allowed by CORS'));    
        }  
    },
    methods: ['GET', 'POST','DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const iocContainer = {express,db,keys,crypto,validator,authJwt};
app.use('/learnerapi', router(iocContainer))
app.get('/learnerapi/health', (req, res) => {
    return res.status(200).send({ uptime: process.uptime(),message: 'Ok',date: new Date()});
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
server.listen((keys.LEARNERAPI_PORT || 4004), async () => {
});
server.on('listening', () => { 
    console.log(`Learner Service Started On Port - ${keys.LEARNERAPI_PORT}`);
});