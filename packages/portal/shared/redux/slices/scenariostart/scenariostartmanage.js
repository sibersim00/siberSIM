import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import api from "../../api_urls";


// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getScenariosListData: [],
  getScenariospauseListData: [],
  singleScenarios: [],
  saveScenarios: [],
  getChatMessagesListData: [],
  saveChatMessage: [],
  saveChatMessageSeen: [],
  updateSessionStatus: [],
  getSessionStatusListData: [],
  getConfigurationsData: [],
  updateCompletedTerminatedData: [],
  getLogsData: [],
  getTabListData: [],
  getToken: [],
  getvmStartScenario: [],
  getvmRestartScenario: [],
  hasdeletescenarioSuccData: [],
  getVncProxyConsole: [],
  saveSnapshot: [],
  getSnapshot: [],
  deleteSnapshot: [],
  pausescenarioData: [],
  resumescenarioData: [],
  getrestoresnapshot: [],
  getVMdetail: [],
  saveCustomComponent: [],
};



const slice = createSlice({
  name: "scenariostart",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetScenariosListData(state, action) {
      state.isLoading = false,
        state.getScenariosListData = action.payload;
    },
    hasGetScenariospauseListData(state, action) {
      state.isLoading = false,
        state.getScenariospauseListData = action.payload;
    },

    hasGetSingleScenariosSucc(state, action) {
      state.isLoading = false,
        state.singleScenarios = action.payload;
    },

    hasGetSaveScenariosSucc(state, action) {
      state.isLoading = false,
        state.saveScenarios = action.payload;

    },

    hasGetGetChatMessagesSucc(state, action) {
      state.isLoading = false,
        state.getChatMessagesListData = action.payload;

    },
    hasGetvmRestartScenario(state, action) {
      state.isLoading = false,
        state.getvmRestartScenario = action.payload;

    },

    hasGetSaveChatMessageSucc(state, action) {
      state.isLoading = false,
        state.saveChatMessage = action.payload;

    },

    hasGetChatMessageSeenSucc(state, action) {
      state.isLoading = false,
        state.saveChatMessageSeen = action.payload;

    },
    hasGetUpdateSessionStatusSucc(state, action) {
      state.isLoading = false,
        state.updateSessionStatus = action.payload;

    },
    hasGetSessionStatusListData(state, action) {
      state.isLoading = false,
        state.getSessionStatusListData = action.payload;

    },
    hasGetConfigurationsSucc(state, action) {
      state.isLoading = false,
        state.getConfigurationsData = action.payload;

    },
    hasGetvmStartScenario(state, action) {
      state.isLoading = false,
        state.getvmStartScenario = action.payload;

    },
    hasUpdateCompletedTerminatedSucc(state, action) {
      state.isLoading = false,
        state.updateCompletedTerminatedData = action.payload;
    },
    hasdeletescenarioSucc(state, action) {
      state.isLoading = false,
        state.hasdeletescenarioSuccData = action.payload;
    },
    haspausescenarioSucc(state, action) {
      state.isLoading = false,
        state.pausescenarioData = action.payload;
    },
    hasresumescenarioSucc(state, action) {
      state.isLoading = false,
        state.resumescenarioData = action.payload;
    },
    hasGetLogsListData(state, action) {
      state.isLoading = false,
        state.getLogsData = action.payload;
    },
    hasGetTabListData(state, action) {
      state.isLoading = false,
        state.getTabListData = action.payload;
    },
    hasGetToken(state, action) {
      state.isLoading = false,
        state.getToken = action.payload;
    },
    hasGetVncProxyConsole(state, action) {
      state.isLoading = false,
        state.getVncProxyConsole = action.payload;
    },

    hasGetSaveSnapshot(state, action) {
      state.isLoading = false,
        state.saveSnapshot = action.payload;
    },
    hasGetSnapshot(state, action) {
      state.isLoading = false,
        state.getSnapshot = action.payload;
    },
    hasDeleteSnapshot(state, action) {
      state.isLoading = false,
        state.deleteSnapshot = action.payload;
    },
    hasGetrestoresnapshot(state, action) {
      state.isLoading = false,
        state.getrestoresnapshot = action.payload;
    },
    hasGetSingleVMDetailSucc(state, action) {
      state.isLoading = false,
        state.getVMdetail = action.payload;
    },
    hasGetSaveCustomComponentSucc(state, action) {
      state.isLoading = false,
        state.saveCustomComponent.data = action.payload;

    },
    // HAS ERROR
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});




// Reducer
export default slice.reducer;
// Actions
export const { openModal, closeModal, selectEvent } = slice.actions;

// ----------------------------------------------------------------------


