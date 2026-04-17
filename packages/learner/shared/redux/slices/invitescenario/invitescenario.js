import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getRunningInviteLearners: [],
  singleScenarios: [],
};

const slice = createSlice({
  name: "scenarios",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasgetRunningInviteLearnersData(state, action) {
      ((state.isLoading = false),
        (state.getRunningInviteLearners = action.payload));
    },
    hasgetInviteScenarioByIDData(state, action) {
      ((state.isLoading = false), (state.singleScenarios = action.payload));
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

export function getRunningInviteLearnersList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.running_invite_learners}`);
      dispatch(slice.actions.hasgetRunningInviteLearnersData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getInviteScenarioByID(scenariouuid) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(
        `${api.invite_scenario}/${scenariouuid}`,
      );
      dispatch(slice.actions.hasgetInviteScenarioByIDData(response.data));
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
