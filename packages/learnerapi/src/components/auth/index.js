
const router = require("./router");
const getRouter = iocContainer => {
  return router(
    iocContainer
);
};
module.exports = getRouter;