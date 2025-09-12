
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer; 

    const router = express.Router();

    //  router.post('/get-learner-statistics', controller.getLearnerStatistics(iocContainer));

router.post('/get-instructor-details', controller.getInstructorDetails(iocContainer));
router.post('/get-instructor-statistics', controller.getInstructorStatistics(iocContainer));




    return router;
}