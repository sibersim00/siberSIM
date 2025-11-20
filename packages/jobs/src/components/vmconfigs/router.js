module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;

  const router = express.Router();

  router.post(
    "/set-scenario-learner-config",
    validator(validation.setScenarioLearnerConfigSchema, "body"),
    controller.setScenarioLearnerConfiguration(iocContainer)
  );
  router.post(
    "/update-complete-terminate",
    validator(validation.updateCompleteTerminatelearner, "body"),
    controller.updateCompleteTerminatelearner(iocContainer)
  );

  router.post(
    "/auto-terminate-expired-scenarios",
    controller.autoTerminateFailedScenarios(iocContainer)
  );

  router.post(
    "/start-scenario-learner",
    controller.startScenarioLearner(iocContainer)
  );

  router.post(
    "/restart-scenario-learner",
    controller.restartscenarioLearner(iocContainer)
  );
  router.post("/create-snapshot", controller.createSnapshot(iocContainer));
  router.delete("/delete-snapshot", controller.deleteSnapshot(iocContainer));
  router.post("/restore-snapshot", controller.restoreSnapshot(iocContainer));

  router.post(
    "/generate-access-token",
    controller.generateProxmoxAccessToken(iocContainer)
  );

  return router;
};
