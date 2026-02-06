
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;
  
    const schemas = require('./validation');

    const router = express.Router();
    
    router.get('/get', controller.getWorkflows(iocContainer));
    router.get('/get/:id', controller.getWorkflowbyId(iocContainer));
    router.post('/save', controller.saveWorkflow(iocContainer));

    return router;
}