module.exports = (iocContainer) => {
  const { express, controller, validation, validator } = iocContainer;

  const { authJwt } = require("../../middleware");
  const router = express.Router();

  router.post("/json", controller.getJson(iocContainer));
  router.post("/save-json", controller.saveJson(iocContainer));
  router.post(
    "/componentlistbycategory",
    validator(validation.schemaComponentByCategory, "body"),
    controller.getComponentByCategoryId(iocContainer)
  );
  router.get(
    "/componentcategorylist",
    controller.componentcategorylist(iocContainer)
  );
  router.post(
    "/scenariocomponentlist",
    controller.scenariocomponentcategorylist(iocContainer)
  );
  router.get("/instructorlist", controller.instructorlist(iocContainer));
  router.post(
    "/componentsubcategorylist",
    validator(validation.schemasubcategory, "body"),
    controller.componentsubcategorylist(iocContainer)
  );
  router.get(
    "/scenariocategorylist",
    controller.scenariocategorylist(iocContainer)
  );
  router.post(
    "/scenariosubcategorylist",
    validator(validation.schema, "body"),
    controller.scenariosubcategorylist(iocContainer)
  );
  router.get("/emailtemplatelist", controller.emailtemplatelist(iocContainer));
  router.get("/rolelist", controller.rolelist(iocContainer));
  router.post("/studentlistevent", controller.studentlistevent(iocContainer));
  router.get("/studentlist", controller.studentlist(iocContainer));
  router.get("/batchlist", controller.batchlist(iocContainer));
  router.get("/scenariolist", controller.scenariolist(iocContainer));
  router.post(
    "/scenarioinstructorlist",
    controller.scenarioinstructorlist(iocContainer)
  );
  router.post("/diagramlist", controller.scenariodiagramlist(iocContainer));
  router.get("/faqlist", controller.faqlist(iocContainer));
  router.get("/getallscenario", controller.eventScenarioList(iocContainer));
    router.get("/theme", controller.theme(iocContainer));

    router.get(
    "/scenariocategorycustomlist",
    controller.scenariocategorycustomlist(iocContainer)
  );
    router.post(
    "/scenariosubcategorycustomlist",
    controller.scenariosubcategorycustomlist(iocContainer)
  );


  return router;
};
