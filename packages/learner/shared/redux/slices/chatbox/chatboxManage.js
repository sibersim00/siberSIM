import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";

import api from "../../api_urls";


const initialState = {
  isLoading: false,
  error: null,
  getChatMessagesListData: [],
  getRefreshMessageData: [],
  saveChatMessage: [],
  saveChatMessageSeen: [],
};

const slice = createSlice({
  name: "Chatbox",
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetGetChatMessagesSucc(state, action) {
      state.isLoading = false,
        state.getChatMessagesListData = action.payload;

    },
    hasGetRefreshChatMessage(state, action) {
      state.isLoading = false,
        state.getRefreshMessageData = action.payload;
    },
    hasGetSaveChatMessageSucc(state, action) {
      state.isLoading = false,
        state.saveChatMessage = action.payload;
    },
    hasGetChatMessageSeenSucc(state, action) {
      state.isLoading = false,
        state.saveChatMessageSeen = action.payload;

    },
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export default slice.reducer;
export const { openModal, closeModal, selectEvent } = slice.actions;


export function getChatMessages(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chatmessage_get}`, payload);
      dispatch(slice.actions.hasGetGetChatMessagesSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearGetChatMessages() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetGetChatMessagesSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getRefreshMessage(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chat_refresh}`, payload);
      dispatch(slice.actions.hasGetRefreshChatMessage(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function clearGetRefreshMessage() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetRefreshChatMessage([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function saveChatMessage(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chat_save}`, payload);
      dispatch(slice.actions.hasGetSaveChatMessageSucc(response.data));

    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearSaveChatMessage() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveChatMessageSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function chatMessageSeen(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.chat_markseen}`, payload);
      dispatch(slice.actions.hasGetChatMessageSeenSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearchatMessageSeen() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetChatMessageSeenSucc([]));
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


