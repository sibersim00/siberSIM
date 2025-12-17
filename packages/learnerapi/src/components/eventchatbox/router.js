module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;
  const router = express.Router();
  router.post("/getMessages",validator(validation.getMessagesByEventSchema, "body"),controller.getMessagesByEvent(iocContainer));
  router.post("/send",validator(validation.sendMessageSchema, "body"),controller.sendMessage(iocContainer));
  router.post("/markSeen",validator(validation.markMessagesSeenSchema, "body"),controller.markMessagesSeen(iocContainer));
  router.post("/refresh",validator(validation.refreshByEventSchema, "body"),controller.refreshByEvent(iocContainer));
  return router;
};
