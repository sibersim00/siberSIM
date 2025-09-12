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
    actiondataResp: [],
    templateData: [],
};

//-----------------



const slice = createSlice({
  name: "activitydata",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasgetActionsSucc(state, action) {
      state.isLoading = false;
      state.actiondataResp = action.payload;   
    },
    hasTemplateByActionIdSucc(state, action) {
      state.isLoading = false;
      state.templateData = action.payload;   
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

export function getActionsList(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.masters_get_actions); 
      dispatch(slice.actions.hasgetActionsSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getTemplateByactionId(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.templates_action_templates}/${id}`); 
      dispatch(slice.actions.hasTemplateByActionIdSucc(response.data));
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
  
