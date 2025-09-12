import { createSlice } from "@reduxjs/toolkit";

import axios from '../../../utils/axiosMaster';
import { dispatch } from "../../store";
import api from "../../api_urls";


const initialState = {
  isLoading: false,
  error: null,
  downloadedFileData: [],
};

const slice = createSlice({
  name: "commonNotification",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetDownloadFileSucc(state, action) {
      state.isLoading = false;
      state.downloadedFileData = action.payload;
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

// ----------------------------------------------------------------------

export function getDownloadFile(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post("/download", payload, {
        responseType: 'blob', 
      });
      const fileName = payload?.filename.substring(payload?.filename.lastIndexOf("/") + 1);
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const fileUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      dispatch(slice.actions.hasGetDownloadFileSucc(response));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


// =============== original ==================//
// export function getDownloadFile(payload) {
//   return async () => {
//     dispatch(slice.actions.startLoading());
//     try {
//       const response = await axios.post("/download",payload);
//       const fileName = payload?.filename.substring(payload?.filename.lastIndexOf("/") + 1);
//       const blob = new Blob([response], { type: response.headers['content-type'] });
//       const fileUrl = URL.createObjectURL(blob);
//       const downloadLink = document.createElement('a');
//       downloadLink.href = fileUrl;
//       downloadLink.download = fileName; 
//       document.body.appendChild(downloadLink); 
//       downloadLink.click(); 
//       document.body.removeChild(downloadLink);

//       dispatch(slice.actions.hasGetDownloadFileSucc(response));
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }

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