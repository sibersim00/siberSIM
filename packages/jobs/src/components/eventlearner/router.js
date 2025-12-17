module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;
  const router = express.Router();


  router.post(
    "/update-complete-event",
    validator(validation.updateCompleteTerminate, "body"),
    controller.updateCompleteTerminate(iocContainer)
  );
  router.post(
  "/restart-event-learner",
  validator(validation.restartEventLearnerConfigSchema, "body"),
  controller.restartEventLearner(iocContainer)
);

  router.post(
    "/set-event-learner-config",
    validator(validation.setEventLearnerConfigSchema, "body"),
    controller.setEventLearnerConfiguration(iocContainer)
  );

  router.post(
  "/auto-terminate-expired-events",
  controller.autoTerminateExpiredEvents(iocContainer)
);

 router.post(
    "/generate-access-token",
    controller.generateProxmoxAccessToken(iocContainer)
  );

      router.post(
  "/pause-scenario-learner",
  controller.pauseScenarioLearner(iocContainer)
);
  router.post(
  "/resume-scenario-learner",
  controller.resumeScenarioLearner(iocContainer)
);

  return router;
};
