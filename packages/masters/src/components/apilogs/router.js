module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;
  const router = express.Router();
  router.get("/get-logs", controller.getApiLogs(iocContainer));
  router.get("/get-logs/:id", controller.getApiLogById(iocContainer));
  return router;
};
