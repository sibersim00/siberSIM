const authRouter = require("../components/auth/router");
const usersRouter = require("../components/users/router");
const componentCategoriesRouter = require("../components/component_categories/router");
const scenarioCategoriesRouter = require("../components/scenario_categories/router");
const scenarioSubcategoriesRouter = require("../components/scenario_subcategories/router");
const scenariosRouter = require("../components/scenarios/router");
module.exports = (ioc) => {
  const router = ioc.express.Router();
  router.use(ioc.requireWebhookLicense(ioc));
  router.use("/auth", authRouter(ioc));
  router.use(
    "/v1",
    ioc.authenticate(ioc),
    ioc.audit(ioc),
    usersRouter(ioc),
    componentCategoriesRouter(ioc),
    scenarioCategoriesRouter(ioc),
    scenarioSubcategoriesRouter(ioc),
    scenariosRouter(ioc)
  );
  return router;
};
