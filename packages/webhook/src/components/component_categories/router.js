const controller = require("./controller");
const validation = require("./validation");

module.exports = ({ express, validator, ...ioc }) => {
  const router = express.Router();
  router.get("/component-categories", controller.getAll(ioc));
  router.get("/component-categories/:id", validator(validation.idSchema, "params"), controller.getById(ioc));
  router.post("/component-categories", validator(validation.createSchema, "body"), controller.save(ioc));
  router.post("/component-categories/update", validator(validation.updateSchema, "body"), controller.update(ioc));
  router.post("/component-categories/delete", validator(validation.deleteSchema, "body"), controller.deleteById(ioc));
  return router;
};
