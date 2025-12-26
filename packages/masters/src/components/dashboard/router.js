module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer; 

    const router = express.Router();

    router.get('/dashboardstats', controller.getDashboardStats(iocContainer));
  
    
    return router;
}