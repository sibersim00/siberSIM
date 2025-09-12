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
    selectorData: [],
    singletemplateData: [],
    actionList: [],
    templateSaveResp: [],
};

//-----------------


const slice = createSlice({
  name: "mailconfigSlice",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetSelectorTypesSucc(state, action) {
      state.isLoading = false;
      state.selectorData = action.payload;   
    },
    hasTemplateByTemplateIdSucc(state, action) {
      state.isLoading = false;
      state.singletemplateData = action.payload;   
    },
    hasGetActionDropdownucc(state, action) {
      state.isLoading = false;
      state.actionList = action.payload;   
    },
    hasSaveTemplateSucc(state, action) {
      state.isLoading = false;
      state.templateSaveResp = action.payload;   
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

export function getSelectorTypes(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.masters_get_selectors}/${id}`); 
      dispatch(slice.actions.hasGetSelectorTypesSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function CleargetSelectorTypes() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSelectorTypesSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getTemplateDataByTemplateId(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.templates_get}/${id}`); 
      dispatch(slice.actions.hasTemplateByTemplateIdSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getActionDropdown() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.masters_get_actions); 
      dispatch(slice.actions.hasGetActionDropdownucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}



export function saveTemplate(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.templates_save, data); 
      dispatch(slice.actions.hasSaveTemplateSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function ClearSaveTemplate() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasSaveTemplateSucc([]));
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
  
