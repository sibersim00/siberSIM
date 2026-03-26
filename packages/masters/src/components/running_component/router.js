module.exports = function (iocContainer) {
  const { express, controller, validation, validator } = iocContainer;

  const router = express.Router();
    router.get('/learners-component', controller.getLearners(iocContainer));
    router.post('/running-components', controller.getRunningComponents(iocContainer));
    router.get("/running-scenarios", controller.getRunningScenarios(iocContainer));
    router.post("/stop-single-component",controller.stopComponent(iocContainer));
    router.post("/start-single-component",controller.startComponent(iocContainer));
    router.post("/restart-single-component",controller.restartComponent(iocContainer));
    router.get('/running', controller.listRunningComponent(iocContainer));
    router.get('/all-except-running', controller.listAllExceptRunning(iocContainer));
  return router;
};
