const dotenv = require('dotenv').config({path:`${__dirname}/../../../.env`});  
if (dotenv.error) { console.log('dotenv file not found....')
    throw dotenv.error
}
var http = require('http');
var express = require('express');
const cors = require('cors');
const xss = require('xss-clean');
const db = require('./db').db;
const router = require('./router');
const keys = require('./keys.js');
const startJob = require('./jobs');
const validator = require("./middleware/validator.js");
const iocContainer = {express,db,keys,crypto,validator};
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
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(xss());
app.use('/jobapi',router(iocContainer))
app.get('/jobapi/health', (req, res) => {
    return res.status(200).send({ uptime: process.uptime(),message: 'Ok',date: new Date()});
});
app.use('/jobapi/uploads', express.static(__dirname + '/../uploads'));

app.all('*', (req, res, next) => {
    return res.status(404).send({ message: `Can't find ${req.originalUrl} on this server!`, date: new Date()});
});
// app.use(errorLogger);
const server = http.createServer(app); 
server.listen((keys.JOBS_PORT || 4005), async () => {
//    startJob(iocContainer)
});
server.on('listening', () => { 
    console.log(`Job Service Started On Port - ${keys.JOBS_PORT}`);
});