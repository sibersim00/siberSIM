const dashboardRouter = require("../components/dashboard");
const profileRouter = require("../components/profile");
const scenarioRouter = require("../components/scenarios");
const customscenariosRouter = require("../components/custom_scenarios");
const vmconfigsRouter = require("../components/vmconfigs");
const eventlearnerRouter = require("../components/eventlearner");
const chatBoxRouter = require("../components/chatbox");
const scenarioQuizRouter = require("../components/scenario_quiz");
const faqsRouter = require("../components/faqs");
const eventsRouter = require("../components/events");
const eventChatBoxRouter = require("../components/eventchatbox");
const notificationRouter = require("../components/notification");
const authRouter = require("../components/auth");
const commonRouter = require("../components/commons");
const customcomponentRouter = require("../components/custom_component");
const invitescenarioRouter = require("../components/invitescenarios");

module.exports = function (iocContainer) {
  const { express, authJwt } = iocContainer;
  const router = express.Router();
  router.use("/auth", authRouter(iocContainer));
  router.use("/vmconfigs",vmconfigsRouter(iocContainer));
  router.use("/dashboard", [authJwt.authenticateToken(["/dashboard"])], dashboardRouter(iocContainer));
  router.use("/profile", [authJwt.authenticateToken([""])], profileRouter(iocContainer));
  router.use("/scenarios", [authJwt.authenticateToken(["/scenarios","/event-dashboard",""])], scenarioRouter(iocContainer));
  router.use("/custom_scenarios", [authJwt.authenticateToken(["/customscenarios"])], customscenariosRouter(iocContainer));
  router.use("/eventlearner", [authJwt.authenticateToken([""])], eventlearnerRouter(iocContainer));
  router.use("/chatbox", [authJwt.authenticateToken([""])], chatBoxRouter(iocContainer));
  router.use("/scenario_quiz", [authJwt.authenticateToken([""])], scenarioQuizRouter(iocContainer));
  router.use("/faqs", [authJwt.authenticateToken(["/faqs"])], faqsRouter(iocContainer));
  router.use("/events", [authJwt.authenticateToken([""])], eventsRouter(iocContainer));
  router.use("/eventchatbox", [authJwt.authenticateToken([""])], eventChatBoxRouter(iocContainer));
  router.use("/notification", [authJwt.authenticateToken([""])], notificationRouter(iocContainer));
  router.use("/commons", [authJwt.authenticateToken([""])], commonRouter(iocContainer));
  router.use("/custom_component", [authJwt.authenticateToken(["/customcomponent"])], customcomponentRouter(iocContainer));
  router.use("/invitescenarios", [authJwt.authenticateToken(["/invitescenarios"])], invitescenarioRouter(iocContainer));

  return router;
};

