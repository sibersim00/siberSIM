import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getThirdPartyIntegrationData: [],
};

const slice = createSlice({
  name: "thirdPartyIntegrations",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetThirdPartyIntegrationListSucc(state, action) {
      state.isLoading = false;
      state.getThirdPartyIntegrationData = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export default slice.reducer;

export function getThirdPartyIntegrations(targetPanel) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(
        `${api.third_party_integrations_available}?target_panel=${encodeURIComponent(targetPanel)}`,
        { skipNotFoundRedirect: true },
      );
      dispatch(slice.actions.hasGetThirdPartyIntegrationListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
