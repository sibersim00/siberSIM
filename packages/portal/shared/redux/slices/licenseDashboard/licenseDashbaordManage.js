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
  getLicenseDashboardData: [],
  viewNameResp: "user",

};

const slice = createSlice({
  name: "License Dashboard",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetLicenseDashboardSucc(state, action) {
      state.isLoading = false,
        state.getLicenseDashboardData = action.payload;
    },
    hasHandleManageSuc(state, action) {
      state.isLoading = false,
        state.viewNameResp = action.payload;
    },
    //HAS ERROR
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
export function getLicenseDashboardData() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.get_license_dashboard_stats}`);
      dispatch(slice.actions.hasGetLicenseDashboardSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function handleManageView(payload) {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasHandleManageSuc(payload));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


//----------------------------------------------------------------------
