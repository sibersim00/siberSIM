module.exports = function (iocContainer) {
  const { express, controller} = iocContainer;
  const router = express.Router();
    router.get("/theme", controller.theme(iocContainer));
    router.get("/ambient-motion", controller.getAmbientMotion(iocContainer));
    router.put("/ambient-motion", controller.updateAmbientMotion(iocContainer));
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
