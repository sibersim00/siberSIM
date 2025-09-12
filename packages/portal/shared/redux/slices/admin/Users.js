import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getUserData: [],
  getOragData: [],
  addUserData: [],
  editUserData:[],
  editStatusUserData:[],
  getIdByUser:[],
  changePasswordSucc:[],
  getProfileSucc:[],
  changeProfileSucc:[],
  saveImportUserResp:[],
  saveUserImageRes:[],
  resetPasswordSucc:[],

};

const slice = createSlice({
    name: "user",
    initialState,
    reducers: {
      startLoading(state) {
        state.isLoading = true;
      },
      stopLoading(state) {
        state.isLoading = false;
      },
      hasGetUserSucc(state, action) {
        state.isLoading = false;
        state.getUserData = action.payload;
      },

      hasGetOragSucc(state, action) {
        state.isLoading = false;
        state.getOragData = action.payload;
      },
  
      hasAddUserSucc(state, action) {
        state.isLoading = false;
        state.addUserData = action.payload;
      },
  
      hasEditUserSucc(state, action) {
        state.isLoading = false;
        state.editUserData = action.payload;
      },
  
      hasEditStatusUserSucc(state, action) {
        state.isLoading = false;
        state.editStatusUserData = action.payload;
      },
  
      hasGetIdByUserSucc(state,action){
          state.isLoading = false;
          state.getIdByUser = action.payload;
      },
      haschangePasswordSucc(state,action){
          state.isLoading = false;
          state.changePasswordSucc = action.payload;
      },
      hasGetProfileSucc(state,action){
          state.isLoading = false;
          state.getProfileSucc = action.payload;
      },
      haschangeProfileSucc(state,action){
          state.isLoading = false;
          state.changeProfileSucc = action.payload;
      },
      saveImportUserSucc(state, action) {
        state.isLoading = false;
        state.saveImportUserResp = action.payload;
      }, 
      hasSaveUserImageSucc(state, action) {
        state.isLoading = false;
        state.saveUserImageRes = action.payload;
      }, 
      hasresetPasswordSucc(state,action){
        state.isLoading = false;
        state.resetPasswordSucc = action.payload;
      },
      
      hasError(state, action) {
        state.isLoading = false;
        state.error = action.payload;
      },
    },
  });

export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;


export function saveUserImage(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api?.user_image}`, payload);
      dispatch(slice.actions.hasSaveUserImageSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveUserImage() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasSaveUserImageSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getListOfUser() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.get(api?.users_list);
        dispatch(slice.actions.hasGetUserSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

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

  export function addUserDetails(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(api?.users, payload);
        dispatch(slice.actions.hasAddUserSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function clearaddUserData() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasAddUserSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function editUserDetails(payload,id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.users_update}`, payload);
        dispatch(slice.actions.hasEditUserSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function cleareditUserData() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasEditUserSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function editStatusUserData(payload,id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.users_status}`, payload);
        dispatch(slice.actions.hasEditStatusUserSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function getIdbyUserData(id) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.get(`${api?.users}/${id}`);
        dispatch(slice.actions.hasGetIdByUserSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function cleareditStatusUserData() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasEditStatusUserSucc([]));
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

  export function changePassword(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(api?.change_password, payload);
        dispatch(slice.actions.haschangePasswordSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function clearChangePasswor() {
    return async () => {
      dispatch(slice.actions.haschangePasswordSucc());
      try {
        dispatch(slice.actions.hasError([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function getProfile() {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.get(api?.get_profile);
        dispatch(slice.actions.hasGetProfileSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function changeProfile(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(api?.change_profile, payload);
        dispatch(slice.actions.haschangeProfileSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function clearChangeProfile() {
    return async () => {
      dispatch(slice.actions.haschangeProfileSucc());
      try {
        dispatch(slice.actions.hasError([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  export function saveImportAdUser(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(`${api?.users_import}`,payload);
        dispatch(slice.actions.saveImportUserSucc(response.data));
      } catch (error) {
         dispatch(slice.actions.hasError(error));
      }
    };
  }
  
  export function clearImportAdUser() {
    return async () => {
      dispatch(slice.actions.stopLoading());
      try {
        dispatch(slice.actions.saveImportUserSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
}


  export function resetPassword(payload) {
    return async () => {
      dispatch(slice.actions.startLoading());
      try {
        const response = await axios.post(api?.users_reset, payload);
        dispatch(slice.actions.hasresetPasswordSucc(response.data));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }
  
  export function clearresetPassword() {
    return async () => {
      dispatch(slice.actions.hasresetPasswordSucc());
      try {
        dispatch(slice.actions.hasError([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }