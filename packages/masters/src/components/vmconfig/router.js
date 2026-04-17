module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;

  const router = express.Router();
  router.post("/update-complete-terminate", validator(validation.updateCompleteTerminate, "body"), controller.updateCompleteTerminate(iocContainer));

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

  router.post("/exports", controller.exportScenario(iocContainer));
  router.post("/save", controller.save(iocContainer));
  router.post(
    "/delete-scenario-usersession",
    controller.deleteScenarioLearner(iocContainer)
  );
  router.post("/add-vm-network", controller.addScenarioVmNetwork(iocContainer));
  router.post("/delete-vm-network", controller.deleteScenarioVmNetwork(iocContainer));
  router.post("/modify-vm-network", controller.ModifyScenarioVmNetwork(iocContainer));
  router.post("/add-single-component", controller.addRuntimeComponent(iocContainer));
  router.post("/delete-single-network", controller.stopDestroySingleComponent(iocContainer));
  router.post("/disconnect-single-network", controller.disconnectRuntimeNetworks(iocContainer));
  router.post("/connect-single-network", controller.connectRuntimeNetwork(iocContainer));
  router.post("/plug-single-network", controller.plugRuntimeNetwork(iocContainer));
  router.post("/unplug-single-network", controller.unplugRuntimeNetwork(iocContainer));
  return router;

};