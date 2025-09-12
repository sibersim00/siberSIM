import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
//
import { dispatch } from "../../store";
import api from "../../api_urls";
import { COMPILER_INDEXES } from "next/dist/shared/lib/constants";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getBatchesListData: [],
  statusChangeBatch: [],
  deleteBatches: [],
  saveBatches: [], 
  updateBatches: [],
  singleBatch: [],

};



const slice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetBatchListSucc(state,action){
      state.isLoading = false,
      state.getBatchesListData = action.payload;
    },

    hasBatchStatusSucc(state, action) {
        state.isLoading = false;
        state.statusChangeBatch = action.payload;
      },
      hasGetDeleteBatchSucc(state, action) {
        state.isLoading = false;
        state.deleteBatches = action.payload;
      },

   
      hasGetSaveBatchesSucc(state,action){
        state.isLoading = false,
        state.saveBatches = action.payload;
    },

    hasGetUpdateBatchesSucc(state,action){
      state.isLoading = false,
      state.updateBatches = action.payload;
  },

  hasGetSingleBatchSucc(state,action){
    state.isLoading = false,
    state.singleBatch = action.payload;
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


export function getSingleBatch(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.batch_single}/${id}`);
      dispatch(slice.actions.hasGetSingleBatchSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function clearSingleBatch() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleBatchSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function getBatchesList() {

  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.batches_get}`);
      dispatch(slice.actions.hasGetBatchListSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusBatch(payload) {
   return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.batches_status}`, payload);
        dispatch(slice.actions.hasBatchStatusSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearBatchChangeStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasBatchStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteBatch(payload) {


  return async (dispatch) => { 
      dispatch(slice.actions.startLoading());

      try {
          const response = await axios.post(`${api.batches_delete}`, payload);
          dispatch(slice.actions.hasGetDeleteBatchSucc(response.data));
      } catch (error) {
          dispatch(slice.actions.hasError(error));
      }
  };
}


export function clearDeleteBatch() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetDeleteBatchSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
 
export function saveBatches(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.batches_save}`,payload);
        dispatch(slice.actions.hasGetSaveBatchesSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}
export function clearSaveBatches() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetSaveBatchesSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
export function updateBatches(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.batches_update}`,payload);
      dispatch(slice.actions.hasGetUpdateBatchesSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearUpdateBatches() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateBatchesSucc([]));
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
