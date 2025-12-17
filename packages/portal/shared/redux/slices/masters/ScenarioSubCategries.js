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
  getSubScenarioListData: [],
  statusChangeSubCat: [],
  saveCategories:[],
  deleteSubCat: [],
  updateSubCategories: [],
  saveSubCategories: [], 
  verifyScenarioSubCategory:[],
  importScenarioSubCategory:[],
};

const slice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetSubCategoriesListSucc(state,action){
      state.isLoading = false,
      state.getSubScenarioListData = action.payload;
    },
    hasGetSaveSubCategoriesSucc(state,action){
        state.isLoading = false,
        state.saveSubCategories = action.payload;
    },
    hasSubCatStatusSucc(state, action) {
        state.isLoading = false;
        state.statusChangeSubCat = action.payload;
      },
      hasGetDeleteSubCatSucc(state, action) {
        state.isLoading = false;
        state.deleteSubCat = action.payload;
      },


    hasGetUpdateSubCategoriesSucc(state,action){
      state.isLoading = false,
      state.updateSubCategories = action.payload;
  },

hasVerifySuccess(state, action) {
  state.isLoading = false;
  state.verifyScenarioSubCategory = action.payload;
},

hasImportSuccess(state, action) {
  state.isLoading = false;
  state.importScenarioSubCategory = action.payload;
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
export function getScenarioSubCatList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {


      const response = await axios.get(`${api.scenario_subcategories_get}`);
      dispatch(slice.actions.hasGetSubCategoriesListSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}




export function updateSubCategories(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_subcategories_update}`,payload);
      dispatch(slice.actions.hasGetUpdateSubCategoriesSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearUpdateSubCategories() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateSubCategoriesSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteComponentSubCat(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.scenario_subcategories_delete}`,payload);
        dispatch(slice.actions.hasGetDeleteSubCatSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearDeleteSubCat() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetDeleteSubCatSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
 
export function saveSubCategories(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_subcategories_save}`,payload);
      dispatch(slice.actions.hasGetSaveSubCategoriesSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSaveSubCategories() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveSubCategoriesSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function changeStatusSubCat(payload,id) {
   return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.scenario_subcategories_status}`, payload);
        dispatch(slice.actions.hasSubCatStatusSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearSubCatChangeStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasSubCatStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}



export function verifyScenarioSubCategoryModal(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.scenario_subcategories_verify, payload);
      dispatch(slice.actions.hasVerifySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearVerifyScenarioSubCategoryModel() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasVerifySuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function importScenarioSubCategoryModal(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.scenario_subcategories_import, payload);
      dispatch(slice.actions.hasImportSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearimportScenarioSubCategoryModal() {
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
