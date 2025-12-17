import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
//
import { dispatch } from "../../store";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getwidgetData: [],
  statusChangeFaqs: [],
  deletewidget: [],
  savewidget: [], 
  updateWidget: [],
  verifyFaqs:[],
  importFaqs:[],
};

const slice = createSlice({
  name: "widgets",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetwidgetListSucc(state,action){
      state.isLoading = false;
      state.getwidgetData = action.payload;
    },
    hasGetSavewidgetSucc(state,action){
        state.isLoading = false;
        state.savewidget = action.payload;
    },
    hasFaqStatusSucc(state, action) {
        state.isLoading = false;
        state.statusChangeFaqs = action.payload;
      },
      hasGetDeletewidgetSucc(state, action) {
        state.isLoading = false;
        state.deletewidget = action.payload;
      },

    hasGetUpdateWidgetSucc(state,action){
      state.isLoading = false;
      state.updateWidget = action.payload;
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

// ----------------------------------------------------------------------
export function getwidgetList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.widget_getall}`);
      console.log("response",response.data);
      dispatch(slice.actions.hasGetwidgetListSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusFaq(payload,id) {
   return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.widget_change_status}`, payload);
        dispatch(slice.actions.hasFaqStatusSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearFaqChangeStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasFaqStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteWidget(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.widget_delete}`,payload);
        dispatch(slice.actions.hasGetDeletewidgetSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function cleardeleteWidget() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetDeletewidgetSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
 
export function savewidget(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.widget_save}`,payload);
        dispatch(slice.actions.hasGetSavewidgetSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}
export function clearSavewidget() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetSavewidgetSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
export function updatewidget(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.widget_update}`,payload);
      dispatch(slice.actions.hasGetUpdateWidgetSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearupdatewidget() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateWidgetSucc([]));
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

// ----------------------------------------------------------------------
