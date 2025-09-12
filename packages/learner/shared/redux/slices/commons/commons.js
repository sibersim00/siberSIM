import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  countrydataResp: [],
  cityDataResp: [],
  cityDataResp: [],
  designationData: [],
  companynamedata: [],
};

const slice = createSlice({
  name: "commondata",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export default slice.reducer;

export function clearHasError() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasError([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

