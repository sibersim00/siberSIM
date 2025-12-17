module.exports = function (iocContainer) {
    const { express, controller, validation, validator } = iocContainer;
    const { authJwt } = require("../../middleware");
    const router = express.Router();

    router.get('/get', controller.getscenarioAll(iocContainer));
    router.get('/get/:id', validator(validation.idSchema, 'params'), controller.getScenarioCategorybyId(iocContainer));
    router.post('/save', validator(validation.saveSchema, 'body'), controller.save(iocContainer)); 
    router.post('/update', validator(validation.updateSchema, 'body'), controller.update(iocContainer));
    router.post('/delete/', validator(validation.deleteSchema, 'body'), controller.deleteById(iocContainer));
    router.post('/change-status', controller.statusChange(iocContainer));
    router.post('/verify', controller.scenariocategoryverify(iocContainer));
    router.post('/import', controller.scenariocategoryImport(iocContainer));

    return router;
};
