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
  getscenariotabData: [],
  getscenariowidgetData: [],
  savescenariotab: [], 
};

const slice = createSlice({
  name: "scenarioTabs",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetscenariotabsListSucc(state,action){
      state.isLoading = false;
      state.getscenariotabData = action.payload;
    },
    hasGetscenariotabswidgetSucc(state,action){
      state.isLoading = false;
      state.getscenariowidgetData = action.payload;
    },
    hasGetSavescenariotabSucc(state,action){
        state.isLoading = false;
        state.savescenariotab = action.payload;
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
export function getsceanriotabList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_tab_list}`);
      dispatch(slice.actions.hasGetscenariotabsListSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getsceanriotabwidget() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_tab_widget}`);
      dispatch(slice.actions.hasGetscenariotabswidgetSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}


 
export function savescenariotab(payload) {
  console.log("Payload type:", typeof payload, Array.isArray(payload), payload);

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_tab_save}`, payload);
      dispatch(slice.actions.hasGetSavescenariotabSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearsavescenariotab() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetSavescenariotabSucc([]));
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
