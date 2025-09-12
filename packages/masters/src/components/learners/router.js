
module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validator,
        validation
    } = iocContainer; 
    
    const router = express.Router();

    router.get('/get', controller.getAll(iocContainer));
    router.post('/save', validator(validation.addSchema,'body'),controller.save(iocContainer));
    router.post('/update', validator(validation.updateSchema,'body'),controller.update(iocContainer));
    router.post('/change-status', validator(validation.statusUpdateSchema,'body'),controller.statusChange(iocContainer));
    router.post('/mail_confirmation', validator(validation.mailSchema,'body'),controller.mailConfirmation(iocContainer));
    router.post('/reset-password', validator(validation.resetPasswordSchema,'body'),controller.resetPassword(iocContainer));
    router.post('/getmapped-instructorList', validator(validation.instructormappedSchema,'body'),controller.getMappedInstructor(iocContainer));
    router.post('/save-mapped-instructor', validator(validation.saveinstructormappedSchema,'body'),controller.saveMappedInstructor(iocContainer));
     router.post(
    "/generate-access-token",
    controller.generateProxmoxAccessToken(iocContainer)
  );
    
    
    router.post('/import', controller.learnerImport(iocContainer));
    router.get('/get/:id', validator(validation.idSchema,'params'),controller.getById(iocContainer));
    router.post('/delete', validator(validation.deleteSchema,'body'),controller.deleteById(iocContainer));
    return router;
}