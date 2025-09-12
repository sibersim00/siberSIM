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
  getinstructorreportslist: [],
  getinstructorperformancelist: []
};

const slice = createSlice({
  name: "instructorreportsManage",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },

    hasinstructorreportslist(state, action) {
      (state.isLoading = false), (state.getinstructorreportslist = action.payload);
    },
    hasinstructorperformancelist(state, action) {
      (state.isLoading = false), (state.getinstructorperformancelist = action.payload);
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

export function instructorReportList(payload) {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${api.instructor_reports_list}`, payload);
      dispatch(slice.actions.hasinstructorreportslist(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function instructorPerformanceList(payload) {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${api.instructor_performance_list}`, payload);
      dispatch(slice.actions.hasinstructorperformancelist(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}






