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
  getSubCategoriesListData: [],
  statusChangeSubCat: [],
  deleteSubCat: [],
  saveSubCategories: [], 
  updateSubCategories:[],
  singleSubCat: []
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
      state.getSubCategoriesListData = action.payload;
    },
    hasGetSaveSubCategoriesSucc(state,action){
        state.isLoading = false,
        state.getSaveSubCategoriesData = action.payload;
    },
    hasSubCatStatusSucc(state, action) {
        state.isLoading = false;
        state.statusChangeSubCat = action.payload;
      },
      hasGetDeleteSubCatSucc(state, action) {
        state.isLoading = false;
        state.deleteSubCat = action.payload;
      },

   
      hasGetSaveSubCategoriesSucc(state,action){
        state.isLoading = false,
        state.saveSubCategories = action.payload;
    },
    hasGetUpdateSubCategoriesSucc(state,action){
      state.isLoading = false,
      state.updateSubCategories = action.payload;
  },

    hasGetSingleSubCatSucc(state,action){
      state.isLoading = false,
      state.singleSubCat = action.payload;
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
export function getSubCategoriesList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
     const response = await axios.get(`${api.component_subcategories_get}`);
      dispatch(slice.actions.hasGetSubCategoriesListSucc(response.data));
    } catch (error) {
     dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusSubCat(payload,id) {
   return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.put(`${api?.component_subcategories_change_status}/${id}`, payload);
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

export function deleteSubCat(id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.delete(`${api.component_subcategories_delete}/${id}`);
        dispatch(slice.actions.hasGetDeleteSubCatSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearDeleteSubcat() {
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
        const response = await axios.post(`${api.component_subcategories_save}`,payload);
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

export function updateSubCategories(payload) {
 return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.component_subcategories_update}`,payload);
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

export function getSingleSubCat(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.component_subcategories_single}/${id}`);
      dispatch(slice.actions.hasGetSingleSubCatSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
export function clearSingleSubCategories() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleSubCatSucc([]));
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
