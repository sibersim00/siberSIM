import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  countrydataResp: [],
  cityDataResp: [],
  cityDataResp: [],
  designationData: [],
  companynamedata: [],
   theme:"",
};

const slice = createSlice({
  name: "commondata",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
      hasGetThemeSucc(state,action){
    state.isLoading = false,
    state.theme = action.payload;
  }, 
  },
});

export default slice.reducer;

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





export function getOrSetTheme(theme) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const url = theme
        ? `${api.user_theme}?theme=${theme}`
        : `${api.user_theme}`;

      const response = await axios.get(url);
      console.log("respopnsessssssssssss",response);
      
      
      dispatch(slice.actions.hasGetThemeSucc(response.data.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

