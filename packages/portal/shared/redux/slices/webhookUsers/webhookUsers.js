import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getWebhookUsersData: [],
  registerWebhookUserResp: [],
  updateWebhookUserResp: [],
  statusChangeWebhookUser: [],
  deleteWebhookUserResp: [],
};

const slice = createSlice({
  name: "WebhookUserData",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetWebhookUsersListSucc(state, action) {
      state.isLoading = false;
      state.getWebhookUsersData = action.payload;
    },
    hasRegisterWebhookUserSucc(state, action) {
      state.isLoading = false;
      state.registerWebhookUserResp = action.payload;
    },
    hasUpdateWebhookUserSucc(state, action) {
      state.isLoading = false;
      state.updateWebhookUserResp = action.payload;
    },
    hasWebhookUserStatusSucc(state, action) {
      state.isLoading = false;
      state.statusChangeWebhookUser = action.payload;
    },
    hasDeleteWebhookUserSucc(state, action) {
      state.isLoading = false;
      state.deleteWebhookUserResp = action.payload;
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

// ----------------------------------------------------------------------

export function getWebhookUsers() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.webhook_users_get);
      dispatch(slice.actions.hasGetWebhookUsersListSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function addWebhookUser(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.webhook_users_save, payload);
      dispatch(slice.actions.hasRegisterWebhookUserSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function clearAddWebhookUser() {
  return async () => {
    dispatch(slice.actions.hasRegisterWebhookUserSucc([]));
  };
}

export function updateWebhookUser(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.webhook_users_update, payload);
      dispatch(slice.actions.hasUpdateWebhookUserSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function clearUpdateWebhookUser() {
  return async () => {
    dispatch(slice.actions.hasUpdateWebhookUserSucc([]));
  };
}

export function changeWebhookUserStatus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        api?.webhook_users_change_status,
        payload,
      );
      dispatch(slice.actions.hasWebhookUserStatusSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function clearChangeWebhookUserStatus() {
  return async () => {
    dispatch(slice.actions.hasWebhookUserStatusSucc([]));
  };
}

export function deleteWebhookUser(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.webhook_users_delete, payload);
      dispatch(slice.actions.hasDeleteWebhookUserSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function clearDeleteWebhookUser() {
  return async () => {
    dispatch(slice.actions.hasDeleteWebhookUserSucc([]));
  };
}

export function clearHasError() {
  return async () => {
    dispatch(slice.actions.hasError(null));
  };
}

// ----------------------------------------------------------------------
