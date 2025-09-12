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
  getMasterCatListData: [], 
  getsubCatById : [],
  getSaveCategoryBannerData: [],
  getScenarioSubCategoriesListData: [],
  getScenarioSubCategorybyId:[],
  getStudentListData: [{}],
  getStudentListDatareport: [{}],
  getBatchesListData : [],
  flowchart : [],
  saveflowchartData : [],
  getInstructorListData :[],
  getCommonScenarioData : [],
  getCommonInstructorData :[],
  getScnarioComponentByCatData : [],
  getFaqData:[],
};

const slice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetMasterCatListSucc(state,action){
      state.isLoading = false,
      state.getMasterCatListData = action.payload;
    },  
    hasGetSubCatbyIdSucc(state, action) {
      state.isLoading = false;
      state.getsubCatById = action.payload;
    },
    //----scenarios dropdown
    hasGetScenarioSubCategoriesListSucc(state, action){
      state.isLoading = false,
      state.getScenarioSubCategoriesListData = action.payload;
    },
  
    hasGetChildCategoriesListSucc(state, action){
    state.isLoading = false,
    state.getScenarioSubCategorybyId = action.payload;
  },

    //----student dropdown
  hasGetStudentListSucc(state, action) {
      state.isLoading = false;
      state.getStudentListData = action.payload;  
  },
  hasGetStudentListSuccreport(state, action) {
      state.isLoading = false;
      state.getStudentListDatareport = action.payload;  
  },
    //----batches dropdown
    hasGetBatchesListSucc(state, action) {
      state.isLoading = false;
      state.getBatchesListData = action.payload;  
  },
  hasGetSingleFlowchart(state,action){
    state.isLoading = false,
    state.flowchart = action.payload;
},
  hasGetSaveFlowchart(state,action){
    state.isLoading = false,
    state.saveflowchartData = action.payload;
  }, 
  hasGetInstructorListSucc(state,action){
    state.isLoading = false,
    state.getInstructorListData = action.payload;
  }, 
  hasGetComponentByCatSuccess(state,action){
    state.isLoading = false,
    state.getComponentByCatData = action.payload;
  }, 
  hasGetCommonScenarioListSucc(state,action){
    state.isLoading = false,
    state.getCommonScenarioData = action.payload;
  }, 
  hasGetCommonInstructorListSucc(state,action){
    state.isLoading = false,
    state.getCommonInstructorData = action.payload;
  }, 
  hasGetScenarioComponentByCatSuccess(state,action){
    state.isLoading = false,
    state.getScnarioComponentByCatData = action.payload;
  }, 

  hasGetFaqListSucc(state,action){
    state.isLoading = false,
    state.getFaqData = action.payload;
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
      const response = await axios.get(`${api.master_component_cat_get}`);
      dispatch(slice.actions.hasGetMasterCatListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function getSubCategorybyId(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.master_component_subcat_get}`,payload);
      dispatch(slice.actions.hasGetSubCatbyIdSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
// -----------------------------scenario dropdown-------

export function getScenarioSubCategoriesList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
   

      const response = await axios.get(`${api.scenario_sub_category_list}`);
      dispatch(slice.actions.hasGetScenarioSubCategoriesListSucc(response.data));
    } catch (error) { 
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getScenarioSubCategorybyId(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_child_category_list}`,payload);
      dispatch(slice.actions.hasGetChildCategoriesListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
export function clearScenarioSubCategorybyId() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetChildCategoriesListSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

// -----------------------------Student dropdown-------

export function getStudentList(payload) {
  return async () => { 
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.batches_student_get}`,payload);
      dispatch(slice.actions.hasGetStudentListSucc(response.data));
    } catch (error) { 
      console.log("Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getStudentListreport(payload) {

  return async () => { 
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.student_getlist}`,payload);
    dispatch(slice.actions.hasGetStudentListSuccreport(response.data));
    } catch (error) { 
      console.log("Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}
// -------------- batches dropdown---------

export function getBatchesList() {
  return async () => { 
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.batches_list}`);
      dispatch(slice.actions.hasGetBatchesListSucc(response.data));
    } catch (error) { 
      console.log("Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}
//------------------------flowchart------------
export function saveScenarioFlow(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_flowchart_save}`,payload);
      dispatch(slice.actions.hasGetSaveFlowchart(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getScenarioFlow(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_flowchart_get}`,payload);
      dispatch(slice.actions.hasGetSingleFlowchart(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}  
export function cleargetScenarioFlow() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleFlowchart([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearsaveScenarioFlow() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveFlowchart([]));
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

// -----------------------------instructor list dropdown-----------------------------------------

export function getInstructorList() {
  return async () => { 
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_instructor_list}`);
      dispatch(slice.actions.hasGetInstructorListSucc(response.data));
    } catch (error) { 
      console.log("Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getComponentListbyCategory(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.master_component_by_catId}`,payload);
      dispatch(slice.actions.hasGetComponentByCatSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
// common scenarios api  for assign scenario -------------------
export function getCommonScenarioList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.common_scenario_get}`);
      dispatch(slice.actions.hasGetCommonScenarioListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

// common Instructor api  for assign scenario -------------------

export function getCommonInstructorList(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.common_instructor_get}`,payload);
      dispatch(slice.actions.hasGetCommonInstructorListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function getScenarioComponentListbyCategory(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_component_by_catId}`,payload);
      dispatch(slice.actions.hasGetScenarioComponentByCatSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function getFaqList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.faq_get}`);
      dispatch(slice.actions.hasGetFaqListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 