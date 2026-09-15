const Sequelize = require("sequelize");
const keys = require("./keys");
const sequelize = new Sequelize(keys.MYSQL_DB, keys.MYSQL_USER, keys.MYSQL_PASSWORD, {
  host: keys.MYSQL_HOST,
  port: keys.MYSQL_PORT,
  dialect: "mysql",
  timezone: "+08:00",
  logging: false,
});
module.exports = { db: { sequelize } };
