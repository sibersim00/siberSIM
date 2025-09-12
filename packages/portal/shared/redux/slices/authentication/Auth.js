import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axios";
import { dispatch } from "../../store";
import api from "../../api_urls";
import axiosMaster from "../../axios/axiosMaster";
// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getCompanyListData: [],
  directLoginData: [],
  verifyMessage: "",
  verifyMessagelearner: "",
  loginSuccessData: [],
  otpSuccessData: [],
  orgData: [],
  forgetSuccessData: [],
  forgetChangepass: [],
  SignupSuccessData: [],
  verifyInstructorData: [],
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
    hasverifyInstructorData(state, action) {
      state.isLoading = false;
      state.verifyInstructorData = action.payload;
    },
    hasverifyInstructorData: (state, action) => {
      state.isLoading = false;
      state.verifyMessage = action.payload.message;
    },
    hasverifylearnerData(state, action) {
      state.isLoading = false;
      state.verifylearnerData = action.payload;
    },
    hasverifylearnerDatamessage: (state, action) => {
      state.isLoading = false;
      state.verifyMessagelearner = action.payload.message;
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

export function getCompanyList() {
  return async () => {
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
  return async () => {
    try {
      dispatch(slice.actions.hasGetCompanyList([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function dispatchDirectLogin(data) {
  return async () => {
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
      const response = await axios.post(api?.verifylogin, data);
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

export function dispatchFromLoginOtp(data) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.checklogin, data);
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
      const response = await axios.get(api?.orglist);
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
      const response = await axios.post(api?.verifyforgot, data);
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
      const response = await axios.post(api?.checkforgot, data);
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
export function clearDispatchFromSignup() {
  return async () => {
    try {
      dispatch(slice.actions.hasSignupSuccess([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
// verify instructor
export function verifyInstructorData(payload) {

  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
     const response = await axios.post(api?.instructor_verifyByID, payload);
      dispatch(slice.actions.hasverifyInstructorData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// viewOrderRequest function
export function clearverifyInstructorData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditStatusInstructorSucc([]));
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

// viewOrderRequest function
export function clearverifylearnerData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditStatuslearnerSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function logOutData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const accessToken = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axiosMaster.post(
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
  return async () => {
    try {
      dispatch(slice.actions.haslogOutData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

