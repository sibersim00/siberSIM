
module.exports = function (iocContainer) {
    const {  express,controller } = iocContainer; 
    const router = express.Router();
  router.get('/get-student-dashboard', controller.getStudentDashboard(iocContainer));
  return router;
}