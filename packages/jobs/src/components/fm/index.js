const controller = require('./controller');
const router = require("./router");

const getRouter = iocContainer => {
  return router({
    ...iocContainer,
    controller,
  });
};

module.exports = getRouter;