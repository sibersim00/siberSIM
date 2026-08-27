const controller = require("./controller");
const validation = require("./validation");
module.exports = ({ express, validator, ...ioc }) => {
  const router = express.Router();
  router.get("/users", controller.getAll(ioc));
  router.post("/users", validator(validation.createSchema, "body"), controller.save(ioc));
  router.post("/users/update", validator(validation.updateSchema, "body"), controller.update(ioc));
  router.post("/users/delete", validator(validation.deleteSchema, "body"), controller.deleteById(ioc));
  return router;
};
