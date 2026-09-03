module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;
  const router = express.Router();

  router.get("/get", controller.getIntegrations(iocContainer));
  router.post("/save", controller.saveIntegration(iocContainer));
  router.post("/update", controller.updateIntegration(iocContainer));
  router.post("/delete", controller.deleteIntegration(iocContainer));
  router.post("/change-status", controller.changeStatus(iocContainer));

  return router;
};
