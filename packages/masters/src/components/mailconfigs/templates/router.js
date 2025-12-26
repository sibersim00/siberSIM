
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;
  
    const schemas = require('./validation');

    const router = express.Router();
    
    router.get('/get', controller.getTemplates(iocContainer));
    router.get('/get/:id', controller.getTemplatebyId(iocContainer));
    router.get('/action-templates/:id', controller.getActionTemplates(iocContainer));
    router.post('/save', controller.saveTemplate(iocContainer));
    router.post('/test-email', controller.getTestEmail(iocContainer));

    return router;
}