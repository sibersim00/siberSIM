import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";



const initialState = {
  isLoading: false,
  error: null,
  getComponentListData: [],
  singleComponent: [],
  getTerminatedgScenarioData: [],
  getCompletedScenarioData: [],
  getStudentDashboardData: [],
};



const slice = createSlice({
  name: "Custom Component",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetComponentListSucc(state, action) {
      state.isLoading = false,
        state.getComponentListData = action.payload;
    },

    hasGetSingleComponentSucc(state, action) {
      state.isLoading = false,
        state.singleComponent = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});




export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;



export function getComponentList() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.custom_component_get}`);
      dispatch(slice.actions.hasGetComponentListSucc(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getSingleComponent(uuid) {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.custom_componentby_id}/${uuid}`);
      dispatch(slice.actions.hasGetSingleComponentSucc(response.data));
    } catch (error) {

      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSingleComponent() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleComponentSucc([]));
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