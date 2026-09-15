const controller = require("./controller");
const dao = require("./dao");
const router = require("./router");
const validation = require("./validation");
module.exports = (iocContainer) => router({ ...iocContainer, controller, dao, validation });
