
module.exports = function (iocContainer) {
    const {express, controller} = iocContainer;
    const router = express.Router();
    router.get('/', controller.profile(iocContainer));
    router.post('/save-profile', controller.updateProfile(iocContainer));
    router.post('/change-password',  controller.changePassword(iocContainer));
    router.post('/dismiss-password-reset', controller.dismissPasswordReset(iocContainer));
    router.post('/save-profile-image',  controller.updateProfileImage(iocContainer));
    return router;
}
