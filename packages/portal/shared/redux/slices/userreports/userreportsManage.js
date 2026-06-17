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
  getuserreportslist: [],
  getuserperformancelist: []
};

const slice = createSlice({
  name: "userreportsManage",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },

    hasuserreportslist(state, action) {
      (state.isLoading = false), (state.getuserreportslist = action.payload);
    },
    hasuserperformancelist(state, action) {
      (state.isLoading = false), (state.getuserperformancelist = action.payload);
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

// --------------- user reports list--------------

export function UserReportList(payload) {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${api.user_reports_list}`, payload);
      dispatch(slice.actions.hasuserreportslist(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function UserPerformanceList(payload) {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${api.user_performance_list}`, payload);
      dispatch(slice.actions.hasuserperformancelist(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}




