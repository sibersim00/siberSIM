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
  getFaqsData: [],
  statusChangeFaqs: [],
  deleteFaqs: [],
  saveFaqs: [], 
  updateFaqs: [],
  verifyFaqs:[],
  importFaqs:[],
};

const slice = createSlice({
  name: "faqs",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetFaqListSucc(state,action){
      state.isLoading = false;
      state.getFaqsData = action.payload;
    },
    hasGetSaveFaqSucc(state,action){
        state.isLoading = false;
        state.saveFaqs = action.payload;
    },
    hasFaqStatusSucc(state, action) {
        state.isLoading = false;
        state.statusChangeFaqs = action.payload;
      },
      hasGetDeleteFaqSucc(state, action) {
        state.isLoading = false;
        state.deleteFaqs = action.payload;
      },

    hasGetUpdateFaqSucc(state,action){
      state.isLoading = false;
      state.updateFaqs = action.payload;
  },

  hasVerifySuccess(state, action) {
    state.isLoading = false;
    state.verifyFaqs = action.payload;
  },

  hasImportSuccess(state, action) {
    state.isLoading = false;
    state.importFaqs = action.payload;
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
export function getFaqList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
    console.log("ssdsaaaaaaaaaaa");

      const response = await axios.get(`${api.faq_getall}`);
      console.log("response",response.data);
      dispatch(slice.actions.hasGetFaqListSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusFaq(payload,id) {
   return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.faq_change_status}`, payload);
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

export function deleteFaq(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.faq_delete}`,payload);
        dispatch(slice.actions.hasGetDeleteFaqSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearDeleteFaq() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetDeleteFaqSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
 
export function saveFaq(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.faq_save}`,payload);
        dispatch(slice.actions.hasGetSaveFaqSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}
export function clearSaveFaq() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetSaveFaqSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
export function updatefaq(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.faq_update}`,payload);
      dispatch(slice.actions.hasGetUpdateFaqSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearUpdateFaq() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateFaqSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}  

export function verifyFaqModal(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.faq_verify, payload);
      dispatch(slice.actions.hasVerifySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearVerifyFaqModel() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasVerifySuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function importFaqModal(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.faq_import, payload);
      dispatch(slice.actions.hasImportSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearimportFaqModal() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasImportSuccess([]));
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
