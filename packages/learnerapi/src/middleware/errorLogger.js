const alldb = require('../db');
const db = alldb.db;

const errorLogger = async (error, req, res, next) => {
    const errorObj = {
        originalUrl: req.originalUrl,
        method: req.method,
        session: req.userLearner || 'Without Session',
        payload: req.body || '',
        ip: req.ip,
        status: error.status || 500,
        name: error.name || '',
        message: error.message || '',
        errorsql: error.sql || ''
    }
    if (error.message) {
        db.sequelize.query(`INSERT INTO log_errors (error_message, createdon) VALUES (?, now())`, {replacements: [JSON.stringify(errorObj)],type: db.sequelize.QueryTypes.INSERT,});
       return res.status(400).send({ statusCode: 400, message: "We're sorry for the inconvenience. Please try again after some time.", error: error.message  });
    } else {
        return res.status(400).send({ statusCode: 400, message: "We're having trouble connecting to the server. Please try again later."});
    } 
}
 
module.exports = errorLogger;