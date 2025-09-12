const dao = require("./dao");
const controller = require('./controller');
const router = require("./router");

const getRouter = iocContainer => {
  return router({
    ...iocContainer,
    controller,
    dao
  });
};

module.exports = getRouter;
