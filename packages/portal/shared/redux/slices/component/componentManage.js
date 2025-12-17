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
  getComponentListData: [],
  statusChangeComponent: [],
  deleteComponent: [],
  saveComponent: [], 
  updateComponent:[],
  getsubCatById : [],
  singleComponent: [],
  vmDetail: [],
  viewNameResp: "card"
};

const slice = createSlice({
  name: "Component",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetComponentListSucc(state,action){
      state.isLoading = false,
      state.getComponentListData = action.payload;
    },
    hasGetSaveComponentSucc(state,action){
        state.isLoading = false,
        state.saveComponent = action.payload;
    },
    hasComponentStatusSucc(state, action) {
        state.isLoading = false;
        state.statusChangeComponent = action.payload;
      },
      hasGetdeleteComponentSucc(state, action) {
        state.isLoading = false;
        state.deleteComponent = action.payload;
      },
      hasGetVMDetailSucc(state, action) {
        state.isLoading = false;
        state.vmDetail = action.payload;
      },
      hasGetSaveComponentSucc(state,action){
        state.isLoading = false,
        state.saveComponent = action.payload;
    },
    hasGetUpdateComponentSucc(state,action){
      state.isLoading = false,
      state.updateComponent = action.payload;
  },

    hasGetSingleComponentSucc(state,action){
      state.isLoading = false,
      state.singleComponent = action.payload;
  },
  hadHandleMAnageSuc(state,action){
    state.isLoading = false,
    state.viewNameResp = action.payload;
  },
  hasGetSubCatbyIdSucc(state, action) {
    state.isLoading = false;
    state.getsubCatById = action.payload;
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
export function getComponentList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
     const response = await axios.get(`${api.component_get}`);
      dispatch(slice.actions.hasGetComponentListSucc(response.data));
    } catch (error) {
     dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusComponent(payload) {
   return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.component_change_status}`, payload);
        dispatch(slice.actions.hasComponentStatusSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function clearComponentChangeStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasComponentStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteComponent(payload) {
  
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.component_delete}`,payload);
        dispatch(slice.actions.hasGetdeleteComponentSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}

export function cleardeleteComponent() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetdeleteComponentSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 
 
export function saveComponent(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api.component_save}`,payload);
        dispatch(slice.actions.hasGetSaveComponentSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}
export function clearSaveComponent() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasGetSaveComponentSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
} 

export function updateComponent(payload) { 
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.component_update}`,payload);
      dispatch(slice.actions.hasGetUpdateComponentSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearUpdateComponent() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateComponentSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 

export function getSingleComponent(uuid) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.component_single}/${uuid}`);
      dispatch(slice.actions.hasGetSingleComponentSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
export function clearSingleComponent() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleComponentSucc([]));
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


export function handleManageView(payload) {

  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hadHandleMAnageSuc(payload));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


//------------proxmox------------

export function getSubCategorybyId(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.component_subcategory_list}`,payload);
      dispatch(slice.actions.hasGetSubCatbyIdSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 




export function getVMDetail(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.component_subcategory_VMDetail}`, payload);
      dispatch(slice.actions.hasGetVMDetailSucc(response.data));
      return response.data; 
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error; 
    }
  };
}
