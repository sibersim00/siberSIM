module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;
  const router = express.Router();

  router.get("/get", controller.getIntegrations(iocContainer));

  return router;
};
