import { combineReducers } from "redux";
import storage from "redux-persist/lib/storage";
import products from "./slices/product/products";
import auth from "./slices/auth/auth";
import localstorage from "./slices/localstorage/LocalStorage";
import profile from "./slices/profile/profile";
import commons from "./slices/commons/commons";
import dashboard from "./slices/dashboard/dashboard";
import loadingReducer from "./slices/loadingSlice";
import scenarios from "./slices/scenarios/scenarios"; 
import customScenario from "./slices/customScenarios/customscenarioManage"; 
import chatboxManage from "./slices/chatbox/chatboxManage";
import quiz from "./slices/scenarios/quiz";
import faqs from "./slices/faqs/faqs";
import events from "./slices/events/events";
import eventLogin from "./slices/eventLogin/eventLogin"
import eventChatboxManage from "./slices/eventchatbox/eventChatboxManage";
import noticonfigs from "./slices/noticonfigs/noticonfigs";
import customComponent from "./slices/customcomponent/customcomponentManage";

const rootPersistConfig = {
  key: "root",
  storage,
  keyPrefix: "redux-",
  whitelist: [],
};

const rootReducer = (state, action) => {
  if (action.type == 'LOGOUT') {
    state = {};
  }
  return combineReducers({
    product: products,
    authData: auth,
    localData: localstorage,
    profiledata: profile,
    commonsdata: commons,
    dashboard: dashboard,
    noticonfigs: noticonfigs,
    loading: loadingReducer,
    scenarios: scenarios,
    chatboxManage: chatboxManage,
    quiz: quiz,
    faqs: faqs,
    events: events,
    eventLogin: eventLogin,
    eventChatboxManage: eventChatboxManage,
    customScenario: customScenario,
    customComponent:customComponent

  })(state, action);
};

export { rootPersistConfig, rootReducer };
