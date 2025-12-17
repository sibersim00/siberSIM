import { createSlice } from "@reduxjs/toolkit";
// utils
import axios from "../../axios/axiosMaster";
//
import { dispatch } from "../../store";
import api from "../../api_urls";

// ----------------------------------------------------------------------

const initialState = {
    isLoading: false,
    error: null,
    ScenarioQuizData: [],
    saveQuizData: [],
    statusChangeData: [],
    verifyQuizData:[],
    importQuizData: [],
    deleteQuiz: [],

};

const slice = createSlice({
    name: "ScenarioQuiz",
    initialState,
    reducers: {
        // START LOADING
        startLoading(state) {
            state.isLoading = true;
        },
        hasGetQuizListSucc(state, action) {
            state.isLoading = false,
                state.ScenarioQuizData = action.payload;
        },
        hasGetSaveScenarioQuizSucc(state, action) {
            state.isLoading = false,
                state.saveQuizData = action.payload;
        },
        hasGetStatusScenarioQuizSucc(state, action) {
            state.isLoading = false,
                state.statusChangeData = action.payload;
        },
        hasVerifyQuizSuccess(state, action) {
            state.isLoading = false,
                state.verifyQuizData = action.payload;
        },
        hasGetImportScenarioQuizSucc(state, action) {
            state.isLoading = false,
                state.importQuizData = action.payload;
        },
        hasGetDeleteQuizSucc(state, action) {
            state.isLoading = false,
                state.deleteQuiz = action.payload;
        },
        //HAS ERROR
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
// export function getScenarioQuizlist() {
//   return async () => {
//     dispatch(slice.actions.startLoading());
//     try {
//      const response = await axios.get(`${api.quiz_getAll }`);
//       dispatch(slice.actions.hasGetQuizListSucc(response.data));
//     } catch (error) {
//      dispatch(slice.actions.hasError(error));
//     }
//   };
// }

export function getScenarioQuizlist(uuid) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`${api.quiz_getAll}/${uuid}`);
            dispatch(slice.actions.hasGetQuizListSucc(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}


export function saveScenarioQuiz(payload) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.post(`${api.quiz_save}`, payload);
            dispatch(slice.actions.hasGetSaveScenarioQuizSucc(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function clearsaveScenarioQuiz() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasGetSaveScenarioQuizSucc([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

export function changeQuizStatus(payload) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.post(`${api?.status_change}`, payload);
            dispatch(slice.actions.hasGetStatusScenarioQuizSucc(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

export function clearchangeQuizStatus() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasGetStatusScenarioQuizSucc([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function verifyScenarioImportQuiz(payload) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.post(api?.veriefy_import_quiz, payload);
            dispatch(slice.actions.hasVerifyQuizSuccess(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function clearVerifyScenarioImportQuiz() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasVerifyQuizSuccess([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

export function saveImportQuestion(payload) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.post(`${api?.import_quiz}`, payload);
            dispatch(slice.actions.hasGetImportScenarioQuizSucc(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

export function clearSaveImportQuestion() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasGetImportScenarioQuizSucc([]));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

export function deleteScenarioQuiz(id) {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            const response = await axios.get(`${api?.delete_quiz}/${id}`,);
            dispatch(slice.actions.hasGetDeleteQuizSucc(response.data));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

export function clearDeleteQuiz() {
    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasGetDeleteQuizSucc([]));
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
export function handleManageView(payload) {

    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasHandleMAnageSuc(payload));
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}
export function clearhandleManageView() {

    return async () => {
        dispatch(slice.actions.startLoading());
        try {
            dispatch(slice.actions.hasHandleMAnageSuc());
        } catch (error) {
            dispatch(slice.actions.hasError(error));
        }
    };
}

//----------------------------------------------------------------------
