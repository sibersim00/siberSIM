import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getRoleData: [],
  addRoleData: [],
  viewRoleMenuData:[],
  deleteRoleData: [],
  editStatusRoleData: [],
  getIdByRole: [],
  addIdRoleMenu: [],
  storeRoleMenusData: []
};

const slice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },

    hasGetRoleSucc(state, action) {
      state.isLoading = false;
      state.getRoleData = action.payload;
    },

    hasAddRoleSucc(state, action) {
      state.isLoading = false;
      state.addRoleData = action.payload;
    },
    hasDeleteRoleSucc(state, action) {
      state.isLoading = false;
      state.deleteRoleData = action.payload;
    },

    hasEditStatusRoleSucc(state, action) {
      state.isLoading = false;
      state.editStatusRoleData = action.payload;
    },

    hasGetIdByRoleSucc(state, action) {
      state.isLoading = false;
      state.getIdByRole = action.payload;
    },

    hasAddIdRoleMenuSucc(state, action) {
      state.isLoading = false;
      state.addIdRoleMenu = action.payload;
    },
    hasGetViewRoleMenuSucc(state, action) {
      state.isLoading = false;
      state.viewRoleMenuData = action.payload;
    },
    hasGetStoreRoleMenusSucc(state, action) {
      state.isLoading = false;
      state.storeRoleMenusData = action.payload;
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

export function getListOfRole() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.roles_list);
      dispatch(slice.actions.hasGetRoleSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addRoleDetails(id,payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api?.roles_upsert}/${id}`, payload);
      dispatch(slice.actions.hasAddRoleSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearaddRoleData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddRoleSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function editStatusRoleData(payload, id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api?.roles_status}/${id}`, payload);
      dispatch(slice.actions.hasEditStatusRoleSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getViewRoleMenusData(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.roles_viewrolemenus, payload);
      dispatch(slice.actions.hasGetViewRoleMenuSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function storeRoleMenus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.roles_storerolemenus ,payload);
      dispatch(slice.actions.hasGetStoreRoleMenusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearStoreRoleMenus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetStoreRoleMenusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function cleareditStatusRoleData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditStatusRoleSucc([]));
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