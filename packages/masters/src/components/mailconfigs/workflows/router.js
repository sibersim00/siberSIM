
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;
  
    const schemas = require('./validation');
    const { authJwt } = require("../../../middleware");

    const router = express.Router();
    
    router.get('/get', [authJwt.authenticateToken],controller.getWorkflows(iocContainer));
    router.get('/get/:id', [authJwt.authenticateToken],controller.getWorkflowbyId(iocContainer));
    router.post('/save', [authJwt.authenticateToken],controller.saveWorkflow(iocContainer));

    return router;
}