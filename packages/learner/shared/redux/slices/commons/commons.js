import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  countrydataResp: [],
  cityDataResp: [],
  cityDataResp: [],
  designationData: [],
  companynamedata: [],
  saveflowchartData: [],
  getScnarioComponentByCatData: [],
  getScenarioSubCategorybyData: [],
  getScenarioSubCategoriesListData: [],
  getMasterCatListData: [],
  theme: "",
};

const slice = createSlice({
  name: "commondata",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    hasGetScenarioComponentByCatSuccess(state, action) {
      (state.isLoading = false),
        (state.getScnarioComponentByCatData = action.payload);
    },
    hasGetScenarioSubCategoriesListSucc(state, action) {
      (state.isLoading = false),
        (state.getScenarioSubCategoriesListData = action.payload);
    },
    hasGetChildCategoriesListSucc(state, action) {
      (state.isLoading = false),
        (state.getScenarioSubCategorybyData = action.payload);
    },
    hasGetSaveFlowchart(state, action) {
      (state.isLoading = false), (state.saveflowchartData = action.payload);
    },
    hasGetMasterCatListSucc(state, action) {
      (state.isLoading = false), (state.getMasterCatListData = action.payload);
    },
    hasGetThemeSucc(state, action) {
      (state.isLoading = false), (state.theme = action.payload);
    },
  },
});

export default slice.reducer;

export function clearHasError() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasError([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getOrSetTheme(theme) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const url = theme
        ? `${api.user_theme}?theme=${theme}`
        : `${api.user_theme}`;

      const response = await axios.get(url);
      console.log("respopnsessssssssssss", response);

      dispatch(slice.actions.hasGetThemeSucc(response.data.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getScenarioComponentListbyCategory(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.scenario_component_by_catId}`,
        payload
      );
      dispatch(
        slice.actions.hasGetScenarioComponentByCatSuccess(response.data)
      );
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getCategoriesList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.master_component_cat_get}`);
      dispatch(slice.actions.hasGetMasterCatListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveScenarioFlow(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.scenario_flowchart_save}`,
        payload
      );
      console.log("responseresponse",response);
      
      dispatch(slice.actions.hasGetSaveFlowchart(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearsaveScenarioFlow() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveFlowchart([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getScenarioSubCategoriesList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_sub_category_list}`);
      dispatch(
        slice.actions.hasGetScenarioSubCategoriesListSucc(response.data)
      );
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getScenarioSubCategorybyId(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.scenario_child_category_list}`,
        payload
      );
      dispatch(slice.actions.hasGetChildCategoriesListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearScenarioSubCategorybyId() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetChildCategoriesListSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
