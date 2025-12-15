module.exports = function (iocContainer) {
  const { express, controller} = iocContainer;
  const router = express.Router();
    router.get("/theme", controller.theme(iocContainer));
     router.post(
    "/componentsubcategorylist",
    controller.componentsubcategorylist(iocContainer)
  );
    router.get(
    "/componentcategorylist",
    controller.componentcategorylist(iocContainer)
  );

  router.post(
    "/scenariocomponentlist",
    controller.scenariocomponentcategorylist(iocContainer)
  );
    router.get(
    "/scenariocategorylist",
    controller.scenariocategorylist(iocContainer)
  );
    router.post(
    "/scenariosubcategorylist",
    controller.scenariosubcategorylist(iocContainer)
  );
  return router;
};
