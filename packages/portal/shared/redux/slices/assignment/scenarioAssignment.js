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
  assignScenario: [],
  assignScenarioList: [],
  getAssignScenaroByID: [],
};

const slice = createSlice({
  name: "ScenarioAssignment",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },

    hasGetAssignScenariosSucc(state, action) {
      state.isLoading = false,
        state.assignScenario = action.payload;
    },
    hasGetAssignScenarioSucc(state, action) {
      state.isLoading = false,
        state.assignScenarioList = action.payload;
    },
    hasHandleManageSuc(state,action){
      console.log("action.payloadaction.payload",action.payload)
      state.isLoading = false,
      state.viewNameResp = action.payload;
    },
    hasGetAssignScenarioByIdSucc(state, action) {
      state.isLoading = false;
      state.getAssignScenaroByID = action.payload;
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

export function saveAssignScenario(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.assign_scenario}`, payload);
      dispatch(slice.actions.hasGetAssignScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearsaveAssignScenario() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetAssignScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getAssignScenaroList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.assign_scenario_get}`);
      dispatch(slice.actions.hasGetAssignScenarioSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getAssignScenaroByID(id) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.assign_scenario_getbyId}/${id}`);
      dispatch(slice.actions.hasGetAssignScenarioByIdSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearAssignScenaroByID() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetAssignScenarioByIdSucc([]));
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

//----------------------------------------------------------------------
