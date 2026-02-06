module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validator,
        validation
    } = iocContainer;

    const router = express.Router();

    router.get('/get', controller.labSessionList(iocContainer));
    router.post('/save', validator(validation.addSchema,'body'),controller.save(iocContainer));
    router.post('/update', validator(validation.updateSchema,'body'),controller.update(iocContainer));
    router.post("/delete",validator(validation.idSchema, "body"),controller.deleteById(iocContainer));
    router.post("/change-status",validator(validation.idWithStatusSchema, "body"),controller.changeStatus(iocContainer));

    return router;
}