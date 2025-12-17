import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
//
import { dispatch } from "../../store";
import api from "../../api_urls";

//-------------------

const initialState = {
    isLoading: false,
    error: null,
    emailconfigsData: [],
    activityData: [],
    workFlowResp: [],
    senderListResp: [],
    saveWorkFlowData: [],
    testMailResp: [],
};

const slice = createSlice({
  name: "mailOverViewResp",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasgetEmailConfigsSucc(state, action) {
      state.isLoading = false;
      state.emailconfigsData = action.payload;   
    },
    hasGetActivityListSucc(state, action) {
      state.isLoading = false;
      state.activityData = action.payload;   
    },
    hasGetActivityActionWorkFlowSucc(state, action) {
      state.isLoading = false;
      state.workFlowResp = action.payload;   
    },
    hasSenderListSucc(state, action) {
      state.isLoading = false;
      state.senderListResp = action.payload;   
    },
    hasSaveWorkFlowSucc(state, action) {
      state.isLoading = false;
      state.saveWorkFlowData = action.payload;   
    },
    hasSendTesmailSucc(state, action) {
      state.isLoading = false;
      state.testMailResp = action.payload;   
    },
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

export function getEmailConfigsForOverview() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.masters_getemail_configs); 
      dispatch(slice.actions.hasgetEmailConfigsSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getActivityList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.masters_get_activities); 
      dispatch(slice.actions.hasGetActivityListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getActivityActionWorkFlow(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.masters_get_activity_actions}/${id}`); 
      dispatch(slice.actions.hasGetActivityActionWorkFlowSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSenderList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.masters_get_email_senders); 
      dispatch(slice.actions.hasSenderListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function saveWorkFlow(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.workflows_save, data); 
      dispatch(slice.actions.hasSaveWorkFlowSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function ClearSaveWorkFlow() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasSaveWorkFlowSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

export function sendTestEmail(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.templates_test_email, data); 
      dispatch(slice.actions.hasSendTesmailSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function ClearSendTestEmail() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasSendTesmailSucc([]));
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
  
