module.exports = function (iocContainer) {
    const { express, controller, validation, validator } = iocContainer;
    const { authJwt } = require("../../middleware");
    const router = express.Router();

    router.get('/get', controller.getscenariosubcategoryAll(iocContainer));
    router.get('/get/:id', validator(validation.idSchema, 'params'), controller.getscenariosubcategorybyId(iocContainer));
    router.post('/save', validator(validation.saveSchema, 'body'), controller.save(iocContainer)); 
    router.post('/update', validator(validation.updateSchema, 'body'), controller.update(iocContainer));
    router.post('/delete/', validator(validation.deleteSchema, 'body'), controller.deleteById(iocContainer));
    router.post('/change-status', controller.statusChange(iocContainer));
    router.post('/verify',controller.scenariosubcategoryverify(iocContainer));
    router.post('/import',validator(validation.importSchema, 'body'), controller.scenariosubcategoryImport(iocContainer));

    return router;
};
