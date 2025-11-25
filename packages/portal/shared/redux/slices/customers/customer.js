import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  customerListResp: [],
  editStatusCustomerResp: [],
  addCustomerResp: [],
  editCustomerResp: [],
  customerLicenseResp: [],
  addLicenseResp: [],
  editLicenseResp: [],

};

const slice = createSlice({
  name: "customerData",
  initialState,
  reducers: {
  startLoading(state) {
      state.isLoading = true;
    },
    stopLoading(state) {
      state.isLoading = false;
    },

    hasGetCustomersListSucc(state, action) {
      state.isLoading = false;
      state.customerListResp = action.payload;
    },
   
    hasEditStatusCustomerSucc(state, action) {
      state.isLoading = false;
      state.editStatusCustomerResp = action.payload;
    },
    hasAddCustomerucc(state, action) {
      state.isLoading = false;
      state.addCustomerResp = action.payload;
    },
    hasEditCustomerSucc(state, action) {
      state.isLoading = false;
      state.editCustomerResp = action.payload;
    },
    hasgetCutomerLicenseSucc(state, action) {
      state.isLoading = false;
      state.customerLicenseResp = action.payload;
    },
    hasAddLicenseSucc(state, action) {
      state.isLoading = false;
      state.addLicenseResp = action.payload;
    },
    hasEditLicenseSucc(state, action) {
      state.isLoading = false;
      state.editLicenseResp = action.payload;
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

export function getCustomerList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(api?.customer_api_list);
      dispatch(slice.actions.hasGetCustomersListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editStatusCustomer(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.customer_change_status, payload);
      dispatch(slice.actions.hasEditStatusCustomerSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleareditStatusCustomerData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditStatusCustomerSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function addCustomerDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.customer_save, payload);
      dispatch(slice.actions.hasAddCustomerucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearAddCustomerData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddCustomerucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editCustomerDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.customer_update, payload);
      dispatch(slice.actions.hasEditCustomerSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearEditCustomerData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditCustomerSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getCustomerLicense(customer_id) {
  return async () => {
    dispatch(slice.actions.startLoading());

    try {
      const response = await axios.post(api.customer_license_get, {
        customer_id: customer_id,
      });

      dispatch(slice.actions.hasgetCutomerLicenseSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

  export function addLicenseDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.customer_license_save, payload);
      dispatch(slice.actions.hasAddLicenseSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearAddLicenseData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasAddLicenseSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function editLicenseDetails(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api?.customer_license_update, payload);
      dispatch(slice.actions.hasEditLicenseSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearEditLicenseData() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasEditLicenseSucc([]));
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