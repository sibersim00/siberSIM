const controller = require("./controller");
const validation = require("./validation");

module.exports = ({ express, validator, ...ioc }) => {
  const router = express.Router();

  router.post(
    "/scenarios/import",
    validator(validation.importSchema, "body"),
    controller.importScenario(ioc),
  );

  return router;
};