export function getScenariosList() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.scenarios_get}`);
      dispatch(slice.actions.hasGetScenariosListData(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getScenariosPauseList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenarios_get_Pause}`);
      dispatch(slice.actions.hasGetScenariospauseListData(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getSingleScenarios(id) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenarios_single}/${id}`);
      dispatch(slice.actions.hasGetSingleScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}



export function getConfigurations(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.admin_start_scenario}`, payload);
      dispatch(slice.actions.hasGetConfigurationsSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function vmStartScenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.vm_start_scenario}`, payload);
      dispatch(slice.actions.hasGetvmStartScenario(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearvmStartScenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetvmStartScenario([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function vmRestartScenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.vm_restart_scenario}`, payload);
      dispatch(slice.actions.hasGetvmRestartScenario(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearvmRestartScenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetvmRestartScenario([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearGetConfigurations() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetConfigurationsSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function updateCompletedTerminated(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.update_completed_terminated}`, payload);
      dispatch(slice.actions.hasUpdateCompletedTerminatedSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function deletescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.delete_scenario}`, payload);
      dispatch(slice.actions.hasdeletescenarioSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function cleardeletescenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasdeletescenarioSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function pausescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.pause_scenario}`, payload);
      dispatch(slice.actions.haspausescenarioSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function resumescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.resume_scenario}`, payload);
      dispatch(slice.actions.hasresumescenarioSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearUpdateCompletedTerminated() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasUpdateCompletedTerminatedSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSingleScenarios() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}



// export function saveScenarios(payload) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//       const response = await axios.post(`${api.scenarios_save}`, payload);
//       dispatch(slice.actions.hasGetSaveScenariosSucc(response.data));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }

// export function updateSessionStatus(payload) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//       const response = await axios.post(`${api.scenario_status_update}`, payload);
//       dispatch(slice.actions.hasGetUpdateSessionStatusSucc(response.data));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }
export function updateSessionStatus(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_status_update}`, payload);
      dispatch(slice.actions.hasGetUpdateSessionStatusSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function getSessionStatusList(id) {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.get_session_status}/${id}`);
      dispatch(slice.actions.hasGetSessionStatusListData(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearGetSessionStatusList() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSessionStatusListData([]));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearSaveScenarios() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getChatMessages(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chatmessage_get}`, payload);
      dispatch(slice.actions.hasGetGetChatMessagesSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearGetChatMessages() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetGetChatMessagesSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveChatMessage(payload) {
  console.log("-----------------------------------------")
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chat_save}`, payload);
      dispatch(slice.actions.hasGetSaveChatMessageSucc(response.data));

      console.log("response", response)
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveChatMessage() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveChatMessageSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function chatMessageSeen(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chat_markseen}`, payload);
      dispatch(slice.actions.hasGetChatMessageSeenSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearchatMessageSeen() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetChatMessageSeenSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getLogs(payload) {
  console.log("getLogsgetLogsgetLogsgetLogsgetLogs");
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.post(`${api.get_logs}`, payload);

      dispatch(slice.actions.hasGetLogsListData(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getTabList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.tab_status}`);
      dispatch(slice.actions.hasGetTabListData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearTabList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetTabListData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getAccessToken() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.post(`${api.generate_access_token}`);

      dispatch(slice.actions.hasGetToken(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleargetAccessToken() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetToken([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function vncProxyConsole(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.post(`${api.vnc_proxy_console}`, payload);

      dispatch(slice.actions.hasGetVncProxyConsole(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveSnapshot(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.save_snapshot}`, payload);
      dispatch(slice.actions.hasGetSaveSnapshot(response.data));

      return response.data; // success response
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}



export function clearSaveSnapshot() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveSnapshot([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSnapshot(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.get_snapshot}`, payload);
      dispatch(slice.actions.hasGetSnapshot(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearGetSnapshot() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSnapshot([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// export function deleteSnapshot(payload) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//       const response = await axios.delete(`${api.delete_snapshot}`, payload);
//       dispatch(slice.actions.hasDeleteSnapshot(response.data));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }

export function deleteSnapshot(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.delete(api.delete_snapshot, {
        data: payload,
      });
      dispatch(slice.actions.hasDeleteSnapshot(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function cleardeleteSnapshot() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasDeleteSnapshot([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function restoresnapshot(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.restore_snapshot}`, payload);
      dispatch(slice.actions.hasGetrestoresnapshot(response.data));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      return {
        success: false,
        error: error?.response?.data || error,
      };
    }
  };
}

export function getSingleVMDetail(id) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.get_details}/${id}`);
      dispatch(slice.actions.hasGetSingleVMDetailSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveCustomComponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.save_vmDetails}`, payload);
      console.log("response", response)
      dispatch(slice.actions.hasGetSaveCustomComponentSucc(response.data.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearCustomComponent() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveCustomComponentSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function startScenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenarios_save_start}`, payload);
      dispatch(slice.actions.hasGetSaveScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearHasError() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasError([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}