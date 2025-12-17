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
  geteventsListData: [],
  getaddparticipants: [],
  getaddLearnerEvent: [],
  getlistparticipants: [],
  getdeleteparticipants: [],
  getupdateparticipants: [],


    getScenarioListsucc: [],
    succsaveEvent: [],
    updateEvent: [],
};

const slice = createSlice({
  name: "eventManage",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGeteventsListSucc(state, action) {
      state.isLoading = false, state.geteventsListData = action.payload;
    },
    hasaddparticipants(state, action) {
      state.isLoading = false, state.getaddparticipants = action.payload;
    },
    hasaddLearnerEvent(state, action) {
      state.isLoading = false, state.getaddLearnerEvent = action.payload;
    },
    hasGetparticipantListSucc(state, action) {
      state.isLoading = false;
      state.getlistparticipants = action.payload.data || [];
    },
    hasDeleteLearnerEvent(state, action) {
      state.isLoading = false;
      state.getdeleteparticipants = action.payload;
    },
    hasupdateLearnerEvent(state, action) {
      state.isLoading = false;
      state.getupdateparticipants = action.payload;
    },
    hasSaveeventsSucc(state,action){
          state.isLoading = false,
          state.succsaveEvent= action.payload;
        },
        hasUpdateeventsSucc(state,action){
          state.isLoading = false,
          state.updateEvent= action.payload;
        },
    
            hasscenariolist(state,action){
          state.isLoading = false,
          state.getScenarioListsucc = action.payload;
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

export function geteventList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.event_getAll}`);
      dispatch(slice.actions.hasGeteventsListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// get participant list
export function getparticipantList(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.event_listparticipant}/${id}`);
      dispatch(slice.actions.hasGetparticipantListSucc(response.data));
    
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteLearnerFromEvent(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.event_removeLearnerFromEvent}`,payload);
        dispatch(slice.actions.hasDeleteLearnerEvent(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearDeleteLearnerFromEvent() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasDeleteLearnerEvent([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 


export function cleargeteventList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGeteventsListSucc([]));
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

// --------------- add participant--------------

export function addparticipant(payload) {
  return async (dispatch) => {
    try {
      const response = await axios.post(
        `${api.event_addparticipants}`,
        payload
      );
     
      dispatch(slice.actions.hasaddparticipants(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function addeventlearner(payload) {
  return async (dispatch) => {
    try {
      const response = await axios.post(
        `${api.event_addLearnerEvent}`,
        payload
      );
      
      dispatch(slice.actions.hasaddLearnerEvent(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateeventlearner(payload) {

  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.event_updateLearnerFromEvent}`,payload);
    
      dispatch(slice.actions.hasupdateLearnerEvent(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearupdateeventlearner() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasupdateLearnerEvent([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearaddeventlearner() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasaddLearnerEvent([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearaddparticipant() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasaddparticipants([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


 export function saveEvent(payload) {

  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.event_save}`,payload);
      dispatch(slice.actions.hasSaveeventsSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearsaveEvent() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasSaveeventsSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateEvent(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.event_update}`, payload); // ✅ add payload
      dispatch(slice.actions.hasUpdateeventsSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearupdateEvent() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasUpdateeventsSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getScenarioList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.event_scenario}`);
      
      dispatch(slice.actions.hasscenariolist(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearscenario() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasscenariolist([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
