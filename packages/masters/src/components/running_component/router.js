module.exports = function (iocContainer) {
  const { express, controller, validation, validator } = iocContainer;

  const router = express.Router();
  router.get("/get", controller.getAll(iocContainer));
  router.post("/delete-single-component",controller.stopDestroySingleComponent(iocContainer));
  router.post("/stop-single-component",controller.stopComponent(iocContainer));
  return router;
};
