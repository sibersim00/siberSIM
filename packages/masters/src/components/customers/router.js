
module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validator,
        validation
    } = iocContainer;

    const router = express.Router();

    router.get('/get', controller.customerList(iocContainer));
    router.get('/get/:id', controller.getById(iocContainer));
    router.post('/save', validator(validation.addSchema,'body'),controller.save(iocContainer));
    router.post('/update', validator(validation.updateSchema,'body'),controller.update(iocContainer));
    router.post('/change-status', controller.statusChange(iocContainer));
    router.post('/get-license', controller.getLicenseByCustomerId(iocContainer));
    router.post("/license-save",validator(validation.licenseAddSchema, "body"), controller.saveLicense(iocContainer));
    router.post("/license-update",validator(validation.licenseUpdateSchema, "body"),controller.updateLicense(iocContainer));


    return router;
}