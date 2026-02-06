
module.exports = function (iocContainer) {
    const {express, controller} = iocContainer;
    const router = express.Router();
    router.get('/get_template_list', controller.getList(iocContainer));
    router.get('/get_template_list/:id', controller.getListById(iocContainer));
    router.post('/savetemplate', controller.savetemplate(iocContainer));
    router.get('/get-selectors/:id', controller.getSelectors(iocContainer));
    router.get('/get_noti_list/:flag', controller.getNotification(iocContainer));
    router.get('/get_noti_list_all/:flag', controller.getNotificationAll(iocContainer));
    router.post('/read_notification', controller.UpdateReadNotification(iocContainer));
    return router;
}