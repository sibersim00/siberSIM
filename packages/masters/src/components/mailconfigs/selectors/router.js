
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;
  
    const schemas = require('./validation');

    const router = express.Router();
    
    router.get('/get', controller.getSelectors(iocContainer));
    router.get('/get/:id', controller.getSelectorbyId(iocContainer));
    router.post('/save', controller.saveSelector(iocContainer));
    //router.delete('/:id', controller.deleteSelector(iocContainer));

    return router;
}