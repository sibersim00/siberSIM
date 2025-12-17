import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";


// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getQuizData: [],
  quizDetailsData: [],
  saveScenariosQuiz: [],  
  resumeQuiz: [],  

};



const slice = createSlice({
  name: "scenarios",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetQuizData(state,action){
      state.isLoading = false,
      state.getQuizData = action.payload;
    },

    hasGetSingleQuizSucc(state,action){
      state.isLoading = false,
      state.quizDetailsData = action.payload;
  },

  hasGetSaveScenarioQuizSucc(state,action){
    state.isLoading = false,
      state.saveScenariosQuiz = action.payload;

  },

  hasGetGetChatMessagesSucc(state,action){
    state.isLoading = false,
      state.getChatMessagesListData = action.payload;

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


export function getAllLearnerQuiz(scenariouuid) {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      const response = await axios.get(`${api.get_all_quiz}/${scenariouuid}`);
      dispatch(slice.actions.hasGetQuizData(response.data));
    } catch (error) { 

      dispatch(slice.actions.hasError(error));
    }
  };
}



export function clearGetAllLearnerQuiz() {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {

      dispatch(slice.actions.hasGetQuizData([]));
    } catch (error) { 

      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getQuizDetails(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.get_all_quizenario_quiz_details}`,payload);
      dispatch(slice.actions.hasGetSingleQuizSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

 
export function clearGetChatMessages() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetGetChatMessagesSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function saveScenarioQuiz(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_quiz_save}`,payload);
      dispatch(slice.actions.hasGetSaveScenarioQuizSucc(response.data));
      
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
 
export function clearSaveScenarioQuiz() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveScenarioQuizSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
 
  


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