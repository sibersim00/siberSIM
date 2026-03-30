import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
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
  saveSnapshot: [],
  getSnapshot: [],
  deleteSnapshot: [],
  pausescenarioData: [],
  saveComponent: [],
  resumescenarioData: [],
  getresume: [],
  hasgetqemuconfig: [],
  stopVmResponse: [],
  getrestoresnapshot: [],
  getVMdetail: [],
  saveCustomComponent: [],
  rejectStopVm: [],
  addNetwork: [],
  modifyNetwork: [],
  deleteNetwork: [],
  saveDraggedComponentData: [],
  deleteDraggedComponentData: [],
  modifyNetworkIdData: [],
  plugNetworkPort: [],
  unplugNetworkPort: [],
  connectNetworkPort: [],
  disconnectNetworkPort: [],
  modifyEditStatus: [],
  changeReleaseEditLock: [],
  learnerlistbyinstructor: [],
  getLearnersByVmRequestData: [],
  deleteInviteLearnerController: [],
  getsaveInviteLearners:[],
  gethasdeletebridge:[],

};

const slice = createSlice({
  name: "scenarios",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetScenariosListData(state, action) {
      ((state.isLoading = false),
        (state.getScenariosListData = action.payload));
    },
    hasGetScenariospauseListData(state, action) {
      ((state.isLoading = false),
        (state.getScenariospauseListData = action.payload));
    },

    hasGetSingleScenariosSucc(state, action) {
      ((state.isLoading = false), (state.singleScenarios = action.payload));
    },

    hasGetSaveScenariosSucc(state, action) {
      ((state.isLoading = false), (state.saveScenarios = action.payload));
    },
    hasGetSaveComponentSucc(state, action) {
      state.isLoading = false;
      state.saveComponent = action.payload; // will now contain proper json
    },

    hasGetGetChatMessagesSucc(state, action) {
      ((state.isLoading = false),
        (state.getChatMessagesListData = action.payload));
    },
    hasGetvmRestartScenario(state, action) {
      ((state.isLoading = false),
        (state.getvmRestartScenario = action.payload));
    },

    hasGetSaveChatMessageSucc(state, action) {
      ((state.isLoading = false), (state.saveChatMessage = action.payload));
    },

    hasGetChatMessageSeenSucc(state, action) {
      ((state.isLoading = false), (state.saveChatMessageSeen = action.payload));
    },
    hasGetUpdateSessionStatusSucc(state, action) {
      ((state.isLoading = false), (state.updateSessionStatus = action.payload));
    },
    hasGetSessionStatusListData(state, action) {
      ((state.isLoading = false),
        (state.getSessionStatusListData = action.payload));
    },
    hasGetConfigurationsSucc(state, action) {
      ((state.isLoading = false),
        (state.getConfigurationsData = action.payload));
    },
    hasGetvmStartScenario(state, action) {
      ((state.isLoading = false), (state.getvmStartScenario = action.payload));
    },
    hasUpdateCompletedTerminatedSucc(state, action) {
      ((state.isLoading = false),
        (state.updateCompletedTerminatedData = action.payload));
    },
    hasdeletescenarioSucc(state, action) {
      ((state.isLoading = false),
        (state.hasdeletescenarioSuccData = action.payload));
    },
    haspausescenarioSucc(state, action) {
      ((state.isLoading = false), (state.pausescenarioData = action.payload));
    },
    hasresumescenarioSucc(state, action) {
      ((state.isLoading = false), (state.resumescenarioData = action.payload));
    },
    hasGetLogsListData(state, action) {
      ((state.isLoading = false), (state.getLogsData = action.payload));
    },
    hasGetTabListData(state, action) {
      ((state.isLoading = false), (state.getTabListData = action.payload));
    },
    hasGetToken(state, action) {
      ((state.isLoading = false), (state.getToken = action.payload));
    },
    hasGetSaveSnapshot(state, action) {
      ((state.isLoading = false), (state.saveSnapshot = action.payload));
    },
    hasGetSnapshot(state, action) {
      ((state.isLoading = false), (state.getSnapshot = action.payload));
    },
    hasGetresume(state, action) {
      ((state.isLoading = false), (state.getresume = action.payload));
    },
    hasDeleteSnapshot(state, action) {
      ((state.isLoading = false), (state.deleteSnapshot = action.payload));
    },
    hasqemuconfig(state, action) {
      ((state.isLoading = false), (state.hasgetqemuconfig = action.payload));
    },
    hasStopVm(state, action) {
      state.isLoading = false;
      state.stopVmResponse = action.payload;
    },
    hasGetrestoresnapshot(state, action) {
      ((state.isLoading = false), (state.getrestoresnapshot = action.payload));
    },
    hasGetSingleVMDetailSucc(state, action) {
      ((state.isLoading = false), (state.getVMdetail = action.payload));
    },
    hasGetSaveCustomComponentSucc(state, action) {
      ((state.isLoading = false), (state.saveCustomComponent = action.payload));
    },
    hasGetRejectStopVm(state, action) {
      ((state.isLoading = false), (state.rejectStopVm = action.payload));
    },

    hasGetAddNetworkSucc(state, action) {
      ((state.isLoading = false), (state.addNetwork = action.payload));
    },
    hasGetModifyNetworkSucc(state, action) {
      ((state.isLoading = false), (state.modifyNetwork = action.payload));
    },
    hasGetDeleteNetworkSucc(state, action) {
      ((state.isLoading = false), (state.deleteNetwork = action.payload));
    },
    saveDroppedComponentSuccess(state, action) {
      state.isLoading = false;
      state.saveDraggedComponentData = action.payload;
    },
    deleteDroppedComponentSuccess(state, action) {
      state.isLoading = false;
      state.deleteDraggedComponentData = action.payload;
    },
    modifyNetworkIdSuccess(state, action) {
      state.isLoading = false;
      state.modifyNetworkIdData = action.payload;
    },
    plugNetworkPortSucc(state, action) {
      state.isLoading = false;
      state.plugNetworkPort = action.payload;
    },
    unplugNetworkPortSucc(state, action) {
      state.isLoading = false;
      state.unplugNetworkPort = action.payload;
    },
    connectNetworkPortSucc(state, action) {
      state.isLoading = false;
      state.connectNetworkPort = action.payload;
    },
    disconnectNetworkPortSucc(state, action) {
      state.isLoading = false;
      state.disconnectNetworkPort = action.payload;
    },
    hasmodifyEditStatus(state, action) {
      state.isLoading = false;
      state.modifyEditStatus = action.payload;
    },
    haschangeReleaseEditLock(state, action) {
      state.isLoading = false;
      state.changeReleaseEditLock = action.payload;
    },
    hasGetlearnerlistbyinstructorData(state, action) {
      ((state.isLoading = false),
        (state.learnerlistbyinstructor = action.payload));
    },
    hasGetLearnersByVmRequestDataData(state, action) {
      ((state.isLoading = false),
        (state.getLearnersByVmRequestData = action.payload));
    },
    hasdeleteInviteLearnerControllerData(state, action) {
      ((state.isLoading = false),
        (state.deleteInviteLearnerController = action.payload));
    },
     hasGetsaveInviteLearnersData(state, action) {
      ((state.isLoading = false),
        (state.getsaveInviteLearners = action.payload));
    },
     hasdeletebridge(state, action) {
      ((state.isLoading = false),
        (state.gethasdeletebridge = action.payload));
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
      const response = await axios.post(`${api.get_configurations}`, payload);
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
      const response = await axios.post(
        `${api.update_completed_terminated}`,
        payload,
      );
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
export function clearpausescenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.haspausescenarioSucc([]));
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

export function clearresumescenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasdeletescenarioSucc([]));
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

export function saveScenarios(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenarios_save}`, payload);
      dispatch(slice.actions.hasGetSaveScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

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
      const response = await axios.post(
        `${api.scenario_status_update}`,
        payload,
      );
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
  console.log("-----------------------------------------");
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chat_save}`, payload);
      dispatch(slice.actions.hasGetSaveChatMessageSucc(response.data));

      console.log("response", response);
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
export function canresumescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.can_resume}`, payload);
      dispatch(slice.actions.hasGetresume(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearcanresumescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetresume([]));
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
export function qemuconfig(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.vm_config}`, payload);
      dispatch(slice.actions.hasqemuconfig(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      return null;
    }
  };
}

