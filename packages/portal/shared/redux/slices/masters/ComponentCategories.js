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
  getCategoriesListData: [],
  statusChangeCat: [],
  deleteCat: [],
  saveCategories: [], 
  updateCategories: [],
  verifyComponentCategory:[],
  importComponentCategory:[],
};

const slice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetCategoriesListSucc(state,action){
      state.isLoading = false,
      state.getCategoriesListData = action.payload;
    },
    hasGetSaveCategoriesSucc(state,action){
        state.isLoading = false,
        state.saveCategories = action.payload;
    },
    hasCatStatusSucc(state, action) {
        state.isLoading = false;
        state.statusChangeCat = action.payload;
      },
      hasGetDeleteCatSucc(state, action) {
        state.isLoading = false;
        state.deleteCat = action.payload;
      },

   
      hasGetSaveCategoriesSucc(state,action){
        state.isLoading = false,
        state.saveCategories = action.payload;
    },

    hasGetUpdateCategoriesSucc(state,action){
      state.isLoading = false,
      state.updateCategories = action.payload;
  },

  hasVerifySuccess(state, action) {
    state.isLoading = false;
    state.verifyComponentCategory = action.payload;
  },

  hasImportSuccess(state, action) {
    state.isLoading = false;
    state.importComponentCategory = action.payload;
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
export function getCategoriesList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
    console.log("ssdsaaaaaaaaaaa");

      const response = await axios.get(`${api.component_categories_get}`);
      dispatch(slice.actions.hasGetCategoriesListSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusCat(payload,id) {
   return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.component_categories_change_status}`, payload);
        dispatch(slice.actions.hasCatStatusSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearCatChangeStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasCatStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteComponentCat(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.component_categories_delete}`,payload);
        dispatch(slice.actions.hasGetDeleteCatSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearDeleteCat() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetDeleteCatSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
 
export function saveCategories(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.component_categories_save}`,payload);
        dispatch(slice.actions.hasGetSaveCategoriesSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}
export function clearSaveCategories() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetSaveCategoriesSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
export function updateCategories(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.component_categories_update}`,payload);
      dispatch(slice.actions.hasGetUpdateCategoriesSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearUpdateCategories() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateCategoriesSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}  

export function verifyComponentCategoryModal(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.component_categories_verify, payload);
      dispatch(slice.actions.hasVerifySuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearVerifyComponentCategoryModel() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasVerifySuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function importComponentCategoryModal(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.component_categories_import, payload);
      dispatch(slice.actions.hasImportSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearimportComponentCategoryModal() {
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
