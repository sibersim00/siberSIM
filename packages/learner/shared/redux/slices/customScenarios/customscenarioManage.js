import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosLearner";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getScenarioListData: [],
  statusChangeScenarios: [],
  deleteScenarios: [],
  saveScenarios: [],
  updateScenarios: [],
  singleScenarios: [],
  assignScenario: [],
  saveTermination: [],
  saveTerminationlogs: [],
  saveTerminationevents: [],
  getScenarioListapprovedData: [],
  viewNameResp: "card",
  getScenarioDigListData: [],
  saveComponentConfigData: [],
  saveflowchartData: [],
  saveTerminationeventslogs: [],
  importResp: [],
  success: null,
};

const slice = createSlice({
  name: "customScenario",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetScenarioListSucc(state, action) {
      (state.isLoading = false), (state.getScenarioListData = action.payload);
    },
    hasGetScenarioListapprovedSucc(state, action) {
      (state.isLoading = false), (state.getScenarioListapprovedData = action.payload);
    },
    // hasGetSaveScenariosSucc(state,action){
    //     state.isLoading = false,
    //     state.saveScenarios = action.payload;
    // },
    hasScenariosStatusSucc(state, action) {
      state.isLoading = false;
      state.statusChangeScenarios = action.payload;
    },
    hasGetdeleteScenariosSucc(state, action) {
      state.isLoading = false;
      state.deleteScenarios = action.payload;
    },
    hasGetterminateFailedScenario(state, action) {
      (state.isLoading = false), (state.saveTermination = action.payload);
    },
    hasGetSaveFlowchart(state, action) {
      (state.isLoading = false), (state.saveflowchartData = action.payload);
    },
    hasGetterminateFailedEvents(state, action) {
      (state.isLoading = false), (state.saveTerminationevents = action.payload);
    },
    hasGetterminateFailedLogs(state, action) {
      (state.isLoading = false), (state.saveTerminationlogs = action.payload);
    },
    hasGetterminateFailedeventsLogs(state, action) {
      (state.isLoading = false),
        (state.saveTerminationeventslogs = action.payload);
    },
    hasImportSucc(state, action) {
      state.isLoading = false;
      state.importResp = action.payload;
    },

    hasGetSaveScenariosSucc(state, action) {
      (state.isLoading = false), (state.saveScenarios = action.payload);
    },
    hasGetUpdateScenariosSucc(state, action) {
      (state.isLoading = false), (state.updateScenarios = action.payload);
    },

    hasGetSingleScenariosSucc(state, action) {
      (state.isLoading = false), (state.singleScenarios = action.payload);
    },
    hasGetAssignScenariosSucc(state, action) {
      (state.isLoading = false), (state.assignScenario = action.payload);
    },
    hasHandleMAnageSuc(state, action) {
      (state.isLoading = false), (state.viewNameResp = action.payload);
    },
    hasGetScenarioDigListSucc(state, action) {
      (state.isLoading = false),
        (state.getScenarioDigListData = action.payload);
    },
    hasExportSucc(state, action) {
      (state.isLoading = false), (state.success = action.payload);
    },
    hasGetSaveConfigSucc(state, action) {
      (state.isLoading = false),
        (state.saveComponentConfigData = action.payload);
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
export function getScenarioList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_get}`);
      dispatch(slice.actions.hasGetScenarioListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function getScenarioListapproved() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_custom_getapproved}`);
      dispatch(slice.actions.hasGetScenarioListapprovedSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusScenarios(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api?.scenario_change_status}`,
        payload
      );
      dispatch(slice.actions.hasScenariosStatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearScenariosChangeStatus() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasScenariosStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteScenarios(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_delete}`, payload);
      dispatch(slice.actions.hasGetdeleteScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function cleardeleteScenarios() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetdeleteScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function customsaveScenarios(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.custom_scenario_save}`, payload);
      dispatch(slice.actions.hasGetSaveScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSaveScenarios() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateScenarios(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.scenario_custom_update}`,
        payload
      );
      dispatch(slice.actions.hasGetUpdateScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearUpdateScenarios() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSinglecustomScenarios(id) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(
        `${api.scenario_single_custom_get}/${id}`
      );
      dispatch(slice.actions.hasGetSingleScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSingleScenarios() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveAssignScenario(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.assign_scenario}`, payload);
      dispatch(slice.actions.hasGetAssignScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearsaveAssignScenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetAssignScenariosSucc([]));
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

export function handleManageView(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasHandleMAnageSuc(payload));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearhandleManageView() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasHandleMAnageSuc());
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSenarioDigramList() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_digram_custom_list}`);
      dispatch(slice.actions.hasGetScenarioDigListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function saveComponentConfiguration(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.save_component_config}`,
        payload
      );
      dispatch(slice.actions.hasGetSaveConfigSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSaveComponentConfiguration() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveConfigSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
//----------------------------------------------------------------------
//----------scenario termination----------

export function terminateFailedScenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.termination_Failed_Scenario}`);
      dispatch(slice.actions.hasGetterminateFailedScenario(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearterminateFailedScenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetterminateFailedScenario([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function terminateFailedEvents() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.termination_Failed_Events}`);
      dispatch(slice.actions.c(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearterminateFailedEvents() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.terminateFailedEvents([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function terminateFailedLogs() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.termination_Failed_Logs}`);
      dispatch(slice.actions.hasGetterminateFailedLogs(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function terminateFailedEventLogs() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.termination_Failed_Events_logs}`);
      dispatch(slice.actions.hasGetterminateFailedeventsLogs(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// zip file
export function exportSelectedScenariosAction(payload) {
  return async (dispatch) => {
    // ⚠️ Add dispatch param here
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.scenario_export_zip, payload, {
        responseType: "arraybuffer", // ✅ use arraybuffer, not blob
      });

      dispatch(slice.actions.hasExportSucc(response.data));
      return response.data;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

//import
export function importScenarioZip(formData) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(api.scenario_import_zip, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(slice.actions.hasImportSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearimportMastersAction() {
  return (dispatch) => {
    dispatch(slice.actions.hasImportSucc(null));
  };
}

export function saveScenarioFlow(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.scenario_flowchart_save}`,
        payload
      );
      dispatch(slice.actions.hasGetSaveFlowchart(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearsaveScenarioFlow() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveFlowchart([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getSingleScenarios(id) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_single_custom_get}/${id}`);
      dispatch(slice.actions.hasGetSingleScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
} 
