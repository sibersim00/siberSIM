
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;
  
    const schemas = require('./validation');
    const { authJwt } = require("../../../middleware");

    const router = express.Router();
    
    router.get('/get', [authJwt.authenticateToken],controller.getSelectors(iocContainer));
    router.get('/get/:id', [authJwt.authenticateToken],controller.getSelectorbyId(iocContainer));
    router.post('/save', [authJwt.authenticateToken],controller.saveSelector(iocContainer));
    //router.delete('/:id', controller.deleteSelector(iocContainer));

    return router;
}