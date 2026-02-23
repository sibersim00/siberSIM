import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  apilogdataData: [],
  apilogsDatalist: [],
  selectedLogData: [],
  TerminationSucc: [],
  stopcomponentSucc: [],
};

const slice = createSlice({
  name: "Running Cpmponents",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },

    hasFetchapilogsSuccesslist(state, action) {
      state.isLoading = false;
      state.apilogsDatalist = action.payload;
    },
    hasGetTerminationSucc(state, action) {
      state.isLoading = false;
      state.TerminationSucc = action.payload;
    },
    hasstopcomponentSucc(state, action) {
      state.isLoading = false;
      state.stopcomponentSucc = action.payload;
    },
     hasFetchApiLogByIdSuccess(state, action) {
      state.isLoading = false;
      state.selectedLogData = action.payload;
    },
  },
});

export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;

export function fetchapilogslist() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.get_running_component}`);
      dispatch(slice.actions.hasFetchapilogsSuccesslist(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearfetchlogs() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasFetchapilogsSuccesslist([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function fetchApiLogById(id) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.fetch_apilogs_by_id}/${id}`);
      dispatch(slice.actions.hasFetchApiLogByIdSuccess(response.data.data)); 
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearfetchlogbyid() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasFetchApiLogByIdSuccess());
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function terminateScenario(payload) {
  console.log(
    "++++++++++++++++++++++++++++++++=======+++++++++++++++++++++",
    payload
  );
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.delete_dropped_component}`, payload);
      console.log("response", response);
      dispatch(slice.actions.hasGetTerminationSucc(response.data));

      console.log("response", response);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function stopcomponent(payload) {
  console.log(
    "++++++++++++++++++++++++++++++++=======+++++++++++++++++++++",
    payload
  );
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.stop_single_component}`, payload);
      console.log("response", response);
      dispatch(slice.actions.hasstopcomponentSucc(response.data));

      console.log("response", response);
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}