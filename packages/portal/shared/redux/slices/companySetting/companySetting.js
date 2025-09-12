import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  exportResp: null,
  importResp: null,
};

const slice = createSlice({
  name: "masters",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasExportSucc(state, action) {
      state.isLoading = false;
      state.exportResp = action.payload;
    },
    hasImportSucc(state, action) {
      state.isLoading = false;
      state.importResp = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearExportResp(state) {
      state.exportResp = null;
    },
    clearImportResp(state) {
      state.importResp = null;
    },
  },
});

export default slice.reducer;

// ---------------- EXPORT ----------------

export function exportMastersAction() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api.export_masters, {
        responseType: "blob",
      });

      // store in Redux (optional)
      dispatch(slice.actions.hasExportSucc(response.data));

      // return blob for component usage
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

// ---------------- IMPORT ----------------

export function importMastersAction(formData) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.import_masters, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(slice.actions.hasImportSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// export function clearimportMastersAction() {
//   return async () => {
//     dispatch(slice.actions.startLoading());
//     try {
//       dispatch(slice.actions.hasImportSucc([]));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }


export function clearimportMastersAction() {
  return (dispatch) => {
    dispatch(slice.actions.hasImportSucc(null));
  };
}




