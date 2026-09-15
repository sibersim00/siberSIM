import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  items: [],
  error: null,
};

const slice = createSlice({
  name: "thirdPartyIntegrations",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
      state.error = null;
    },
    loadSuccess(state, action) {
      state.isLoading = false;
      state.items = action.payload?.data || [];
    },
    operationSuccess(state) {
      state.isLoading = false;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export default slice.reducer;
export const { clearError } = slice.actions;

const errorPayload = (error) =>
  error?.response?.data || {
    statusCode: 500,
    message: error?.message || "Something went wrong.",
  };

export const getIntegrations = () => async (dispatch) => {
  dispatch(slice.actions.startLoading());
  try {
    const response = await axios.get(api.third_party_integrations_get);
    dispatch(slice.actions.loadSuccess(response.data));
  } catch (error) {
    dispatch(slice.actions.hasError(errorPayload(error)));
    throw error;
  }
};
