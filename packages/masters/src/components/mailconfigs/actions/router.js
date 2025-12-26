
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;
    const router = express.Router();
    
    router.get('/get',  controller.getActions(iocContainer));
    router.get('/get/:id', controller.getActionbyId(iocContainer));
    router.post('/save', controller.saveAction(iocContainer));

    return router;
}