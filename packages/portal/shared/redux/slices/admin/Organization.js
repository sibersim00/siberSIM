import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getOragData: [],
  addOragData: [],
  editOragData:[],
  editStatusOragData:[],
  getIdByOrag:[],
};

const slice = createSlice({
    name: "organization",
    initialState,
    reducers: {
      // START LOADING
      startLoading(state) {
        state.isLoading = true;
      },
  
      hasGetOragSucc(state, action) {
        state.isLoading = false;
        state.getOragData = action.payload;
      },
  
      hasAddOragSucc(state, action) {
        state.isLoading = false;
        state.addOragData = action.payload;
      },
  
      hasEditOragSucc(state, action) {
        state.isLoading = false;
        state.editOragData = action.payload;
      },
  
      hasEditStatusOragSucc(state, action) {
        state.isLoading = false;
        state.editStatusOragData = action.payload;
      },
  
      hasGetIdByOragSucc(state,action){
          state.isLoading = false;
          state.getIdByOrag = action.payload;
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

export function getListOfOrag() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.get(api?.org_list);
        dispatch(slice.actions.hasGetOragSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function addOragDetails(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(api?.org, payload);
        dispatch(slice.actions.hasAddOragSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function clearaddOragData() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasAddOragSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function editOragDetails(payload,id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.put(`${api?.org}/${id}`, payload);
        dispatch(slice.actions.hasEditOragSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function cleareditOragData() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasEditOragSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function editStatusOragData(payload,id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.put(`${api?.org_status}/${id}`, payload);
        dispatch(slice.actions.hasEditStatusOragSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function getIdbyOragData(id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.get(`${api?.org}/${id}`);
        dispatch(slice.actions.hasGetIdByOragSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function cleareditStatusOragData() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasEditStatusOragSucc([]));
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