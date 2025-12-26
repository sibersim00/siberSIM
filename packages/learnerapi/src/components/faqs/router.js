module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;
  const router = express.Router();
  router.get("/getfaqs", controller.getfaq(iocContainer));
  return router;
};
