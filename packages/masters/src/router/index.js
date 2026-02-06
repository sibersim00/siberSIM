const vmconfigRouter = require("../components/vmconfig");
const vmstartRouter = require("../components/vmstart");
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
const scenarioImport = require("../components/scenario_import")
const customersRouter = require("../components/customers");
const labSessions = require("../components/lab_sessions");
const vmScenarioStart = require("../components/vm_scenario_start");
const customcomponentRouter = require("../components/custom_component");
const runningComponnets = require("../components/running_component");
const licenseDashboardRouter = require("../components/licensedashboard");

module.exports = function (iocContainer) {
  const { express, authJwt } = iocContainer;
  const router = express.Router();
  router.use("/auth", authRouter(iocContainer));
  router.use("/vmconfig", [authJwt.authenticateToken(['/scenariotermination'])], vmconfigRouter(iocContainer));
  router.use("/vmstart", [authJwt.authenticateToken([''])], vmstartRouter(iocContainer));
  router.use("/dashboard", [authJwt.authenticateToken(['/dashboard'])], dashboardRouter(iocContainer));
  router.use(
    "/commons",
    [authJwt.authenticateToken([''])],
    commonsRouter(iocContainer)
  );
  router.use(
    "/roleaccess/menus",
    [authJwt.authenticateToken(["/admin"])],
    roleMenuRouter(iocContainer)
  );
  router.use(
    "/roleaccess/roles",
    [authJwt.authenticateToken(["/admin"])],
    roleRouter(iocContainer)
  );
  router.use(
    "/roleaccess/org",
    [authJwt.authenticateToken([""])],
    OrganizationRouter(iocContainer)
  );
  router.use("/roleaccess/users",
    [authJwt.authenticateToken([''])],
    UserRouter(iocContainer)
  );
  router.use(
    "/actions",
    [authJwt.authenticateToken([""])],
    actionRouter(iocContainer)
  );
  router.use(
    "/templates",
    [authJwt.authenticateToken([""])],
    templateRouter(iocContainer)
  );
  router.use(
    "/selectors",
    [authJwt.authenticateToken([""])],
    selectorRouter(iocContainer)
  );
  router.use(
    "/masters",
    [authJwt.authenticateToken(["",'/masters'])],
    mastersRouter(iocContainer)
  );
  router.use(
    "/workflows",
    [authJwt.authenticateToken([""])],
    workflowRouter(iocContainer)
  );
  router.use(
    "/notification",
    [authJwt.authenticateToken([""])],
    notiRouter(iocContainer)
  );
  router.use(
    "/web-settings",
    [authJwt.authenticateToken([""])],
    webSettings(iocContainer)
  );
  router.use(
    "/systemconfigapi",
    [authJwt.authenticateToken([""])],
    systemConfigsRouter(iocContainer)
  );

  router.use(
    "/learners",
    [authJwt.authenticateToken(['/users-management'])],
    learnersRouter(iocContainer)
  );
  router.use(
    "/instructors",
    [authJwt.authenticateToken(['/users-management'])],
    instructorsRouter(iocContainer)
  );
  router.use("/scenario", [authJwt.authenticateToken(['/scenarios'])], scenario(iocContainer));
  router.use(
    "/scenario-categories",
    [authJwt.authenticateToken(['/masters'])],
    scenarioCategories(iocContainer)
  );
  router.use(
    "/scenario-subcategories",
    [authJwt.authenticateToken(['/masters'])],
    scenariosubCategories(iocContainer)
  );
  router.use(
    "/component-category",
    [authJwt.authenticateToken(['/masters'])],
    componentCategory(iocContainer)
  );
  router.use(
    "/component-subcategory",
    [authJwt.authenticateToken([""])],
    componentSubCategory(iocContainer)
  );
  router.use(
    "/components",
    [authJwt.authenticateToken(['/components'])],
    componentRouter(iocContainer)
  );
  router.use(
    "/batches",
    [authJwt.authenticateToken([""])],
    componentBatchRouter(iocContainer)
  );
  router.use(
    "/usersession",
    [authJwt.authenticateToken(['/user-sessions'])],
    usersessionRouter(iocContainer)
  );
  router.use(
    "/network",
    [authJwt.authenticateToken(['/network'])],
    networkRouter(iocContainer)
  );
  router.use(
    "/apilogs",
    [authJwt.authenticateToken(['/proxmoxlogs'])],
    apilogsRouter(iocContainer)
  );
  router.use(
    "/chatbox",
    [authJwt.authenticateToken([""])],
    chatboxRouter(iocContainer)
  );
  router.use(
    "/scenario_questions",
    [authJwt.authenticateToken([""])],
    scenarioquestionRouter(iocContainer)
  );
  router.use("/event", [authJwt.authenticateToken(['/events'])], eventRouter(iocContainer));
  router.use("/faqs", [authJwt.authenticateToken(['/masters'])], faqsRouter(iocContainer));
  router.use(
    "/widgets",
    [authJwt.authenticateToken(['/masters'])],
    widgetsRouter(iocContainer)
  );
  router.use(
    "/eventchatbox",
    [authJwt.authenticateToken([""])],
    eventchatboxRouter(iocContainer)
  );
  router.use(
    "/eventdashboard",
    [authJwt.authenticateToken(['/event-dashboard'])],
    eventdashboardRouter(iocContainer)
  );
  router.use(
    "/user-reports",
    [authJwt.authenticateToken(['/userreport'])],
    userreportsRouter(iocContainer)
  );
  router.use(
    "/instructor-reports",
    [authJwt.authenticateToken(['/instructorreport'])],
    instructorreportsRouter(iocContainer)
  );
  router.use("/report", [authJwt.authenticateToken(['/loginlogs',])], reportRouter(iocContainer));
  router.use("/company_setting", [authJwt.authenticateToken(['',])], companySettingRouter(iocContainer));
  router.use("/custom_scenarios", [authJwt.authenticateToken(['/customscenarios'])], customscenariosRouter(iocContainer));
  router.use("/scenarios_tabs", [authJwt.authenticateToken(['/masters'])], scenariosTabs(iocContainer));
 
  router.use("/customers",[authJwt.authenticateToken([""])],customersRouter(iocContainer));
  router.use("/lab_sessions",[authJwt.authenticateToken([""])],labSessions(iocContainer));

  router.use("/custom_component", [authJwt.authenticateToken([""])], customcomponentRouter(iocContainer));
  router.use("/vm_scenario_start", [authJwt.authenticateToken([""])], vmScenarioStart(iocContainer));
  router.use("/running_component", [authJwt.authenticateToken([""])], runningComponnets(iocContainer));
   router.use("/licensedashboard",
       [authJwt.authenticateToken([""])], 
       licenseDashboardRouter(iocContainer));
  router.get("/", (_req, res) => res.json("Masters Module"));
  return router;
};
