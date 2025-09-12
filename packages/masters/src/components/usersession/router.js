
module.exports = function (iocContainer) {
    const { express, controller, validator, validation } = iocContainer;
    const router = express.Router();

    router.get('/list', controller.listScenarios(iocContainer));
    router.get('/get/:scenariolearneruuid', controller.getUserSessionById(iocContainer));
    router.post("/getMessages", controller.getMessagesByScenario(iocContainer));
    router.post("/send", controller.sendMessage(iocContainer));
    router.post("/markSeen", controller.markMessagesSeen(iocContainer));
    router.post("/noti-termination", controller.notitermination(iocContainer));
    router.post("/terminate", controller.terminateScenario(iocContainer));
  router.post("/get-logs", controller.getLogs(iocContainer));



    return router;
}