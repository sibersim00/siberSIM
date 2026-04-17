import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  apilogdataData: [],
  stopcomponentSucc: [],
  startcomponentSucc: [],
  restartcomponentSucc: [],
  getrunninglearnerSucc: [],
  getrunningcomponentSucc: [],
  fetchrunningscenario: [],
  listRunningScenariosData: [],
  listAllExceptRunningData: [],
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

    hasfetchrunningscenariolist(state, action) {
      state.isLoading = false;
      state.fetchrunningscenario = action.payload;
    },
    hasstopcomponentSucc(state, action) {
      state.isLoading = false;
      state.stopcomponentSucc = action.payload;
    },
    hasstartcomponentSucc(state, action) {
      state.isLoading = false;
      state.startcomponentSucc = action.payload;
    },
    hasrestartcomponentSucc(state, action) {
      state.isLoading = false;
      state.restartcomponentSucc = action.payload;
    },
    hasgetrunninglearner(state, action) {
      state.isLoading = false;
      state.getrunninglearnerSucc = action.payload;
    },
    hasgetrunningcomponent(state, action) {
      state.isLoading = false;
      state.getrunningcomponentSucc = action.payload;
    },
    hasgetlistRunningScenariosSucc(state, action) {
      state.isLoading = false;
      state.listRunningScenariosData = action.payload;
    },
    hasgetlistAllExceptRunningSucc(state, action) {
      state.isLoading = false;
      state.listAllExceptRunningData = action.payload;
    },
  },
});

export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;


export function fetchrunningscenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.running_senario}`);
      dispatch(slice.actions.hasfetchrunningscenariolist(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getrunninglearner() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.get_running_learner}`);
      dispatch(slice.actions.hasgetrunninglearner(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getrunningcomponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.get_running_component}`,payload);
      dispatch(slice.actions.hasgetrunningcomponent(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function stopcomponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.stop_single_component}`, payload);
      dispatch(slice.actions.hasstopcomponentSucc(response.data));
      return response.data
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function startcomponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.start_single_component}`, payload);
      dispatch(slice.actions.hasstartcomponentSucc(response.data));
      return response.data
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function restartcomponent(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.restart_single_component}`, payload);;
      dispatch(slice.actions.hasrestartcomponentSucc(response.data));
      return response.data
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function listRunningScenarios(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api.running, {
        params: payload, 
      });
      dispatch(
        slice.actions.hasgetlistRunningScenariosSucc(response.data.data)
      );
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function listAllExceptRunning(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api.all_except_running, {
        params: payload, 
      });
      dispatch(
        slice.actions.hasgetlistAllExceptRunningSucc(response.data.data)
      );
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}