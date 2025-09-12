
module.exports = function (iocContainer) {
    const {express, controller} = iocContainer; 
    const { authJwt } = require("../../middleware");
    const router = express.Router();
    router.get('/get_template_list', [authJwt.authenticateToken],controller.getList(iocContainer));
    router.get('/get_template_list/:id', [authJwt.authenticateToken],controller.getListById(iocContainer));
    router.post('/savetemplate', [authJwt.authenticateToken],controller.savetemplate(iocContainer));
    router.get('/get-selectors/:id', controller.getSelectors(iocContainer));
    router.get('/get_noti_list/:flag', [authJwt.authenticateToken],controller.getNotification(iocContainer));
    router.get('/get_noti_list_all/:flag', [authJwt.authenticateToken],controller.getNotificationAll(iocContainer));
    router.post('/read_notification', [authJwt.authenticateToken],controller.UpdateReadNotification(iocContainer));
    return router;
}