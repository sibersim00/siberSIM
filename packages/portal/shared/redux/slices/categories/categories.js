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
  getSaveCategoriesData: [],
  getDeleteCategoriesData: [],
  addUpdateStatusChangeRes: [],
  deleteFAQRes:[],
  categoryFAQbyIdData : [],
  getSaveCategoryBannerData: []
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
        state.getSaveCategoriesData = action.payload;
    },
    hasGetSaveCategoryBannerSucc(state,action){
        state.isLoading = false,
        state.getSaveCategoryBannerData = action.payload;
    },
    hasGetDeleteCategoriesSucc(state,action){
        state.isLoading = false,
        state.getDeleteCategoriesData = action.payload;
    },
    hasAddUpdateStatusChangeFAQSucc(state, action) {
      state.isLoading = false;
      state.addUpdateStatusChangeRes = action.payload;
    },
    hasDeleteFAQSucc(state, action) {
      state.isLoading = false;
      state.deleteFAQRes = action.payload;
    },
    hasGetCategoryFAQbyIdSucc(state, action) {
      state.isLoading = false;
      state.categoryFAQbyIdData = action.payload;
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
      const response = await axios.get(`${api.categories_get}`);
      dispatch(slice.actions.hasGetCategoriesListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveCategories(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.categories_save}`,payload);
        dispatch(slice.actions.hasGetSaveCategoriesSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function saveCategoryBanner(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.categories_save}`,payload);
      dispatch(slice.actions.hasGetSaveCategoryBannerSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveCategoryBanner() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveCategoryBannerSucc([]));
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

export function deleteCategories(id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.delete(`${api.categories}/${id}`);
        dispatch(slice.actions.hasGetDeleteCategoriesSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearDeleteCategories() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetDeleteCategoriesSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function getCategoryFAQbyId(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.category_faqs_get}/${id}`);
      dispatch(slice.actions.hasGetCategoryFAQbyIdSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addUpdateStatusChangeFAQ(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.category_faqs_save}`,payload);
      dispatch(slice.actions.hasAddUpdateStatusChangeFAQSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearAddUpdateStatusChangeFAQ() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddUpdateStatusChangeFAQSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteFAQ(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.delete(`${api.category_faqs}/${id}`);
      dispatch(slice.actions.hasDeleteFAQSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearDeleteFAQ() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasDeleteFAQSucc([]));
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
