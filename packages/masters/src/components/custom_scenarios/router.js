// const multer = require("multer");

module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;
  const router = express.Router();

  router.get("/list_custom", controller.list(iocContainer));
  router.get(
    "/get/:id",
    validator(validation.idSchema, "params"),
    controller.getById(iocContainer)
  );
  router.post(
    "/save",
    validator(validation.schema, "body"),
    controller.create(iocContainer)
  );
  router.post(
    "/update",
    validator(validation.updateSchema, "body"),
    controller.update(iocContainer)
  );
  router.post("/save_diagram", controller.saveDiagram(iocContainer));
  router.get(
    "/scenariodigramlist",
    controller.scenariodigramlist(iocContainer)
  );
  router.post(
    "/savecomponentconfiguration",
    controller.saveComponentconfiguration(iocContainer)
  );
  return router;
};
