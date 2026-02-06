module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;

  const router = express.Router();

  router.get("/loginlogs/admins", controller.getAdminLogs(iocContainer));
  router.get("/loginlogs/instructors", controller.getInstructorLogs(iocContainer));
  router.get("/loginlogs/learners", controller.getLearnerLogs(iocContainer));

  return router;
};
