module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validation,
        validator,
    } = iocContainer; 
   
    const router = express.Router();

    router.get('/fetch-network', controller.fetchAndStoreOVSNetworks(iocContainer));
    router.get('/list', controller.list(iocContainer));

    return router;
}