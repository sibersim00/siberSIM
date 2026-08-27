const controller = require("./controller");
const validation = require("./validation");

module.exports = ({ express, validator, ...ioc }) => {
  const router = express.Router();
  router.get("/scenario-subcategories", controller.getAll(ioc));
  router.get("/scenario-subcategories/:id", validator(validation.idSchema, "params"), controller.getById(ioc));
  router.post("/scenario-subcategories", validator(validation.createSchema, "body"), controller.save(ioc));
  router.post("/scenario-subcategories/update", validator(validation.updateSchema, "body"), controller.update(ioc));
  router.post("/scenario-subcategories/delete", validator(validation.deleteSchema, "body"), controller.deleteById(ioc));
  return router;
};
