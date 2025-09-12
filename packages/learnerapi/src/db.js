const keys = require('./keys.js');
const Sequelize = require('sequelize');
const db = {};
const  config = {
  host: keys.MYSQL_HOST,
  user: keys.MYSQL_USER,
  password: keys.MYSQL_PASSWORD,
  database: keys.MYSQL_DB, 
  dialect: 'mysql',
  timezone: '+08:00',
} 
let sequelize = new Sequelize(config.database, config.user, config.password, config);
db.sequelize = sequelize;
module.exports = {db};