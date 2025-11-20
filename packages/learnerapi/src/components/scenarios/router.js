module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;
  const router = express.Router();
  router.get("/get", controller.getAll(iocContainer));
  router.get("/get/:scenariouuid", controller.getByID(iocContainer));
  router.get("/get-session-status/:session_uuid", controller.getSessionStatus(iocContainer));
  router.post("/start-scenario", validator(validation.startScenarioSchema, "body"), controller.startScenario(iocContainer));
  router.post("/update-session-status", validator(validation.updateSessionStatusSchema, "body"), controller.updateSessionStatus(iocContainer));
  router.post("/getMessages", validator(validation.getMessagesSchema, "body"), controller.getMessagesByScenario(iocContainer));
  router.post("/get-logs", controller.getLogs(iocContainer));
  router.post("/send", validator(validation.sendMessageSchema, "body"), controller.sendMessage(iocContainer));
  router.post("/markSeen", validator(validation.markSeenSchema, "body"), controller.markMessagesSeen(iocContainer));
  router.get(
    "/list",
    controller.getTabList(iocContainer)
  );
  return router;
};