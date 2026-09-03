module.exports = ({ express, controller, validator, validation, ...ioc }) => {
  const router = express.Router();

  router.post(
    "/import",
    validator(validation.importSchema, "body"),
    controller.importScenario({ ...ioc, controller, validator, validation }),
  );

  return router;
};
