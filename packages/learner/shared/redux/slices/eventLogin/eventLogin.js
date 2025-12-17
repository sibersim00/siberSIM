import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axios";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getCompanyListData: [],
  directLoginData: [],
  loginSuccessData: [],
  otpSuccessData: [],
  getEventListData :[],
  forgetSuccData: [],
  otpforgetSuccResp: [],
  SignupSuccessData: [],
  verifylearnerData: [],
};

const slice = createSlice({
  name: "eventData",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },

    hasGetCompanyList(state, action) {
      state.isLoading = false;
      state.getCompanyListData = action.payload;
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
    hasGetEventList(state, action) {
      state.isLoading = false;
      state.getEventListData = action.payload;
    },
    hasverifyforgotSucc(state, action) {
      state.isLoading = false;
      state.forgetSuccData = action.payload;
    },
    hasCheckForgotPassSucc(state, action) {
      state.isLoading = false;
      state.otpforgetSuccResp = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    hasSignupSuccess(state, action) {
      state.isLoading = false;
      state.SignupSuccessData = action.payload;
    },
    hasverifylearnerData(state, action) {
      state.isLoading = false;
      state.verifylearnerData = action.payload;
    },
  },
});

export default slice.reducer;

export const { openModal, closeModal, selectEvent } = slice.actions;


export function getCompanyList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.company_list);
      dispatch(slice.actions.hasGetCompanyList(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearGetCompanyList() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasGetCompanyList([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function dispatchDirectLogin(data) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.event_without_otp_verify, data);
      dispatch(slice.actions.hasDirectLoginSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDispatchDirectLogin() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasDirectLoginSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function verifyLogin(data) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.event_learner_verifylogin, data);
      dispatch(slice.actions.hasLoginSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearVerifyLogin() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasLoginSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function dispatchFromUserPass(data) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.event_learner_checklogin, data);
      dispatch(slice.actions.hasOtpSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleardispatchFromUserPass() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasOtpSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getEventList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.event_list);
      dispatch(slice.actions.hasGetEventList(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function verifyForgot(data) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.learner_verifyforgot, data);
      dispatch(slice.actions.hasverifyforgotSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearVerifyForgot() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasverifyforgotSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function checkForgotpassword(data) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.learner_checkforgot, data);
      dispatch(slice.actions.hasCheckForgotPassSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearCheckForgotpassword() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasCheckForgotPassSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function SignupStudent(data) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.learner_register, data);
      dispatch(slice.actions.hasSignupSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearDispatchFromSignup() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasSignupSuccess([]));
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


export function verifylearnerData(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.learners_Account_verify, payload);
      dispatch(slice.actions.hasverifylearnerData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
