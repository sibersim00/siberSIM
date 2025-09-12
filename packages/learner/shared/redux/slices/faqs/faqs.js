import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";


const initialState = {
  isLoading: false,
  error: null,
  getFaqData:[],
  
};

const slice = createSlice({
  name: "faqData",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
      hasGetFaqListSucc(state,action){
    state.isLoading = false,
    state.getFaqData = action.payload;
  }, 
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    }
  },
});

export default slice.reducer;



export function getFaqList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.faq_get}`);
      dispatch(slice.actions.hasGetFaqListSucc(response.data));
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

