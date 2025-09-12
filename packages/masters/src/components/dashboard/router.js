const { authenticateToken } = require("../../middleware/authJwt");
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer; 

    const router = express.Router();

    router.get('/dashboardstats',authenticateToken,controller.getDashboardStats(iocContainer));
  
    
    return router;
}