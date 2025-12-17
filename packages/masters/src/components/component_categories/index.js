const dao = require("./dao");
const controller = require('./controller');
const router = require("./router");
const validation = require("./validation");

const getRouter = iocContainer => {
  return router({
    ...iocContainer,
    controller,
    dao,
    router,
    validation
  });
};

module.exports = getRouter;
