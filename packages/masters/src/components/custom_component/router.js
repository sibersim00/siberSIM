module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;

  const router = express.Router();

  router.get("/get", controller.getAll(iocContainer));
  router.get("/getbyid/:uuid", controller.getById(iocContainer));
  router.post("/status-update", controller.updateStatus(iocContainer));
  router.post(
    "/delete",
    validator(validation.deleteSchema, "body"),
    controller.deleteById(iocContainer)
  );
  router.post(
    "/save",
    validator(validation.addSchema, "body"),
    controller.save(iocContainer)
  );
  router.post(
    "/update",
    validator(validation.updateSchema, "body"),
    controller.update(iocContainer)
  );
  router.post(
    "/vm-details",
    validator(validation.vmDetailsSchema, "body"),
    controller.vmDetails(iocContainer)
  );
  router.post(
    "/get-vms",
    validator(validation.getVmsSchema, "body"),
    controller.getVms(iocContainer)
  );
  return router;
};
