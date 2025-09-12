import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  cmpSettingData:[],
  addDataResp: [],
  updateDataResp:[],
  uploadLogoResp : []
};

const slice = createSlice({
  name: "companySetting",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetListSucc(state, action) {
      state.isLoading = false;
      state.cmpSettingData = action.payload;
    },
    hasAddSucc(state, action) {
      state.isLoading = false;
      state.addDataResp = action.payload;
    },
    hasUpdateSucc(state, action) {
      state.isLoading = false;
      state.updateDataResp = action.payload;
    },
    hasUploadLogoSucc(state, action) {
      state.isLoading = false;
      state.uploadLogoResp = action.payload;
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

// Get City List
export function getWebSettings() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.web_setting);
      dispatch(slice.actions.hasGetListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addWebSetting(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.add_web_setting, payload);
      dispatch(slice.actions.hasAddSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearAddWebSetting() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateWebSetting(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.updated_web_setting, payload);
      dispatch(slice.actions.hasUpdateSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearUpdateWebSetting() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasUpdateSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function uploadLogo(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.upload_logo, payload);
      dispatch(slice.actions.hasUploadLogoSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearUploadLogo() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasUploadLogoSucc([]));
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

// ----------------------------------------------------------------------