export function clearqemuconfig() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasqemuconfig([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// export function stopVm(payload) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//       const response = await axios.post(`${api.stop_vm}`, payload);
//       dispatch(slice.actions.hasStopVm(response.data));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }

export function stopVm(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.stop_vm}`, payload);

      dispatch(slice.actions.hasStopVm(response.data));

      // ✅ IMPORTANT: return response
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));

      // ✅ Return error response so UI can handle it
      return error?.response?.data || { statusCode: 500 };
    }
  };
}

export function clearStopVm() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasStopVm([]));
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

// export function saveCustomComponent(payload) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//       const response = await axios.post(`${api.save_vmDetails}`, payload);
//       console.log("responseeeeeeeeeeeeeeeeeeeeeeeeeerrrrrrrrrrrrreee", response)
//       dispatch(slice.actions.hasGetSaveCustomComponentSucc(response.data));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }

export function saveCustomComponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.save_vmDetails, payload);

      dispatch(slice.actions.hasGetSaveCustomComponentSucc(response.data));

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const errData = error?.response?.data || {
        message: error.message,
      };

      dispatch(slice.actions.hasError(errData));

      return {
        success: false,
        error: errData,
      };
    }
  };
}
export function saveComponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        api.custom_component_save_learner,
        payload,
      );

      dispatch(slice.actions.hasGetSaveComponentSucc(response.data));

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const errData = error?.response?.data || {
        message: error.message,
      };

      dispatch(slice.actions.hasError(errData));

      return {
        success: false,
        error: errData,
      };
    }
  };
}
export function clearSaveComponent() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveComponentSucc([]));
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
export function rejectStoppedVm(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.reject_stopped_vm, payload);
      dispatch(slice.actions.hasGetRejectStopVm(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function addNetworkPort(payload) {
  console.log("-----------------------------------------");
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.add_network}`, payload);
      dispatch(slice.actions.hasGetAddNetworkSucc(response.data));

      console.log("response", response);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSaveNetworkPort() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetAddNetworkSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function modifyNetworkPort(payload) {
  console.log("-----------------------------------------");
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.modify_network}`, payload);
      dispatch(slice.actions.hasGetModifyNetworkSucc(response.data));

      console.log("response", response);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearModifyNetworkPort() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetModifyNetworkSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function deleteNetworkPort(payload) {
  console.log("-----------------------------------------");
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.delete_network}`, payload);
      dispatch(slice.actions.hasGetDeleteNetworkSucc(response.data));

      console.log("response", response);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDeleteNetworkPort() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetDeleteNetworkSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function saveDraggedComponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.save_dropped_component, payload);
      dispatch(slice.actions.saveDroppedComponentSuccess(response.data));
      // return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearDraggedComponent() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.saveDroppedComponentSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function deleteDraggedComponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.delete_dropped_component, payload);
      dispatch(slice.actions.deleteDroppedComponentSuccess(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearDeleteDraggedComponent() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.deleteDroppedComponentSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function modifyNetworkId(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.modify_networkId, payload);
      dispatch(slice.actions.modifyNetworkIdSuccess(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearModifyNetworkId() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.modifyNetworkIdSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function plugNetworkPort(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.plug_networPort, payload);
      console.log("rrrrrrrrrrrrrrrrrrrrrr", response);
      dispatch(slice.actions.plugNetworkPortSucc(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearPlugNetworkPort() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.plugNetworkPortSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function unplugNetworkPort(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.unplug_networkPort, payload);
      dispatch(slice.actions.unplugNetworkPortSucc(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearUnplugNetworkPort() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.unplugNetworkPortSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function connectNetworkPort(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.connect_networkPort, payload);
      dispatch(slice.actions.connectNetworkPortSucc(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearConnectNetworkPort() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.connectNetworkPortSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function disconnectNetworkPort(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.disconnect_networkPort, payload);
      dispatch(slice.actions.disconnectNetworkPortSucc(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearDisconnectNetworkPort() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.disconnectNetworkPortSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function changeEditStatus(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.change_edit_status, payload);
      dispatch(slice.actions.hasmodifyEditStatus(response.data));
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        const msg =
          error.response?.data?.message || "Someone is already editing";
        return Promise.reject("LOCKED");
      }
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearchangeEditStatus() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasmodifyEditStatus([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function changeReleaseEditLock(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.release_edit_lock, payload);
      dispatch(slice.actions.haschangeReleaseEditLock(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function clearchangeReleaseEditLock() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.haschangeReleaseEditLock([]));
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

export function Learnerlistbyinstructor(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.post_Learnerlistbyinstructor}`,
        payload,
      );
      dispatch(slice.actions.hasGetlearnerlistbyinstructorData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearLearnerlistbyinstructor() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetlearnerlistbyinstructorData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getLearnersByVmRequest(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.learnersByVmRequest}`, payload);
      dispatch(slice.actions.hasGetLearnersByVmRequestDataData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleargetLearnersByVmRequest() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetLearnersByVmRequestDataData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveInviteLearners(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.save_Invite_Learners}`, payload);
      dispatch(slice.actions.hasGetsaveInviteLearnersData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearDeleteInviteLearnerController() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasdeleteInviteLearnerControllerData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function DeleteInviteLearnerController(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.deleteInviteLearner}`, payload);
      dispatch(
        slice.actions.hasdeleteInviteLearnerControllerData(response.data),
      );
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function deletebridge(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.delete_bridge}`, payload);
      console.log("responseresponseresponseresponse",response);
      dispatch(slice.actions.hasdeletebridge(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
