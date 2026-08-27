module.exports = ({ express, controller, validator, validation, ...iocContainer }) => {
  const router = express.Router();
  const ioc = { express, controller, validator, validation, ...iocContainer };
  router.get("/get", controller.list(ioc));
  router.post("/save", validator(validation.addSchema, "body"), controller.save(ioc));
  router.post("/update", validator(validation.updateSchema, "body"), controller.update(ioc));
  router.post("/change-status", validator(validation.statusSchema, "body"), controller.changeStatus(ioc));
  router.post("/delete", validator(validation.deleteSchema, "body"), controller.remove(ioc));
  return router;
};
