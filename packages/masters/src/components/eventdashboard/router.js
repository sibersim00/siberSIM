
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;

    const router = express.Router();

    router.get('/dashboardstats', controller.getDashboardStats(iocContainer));
   router.get('/getEventList', controller.eventListController(iocContainer));
     router.get('/teams', controller.fetchTeamsByEventUUID(iocContainer));


    return router;
}