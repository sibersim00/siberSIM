
import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import Products from "./slices/Products";
// -------Authentication-----------------------
import Auth from "./slices/authentication/Auth";
// -------Admin-----------------------------
import Menus from "./slices/admin/Menus";
import Roles from "./slices/admin/Roles";
import Organization from "./slices/admin/Organization";
import UserRoleMapping from "./slices/admin/UserRoleMapping";
import Users from "./slices/admin/Users";
// -------System configuration-------------------
// -------intsructor login-----------------------
import instructorLogin from "./slices/instructorLogin/instructorLogin";
import systemConfig from "./slices/systemconfig/systemConfig";
//--------LocalStorage-----------------------
import LocalStorage from "./slices/localstorage/LocalStorage";
//--------Mail configuration-----------------------
import configureTemplate from "./slices/mailconfig/configureTemplate";
import activitiesWorkflow from "./slices/mailconfig/activitiesWorkflow";
import mailPlaceholder from "./slices/mailconfig/mailPlaceholder";
import mailOverview from "./slices/mailconfig/mailOverview";
//------------Categories--------------------
import categories from "./slices/categories/categories";
//------------Learner--------------------
import learnerManage from "./slices/learner/learnerManage";
// ------Notification Configuration-------------------------
import noticonfigs from "./slices/noticonfigs/noticonfigs";
//------web settings------------------------
import companySetting from "./slices/web-settings/company-setting";
//-------------------Component Subcategory---------------
import componentsubcategories from "./slices/masters/ComponentSubCategories";
//-------------------Component category---------------
import componentcategories from "./slices/masters/ComponentCategories";
//-------------------Scenario category---------------
import scenariocategories from "./slices/masters/ScenarioCategories";
//-------------------Common Component master---------------
import commonMaster from "./slices/common/masters";
//-------------------Manage Components---------------
import componentManage from "./slices/component/componentManage";

//------------------Manage Scenario--------------
import scenarioManage from "./slices/scenario/scenarioManage";

import batches from "./slices/batches/batches";

//------------------instructor-----------------
import instructor from "./slices/instructor/instructor";

//------------------Normal User / Student-----------------
import normalUserManage from "./slices/normalusers/normalUserManage";

//-------------------Scenario Sub category---------------
import scenariosubcategories from "./slices/masters/ScenarioSubCategries";

//------------Assignment scenaros ---------
import usersessionManage from "./slices/usersession/usersessionManage";
import networkManage from "./slices/network/networkManage";
import chatboxManage from "./slices/chatbox/chatboxManage";
import quizManage from "./slices/scenarioquiz/quizManage";
import eventsManage from "./slices/event/eventsManage";
import apilogsManage from "./slices/ApiLogs/apilogsManage";
import faqs from "./slices/common/masters";
import widgets from "./slices/masters/widgets";
import faq from "./slices/masters/Faqs";
import dashboarData from "./slices/Dashboard/dashboardManage";
import eventDashboardData from "./slices/EventDashboard/eventdashboardManage";
import customScenario from "./slices/customScenarios/customscenarioManage";
import scenarioTabs from "./slices/scenariotabs/scenariotabsManage";
import eventchatboxData from "./slices/eventchatbox/eventchatboxManage";
import reportData from "./slices/reports/reportManage";
import userreportsManage from "./slices/userreports/userreportsManage";
import instructorreportsManage from "./slices/instructorreports/instructorreportsManage";
import customerData from "./slices/customers/customer";

import company_setting  from "./slices/companySetting/companySetting";

const rootPersistConfig = {
  key: "root",
  storage,
  keyPrefix: "redux-",
  whitelist: [],
};

const productPersistConfig = {
  key: "product",
  storage,
  keyPrefix: "redux-",
  whitelist: ["sortBy", "checkout"],
};

const rootReducer = (state, action) => {
  if (action.type === "LOGOUT") {
    // Reset the state to its initial values for all slices
    state = {};
  }
  return combineReducers({
    product: Products,
    authData: Auth,
    instLoginData: instructorLogin,
    menus: Menus,
    roles: Roles,
    organization: Organization,
    userRoleMapping: UserRoleMapping,
    user: Users,
    systemConfig: systemConfig,
    localData: LocalStorage,
    mailconfigSlice: configureTemplate,
    activitydata: activitiesWorkflow,
    mailPlaceholderData: mailPlaceholder,
    mailOverViewResp: mailOverview,
    categories: categories,
    learnerData: learnerManage,
    noticonfigs: noticonfigs,
    companySetting: companySetting,
    componentcategories: componentcategories,
    componentsubcategories: componentsubcategories,
    scenariocategories: scenariocategories,
    commonMaster: commonMaster,
    componentManage: componentManage,
    scenarioManage: scenarioManage,
    batches: batches,
    InstructorData: instructor,
    normalUSerData: normalUserManage,
    scenariosubcategories: scenariosubcategories,
    usersessionManage: usersessionManage,
    networkManage: networkManage,
    chatboxManage: chatboxManage,
    quizManage: quizManage,
    eventsManage: eventsManage,
    apilogsManage: apilogsManage,
    faqs: faqs,
    widgets: widgets,
    faq: faq,
    dashboarData: dashboarData,
    eventDashboardData: eventDashboardData,
    eventchatboxData: eventchatboxData,
    userreportsManage: userreportsManage,
    instructorreportsManage: instructorreportsManage,
    reportData : reportData ,
    company_setting :company_setting,
    customScenario: customScenario,
    scenarioTabs:scenarioTabs,
    customerData: customerData,
  })(state, action);
};

export { rootPersistConfig, rootReducer };
