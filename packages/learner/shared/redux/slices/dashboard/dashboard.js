import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";



const initialState = {
  isLoading: false,
  error: null,
  getlearnerListData: [],
  getRunningScenarioData: [],
  getTerminatedgScenarioData: [],
  getCompletedScenarioData: [],
  getStudentDashboardData: [],
};



const slice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetLearnerListSucc(state,action){
      state.isLoading = false,
      state.getlearnerListData = action.payload;
    },

    hasGetRunningScenarioListSucc(state,action){
      state.isLoading = false,
      state.getRunningScenarioData = action.payload;
    },

    hasGetTerminatedScenarioListSucc(state,action){
      state.isLoading = false,
      state.getTerminatedgScenarioData = action.payload;
    },

     hasGetCompletedScenarioListSucc(state,action){
      state.isLoading = false,
      state.getCompletedScenarioData = action.payload;
    },

    hasGetStudentDashboardListSucc(state,action){
      state.isLoading = false,
      state.getStudentDashboardData = action.payload;
    },

    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});




export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;



export function getLearnerList() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.dashboard_get}`);
      dispatch(slice.actions.hasGetLearnerListSucc(response.data));
    } catch (error) { 

      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getRunningScenario() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.running_scenario_get}`);
      dispatch(slice.actions.hasGetRunningScenarioListSucc(response.data));
    } catch (error) { 

      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getStudentDashboard() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.get_student_dashboard}`);
      dispatch(slice.actions.hasGetStudentDashboardListSucc(response.data));
    } catch (error) { 

      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getTerminatedScenario() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.terminated_scenario_get}`);
      dispatch(slice.actions.hasGetTerminatedScenarioListSucc(response.data));
    } catch (error) { 

      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getCompletedScenario() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.completed_scenario_get}`);
      dispatch(slice.actions.hasGetCompletedScenarioListSucc(response.data));
    } catch (error) { 

      dispatch(slice.actions.hasError(error));
    }
  };
}

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