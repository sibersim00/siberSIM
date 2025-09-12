import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axios";
import { dispatch } from "../../store";
import api from "../../api_urls";
import axiosmaster from "../../axios/axiosMaster";
// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  events: [],
 
  loginSuccessData: [],
  directLoginData: [],
  otpSuccessData: [],
  orgData: [],
  forgetSuccessData: [],
  forgetChangepass: [],
  SignupSuccessData: [],
};

const slice = createSlice({
  name: "instructorLogin",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },

   
    hasLoginSuccess(state, action) {
      state.isLoading = false;
      state.loginSuccessData = action.payload;
    },
    hasDirectLoginSuccess(state, action) {
      state.isLoading = false;
      state.directLoginData = action.payload;
    },
    hasOtpSuccess(state, action) {
      state.isLoading = false;
      state.otpSuccessData = action.payload;
    },

    hasorgData(state, action) {
      state.isLoading = false;
      state.orgData = action.payload;
    },
    hasdispatchForgetSucc(state, action) {
      state.isLoading = false;
      state.forgetSuccessData = action.payload;
    },
    hasChangepaswordSucc(state, action) {
      state.isLoading = false;
      state.forgetChangepass = action.payload;
    },
    // HAS ERROR
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    hasSignupSuccess(state, action) {
      state.isLoading = false;
      state.SignupSuccessData = action.payload;
    },
  },
});

// Reducer
export default slice.reducer;

// Actions
export const { openModal, closeModal, selectEvent } = slice.actions;

// ----------------------------------------------------------------------

export function dispatchDirectLogin(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.without_otp_verify_inst, data);
      dispatch(slice.actions.hasDirectLoginSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDispatchDirectLogin() {
  return async () => {
    try {
      dispatch(slice.actions.hasDirectLoginSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function dispatchFromLogin(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_verifylogin, data);
      dispatch(slice.actions.hasLoginSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDispatchFromLogin() {
  return async () => {
    try {
      dispatch(slice.actions.hasLoginSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDispatchFromSignup() {
  return async () => {
    try {
      dispatch(slice.actions.hasSignupSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function dispatchFromLoginOtp(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_checklogin, data);
      dispatch(slice.actions.hasOtpSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDispatchFromOtp() {
  return async () => {
    try {
      dispatch(slice.actions.hasOtpSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getorgData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.instructor_orglist);
      dispatch(slice.actions.hasorgData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

//forget password

export function dispatchFromForget(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_verifyforgot, data);
      dispatch(slice.actions.hasdispatchForgetSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDispatchFromForget() {
  return async () => {
    try {
      dispatch(slice.actions.hasdispatchForgetSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changepasswordForget(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_checkforgot, data);
      dispatch(slice.actions.hasChangepaswordSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearChangepasswordForget() {
  return async () => {
    try {
      dispatch(slice.actions.hasChangepaswordSucc([]));
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


export function SignupInstructor(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_signup, data);
      dispatch(slice.actions.hasSignupSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}



// ----------------------------------------------------------------------
