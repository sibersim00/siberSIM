import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
//
import { dispatch } from "../../store";
import api from "../../api_urls";


const initialState = {
    isLoading: false,
    error: null,
    getAdminLogListData: [],
    getInstructorLogListData: [],
    getUserLogListData: [],

};

const slice = createSlice({
    name: "Reports",
    initialState,
    reducers: {
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
        },
        hasGetAdminLogslist(state, action) {
            state.isLoading = false,
                state.getAdminLogListData = action.payload;
        },
        hasGetInstructorLogslist(state, action) {
            state.isLoading = false,
                state.getInstructorLogListData = action.payload;
        },
        hasGetUserLogslist(state, action) {
            state.isLoading = false,
                state.getUserLogListData = action.payload;
        },
        //HAS ERROR
        hasError(state, action) {
            state.isLoading = false;
            state.error = action.payload;
        },
    },
});


export default slice.reducer;
// Actions
export const { openModal, closeModal, selectEvent } = slice.actions;


export function getAdminLogsList() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`${api.admin_logs}`);
            dispatch(slice.actions.hasGetAdminLogslist(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}


export function getInstructorLogsList() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`${api.instructor_logs}`);
            dispatch(slice.actions.hasGetInstructorLogslist(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

export function getUserLogsList() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`${api.user_logs}`);
            dispatch(slice.actions.hasGetUserLogslist(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function clearScenariosChangeStatus() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasScenariosStatusSucc([]));
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
