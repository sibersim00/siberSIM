import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
  isLoading: false,
  error: null,
  getNormalusersData: [],
  statusChangeNormaluser: [],
  normaluserInfoResp: [],
  registerNormaluserResp: [],
  saveImportNormaluserResp: [],
  deleteNormalUser: [[]],
  saveMappedInstructorRes: [],
  getMappedInstructorByIdRes: [],
  changePasswordSucc: [],
  confirmationlearnerData: [],
};

const slice = createSlice({
  name: "NormaluserData",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    stopLoading(state) {
      state.isLoading = false;
    },
    hasgetNormalusersListSucc(state, action) {
      state.isLoading = false;
      state.getNormalusersData = action.payload;
    },
    hasNormaluserstatusSucc(state, action) {
      state.isLoading = false;
      state.statusChangeNormaluser = action.payload;
    },
    hasgetNormalusersInfoSucc(state, action) {
      state.isLoading = false;
      state.normaluserInfoResp = action.payload;
    },
    hasRegisterNormalusersucc(state, action) {
      state.registerNormaluserResp = action.payload;
    },
    hasUpdateNormalusersucc(state, action) {
      state.updateNormaluserResp = action.payload;
    },
    saveImportNormalusersucc(state, action) {
      state.isLoading = false;
      state.saveImportNormaluserResp = action.payload;
    },
    hasGetdeleteNormalUser(state, action) {
      state.isLoading = false;
      state.deleteNormalUser = action.payload;
    },
    saveMappedInstructorsucc(state, action) {
      state.isLoading = false;
      state.saveMappedInstructorRes = action.payload;
    },
    hasGetMappedInstructorByIdSucc(state, action) {
      state.isLoading = false;
      state.getMappedInstructorByIdRes = action.payload;
    },

    haschangePasswordSucc(state, action) {
      state.isLoading = false;
      state.changePasswordSucc = action.payload;
    },
    hasconfirmationlearnerData(state, action) {
      state.isLoading = false;
      state.confirmationlearnerData = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

export function getNormalusersManageList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.normalusers_get);
      dispatch(slice.actions.hasgetNormalusersListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveNormalusersChangeStatus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        api?.normalusers_change_status,
        payload
      );
      dispatch(slice.actions.hasNormaluserstatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveNormalusersChangeStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasNormaluserstatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getNormalusersInfo(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api?.normalusers_getbyid}/${id}`);
      dispatch(slice.actions.hasgetNormalusersInfoSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearNormalusersInfo() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasgetNormalusersInfoSucc([]));
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

// ----------------------------------------------------------------------
export function deleteNormalUser(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.normalusers_delete}`, payload);
      dispatch(slice.actions.hasGetdeleteNormalUser(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleardeleteNormalUser() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetdeleteNormalUser([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
// -------------- Registration -------------------------------------

export function registerNormaluser(payload) {
  return async (dispatch) => {
    try {
      if (payload?.learner_uuid) {
        const response = await axios.post(`${api.normalusers_update}`, payload);
        dispatch(slice.actions.hasUpdateNormalusersucc(response.data));
      } else {
        const response = await axios.post(`${api.normalusers_save}`, payload);
        dispatch(slice.actions.hasRegisterNormalusersucc(response.data));
      }
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearRegisterNormaluser() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasRegisterNormalusersucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleareditUserData() {
  return async (dispatch) => {
    try {
      dispatch(slice.actions.hasUpdateNormalusersucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveImportNormaluser(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api?.normalusers_import}`, payload);
      dispatch(slice.actions.saveImportNormalusersucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearImportNormaluser() {
  return async () => {
    dispatch(slice.actions.stopLoading());
    try {
      dispatch(slice.actions.saveImportNormalusersucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveMappedInstructor(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api?.save_mapped_instructor}`,
        payload
      );
      dispatch(slice.actions.saveMappedInstructorsucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveMappedInstructor() {
  return async () => {
    dispatch(slice.actions.stopLoading());
    try {
      dispatch(slice.actions.saveMappedInstructorsucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getMappedInstructorById(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api?.getmapped_instructorList_byId}`,
        payload
      );
      dispatch(slice.actions.hasGetMappedInstructorByIdSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearMappedInstructorById() {
  return async () => {
    dispatch(slice.actions.stopLoading());
    try {
      dispatch(slice.actions.hasGetMappedInstructorByIdSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changePassword(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.learners_reset, payload);
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

export function confirmationlearnerData(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.learners_confirmation, payload);
      dispatch(slice.actions.hasconfirmationlearnerData(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearconfirmationlearnerData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasconfirmationlearnerData([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
