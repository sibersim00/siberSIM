const fmRouter = require("../components/fm")
const eventLearnerRouter = require(".././components/eventlearner");
const vmconfigsRouter = require(".././components/vmconfigs");

module.exports = function (iocContainer) {
  const { express } = iocContainer;
  const router = express.Router();


  router.use('/fm', fmRouter(iocContainer));
  router.use("/eventlearner", eventLearnerRouter(iocContainer));
  router.use("/vmconfigs", vmconfigsRouter(iocContainer));





  router.get('/', (_req, res) => res.json('Jobs Module'));
  return router;
};
