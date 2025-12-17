
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;

    const router = express.Router();
    
    router.get('/get-activities', controller.getActivities(iocContainer));
    router.get('/get-actions', controller.getActions(iocContainer));
    router.get('/get-selectors/:id', controller.getSelectors(iocContainer));
    router.get('/get-activity-actions/:id', controller.getActivityActions(iocContainer));
    router.get('/get-email-configs', controller.getEmailConfigs(iocContainer));
    router.get('/get-email-senders', controller.getEmailSenders(iocContainer));
    
    return router;
}