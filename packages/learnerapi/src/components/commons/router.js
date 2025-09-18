module.exports = function (iocContainer) {
  const { express, controller} = iocContainer;
  const router = express.Router();
    router.get("/theme", controller.theme(iocContainer));
  return router;
};
