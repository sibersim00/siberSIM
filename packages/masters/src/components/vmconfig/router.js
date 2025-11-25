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
router.post(
  "/cleanup-operation-failed-events",
  controller.stopAndDestroyFailedEvents(iocContainer)
);
router.get(
  "/get-operation-failed-logs",
  controller.getOperationFailedLogs(iocContainer)
);
router.get(
  "/get-event-operation-failed-logs",
  controller.getEventOperationFailedLogs(iocContainer)
);


  router.post("/get-snapshots", controller.getSnapshotsByVmid(iocContainer));





 router.post(
    "/generate-access-token",
    controller.generateProxmoxAccessToken(iocContainer)
  );

  return router;
};
