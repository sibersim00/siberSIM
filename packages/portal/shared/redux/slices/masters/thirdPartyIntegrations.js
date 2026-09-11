import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getThirdPartyIntegrationData: [],
  saveThirdPartyIntegrationData: [],
  updateThirdPartyIntegrationData: [],
  statusChangeThirdPartyIntegrationData: [],
  deleteThirdPartyIntegrationData: [],
};

const slice = createSlice({
  name: "thirdPartyIntegrationsMaster",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetThirdPartyIntegrationListSucc(state, action) {
      state.isLoading = false;
      state.getThirdPartyIntegrationData = action.payload;
    },
    hasSaveThirdPartyIntegrationSucc(state, action) {
      state.isLoading = false;
      state.saveThirdPartyIntegrationData = action.payload;
    },
    hasUpdateThirdPartyIntegrationSucc(state, action) {
      state.isLoading = false;
      state.updateThirdPartyIntegrationData = action.payload;
    },
    hasStatusThirdPartyIntegrationSucc(state, action) {
      state.isLoading = false;
      state.statusChangeThirdPartyIntegrationData = action.payload;
    },
    hasDeleteThirdPartyIntegrationSucc(state, action) {
      state.isLoading = false;
      state.deleteThirdPartyIntegrationData = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export default slice.reducer;

export function getThirdPartyIntegrations() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.third_party_integration_getall}`);
      dispatch(slice.actions.hasGetThirdPartyIntegrationListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveThirdPartyIntegration(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.third_party_integration_save}`, payload);
      dispatch(slice.actions.hasSaveThirdPartyIntegrationSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveThirdPartyIntegration() {
  return async () => {
    dispatch(slice.actions.hasSaveThirdPartyIntegrationSucc([]));
  };
}

export function updateThirdPartyIntegration(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.third_party_integration_update}`, payload);
      dispatch(slice.actions.hasUpdateThirdPartyIntegrationSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearUpdateThirdPartyIntegration() {
  return async () => {
    dispatch(slice.actions.hasUpdateThirdPartyIntegrationSucc([]));
  };
}

export function changeThirdPartyIntegrationStatus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.third_party_integration_change_status}`, payload);
      dispatch(slice.actions.hasStatusThirdPartyIntegrationSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearStatusThirdPartyIntegration() {
  return async () => {
    dispatch(slice.actions.hasStatusThirdPartyIntegrationSucc([]));
  };
}

export function deleteThirdPartyIntegration(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.third_party_integration_delete}`, payload);
      dispatch(slice.actions.hasDeleteThirdPartyIntegrationSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearDeleteThirdPartyIntegration() {
  return async () => {
    dispatch(slice.actions.hasDeleteThirdPartyIntegrationSucc([]));
  };
}

export function clearThirdPartyError() {
  return async () => {
    dispatch(slice.actions.hasError(null));
  };
}
