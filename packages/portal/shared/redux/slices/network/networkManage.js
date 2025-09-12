import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import api from "../../api_urls";

const initialState = {
 isLoading: false,
  error: null,
  networkData: [], 
  networkDatalist: [],
};

const slice = createSlice({
  name: "networkManage",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    hasFetchNetworkSuccess(state, action) {
      state.isLoading = false;
      state.networkData = action.payload;
    },
    hasFetchNetworkSuccesslist(state, action) {
      state.isLoading = false;
      state.networkDatalist = action.payload;
    },
  },
});

export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;


export function fetchNetwork() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.fetch_network}`);
      dispatch(slice.actions.hasFetchNetworkSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function fetchNetworlist() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.fetch_network_list}`);
      dispatch(slice.actions.hasFetchNetworkSuccesslist(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearfetchNetwork() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasFetchNetworkSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
