module.exports = function (iocContainer) {
  const { express, controller, validation, validator } = iocContainer;

  const router = express.Router();
  router.get("/get", controller.getAll(iocContainer));
  return router;
};
