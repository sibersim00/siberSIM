import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getLabsListDataresp: [],
  addLabResp: [],
  editLabResp: [],
  deleteLabResp: [],
  viewNameResp: "card",
};

const slice = createSlice({
  name: "Labs",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetLabsListSucc(state, action) {
      ((state.isLoading = false), (state.getLabsListDataresp = action.payload));
    },
    hasAddLabSucc(state, action) {
      ((state.isLoading = false), (state.addLabResp = action.payload));
    },
    hasEditLabSucc(state, action) {
      ((state.isLoading = false), (state.editLabResp = action.payload));
    },
    hasGetdeleteLabSucc(state, action) {
      state.isLoading = false;
      state.deleteLabResp = action.payload;
    },
    hasLabsStatusSucc(state, action) {
      state.isLoading = false;
      state.statusChangeLabResp = action.payload;
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
export function getLabsList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.lab_sessions_get}`);
      dispatch(slice.actions.hasGetLabsListSucc(response.data));
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

export function addLabDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.lab_session_save, payload);
      dispatch(slice.actions.hasAddLabSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearLabDetails() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddLabSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editLabDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.lab_session_update, payload);
      dispatch(slice.actions.hasEditLabSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearEditLabDetails() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditLabSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteLab(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.lab_session_delete}`, payload);
      dispatch(slice.actions.hasGetdeleteLabSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleardeleteLab() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetdeleteLabSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusLab(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api?.lab_change_status}`, payload);
      dispatch(slice.actions.hasLabsStatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearchangeStatusLab() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasLabsStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
