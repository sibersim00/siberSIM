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
  getDashboardData: [],
  viewNameResp: "user",

};

const slice = createSlice({
  name: "Dashboard",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetDashboardSucc(state, action) {
      state.isLoading = false,
        state.getDashboardData = action.payload;
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
export function getDashboardListData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.get_dashoard}`);
      dispatch(slice.actions.hasGetDashboardSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function handleManageView(payload) {

  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasHandleManageSuc(payload));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


//----------------------------------------------------------------------
