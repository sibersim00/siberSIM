
module.exports = function (iocContainer) {
    const {
        express,
        controller,
        validator,
        validation
    } = iocContainer; 

    const router = express.Router();
    router.post('/get-learner-details', controller.getLearnerDetails(iocContainer));
    router.post('/get-learner-statistics', controller.getLearnerStatistics(iocContainer));



    return router;
}