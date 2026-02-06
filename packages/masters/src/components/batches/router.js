module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validation,
        validator,
    } = iocContainer;

    const router = express.Router();
    router.get('/get', controller.getAll(iocContainer));
    router.get('/get/:id',validator(validation.idSchema,'params'), controller.getById(iocContainer));
    router.post('/save', validator(validation.saveschema,'body'),controller.save(iocContainer)); 
    router.post('/update',validator(validation.updateschema,'body'), controller.update(iocContainer));
    router.post('/change-status',validator(validation.statusschema,'body'),controller.changestatus(iocContainer));
    router.post('/delete/',validator(validation.deleteSchema,'body'), controller.deleteById(iocContainer));
    return router;
}