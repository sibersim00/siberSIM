module.exports = function (iocContainer) {
    const { express, controller } = iocContainer;
    const router = express.Router();
    
    router.get('/list', controller.list(iocContainer));
    
    router.get('/getmenu/:id', controller.getById(iocContainer));
    
    router.get('/parentlist', controller.parentlist(iocContainer));
    
    router.post('/', controller.create(iocContainer));
    
    router.put('/:id',controller.update(iocContainer));
   
    router.delete('/:id',controller.remove(iocContainer));
   
    router.put('/status/:id',controller.status(iocContainer));
    return router;
}
