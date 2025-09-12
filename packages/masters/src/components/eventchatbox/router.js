module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;
  const router = express.Router();
  const authJwt = require('../../middleware/authJwt');

  router.post("/getMessages", controller.getMessagesByEventLearner(iocContainer));
  router.post("/send", authJwt.authenticateToken, controller.sendMessage(iocContainer));
  router.post("/markSeen", controller.markMessagesSeen(iocContainer));
  router.post("/refresh", controller.refreshByEventLearner(iocContainer));

  return router;
};
