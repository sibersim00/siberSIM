module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;
  const router = express.Router();
  router.post(
    "/set-scenario-start-config",
    // validator(validation.setVMRequestConfiguration, "body"),
    controller.setVMRequestConfiguration(iocContainer)
  );
  router.post(
    "/update-complete-terminate",
    // validator(validation.updateCompleteTerminate, "body"),
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

  router.post(
    "/restart-scenario-learner",
    controller.restartscenarioLearner(iocContainer)
  );
  router.post("/create-snapshot", controller.createsnapshot(iocContainer));
  router.delete("/delete-snapshot", controller.deletesnapshot(iocContainer));
  router.post("/restore-snapshot", controller.restoresnapshot(iocContainer));
  router.post("/get-snapshots", controller.getSnapshotsByVmid(iocContainer));
  router.post(
    "/pause-scenario-learner",
    controller.pauseScenarioLearner(iocContainer)
  );
  router.post(
    "/resume-scenario-learner",
    controller.resumeScenarioLearner(iocContainer)
  );
  router.post(
    "/delete-scenario-learner",
    controller.deleteScenarioLearner(iocContainer)
  );
  router.post("/vnc-proxy-console", controller.vncProxyConsole(iocContainer));
  router.get("/get/:vmid", controller.getComponentByVmid(iocContainer));
  router.post("/save", controller.saveCustomComponent(iocContainer));
  return router;
};
