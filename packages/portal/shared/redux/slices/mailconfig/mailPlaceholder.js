import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
//
import { dispatch } from "../../store";
import api from "../../api_urls";

//-------------------

const initialState = {
    isLoading: false,
    error: null,
    placeholderData: [],

};

const slice = createSlice({
  name: "mailPlaceholderData",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetPlaceholderListSucc(state, action) {
      state.isLoading = false;
      state.placeholderData = action.payload;   
    },
  
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

export function getPlaceholderList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.selectors_get); 
      dispatch(slice.actions.hasGetPlaceholderListSucc(response.data));
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
  
