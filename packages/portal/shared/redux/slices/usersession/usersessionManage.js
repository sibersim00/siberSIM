import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
//
import { dispatch } from "../../store";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getUserSessionListData: [],
  getChatMessagesListData: [],
  saveChatMessage: [],
  saveChatMessageSeen: [],
  viewNameResp: "card",
  saveTermination: [],
  sendNotification: [],
  sendTermination: [],
  singleUserSession: [],
  getvmStartScenario: [],
  getSnapshot: [],
  getvmRestartScenario: [],
  getLogsData: [],
  hasdeletescenarioSuccData: [],
};

const slice = createSlice({
  name: "Scenario",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetUserSessionListSucc(state, action) {
      (state.isLoading = false),
        (state.getUserSessionListData = action.payload);
    },
    hasHandleMAnageSuc(state, action) {
      console.log("action.payloadaction.payload", action.payload);
      (state.isLoading = false), (state.viewNameResp = action.payload);
    },

    hasGetGetChatMessagesSucc(state, action) {
      (state.isLoading = false),
        (state.getChatMessagesListData = action.payload);
    },
    hasGetvmStartScenario(state, action) {
      (state.isLoading = false), (state.getvmStartScenario = action.payload);
    },
    hasGetvmRestartScenario(state, action) {
      (state.isLoading = false), (state.getvmRestartScenario = action.payload);
    },

    hasGetSaveChatMessageSucc(state, action) {
      (state.isLoading = false), (state.saveChatMessage = action.payload);
    },

    hasGetChatMessageSeenSucc(state, action) {
      (state.isLoading = false), (state.saveChatMessageSeen = action.payload);
    },

    hasGetTerminationSucc(state, action) {
      (state.isLoading = false), (state.saveTermination = action.payload);
    },
    hasSendNotificationSucc(state, action) {
      (state.isLoading = false), (state.sendNotification = action.payload);
    },
    hasGetTerminationByAdInstSucc(state, action) {
      (state.isLoading = false), (state.sendTermination = action.payload);
    },

    hasGetSingleUserSessionSucc(state, action) {
      (state.isLoading = false), (state.singleUserSession = action.payload);
    },
    hasGetSnapshot(state, action) {
      (state.isLoading = false), (state.getSnapshot = action.payload);
    },
    hasdeletescenarioSucc(state, action) {
      state.isLoading = false,
        state.hasdeletescenarioSuccData = action.payload;
    },
    hasGetLogsListData(state, action) {
      (state.isLoading = false), (state.getLogsData = action.payload);
    },

    //HAS ERROR
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

// Chatbox APIS

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

export function getSingleUserSession(id) {
  console.log("idididididididididididididididididididid",id);
  
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.usersession_getbyId}/${id}`);
      console.log("responseresponserespocccccccccccnseresponse",response);
      
      dispatch(slice.actions.hasGetSingleUserSessionSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSingleUserSession() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleUserSessionSucc([]));
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
// export function terminateScenario(payload) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//       const response = await axios.post(`${api.termination_save}`, payload);
//       console.log("response",response)
//       dispatch(slice.actions.hasGetTerminationSucc(response.data));

//       console.log("response", response)
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }

// export function clearTerminateScenario() {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//       dispatch(slice.actions.hasGetTerminationSucc([]));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }

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

// ----------------------------------------------------------------------
export function getUserSessionList() {
  console.log("notification_sendnotification_send");
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.usersession_list}`);
      dispatch(slice.actions.hasGetUserSessionListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearGetUserSessionList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUserSessionListSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSingleScenarios(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_single}/${id}`);
      dispatch(slice.actions.hasGetSingleScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function sentNotification(payload) {
  console.log("notification_send77777777777777777");
  return async (dispatch) => {
    // Corrected here
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.notification_send, payload);
      dispatch(slice.actions.hasSendNotificationSucc(response.data));
      console.log("Response from sendNotification:", response.data); // Log response data
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      console.error("Error sending notification:", error); // Log any errors
    }
  };
}

export function clearSentNotification() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasSendNotificationSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function terminateScenario(payload) {
  console.log(
    "++++++++++++++++++++++++++++++++=======+++++++++++++++++++++",
    payload
  );
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.termination_send}`, payload);
      console.log("response", response);
      dispatch(slice.actions.hasGetTerminationSucc(response.data));

      console.log("response", response);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearTerminateScenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetTerminationSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function terminateScenarioByAdInst(payload) {
  console.log(
    "++++++++++++++++++++++++++++++++=======+++++++++++++++++++++",
    payload
  );
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.terminated}`, payload);
      console.log("response", response);
      dispatch(slice.actions.hasGetTerminationByAdInstSucc(response.data));

      console.log("response", response);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearTerminateScenarioByAdInst() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetTerminationByAdInstSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSingleScenarios() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// start restart
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

export function clearHasError() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasError([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function handleManageView(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasHandleMAnageSuc(payload));
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
export function deletescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.terminate_scenario}`, payload);
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

//----------------------------------------------------------------------
