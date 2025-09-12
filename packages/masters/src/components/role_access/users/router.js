module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validation,
        validator
    } = iocContainer;

    const router = express.Router();
    //LIST
    router.get('/list/:id?', controller.list(iocContainer));
    router.get('/get-profile', controller.getProfile(iocContainer));
    router.post('/save-profile', controller.updateProfile(iocContainer));
    router.post('/save-profile-image',validator(validation.updateprofileSchema,'body'), controller.updateProfileImage(iocContainer));
    router.post('/change-password', controller.changePassword(iocContainer));
    router.post('/', validator(validation.schema,'body'),controller.create(iocContainer));
    router.post('/update',validator(validation.updateSchema,'body'), controller.update(iocContainer));
    //UPDATE STATUS
    router.post('/status', validator(validation.statusSchema,'body'),controller.status(iocContainer));
    router.post('/resend-mail', controller.resendMailUser(iocContainer));
    router.post('/mail_confirmation',  validator(validation.mailSchema,'body'),controller.mailConfirmation(iocContainer));
    router.post('/reset-password', controller.resetpassword(iocContainer));
    
    
    
    router.post('/import', controller.userImport(iocContainer));
    return router;
   
}