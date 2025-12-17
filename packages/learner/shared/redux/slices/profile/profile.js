import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import api from "../../api_urls";


const initialState = {
  isLoading: false,
  error: null,
  getProfileSucc:[],
  saveProfileResp: [],
  changePasswordSucc:[],
  userData: {}, 
  saveUserImageRes: [],
};

const slice = createSlice({
  name: "profiledata",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hastutorDatabyIdSucc(state, action) {
      state.isLoading = false;
      state.getProfileSucc = action.payload;
    },
    haschangePasswordSucc(state,action){
      state.isLoading = false;
      state.changePasswordSucc = action.payload;
    },  
    hasSaveProfileDataSucc(state, action) {
      state.isLoading = false;
      state.saveProfileResp = action.payload;
    },
    hasSaveUserImageSucc(state, action) {
      state.isLoading = false;
      state.saveUserImageRes = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    setUser (state, action) {
      state.userData = action.payload; 
    },
  },
});

export default slice.reducer;

export function getProfile() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.profile_get}`);
      const user = response.data.data; 
      dispatch(slice.actions.hastutorDatabyIdSucc(response.data));
      dispatch(slice.actions.setUser(user)); 
      localStorage.setItem("userLearner", JSON.stringify(user)); 
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function saveUserImage(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.profile_image_update, payload);
      dispatch(slice.actions.hasSaveUserImageSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSaveUserImage() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasSaveUserImageSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function changePassword(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.changePassword, payload);
      dispatch(slice.actions.haschangePasswordSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearChangePasswor() {
  return async (dispatch) => {
    dispatch(slice.actions.haschangePasswordSucc());
    try {
      dispatch(slice.actions.hasError([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function saveProfileData(payload) {
  return async (dispatch) => {
      dispatch(slice.actions.startLoading());
      try {
          const response = await axios.post(api?.profile_update, payload);
          dispatch(slice.actions.hasSaveProfileDataSucc(response.data)); 
      } catch (error) {
          dispatch(slice.actions.hasError(error));
      }
  };
}
export function clearSaveProfileData() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasSaveProfileDataSucc([]));
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

