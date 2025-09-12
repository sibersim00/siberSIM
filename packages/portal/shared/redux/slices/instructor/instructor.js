import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  events: [],
  getOragData: [],
  addInstructorData: [],
  editInstructorData: [],
  getInstructorData:[],
  editStatusInstructorData: [],
  listinstructorData: [],
  cleareditStatusInstructorData: [],
  confirmationInstructorData: [],
  clearconfirmationInstructorData: [],
  verifyInstructorData:[],
  clearverifyInstructorData:[],
  changePasswordSucc: [],
  getProfileSucc: [],
  changeProfileSucc: [],
};

const slice = createSlice({
  name: "InstructorData",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    stopLoading(state) {
      state.isLoading = false;
    },
    hasGetinstructorSucc(state, action) {
      state.isLoading = false;
      state.listinstructorData = action.payload;
    },
   

    hasGetOragSucc(state, action) {
      state.isLoading = false;
      state.getOragData = action.payload;
    },

    hasAddInstructorSucc(state, action) {
      state.isLoading = false;
      state.addInstructorData = action.payload;
    },

    hasEditinstructorSucc(state, action) {
      state.isLoading = false;
      state.editInstructorData = action.payload;
    },
    hasgetInstructorInfoSucc(state, action) {
      state.isLoading = false;
      state.getInstructorData = action.payload;
    },

    hasEditStatusInstructorSucc(state, action) {
      state.isLoading = false;
      state.editStatusInstructorData = action.payload;
    },

    hasconfirmationInstructorData(state, action) {
      state.isLoading = false;
      state.confirmationInstructorData = action.payload;
    },


    hasGetIdByUserSucc(state, action) {
      state.isLoading = false;
      state.getIdByUser = action.payload;
    },

    haschangePasswordSucc(state, action) {
      state.isLoading = false;
      state.changePasswordSucc = action.payload;
    },
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

export function getListOfinstructor() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.instructor_get);
      dispatch(slice.actions.hasGetinstructorSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addinstructorDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_save, payload);
      dispatch(slice.actions.hasAddInstructorSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearaddInstructorData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddInstructorSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getInstructor(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.instructor_getbyid}/${id}`);
      dispatch(slice.actions.hasgetInstructorInfoSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
  
export function cleargetInstructorData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasgetInstructorInfoSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editInstructorDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_update, payload);
      dispatch(slice.actions.hasEditinstructorSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleareditInstructorData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditinstructorSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editStatusInstructorData(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_change_status, payload);
      dispatch(slice.actions.hasEditStatusInstructorSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function confirmationInstructorData(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_verify, payload);
      console.log("API Response:", response); 
      dispatch(slice.actions.hasconfirmationInstructorData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearconfirmationInstructorData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasconfirmationInstructorData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleareditStatusInstructorData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditStatusInstructorSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changePassword(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.instructor_reset, payload);
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