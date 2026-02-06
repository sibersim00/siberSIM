const loginRouter = require("../components/login")
const loginLearnerRouter = require("../components/login_learner")
const loginInstructorRouter = require("../components/login_instructor")
const loginEventRouter = require("../components/login_event")

module.exports = function (iocContainer) {
    const { express } = iocContainer;
    const router = express.Router();
    router.use('/', loginRouter(iocContainer))
    router.use('/learner', loginLearnerRouter(iocContainer))
    router.use('/instructor', loginInstructorRouter(iocContainer))
    router.use('/event',loginEventRouter(iocContainer))
    return router;
}
