module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;
  const router = express.Router();
  router.get("/get", controller.getAll(iocContainer));
  router.post("/start-event", controller.startEvent(iocContainer));
  router.post("/update-event-status", controller.updateEventLearnerStatus(iocContainer));
  router.get('/get-event-status/:eventlearnerid', controller.getEventStatus(iocContainer));
  router.post("/get-logs", controller.getLogs(iocContainer));
  return router;
};
