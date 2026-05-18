
const multer  = require("multer");
const upload  = multer(); // memory storage — we just forward the file


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
  router.post('/savecomponentconfiguration',controller.saveComponentconfiguration(iocContainer));
  router.post("/create-export", controller.createExport(iocContainer));
  router.get("/tablist",controller.getTabList(iocContainer));
  router.get("/exportlist",controller.exportList(iocContainer));
  router.get("/exportlist-inprogress", controller.exportListInProgress(iocContainer));
  router.post("/export_components",controller.exportcomponents(iocContainer));
  router.post("/create-export",controller.createExport(iocContainer));




  return router;
}