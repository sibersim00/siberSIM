
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;
  
    const schemas = require('./validation');
    const { authJwt } = require("../../../middleware");

    const router = express.Router();
    
    router.get('/get', [authJwt.authenticateToken],controller.getTemplates(iocContainer));
    router.get('/get/:id', [authJwt.authenticateToken],controller.getTemplatebyId(iocContainer));
    router.get('/action-templates/:id', [authJwt.authenticateToken],controller.getActionTemplates(iocContainer));
    router.post('/save', [authJwt.authenticateToken],controller.saveTemplate(iocContainer));
    router.post('/test-email', [authJwt.authenticateToken],controller.getTestEmail(iocContainer));

    return router;
}