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
    events: [],
    systemConfigTypeData: [],
    systemConfigSubmitData : [],
    systemConfigUpdateStatusData:[],
    systemConfigUserSubmitData:[],
    systemConfigEmailUserData:[],
    userUpdateStatusData:[],
    getDefaultUpdateData : [],
    getTestEmailData:[]
};

//-----------------



const slice = createSlice({
  name: "systemConfig",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetSystemConfigTypeSucc(state, action) {
      state.isLoading = false;
      state.systemConfigTypeData = action.payload;   
    },
    hasGetSystemConfigSubmitSucc(state, action) {
      state.isLoading = false;
      state.systemConfigSubmitData = action.payload;   
    },
    hasGetSystemConfigUpdateStatusSucc(state, action) {
      state.isLoading = false;
      state.systemConfigUpdateStatusData = action.payload;   
    },
    hasGetSystemConfigUserSubmitSucc(state, action) {
      state.isLoading = false;
      state.systemConfigUserSubmitData = action.payload;   
    },
    hasGetSystemConfigEmailUserSucc(state, action) {
      state.isLoading = false;
      state.systemConfigEmailUserData = action.payload;   
    },
    hasGetUserUpdateStatusSucc(state, action) {
      state.isLoading = false;
      state.userUpdateStatusData = action.payload;   
    },
    hasGetDefaultUpdateSucc(state, action) {
      state.isLoading = false;
      state.getDefaultUpdateData = action.payload;   
    },
    hasGetTestEmailSucc(state, action) {
      state.isLoading = false;
      state.getTestEmailData = action.payload;   
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

export function getSystemConfigTypes() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.sc_types}`); 
      dispatch(slice.actions.hasGetSystemConfigTypeSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function systemConfigSubmit(id,payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.sc_submit}/${id}`,payload ); 
      dispatch(slice.actions.hasGetSystemConfigSubmitSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSystemConfigSubmit() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSystemConfigSubmitSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function systemConfigUpdateStatus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.sc_update_status}`,payload); 
      dispatch(slice.actions.hasGetSystemConfigUpdateStatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSystemConfigUpdateStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSystemConfigUpdateStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function systemConfigUserSubmit(id,payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.sc_users_submit}/${id}`,payload); 
      dispatch(slice.actions.hasGetSystemConfigUserSubmitSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSystemConfigUserSubmit() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSystemConfigUserSubmitSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSystemConfigEmailUser(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.sc_email_user}/${id}`); 
      dispatch(slice.actions.hasGetSystemConfigEmailUserSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getUserUpdateStatus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.sc_user_update_status}`,payload); 
      dispatch(slice.actions.hasGetUserUpdateStatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearUserUpdateStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUserUpdateStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getDefaultUpdate(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.sc_types_defaultupdate}`,payload); 
      dispatch(slice.actions.hasGetDefaultUpdateSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearGetDefaultUpdate() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetDefaultUpdateSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function testEmail(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.sc_testemail}`,payload); 
      dispatch(slice.actions.hasGetTestEmailSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearTestEmail() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetTestEmailSucc([]));
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
  
