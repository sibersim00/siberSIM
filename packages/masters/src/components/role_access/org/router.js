module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;

    const router = express.Router();
    //LIST
    router.get('/list/:id?', controller.list(iocContainer));
    router.post('/', controller.create(iocContainer));
    router.put('/:id', controller.update(iocContainer));
    router.put('/status/:id', controller.status(iocContainer));
    return router;
}
