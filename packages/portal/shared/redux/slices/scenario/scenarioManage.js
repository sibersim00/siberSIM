import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios/axiosMaster";
import { dispatch } from "../../store";
import api from "../../api_urls";

const initialState = {
  isLoading: false,
  error: null,
  getScenarioListData: [],
  statusChangeScenarios: [],
  statusChangemanipulationScenarios: [],
  deleteScenarios: [],
  saveScenarios: [],
  updateScenarios: [],
  singleScenarios: [],
  assignScenario: [],
  saveTermination: [],
  saveTerminationlogs: [],
  saveTerminationevents: [],
  viewNameResp: "card",
  getScenarioDigListData: [],
  saveComponentConfigData: [],
  saveTerminationeventslogs: [],
  importResp: [],
  scenarioImportData: [],
  ScenarioexportList: [],
  ScenarioExport: [],
  exportscenario:[],
  exportTriggerResponse:[],
  exportDownloadResponse:[],
  getExportComponents:[],
  getInProgressExports:[],
  triggerScenarioImport:[],
  getScenarioImportList:[],
  checkScenarioIdentification:[],
  downloadScenarioExport:[],
  hastriggerScenariostartrestore:[],
  getzststatus:[],
  exportData: null,
  manipulation: false,
};

const slice = createSlice({
  name: "scenarioManage",
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    hasGetScenarioListSucc(state, action) {
    state.isLoading = false;
    state.getScenarioListData = action.payload.data;
    state.manipulation = action.payload.manipulation;
    },
    hasScenariosStatusSucc(state, action) {
      state.isLoading = false;
      state.statusChangeScenarios = action.payload;
    },
    hasScenariosmanipulationStatusSucc(state, action) {
      state.isLoading = false;
      state.statusChangemanipulationScenarios = action.payload;
    },
    hasGetdeleteScenariosSucc(state, action) {
      state.isLoading = false;
      state.deleteScenarios = action.payload;
    },
    hasGetterminateFailedScenario(state, action) {
      (state.isLoading = false), (state.saveTermination = action.payload);
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
      console.log("action.payloadaction.payload", action.payload);
      (state.isLoading = false), (state.viewNameResp = action.payload);
    },
    hasGetScenarioDigListSucc(state, action) {
      (state.isLoading = false),
        (state.getScenarioDigListData = action.payload);
    },
    hasGetSaveConfigSucc(state, action) {
      (state.isLoading = false),
        (state.saveComponentConfigData = action.payload);
    },
    hasGetScenarioImportSucc(state, action) {
      (state.isLoading = false),
        (state.scenarioImportData = action.payload);
    },
    hasGetScenarioexportListSucc(state, action) {
      (state.isLoading = false), (state.ScenarioexportList = action.payload);
    },
    hasGetScenarioExportSucc(state, action) {
      (state.isLoading = false), (state.ScenarioExport = action.payload);
    },
    hasGetScenarioExport(state, action) {
      (state.isLoading = false), (state.exportscenario = action.payload);
    },
    hasExportSuccess(state, action) {
      state.isLoading = false;
      state.exportData = action.payload;
      state.success = true;
    },
    triggerScenarioExportSuccess: (state, action) => {
      state.isLoading = false;
      state.exportTriggerResponse = action.payload;
    },
    downloadScenarioExportSuccess: (state, action) => {
      state.isLoading = false;
      state.exportDownloadResponse = action.payload;
    },
    getExportComponentsSuccess: (state, action) => {
      state.isLoading = false;
      state.getExportComponents = action.payload;
    },
    getInProgressExportsSuccess: (state, action) => {
      state.isLoading = false;
      state.getInProgressExports = action.payload;
    },
    triggerScenarioImportSuccess: (state, action) => {
      state.isLoading = false;
      state.triggerScenarioImport = action.payload;
    },
    getScenarioImportListSuccess: (state, action) => {
      state.isLoading = false;
      state.getScenarioImportList = action.payload;
    },
    checkScenarioIdentificationSuccess: (state, action) => {
      state.isLoading = false;
      state.checkScenarioIdentification = action.payload;
    },
    downloadScenarioExportSuccess: (state, action) => {
      state.isLoading = false;
      state.downloadScenarioExport = action.payload;
    },
    triggerScenariostartrestore: (state, action) => {
      state.isLoading = false;
      state.hastriggerScenariostartrestore = action.payload;
    },
    getzststatussuccess: (state, action) => {
      state.isLoading = false;
      state.getzststatus = action.payload;
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
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_get}`);
      console.log("responsecccccccccccccc",response);
      
      dispatch(slice.actions.hasGetScenarioListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function changeStatusScenarios(payload) {
  return async () => {
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
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasScenariosStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function changeManipulationStatus(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api?.scenario_manipulation_status}`,
        payload
      );
      dispatch(slice.actions.hasScenariosmanipulationStatusSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearchangeManipulationStatus() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasScenariosmanipulationStatusSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function deleteScenarios(payload) {
  return async () => {
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
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetdeleteScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveScenarios(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_save}`, payload);
      dispatch(slice.actions.hasGetSaveScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSaveScenarios() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSaveScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function updateScenarios(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_update}`, payload);
      dispatch(slice.actions.hasGetUpdateScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearUpdateScenarios() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetUpdateScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getSingleScenarios(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_single}/${id}`);
      dispatch(slice.actions.hasGetSingleScenariosSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function clearSingleScenarios() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetSingleScenariosSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function saveAssignScenario(payload) {
  return async () => {
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
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetAssignScenariosSucc([]));
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

export function getSenarioDigramList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_digram_list}`);
      dispatch(slice.actions.hasGetScenarioDigListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}
export function saveComponentConfiguration(payload) {
  return async () => {
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
  return async () => {
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
  return async () => {
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
  return async () => {
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

export function getScenarioImport(id) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.scenario_import}/${id}`);
      dispatch(slice.actions.hasGetScenarioImportSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getScenarioExportList() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.export_list}`);
      dispatch(slice.actions.hasGetScenarioexportListSucc(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function createScenarioExport(payload) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.create_export_zip}`, payload);
      dispatch(slice.actions.hasGetScenarioExportSucc(response.data));
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

// triggerScenarioExport — fires and forgets, does NOT wait for ZIP
export function triggerScenarioExport(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.scenario_trigger_export}`, payload);
      dispatch(slice.actions.triggerScenarioExportSuccess(response.data));
      return response;
    } catch (error) {
      console.error("triggerScenarioExport Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function getExportComponents(payload) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(`${api.export_components}`, payload);
      dispatch(slice.actions.getExportComponentsSuccess(response.data));
      return response.data;
    } catch (error) {
      console.error("getExportComponents Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getInProgressExportsScenario() {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(`${api.export_list_inprogress}`);
      dispatch(slice.actions.getInProgressExportsSuccess(response.data));
      // return response.data; // ← must return
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function clearScenarioExport() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      dispatch(slice.actions.hasGetScenarioExportSucc([]));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}


export function triggerScenarioImport(formData) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.scenario_trigger_import}`,  // add to your api config
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      dispatch(slice.actions.triggerScenarioImportSuccess(response.data));
      return response;
    } catch (error) {
      console.error("[triggerScenarioImport] Error:", error);
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function startScenarioRestore(formData) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());

    try {
      const response = await axios.post(
        `${api.scenario_start_restore}`,
        formData,
      );

      dispatch(
        slice.actions.triggerScenariostartrestore(
          response.data,
        ),
      );

      return response;

    } catch (error) {

      console.error(
        "[triggerScenarioImport] Error:",
        error,
      );

      dispatch(slice.actions.hasError(error));

      throw error;
    }
  };
}

export function checkScenarioIdentification(formData) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(
        `${api.scenario_check_import}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      dispatch(slice.actions.checkScenarioIdentificationSuccess(response.data));
      return response;
    } catch (error) {
      console.error("[checkScenarioIdentification] Error:", error);
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function pollImportStatus(importid) {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${api.scenario_import_status}/${importid}`);
      dispatch(slice.actions.getScenarioImportListSuccess(response.data?.data || []));
      return response;
    } catch (error) {
      console.error("[pollImportStatus] Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}

// export function downloadScenarioZIP({ exportid }) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());

//     try {
//       const response = await axios.get(
//         `${api.scenario_trigger_zip}?exportid=${exportid}`,
//         {
//           responseType: "blob",
//         },
//       );

//       // interceptor may unwrap response.data — handle both cases
//       const blob = response?.data instanceof Blob ? response.data : response;

//       dispatch(slice.actions.downloadScenarioExportSuccess(blob));

//       return blob;
//     } catch (error) {
//       console.error("downloadScenarioZIP Error:", error);
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }
export function downloadScenarioZIP({ exportid, scenarioid }) {
  return async (dispatch) => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(
        `${api.scenario_trigger_zip}`,
        {
          params:       { exportid, scenarioid }, // ← both params
          responseType: "blob",
        },
      );

      const blob = response?.data instanceof Blob ? response.data : response;
      dispatch(slice.actions.downloadScenarioExportSuccess(blob));
      return blob;
    } catch (error) {
      console.error("downloadScenarioZIP Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}

// export function downloadScenarioComponent({ exportid, file_name, onProgress}) {
//   return async (dispatch) => {
//     dispatch(slice.actions.startLoading());

//     try {
//       const params = new URLSearchParams({ exportid, file_name });

//       // const response = await axios.get(
//       //   `${api.scenario_trigger_zst}?${params}`,
//       //   {
//       //     responseType: "blob",
//       //   },
//       // );
//       const response = await axios.get(`${api.scenario_trigger_zst}`, {
//         params:       { exportid, file_name },
//         responseType: "blob",
//         onDownloadProgress: (e) => {
//           if (e.total && onProgress) {
//             const pct = Math.round((e.loaded / e.total) * 100);
//             onProgress(pct, e.loaded, e.total);
//           }
//         },
//       });
//       const blob = response?.data instanceof Blob ? response.data : response;
//       dispatch(slice.actions.downloadScenarioExportSuccess(blob));
//       return blob;
//     } catch (error) {
//       dispatch(slice.actions.hasError(error));
//     }
//   };
// }
export function downloadScenarioComponent({ exportid, file_name, onProgress, signal }) {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${api.scenario_trigger_zst}`, {
        params:       { exportid, file_name },
        responseType: "blob",
        signal,
        onDownloadProgress: (e) => {
          if (e.total && onProgress) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct, e.loaded, e.total);
          }
        },
      });
      const blob = response?.data instanceof Blob ? response.data : response;
      return blob;
    } catch (error) {
      // ← fix cancel check
      if (error?.name === "CanceledError" || error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
        return null; // silent cancel
      }
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
export function uploadComponentZst(payload, onProgress) {
  return async (dispatch) => {
    try {
      const response = await axios.post(
        `${api.scenario_import_upload_zst}`, // e.g. /scenario/import/upload-zst
        payload.file,                         // raw File object — no FormData
        {
          params:  { importid: payload.importid, vmFile: payload.vmFile },
          headers: { "Content-Type": "application/octet-stream" },
          timeout: 0,
          onUploadProgress: (e) => {
            if (e.total && onProgress) {
              const pct = Math.round((e.loaded / e.total) * 100);
              onProgress(pct);
            }
          },
          maxBodyLength:    Infinity,
          maxContentLength: Infinity,
        },
      );
      return response;
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function pollZstUploadStatus(importid) {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${api.poll_Zst_Upload_Status}`,{ params: { importid } });
      dispatch(slice.actions.getzststatussuccess(response.data?.data || []));
      return response;
    } catch (error) {
      console.error("[pollImportStatus] Error:", error);
      dispatch(slice.actions.hasError(error));
    }
  };
}
