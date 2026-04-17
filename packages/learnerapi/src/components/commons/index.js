const controller = require('./controller');
const dao = require("./dao");
const router = require("./router");
const getRouter = iocContainer => {
  return router({...iocContainer, controller, dao
  });
};
module.exports = getRouter;