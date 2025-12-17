module.exports = function (iocContainer) {
  const { express, controller, validation, validator } = iocContainer;

  const router = express.Router();
  router.get("/get", controller.getAll(iocContainer));
  router.post("/save",validator(validation.saveSchema, "body"),controller.save(iocContainer));
  router.post("/addParticipants",validator(validation.addParticipants, "body"),controller.addParticipants(iocContainer));
  router.post("/update",validator(validation.updateSchema, "body"),controller.update(iocContainer));
  router.post("/addLearnerEvent",validator(validation.addLearnerEvent, "body"),controller.addLearnerEvent(iocContainer));
  router.get("/fetchLearnersByEvent/:eventid",controller.getLearnersByEvent(iocContainer));
  router.post("/updateParticipant",controller.updateParticipant(iocContainer));
  router.post("/removeLearnerFromEvent",controller.deleteLearnerFromEvent(iocContainer));
  return router;
};
