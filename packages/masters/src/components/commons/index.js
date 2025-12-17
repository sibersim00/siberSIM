const dao = require("./dao");
const controller = require('./controller');
const router = require("./router");
const validation = require("./validation");

const getRouter = iocContainer => {
  return router({
    ...iocContainer,
    controller,
    dao,
    validation
  });
};

module.exports = getRouter;




