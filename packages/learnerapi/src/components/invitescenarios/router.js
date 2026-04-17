module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;
  const router = express.Router();

  router.get("/running-invite-learners",controller.getRunningInviteLearnersController(iocContainer));
  router.get("/invite-scenario/:scenariouuid",controller.getInviteScenarioByID(iocContainer));

  return router;
};
