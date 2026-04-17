
module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;
  const router = express.Router();

  router.get('/list', controller.list(iocContainer));
  router.get('/get/:id', validator(validation.idSchema, 'params'), controller.getById(iocContainer));
  router.post('/save', validator(validation.schema, 'body'), controller.create(iocContainer));
  router.post('/update', validator(validation.updateSchema, 'body'), controller.update(iocContainer));
  router.post('/status', validator(validation.statusSchema, 'body'), controller.changeStatus(iocContainer));
  router.post('/manipulation-status', validator(validation.statusSchema, 'body'), controller.changeMaipulationStatus(iocContainer));
  router.post('/save_diagram', controller.saveDiagram(iocContainer));
  router.get('/scenariodigramlist', controller.scenariodigramlist(iocContainer));
  router.post('/delete', validator(validation.deleteSchema, 'body'), controller.deleteById(iocContainer));
  router.post('/savecomponentconfiguration',
    //  validator(validation.componentconfigSchema, 'body'),
      controller.saveComponentconfiguration(iocContainer));
  router.get('/exportlist', controller.exportList(iocContainer));
  router.post("/create-export", controller.createExport(iocContainer));
  router.get(
    "/tablist",
    controller.getTabList(iocContainer)
  );
  return router;
}