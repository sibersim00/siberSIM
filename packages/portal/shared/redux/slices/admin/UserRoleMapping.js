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
    events: [],
    getOrgUserListData:[],
    getRoleListData:[],
    getAddListData:[],
    getShowRightData:[],
    getdeleteUserRole:[],
}

const slice = createSlice({
    name: "userRoleMapping",
    initialState,
    reducers: {
      // START LOADING
      startLoading(state) {
        state.isLoading = true;
      },

       // HAS ERROR
      hasError(state, action) {
        state.isLoading = false;
        state.error = action.payload;
      },

      hasGetOrgUserListSucc(state, action){
        state.isLoading = false;
        state.getOrgUserListData = action.payload;
        
      },
      hasGetRoleistSucc(state, action){
        state.isLoading = false;
        state.getRoleListData = action.payload;
      },

      hasGetAddListSucc(state, action){
        state.isLoading = false;
        state.getAddListData = action.payload;
      },

      hasGetShowRightSucc(state, action){
        state.isLoading = false;
        state.getShowRightData = action.payload;
      },

      hasDeleteUserRoleSucc(state, action) {
        state.isLoading = false;
        state.getdeleteUserRole = action.payload;
      }
    }
})     

// Reducer
export default slice.reducer;

// Actions
export const { openModal, closeModal, selectEvent } = slice.actions;

// ----------------------------------------------------------------------


  export function getOrgUserList() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.get(api?.roles_getusers);
        dispatch(slice.actions.hasGetOrgUserListSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function getRoleList() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.get(api?.roles_getrolelist);
        dispatch(slice.actions.hasGetRoleistSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function getAddList(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(api?.roles_userrolemap, payload);
        dispatch(slice.actions.hasGetAddListSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function clearGetAddList(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetAddListSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function getShowRight(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(api?.roles_userrolerights, payload);
        dispatch(slice.actions.hasGetShowRightSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }


 // ---------------------------------------------------

 export function deleteUserRoleData(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.delete(`${api?.roles_userrolemap}/${id}`);
      dispatch(slice.actions.hasDeleteUserRoleSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDeleteUserRole(data,id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasDeleteUserRoleSucc([]));
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

