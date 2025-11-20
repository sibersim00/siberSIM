const vmconfigRouter = require("../components/vmconfig");
const dashboardRouter = require("../components/dashboard");
const commonsRouter = require("../components/commons");
const roleMenuRouter = require("../components/role_access/menus");
const roleRouter = require("../components/role_access/roles");
const OrganizationRouter = require("../components/role_access/org");
const UserRouter = require("../components/role_access/users");
const systemConfigsRouter = require("../components/systemConfigs");
const notiRouter = require("../components/notification");
const webSettings = require("../components/web_settings");
const actionRouter = require("../components/mailconfigs/actions");
const templateRouter = require("../components/mailconfigs/templates");
const selectorRouter = require("../components/mailconfigs/selectors");
const mastersRouter = require("../components/mailconfigs/masters");
const workflowRouter = require("../components/mailconfigs/workflows");
const scenario = require("../components/scenario");
const instructorsRouter = require("../components/instructors");
const learnersRouter = require("../components/learners");
const scenarioCategories = require("../components/scenario_categories");
const scenariosubCategories = require("../components/scenario_subcategories");
const componentCategory = require("../components/component_categories");
const componentSubCategory = require("../components/component_subcategories");
const componentRouter = require("../components/components");
const componentBatchRouter = require("../components/batches");
const usersessionRouter = require("../components/usersession");
const networkRouter = require("../components/network");
const apilogsRouter = require("../components/apilogs");
const chatboxRouter = require("../components/chatbox");
const scenarioquestionRouter = require("../components/scenario_quiz");
const eventRouter = require("../components/event");
const faqsRouter = require("../components/faqs");
const widgetsRouter = require("../components/widgets");
const eventchatboxRouter = require("../components/eventchatbox");
const eventdashboardRouter = require("../components/eventdashboard");
const userreportsRouter = require("../components/user_reports");
const instructorreportsRouter = require("../components/instructor_reports");
const reportRouter = require("../components/report");
const authRouter = require("../components/auth");
const companySettingRouter = require("../components/company_setting");
const customscenariosRouter = require("../components/custom_scenarios");
const scenariosTabs = require("../components/scenarios_tabs");
const customersRouter = require("../components/customers");
module.exports = function (iocContainer) {
  const { express, authJwt } = iocContainer;
  const router = express.Router();
  router.use("/auth", authRouter(iocContainer));
  router.use("/vmconfig", authJwt.authenticateToken, vmconfigRouter(iocContainer));
  router.use("/dashboard", authJwt.authenticateToken, dashboardRouter(iocContainer));
  router.use(
    "/commons",
    authJwt.authenticateToken,
    commonsRouter(iocContainer)
  );
  authJwt.authenticateToken,
    router.use(
      "/roleaccess/menus",
      authJwt.authenticateToken,
      roleMenuRouter(iocContainer)
    );
  router.use(
    "/roleaccess/roles",
    authJwt.authenticateToken,
    roleRouter(iocContainer)
  );
  router.use(
    "/roleaccess/org",
    authJwt.authenticateToken,
    OrganizationRouter(iocContainer)
  );
  router.use(
    "/roleaccess/users",
    authJwt.authenticateToken,
    UserRouter(iocContainer)
  );
  authJwt.authenticateToken,
    router.use(
      "/actions",
      authJwt.authenticateToken,
      actionRouter(iocContainer)
    );
  router.use(
    "/templates",
    authJwt.authenticateToken,
    templateRouter(iocContainer)
  );
  router.use(
    "/selectors",
    authJwt.authenticateToken,
    selectorRouter(iocContainer)
  );
  router.use(
    "/masters",
    authJwt.authenticateToken,
    mastersRouter(iocContainer)
  );
  router.use(
    "/workflows",
    authJwt.authenticateToken,
    workflowRouter(iocContainer)
  );
  authJwt.authenticateToken,
    router.use(
      "/notification",
      authJwt.authenticateToken,
      notiRouter(iocContainer)
    );
  router.use(
    "/web-settings",
    authJwt.authenticateToken,
    webSettings(iocContainer)
  );
  router.use(
    "/systemconfigapi",
    authJwt.authenticateToken,
    systemConfigsRouter(iocContainer)
  );
  authJwt.authenticateToken,
    router.use(
      "/learners",
      authJwt.authenticateToken,
      learnersRouter(iocContainer)
    );
  router.use(
    "/instructors",
    authJwt.authenticateToken,
    instructorsRouter(iocContainer)
  );
  router.use("/scenario", authJwt.authenticateToken, scenario(iocContainer));
  router.use(
    "/scenario-categories",
    authJwt.authenticateToken,
    scenarioCategories(iocContainer)
  );
  router.use(
    "/scenario-subcategories",
    authJwt.authenticateToken,
    scenariosubCategories(iocContainer)
  );
  router.use(
    "/component-category",
    authJwt.authenticateToken,
    componentCategory(iocContainer)
  );
  router.use(
    "/component-subcategory",
    authJwt.authenticateToken,
    componentSubCategory(iocContainer)
  );
  router.use(
    "/components",
    authJwt.authenticateToken,
    componentRouter(iocContainer)
  );
  router.use(
    "/batches",
    authJwt.authenticateToken,
    componentBatchRouter(iocContainer)
  );
  router.use(
    "/usersession",
    authJwt.authenticateToken,
    usersessionRouter(iocContainer)
  );
  router.use(
    "/network",
    authJwt.authenticateToken,
    networkRouter(iocContainer)
  );
  router.use(
    "/apilogs",
    authJwt.authenticateToken,
    apilogsRouter(iocContainer)
  );
  router.use(
    "/chatbox",
    authJwt.authenticateToken,
    chatboxRouter(iocContainer)
  );
  router.use(
    "/scenario_questions",
    authJwt.authenticateToken,
    scenarioquestionRouter(iocContainer)
  );
  router.use("/event", authJwt.authenticateToken, eventRouter(iocContainer));
  router.use("/faqs", authJwt.authenticateToken, faqsRouter(iocContainer));
  router.use(
    "/widgets",
    authJwt.authenticateToken,
    widgetsRouter(iocContainer)
  );
  router.use(
    "/eventchatbox",
    authJwt.authenticateToken,
    eventchatboxRouter(iocContainer)
  );
  router.use(
    "/eventdashboard",
    authJwt.authenticateToken,
    eventdashboardRouter(iocContainer)
  );
  router.use(
    "/user-reports",
    authJwt.authenticateToken,
    userreportsRouter(iocContainer)
  );
  router.use(
    "/instructor-reports",
    authJwt.authenticateToken,
    instructorreportsRouter(iocContainer)
  );
  router.use("/report", authJwt.authenticateToken, reportRouter(iocContainer));
  router.use("/company_setting", companySettingRouter(iocContainer));
  router.use("/custom_scenarios", authJwt.authenticateToken, customscenariosRouter(iocContainer));
  router.use("/scenarios_tabs", authJwt.authenticateToken, scenariosTabs(iocContainer));
  router.get("/", (_req, res) => res.json("Masters Module"));
  router.use("/customers",authJwt.authenticateToken,customersRouter(iocContainer));
  return router;
};
