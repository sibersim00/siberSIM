const controller = require("./controller");
const validation = require("./validation");

module.exports = ({ express, validator, ...ioc }) => {
  const router = express.Router();
  router.get("/scenario-categories", controller.getAll(ioc));
  router.get("/scenario-categories/:id", validator(validation.idSchema, "params"), controller.getById(ioc));
  router.post("/scenario-categories", validator(validation.createSchema, "body"), controller.save(ioc));
  router.post("/scenario-categories/update", validator(validation.updateSchema, "body"), controller.update(ioc));
  router.post("/scenario-categories/delete", validator(validation.deleteSchema, "body"), controller.deleteById(ioc));
  return router;
};
