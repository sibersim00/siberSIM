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
    validator(validation.updateCompleteTerminate, "body"),
    controller.updateCompleteTerminate(iocContainer)
  );
  router.post(
    "/cleanup-operation-failed",
    controller.stopAndDestroyFailedScenarios(iocContainer)
  );
  router.get(
    "/get-operation-failed-logs",
    controller.getOperationFailedLogs(iocContainer)
  );
  router.post(
    "/generate-access-token",
    controller.generateProxmoxAccessToken(iocContainer)
  );

  router.post(
  "/start-scenario-learner",
  controller.startScenarioLearner(iocContainer)
);

  router.post("/restart-scenario-learner", controller.restartscenarioLearner(iocContainer));
  router.post("/create-snapshot", controller.createsnapshot(iocContainer));
  router.delete("/delete-snapshot", controller.deletesnapshot(iocContainer));
  router.post("/restore-snapshot", controller.restoresnapshot(iocContainer));
  router.post("/get-snapshots", controller.getSnapshotsByVmid(iocContainer));

  router.post("/vnc-proxy-console", controller.vncProxyConsole(iocContainer));
  return router;
};
