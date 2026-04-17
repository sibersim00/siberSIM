module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer; 

    const router = express.Router();
    router.get('/licensedashboardstats', controller.getLicenseDashboardStats(iocContainer));
    return router;
}