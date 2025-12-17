

import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getNotiTempData: [],
	getSelectorData :[],
  saveTemplateResponse: [],
  notificationData : [],
  notificationAllData : [],
  markReadNotiResp : []
};

const slice = createSlice({
  name: "noticonfigs",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },

    hasGetNotiTemplateSucc(state, action) {
      state.isLoading = false;
      state.getNotiTempData = action.payload;
    },

    hasGetSelectorSucc(state, action) {
      state.isLoading = false;
      state.getSelectorData = action.payload;
    },

    hasSaveTemplateSucc(state, action) {
      state.isLoading = false;
      state.saveTemplateResponse = action.payload;
    },
    hasGetNotificationSucc(state, action) {
      state.isLoading = false;
      state.notificationData = action.payload;
    },
      hasGetNotificationAllSucc(state, action) {
      state.isLoading = false;
      state.notificationAllData = action.payload;
    },
    hasMarkReadNotificationSucc(state, action) {
      state.isLoading = false;
      state.markReadNotiResp = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;

export function getNotiTemplateList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.notification_get_template_list}`);
      console.log("responseresponse",response)
      dispatch(slice.actions.hasGetNotiTemplateSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSelectors(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.notification_get_selectors}/${id}`);
      dispatch(slice.actions.hasGetSelectorSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveTemplate(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api?.notification_savetemplate}`, payload);
      dispatch(slice.actions.hasSaveTemplateSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getNotification(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.notification_get_noti_list}/${payload}`);
      dispatch(slice.actions.hasGetNotificationSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getNotificationAll(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.notification_get_noti_list_all}/${payload}`);
      dispatch(slice.actions.hasGetNotificationAllSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function markReadNotification(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api?.notification_read_notification}`,payload);
      dispatch(slice.actions.hasMarkReadNotificationSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearSaveTemplateData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasSaveTemplateSucc([]));
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