import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getLearnersData: [],
  statusChangeTutor: [],
  learnerInfoResp: [],
  registerLearnerResp: [],
  saveImportLearnerResp: [],
};

const slice = createSlice({
  name: "learnerData",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    stopLoading(state) {
      state.isLoading = false;
    },
    hasgetLearnersListSucc(state, action) {
      state.isLoading = false;
      state.getLearnersData = action.payload;
    },

    hasTutorsStatusSucc(state, action) {
      state.isLoading = false;
      state.statusChangeTutor = action.payload;
    },
    hasgetLearnersInfoSucc(state, action) {
      state.isLoading = false;
      state.learnerInfoResp = action.payload;
    },
    hasRegisterLearnerSucc(state, action) {
      state.registerLearnerResp = action.payload;
    },
    saveImportLearnerSucc(state, action) {
      state.isLoading = false;
      state.saveImportLearnerResp = action.payload;
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

// ----------------------------------------------------------------------

export function getLearnersManageList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.learners_get);
      dispatch(slice.actions.hasgetLearnersListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveLearnersChangeStatus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.learners_change_status, payload);
      dispatch(slice.actions.hasTutorsStatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveLearnersChangeStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasTutorsStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getLearnersInfo(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.learners_get}/${id}`);
      dispatch(slice.actions.hasgetLearnersInfoSucc(response.data));
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

// -------------- Registration -------------------------------------

export function registerLearner(payload) {
  return async (dispatch) => {
    try {
      if (payload?.learner_id) {
        const response = await axios.post(`${api.learners_update}`, payload);
        dispatch(slice.actions.hasRegisterLearnerSucc(response.data));
      } else {
        const response = await axios.post(`${api.learners_save}`, payload);
        dispatch(slice.actions.hasRegisterLearnerSucc(response.data));
      }
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearRegisterLearner() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasRegisterLearnerSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveImportLearner(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axiosMaster.post(
        `${api?.learners_import}`,
        payload
      );
      dispatch(slice.actions.saveImportLearnerSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearImportLearner() {
  return async () => {
    dispatch(slice.actions.stopLoading());
    try {
      dispatch(slice.actions.saveImportLearnerSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
