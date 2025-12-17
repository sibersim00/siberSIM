module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;

  const router = express.Router();

  router.get("/get", controller.getAll(iocContainer));
  router.get("/getbyid/:uuid", controller.getById(iocContainer));
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
    "/change-status",
    validator(validation.statusSchema, "body"),
    controller.statusChange(iocContainer)
  );
  router.post(
    "/get-vms",
    validator(validation.getVmsSchema, "body"),
    controller.getVms(iocContainer)
  );
  router.post(
    "/vm-details",
    validator(validation.vmDetailsSchema, "body"),
    controller.vmDetails(iocContainer)
  );
  router.post(
    "/delete",
    validator(validation.deleteSchema, "body"),
    controller.deleteById(iocContainer)
  );
  router.get("/fetch-ovs", controller.fetchAndStoreOVSNetworks(iocContainer));
  return router;
};
