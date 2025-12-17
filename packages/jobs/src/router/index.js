const fmRouter = require("../components/fm")
const eventLearnerRouter = require(".././components/eventlearner");
const vmconfigsRouter = require(".././components/vmconfigs");
const vmstartRouter = require(".././components/vmstart");

module.exports = function (iocContainer) {
  const { express } = iocContainer;
  const router = express.Router();


  router.use('/fm', fmRouter(iocContainer));
  router.use("/eventlearner", eventLearnerRouter(iocContainer));
  router.use("/vmconfigs", vmconfigsRouter(iocContainer));
  router.use("/vmstart", vmstartRouter(iocContainer));





  router.get('/', (_req, res) => res.json('Jobs Module'));
  return router;
};
