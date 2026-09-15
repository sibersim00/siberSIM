module.exports = function (iocContainer) {
  const { express, controller, validation, validator } = iocContainer;
  const router = express.Router();

  router.get("/get", controller.getThirdPartyIntegrations(iocContainer));
  router.get("/available", controller.getAvailableThirdPartyIntegrations(iocContainer));
  router.post("/save", validator(validation.saveSchema, "body"), controller.saveThirdPartyIntegration(iocContainer));
  router.post("/update", validator(validation.updateSchema, "body"), controller.updateThirdPartyIntegration(iocContainer));
  router.post("/delete", validator(validation.deleteSchema, "body"), controller.deleteThirdPartyIntegration(iocContainer));
  router.post("/change-status", validator(validation.statusSchema, "body"), controller.changeThirdPartyIntegrationStatus(iocContainer));
  return router;
};
