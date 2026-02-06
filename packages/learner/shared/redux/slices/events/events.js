import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getScenariosListData: [],
  getEventListData: [],
  saveEvents: [],
  getChatMessagesListData: [],
  saveChatMessage: [],
  saveChatMessageSeen: [],
  updateSessionStatus: [],
  getSessionStatusListData: [],
  getConfigurationsData: [],
  getresume: [],
   pausescenarioData: [],
  resumescenarioData: [],
  updateCompletedTerminatedData: [],
  getLogsData: [],
  getToken: [],
  hasdeletescenarioSuccData: [],
  eventRestart: [],
};

const slice = createSlice({
  name: "events",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetScenariosListData(state, action) {
      (state.isLoading = false), (state.getScenariosListData = action.payload);
    },

    hasGetEventSucc(state, action) {
      (state.isLoading = false), (state.getEventListData = action.payload);
    },

    hasGetSaveScenariosSucc(state, action) {
      (state.isLoading = false), (state.saveEvents = action.payload);
    },
    hasGetresume(state, action) {
      state.isLoading = false,
        state.getresume = action.payload;
    },
     haspausescenarioSucc(state, action) {
      state.isLoading = false,
        state.pausescenarioData = action.payload;
    },
    hasresumescenarioSucc(state, action) {
      state.isLoading = false,
        state.resumescenarioData = action.payload;
    },

    hasGetGetChatMessagesSucc(state, action) {
      (state.isLoading = false),
        (state.getChatMessagesListData = action.payload);
    },

    hasGetSaveChatMessageSucc(state, action) {
      (state.isLoading = false), (state.saveChatMessage = action.payload);
    },
    hasGetEventRestartSucc(state, action) {
      (state.isLoading = false), (state.eventRestart = action.payload);
    },

    hasGetChatMessageSeenSucc(state, action) {
      (state.isLoading = false), (state.saveChatMessageSeen = action.payload);
    },
    hasGetUpdateSessionStatusSucc(state, action) {
      (state.isLoading = false), (state.updateSessionStatus = action.payload);
    },
    hasdeletescenarioSucc(state, action) {
      state.isLoading = false,
        state.hasdeletescenarioSuccData = action.payload;
    },
    hasGetSessionStatusListData(state, action) {
      (state.isLoading = false),
        (state.getSessionStatusListData = action.payload);
    },
    hasGetConfigurationsSucc(state, action) {
      (state.isLoading = false), (state.getConfigurationsData = action.payload);
    },
    hasUpdateCompletedTerminatedSucc(state, action) {
      (state.isLoading = false),
        (state.updateCompletedTerminatedData = action.payload);
    },

    hasGetLogsListData(state, action) {
      (state.isLoading = false), (state.getLogsData = action.payload);
    },
    hasGetToken(state, action) {
      (state.isLoading = false), (state.getToken = action.payload);
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;

export function getEventList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.events_get}`);
      console.log("responseresponseresponse",response);
      
      dispatch(slice.actions.hasGetEventSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getEventsConfigurations(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.get_event_configurations}`,
        payload
      );
      dispatch(slice.actions.hasGetConfigurationsSucc(response.data));
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
        `${api.update_completed_event}`,
        payload
      );
      dispatch(slice.actions.hasUpdateCompletedTerminatedSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearEvent() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetEventSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveEvents(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.events_update}`, payload);
      dispatch(slice.actions.hasGetSaveScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function eventRestart(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.event_restart}`, payload);
      dispatch(slice.actions.hasGetEventRestartSucc(response ? response.data : null));
    } catch (error) {
      dispatch(slice.actions.hasGetEventRestartSucc(error));
      // dispatch(slice.actions.hasError(error));
    }
  };
}
export function canresumescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.event_can_resume}`, payload);
      dispatch(slice.actions.hasGetresume(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearEventRestart() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetEventRestartSucc([]));
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

export function updateSessionStatus(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.event_status_update}`, payload);
      dispatch(slice.actions.hasGetUpdateSessionStatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSessionStatusList(id) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.get_event_status}/${id}`);
      dispatch(slice.actions.hasGetSessionStatusListData(response.data));
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
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chat_save}`, payload);
      dispatch(slice.actions.hasGetSaveChatMessageSucc(response.data));
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
      const response = await axios.post(`${api.event_get_logs}`, payload);

      dispatch(slice.actions.hasGetLogsListData(response.data));
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

//Pause and resume

export function pausescenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.event_pause}`, payload);
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
      const response = await axios.post(`${api.event_resume}`, payload);
      dispatch(slice.actions.hasresumescenarioSucc(response.data));
      return response.data;
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
