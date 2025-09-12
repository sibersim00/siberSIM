import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getMenusData: [],
  getRoleListData: [],
  addMenusData: [],
  editMenusData:[],
  editStatusMenusData:[],
  getParentListData:[],
  getByIdData: []
};

const slice = createSlice({
  name: "menus",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },

    hasGetMenusSucc(state, action) {
      state.isLoading = false;
      state.getMenusData = action.payload;
    },
    hasGetParentListSucc(state, action){
      state.isLoading = false;
      state.getParentListData = action.payload;
    },
    hasGetRoleListSucc(state, action){
      state.isLoading = false;
      state.getRoleListData = action.payload;
    },

    hasAddMenusSucc(state, action) {
      state.isLoading = false;
      state.addMenusData = action.payload;
    },

    hasEditMenusSucc(state, action) {
      state.isLoading = false;
      state.editMenusData = action.payload;
    },

    hasEditStatusMenusSucc(state, action) {
      state.isLoading = false;
      state.editStatusMenusData = action.payload;
    },
    hasGetByIdSucc(state, action) {
      state.isLoading = false;
      state.getByIdData = action.payload;
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

export function getListOfMenus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.menus_list);
      dispatch(slice.actions.hasGetMenusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getParentList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.menus_parentlist);
      dispatch(slice.actions.hasGetParentListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getRoleList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.master_rolelist);
      dispatch(slice.actions.hasGetRoleListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addMenusDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.menus, payload);
      dispatch(slice.actions.hasAddMenusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearaddMenusData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddMenusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editMenusDetails(payload,id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.put(`${api?.menus}/${id}`, payload);
      dispatch(slice.actions.hasEditMenusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleareditMenusData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditMenusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editStatusMenusData(payload,id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.put(`${api?.menus_status}/${id}`, payload);
      dispatch(slice.actions.hasEditStatusMenusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function cleareditStatusMenusData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditStatusMenusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getById(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.menus_getmenu}/${id}`);
      dispatch(slice.actions.hasGetByIdSucc(response.data));
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