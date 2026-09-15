const dao = require("./dao");
const controller = require("./controller");
const router = require("./router");
const validation = require("./validation");

module.exports = (iocContainer) =>
  router({ ...iocContainer, dao, controller, validation });
