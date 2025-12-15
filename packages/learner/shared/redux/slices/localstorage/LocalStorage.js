import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  error: null,
  getLocalData: [],
  setLocalData: [],
  componentData: []
};

const slice = createSlice({
  name: "localData",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasgetLocalStorageDataSucc(state, action) {
      state.isLoading = false;
      state.getLocalData = action.payload;
    },
    setLocalStorageDataSucc(state, action){
      state.isLoading = false;
      state.setLocalData = action.payload;
    },
    hasgetComponentDetailsSucc(state, action){
      state.isLoading = false;
      state.componentData = action.payload;
    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});


export default slice.reducer;

export const { openModal, closeModal, selectEvent } = slice.actions;

export function getLocalStorageData(key) {
    return async (dispatch) => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasgetLocalStorageDataSucc(JSON.parse(localStorage.getItem(key))));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }
  export function CleargetLocalStorageData() {
    return async (dispatch) => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.hasgetLocalStorageDataSucc([]));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

export function setLocalStorageData(key,data) {
    return async (dispatch) => {
      dispatch(slice.actions.startLoading());
      try {
        dispatch(slice.actions.setLocalStorageDataSucc(localStorage.setItem(key,JSON.stringify(data))));
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }
  export function clearLocalStorageKey(key) {
    return async (dispatch) => {
      dispatch(slice.actions.startLoading());
      try {
        localStorage.removeItem(key);
      } catch (error) {
        dispatch(slice.actions.hasError(error));
      }
    };
  }

  const findMenuItem=(data, currentPath)=> {
    for (let i = 0; i < data?.length; i++) {
        const currentItem = data[i];
        if (currentItem?.source === currentPath) {
          return currentItem;
        }
        if (currentItem?.children && currentItem.children.length > 0) {
          const result = findMenuItem(currentItem.children, currentPath);
          if (result) {
            return result; 
          }
        }
    }
    return "";
  }

  export function getComponentDetails(currentPath) {
    return async (dispatch) => {
      dispatch(slice.actions.startLoading());
      try {
        const response = JSON.parse(localStorage.getItem("menusLearner"));
        let currentItem = findMenuItem(response && response.length > 0 && response[0]?.Items,currentPath)
        dispatch(slice.actions.hasgetComponentDetailsSucc(currentItem));
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