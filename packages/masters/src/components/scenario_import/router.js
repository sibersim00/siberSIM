
module.exports = function (iocContainer) {
    const { express, controller, validator, validation } = iocContainer;
    const router = express.Router();

router.get(
  "/get/:uuid", controller.getScenarioById(iocContainer)
);

    return router;
}