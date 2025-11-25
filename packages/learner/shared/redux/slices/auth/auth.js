import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axios";
import api from "../../api_urls";
import axiosLearner from "../../axios/axiosLearner";
// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getCompanyListData: [],
  directLoginData: [],
  loginSuccessData: [],
  otpSuccessData: [],
  forgetSuccData: [],
  otpforgetSuccResp: [],
  SignupSuccessData: [],
  verifylearnerData: [],
  logout: [],
};

const slice = createSlice({
  name: "authData",
  initialState,
  reducers: {
    // START LOADING
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
    hasverifyforgotSucc(state, action) {
      state.isLoading = false;
      state.forgetSuccData = action.payload;
    },
    hasCheckForgotPassSucc(state, action) {
      state.isLoading = false;
      state.otpforgetSuccResp = action.payload;
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
    hasverifylearnerData(state, action) {
      state.isLoading = false;
      state.verifylearnerData = action.payload;
    },
    haslogOutData(state, action) {
      state.isLoading = false;
      state.logout = action.payload;
    },
  },
});

// Reducer
export default slice.reducer;

// Actions
export const { openModal, closeModal, selectEvent } = slice.actions;

// ----------------------------------------------------------------------

export function getCompanyList(data) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.company_list,data);
      dispatch(slice.actions.hasGetCompanyList(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// export function verifyLogin(data) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());
//     try {
//         const response = await axios.get(api?.company_list);
//       dispatch(slice.actions.hasLoginSuccess(response.data));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }
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
      const response = await axios.post(api?.without_otp_verify, data);
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
      const response = await axios.post(api?.learner_verifylogin, data);
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
      const response = await axios.post(api?.learner_checklogin, data);
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

// forgot password

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
      // console.log(api?.learners_Account_verify)
      const response = await axios.post(api?.learners_Account_verify, payload);
      dispatch(slice.actions.hasverifylearnerData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
// ------------------Logout
export function logOutData() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const accessToken = JSON.parse(localStorage.getItem("accessTokenLearner"));
      
      const response = await axiosLearner.post(
        api?.logout,
        {}, // body
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      dispatch(slice.actions.haslogOutData(response.data));
    } catch (error) {
      console.log("hasError");
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearlogOutData() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.haslogOutData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}