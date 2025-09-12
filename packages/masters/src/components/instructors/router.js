
module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validator,
        validation
    } = iocContainer;

    const router = express.Router();

    router.get('/get', controller.list(iocContainer));
    router.get('/get/:id', controller.getById(iocContainer));
    router.post('/save', validator(validation.addSchema,'body'),controller.save(iocContainer));
    router.post('/update', validator(validation.updateSchema,'body'),controller.update(iocContainer));
    router.post('/change-status', validator(validation.statusSchema,'body'),controller.statusChange(iocContainer));
    router.post('/delete', validator(validation.deleteSchema,'body'),controller.deleteById(iocContainer));
    router.post('/send-verification', validator(validation.verifySchema,'body'),controller.sendVerification(iocContainer));
    router.post('/reset-password', validator(validation.resetpasswordSchema,'body'),controller.resetPassword(iocContainer));

    return router;
}