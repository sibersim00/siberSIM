module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;

  const router = express.Router();

  router.get("/get", controller.getAll(iocContainer));
  router.get("/getbyid/:uuid", controller.getById(iocContainer));
  router.post("/status-update", controller.updateStatus(iocContainer));

  return router;
};
