import React, { useState, useEffect, useMemo,useRef,useCallback  } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { getScenarioList, changeStatusScenarios, changeManipulationStatus, clearchangeManipulationStatus, clearScenariosChangeStatus, deleteScenarios, cleardeleteScenarios, clearHasError, handleManageView,triggerScenarioExport, createScenarioExport,
} from "../../../shared/redux/slices/scenario/scenarioManage";
import {
  clearHasErrorr,
} from "../../../shared/redux/slices/scenariostart/scenariostartmanage";
import * as XLSX from "xlsx";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import ManipulationToggleButton from "../../../shared/data/masterButtons/manipulationtoggle";
import ScenarioForm from "../../../shared/data/scenarios/scenariosForm";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";
import ScenarioModal from "../../../shared/data/scenarios/scenarioModal";
import ScenarioImportModal from "../../../shared/data/scenarios/ScenarioImportModal";
// import ImportScenarioZipFile from "../../../shared/data/scenarios/ImportScenarioZipFile";
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;



const ManageScenarios = () => {
const router = useRouter();
const { t } = useTranslation();
const dispatch = useDispatch();
const [scenStatus, setscenStatus] = useState("true");
const [scenType, setScenType] = useState("Public"); // Public/Private
const [view, setView] = useState("card");
const [rowData, setRowData] = useState([]);
const [gridData, setGridData] = useState([]);
const [gridApi, setGridApi] = useState(null);
const [quickFilter, setQuickFilter] = useState("");
const [formModal, setformModal] = useState(false);
const { push } = useRouter();
const [listLoading, setListLoading] = useState(true);
const [hasLoadedScenarioList, setHasLoadedScenarioList] = useState(false);
const [showListImort, setShowListImport] = useState(true);
const [openImportModal, setOpenImportModal] = useState(false);
const [oneClick, setOneClick] = useState(false);
const [previousView, setPreviousView] = useState("card");
const [backview, setBackView] = useState("card");
const [selectedScenarios, setSelectedScenarios] = useState([]);
const [exportingIds, setExportingIds] = useState([]);
const [pageSize, setPageSize] = useState(20);


  const [activeImportId, setActiveImportId] = useState(() => {
  try {
      const saved = localStorage.getItem("activeImport");
      return saved ? JSON.parse(saved).importid : null;
    } catch (_) {
      return null;
    }
  });

const [showImportModal, setShowImportModal] = useState(false);

const gridRef = useRef(null);
const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  
  const [rowValues, setRowValues] = useState({
    title: "Add",
    scenarioid: 0,
    scenarioidentification: " ",
    scenariotitle: " ",
    scenariodescription: " ",
    scenariocategory: " ",
    scenariosubcategory: " ",
    scenariolevel: " ",
    instructor_name: " ",
    instruction_file: " ",
    duration: " ",
    status: "true",
  });
  const {
    hasGetScenarioListSucc,
    errorData,
    deleteScenariosRes,
    hasScenariosStatusSucc,
    viewNameResp,
    errorData1,
    getUserDataFromLocal,
    hasGetScenarioExportSucc,
    manipulation,
    hasScenariosmanipulationStatusSucc
  } = useSelector((state) => {
    return {
      hasGetScenarioListSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.getScenarioListData,
      manipulation: state?.scenarioManage?.manipulation,
      hasGetScenarioExportSucc:
        state && state.scenarioManage && state.scenarioManage.ScenarioExport,
      deleteScenariosRes:
        state && state.scenarioManage && state.scenarioManage.deleteScenarios,
      hasScenariosStatusSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.statusChangeScenarios,
      hasScenariosmanipulationStatusSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.statusChangemanipulationScenarios,
      errorData: state && state.scenarioManage && state.scenarioManage.error,
      errorData1: state && state.scenariostart && state.scenariostart.error,
      getUserDataFromLocal:
        state && state.localData && state.localData.getLocalData,
      viewNameResp:
        state && state.scenarioManage && state.scenarioManage.viewNameResp,
      hasGetSingleScenariosSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.singleScenarios &&
        state.scenarioManage.singleScenarios.data,
    };
  });
  
   const getScenarioSelectStyles = () => {
    return {
      control: (styles) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)",
        borderColor: "#ced4da",
        minHeight: "38px",
      }),
      multiValue: (styles) => ({
        ...styles,
        backgroundColor: "var(--primary-bg-color)",
      }),
      multiValueLabel: (styles) => ({
        ...styles,
        color: "#fff",
      }),
      multiValueRemove: (styles) => ({
        ...styles,
        color: "#fff",
        ":hover": {
          backgroundColor: "#EB5757",
          color: "white",
        },
      }),
      input: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      singleValue: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      placeholder: (styles) => ({
        ...styles,
        color: "#aaa",
      }),
    };
  };
const handleScenarioExport = async (scenarioid) => {
  setExportingIds((prev) => [...prev, scenarioid]);
  try {
    // Step 1: Create export record
    const createRes = await dispatch(
      createScenarioExport({
        scenarioid,
        learner_id: null,
        status: "Inprogress",
      }),
    );

    const { exportid } = createRes.data;
    if (!exportid) throw new Error("No exportid returned");

    // Step 2: Fire export job — DO NOT await completion
    // Backend will process in background, cron updates status
    dispatch(triggerScenarioExport({ scenarioid, exportid }));

    // Step 3: Redirect immediately to export list page
    toast.success(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              Export started! You'll be notified when it's ready
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
    // push("/scenarioexport/");
    router.push(`/scenarioexport`);

  } catch (err) {
    console.error("Export failed:", err);
    toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              Export failed. Please try again
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
  } finally {
    setExportingIds((prev) => prev.filter((id) => id !== scenarioid));
  }
};
  const assignedBadgeRenderer = (params) => {
    const { value, data } = params;
    const maxLength = 20; // Set the character limit for the title
    const title = value || "";
    const truncatedTitle =
      title.length > maxLength ? title.substring(0, maxLength) + "..." : title;

    return (
      <div className="d-flex align-items-center position-relative">
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>{title}</Tooltip>} // Full title on hover
        >
          <div
            className="text-truncate"
            style={{ maxWidth: "100%", cursor: "pointer" }}
          >
            {truncatedTitle}
          </div>
        </OverlayTrigger>

        {data.scenariostatus === "Publish" && (
          <div className="position-absolute top-0 end-0 m-2">
            <Badge
              bg="success"
              pill
              className="d-flex align-items-center text-white"
            >
              <i className="fas fa-check-circle"></i>
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const baseColumnDefs = [
    {
      headerName: "Sr No.",
      field: "",
      cellRenderer: "srNoRender",
      floatingFilter: true,
      minWidth: 80,
      sortable: false,
    },
    {
      headerName: "Identification No",
      field: "scenarioidentification",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Title",
      field: "scenariotitle",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
      cellRendererFramework: assignedBadgeRenderer,
    },
    {
      headerName: "Level",
      field: "scenariolevel",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Scenario Category",
      field: "scenariocategory",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Scenario Sub-Category",
      field: "scenariosubcategory",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "SIMManager",
      field: "instructor_name",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Duration",
      field: "duration",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Status",
      field: "status",
      pinned: "right",
      maxWidth: 70,
      pinned: "right",
      cellRenderer: "actionSwitchRenderer",
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      maxWidth: 160,
      pinned: "right",
      cellRenderer: "actionButtonRenderer",
    },
  ];

  const manipulationStatusColumn = {
  headerName: "Manipulation Status",
  field: "manipulation_flag",
  pinned: "right",
  maxWidth: 100,
  cellRenderer: "actionManipulationSwitchRenderer",
  headerTooltip: "Toggle to enable or disable manipulation for this record"
};

const columnDefs = useMemo(() => {
  const cols = [...baseColumnDefs];
  if (manipulation === "1") {
    cols.push(manipulationStatusColumn);
  }
  return cols;
}, [manipulation]);


  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  //Function to Download Excel file
  const handleExportExcel = () => {
    // If no scenario selected → export all (with scenStatus filter)
    let filteredData = hasGetScenarioListSucc.filter((row) => {
      if (scenStatus === "") return true; // All statuses
      return row.status === scenStatus;
    });

    // If specific scenarios are selected → filter by those scenario IDs
    if (selectedScenarios && selectedScenarios.length > 0) {
      const selectedIds = selectedScenarios.map((s) => s.value);
      filteredData = filteredData.filter((row) =>
        selectedIds.includes(row.scenarioid)
      );
    }

    if (!filteredData.length) {
      alert("No scenarios found to export!");
      return;
    }

    // Prepare Excel data
    const exportData = filteredData.map((row) => {
      const createdDate = row.createdon ? new Date(row.createdon) : null;
      const modifiedDate = row.modifiedon ? new Date(row.modifiedon) : null;

      const createdDateOnly =
        createdDate && !isNaN(createdDate)
          ? createdDate.toLocaleDateString()
          : "N/A";
      const createdTime =
        createdDate && !isNaN(createdDate)
          ? createdDate.toLocaleTimeString()
          : "N/A";

      const modifiedDateOnly =
        modifiedDate && !isNaN(modifiedDate)
          ? modifiedDate.toLocaleDateString()
          : " ";
      const modifiedTime =
        modifiedDate && !isNaN(modifiedDate)
          ? modifiedDate.toLocaleTimeString()
          : " ";

      return [
        row.scenarioid,
        row.scenarioidentification,
        row.scenariotitle,
        row.scenariodescription,
        row.components,
        row.scenariodiagram,
        row.component_config,
        row.network_config,
        row.scenariocategory,
        row.scenariosubcategory,
        row.scenariolevel,
        row.instructor_name,
        row.instruction_file,
        row.duration,
        row.status === "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "Scenario Id",
      "Identification no",
      "Title",
      "Desciption",
      "Components",
      "Scenario Diagram",
      "Component Config",
      "Network Config",
      "Scenario Category",
      "Scenario Sub Category",
      "Level",
      "SIMManager Name",
      "Instruction File",
      "Duration",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scenarios");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);

    let filePrefix = "Scenarios_All";
    if (selectedScenarios.length > 0) {
      filePrefix = "Scenarios_Selected";
    } else if (scenStatus === "true") {
      filePrefix = "Scenarios_Active";
    } else if (scenStatus === "false") {
      filePrefix = "Scenarios_Inactive";
    }

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };
    const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };

const onGridReady = useCallback((params) => {
  gridRef.current = params.api;

  // Set correct height on first load as well
  const initialPageSize = params.api.paginationGetPageSize();
  const totalRows = params.api.getDisplayedRowCount();
  const effectiveRows = Math.min(initialPageSize, totalRows);
  setPageSize(effectiveRows);
}, []);
  
    // Fires when page size changes via the built-in dropdown
   const onPaginationChanged = useCallback((params) => {
  if (params.api) {
    const newPageSize = params.api.paginationGetPageSize();
    const totalRows = params.api.getDisplayedRowCount(); // ✅ actual rows in data

    // Use whichever is smaller — actual rows vs page size
    const effectiveRows = Math.min(newPageSize, totalRows);
    setPageSize(effectiveRows);
  }
}, []);
  const onFilterChanged = (data) => {
    setQuickFilter(data);
    let val = data.toLowerCase();
    if (scenStatus == "") {
      const temp =
        hasGetScenarioListSucc &&
        hasGetScenarioListSucc.filter((d) => {
          return (
            d.scenarioidentification?.toLowerCase().includes(val) ||
            // d.instructor_name?.toLowerCase().includes(val) ||
            (d.instructor_name?.toLowerCase() || "").includes(val) ||
            d.vm_status?.toLowerCase().includes(val) ||
            d.scenariotitle?.toLowerCase().includes(val) ||
            d.scenariolevel?.toLowerCase().includes(val) ||
            (typeof d.duration === "number" &&
              d.duration.toString().toLowerCase().includes(val)) ||
            d.name?.toLowerCase().includes(val) ||
            d.scenariocategory?.toLowerCase().includes(val) ||
            d.scenariosubcategory?.toLowerCase().includes(val) ||

            !val
          );
        });

      setGridData(temp);
      setRowData(temp);
    } else if (scenStatus == "true") {
      const filteredData =
        hasGetScenarioListSucc.length > 0 &&
        hasGetScenarioListSucc.filter(
          (data) => data?.status?.toString() == "true"
        );

      const temp =
        filteredData &&
        filteredData.filter((d) => {
          return (
            d.scenarioidentification.toLowerCase().indexOf(val) !== -1 ||
            d.scenariotitle.toLowerCase().indexOf(val) !== -1 ||
            // d.instructor_name.toLowerCase().indexOf(val) !== -1 ||
            (d.instructor_name?.toLowerCase() || "").includes(val) ||
            (d.vm_status?.toLowerCase() || "").includes(val) ||
            d.scenariolevel.toLowerCase().indexOf(val) !== -1 ||
            (typeof d.duration === "number" &&
              d.duration.toString().indexOf(val.toLowerCase()) !== -1) ||
            (d.name &&
              d.name != null &&
              d.name.toLowerCase().indexOf(val) !== -1) ||
            (d.scenariocategory &&
              d.scenariocategory != null &&
              d.scenariocategory.toLowerCase().indexOf(val) !== -1) ||
            (d.scenariosubcategory &&
              d.scenariosubcategory != null &&
              d.scenariosubcategory.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });
      setGridData(temp);
      setRowData(temp);
    } else if (scenStatus == "false") {
      const filteredData =
        hasGetScenarioListSucc.length > 0 &&
        hasGetScenarioListSucc.filter(
          (data) => data?.status?.toString() == "false"
        );

      const temp =
        filteredData &&
        filteredData.filter((d) => {
          return (
            d.scenarioidentification.toLowerCase().indexOf(val) !== -1 ||
            d.scenariotitle.toLowerCase().indexOf(val) !== -1 ||
            // d.instructor_name.toLowerCase().indexOf(val) !== -1 ||
            (d.instructor_name?.toLowerCase() || "").includes(val) ||
            (d.vm_status?.toLowerCase() || "").includes(val) ||
            d.scenariolevel.toLowerCase().indexOf(val) !== -1 ||
            (typeof d.duration === "number" &&
              d.duration.toString().indexOf(val.toLowerCase()) !== -1) ||
            (d.name &&
              d.name != null &&
              d.name.toLowerCase().indexOf(val) !== -1) ||
            (d.scenariocategory &&
              d.scenariocategory != null &&
              d.scenariocategory.toLowerCase().indexOf(val) !== -1) ||
            (d.scenariosubcategory &&
              d.scenariosubcategory != null &&
              d.scenariosubcategory.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });
      setGridData(temp);
      setRowData(temp);
    }
  };

  useEffect(() => {
    if (hasGetScenarioListSucc) {
      if (scenStatus === "") {
      setHasLoadedScenarioList(true);
        setRowData(hasGetScenarioListSucc);
        setGridData(hasGetScenarioListSucc);
      } else if (scenStatus === "true") {
        const filteredData = hasGetScenarioListSucc.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      } else if (scenStatus === "false") {
        const filteredData = hasGetScenarioListSucc.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      }
    }
  }, [hasGetScenarioListSucc, scenStatus]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    dispatch(handleManageView(thisView));
    setBackView(thisView);
    if (scenStatus == "") {
      setRowData(hasGetScenarioListSucc);
      setGridData(hasGetScenarioListSucc);
    } else if (scenStatus == "true") {
      const filteredData =
        hasGetScenarioListSucc.length > 0 &&
        hasGetScenarioListSucc.filter(
          (data) => data?.status?.toString() == "true"
        );
      setRowData(filteredData && filteredData.length > 0 ? filteredData : []);
      setGridData(filteredData);
    } else if (scenStatus == "false") {
      const filteredData =
        hasGetScenarioListSucc.length > 0 &&
        hasGetScenarioListSucc.filter(
          (data) => data?.status?.toString() == "false"
        );
      setRowData(filteredData && filteredData.length > 0 ? filteredData : []);
      setGridData(filteredData);
    }
  };

  useEffect(() => {
    if (viewNameResp) {
      setView(viewNameResp);
    }
  }, [viewNameResp]);

  useEffect(() => {
    const loadScenarios = async () => {
      setListLoading(true);
      setHasLoadedScenarioList(false);
      await dispatch(getScenarioList());
      setListLoading(false);
    };

    loadScenarios();
    if (viewNameResp != "list") {
      dispatch(handleManageView("card"));
    }
  }, []);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  useEffect(() => {
    if (errorData?.statusCode) {
      errorData.errors && errorData.errors.length > 0
        ? errorData.errors.map((data) => {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {data}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        })
        : toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {errorData?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: true,
            theme: "colored",
          }
        );

      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);
  useEffect(() => {
    if (errorData1?.statusCode) {
      handleOneClick(false);
      dispatch(clearHasErrorr());
    }
  }, [errorData1]);

  useEffect(() => {
    if (hasScenariosStatusSucc?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasScenariosStatusSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioList());
      dispatch(clearScenariosChangeStatus());
    }
  }, [hasScenariosStatusSucc]);
  useEffect(() => {
    if (hasScenariosmanipulationStatusSucc?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasScenariosmanipulationStatusSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioList());
      dispatch(clearchangeManipulationStatus());
    }
  }, [hasScenariosmanipulationStatusSucc]);

  useEffect(() => {
    if (deleteScenariosRes?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {deleteScenariosRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioList());
      dispatch(cleardeleteScenarios());
    }
  }, [deleteScenariosRes]);

  const [userType, setUserType] = useState("");

  useEffect(() => {
    if (getUserDataFromLocal) {
      try {
        if (getUserDataFromLocal?.usertype) {
          setUserType(getUserDataFromLocal.usertype);
        }
      } catch (error) {
        console.error("Error retrieving user data:", error);
      }
    }
  }, [getUserDataFromLocal]);

  const [rowId, setRowId] = useState("");
  const handleEdit = (props) => {
    handleOneClick(false);
    setPreviousView(view);
    setBackView(view);
    if (props && props.scenariouuid) {
      title: "Add", setRowId(props.scenariouuid);
      dispatch(handleManageView("Form"));
    }
  };
  const handleDeletecard = (item) => {
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_delete"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          scenarioid: item?.scenarioid,
        };
        dispatch(deleteScenarios(payload));
      }
    });
  };

  const handleDelete = (props, flag) => {
    if (flag == true) {
      const payload = {
        scenarioid: props?.scenarioid,
      };
      dispatch(deleteScenarios(payload));
    }
  };

  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to change the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const Id = data?.scenarioid;
        const payload = {
          status: data.status == "true" ? "false" : "true",
          scenarioid: Id,
        };
        dispatch(changeStatusScenarios(payload, Id));
      }
    });
  };
  const handleManipulationStatusSwitch = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to change the Manipulation status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const Id = data?.scenarioid;
        
        const payload = {
          status: data.manipulation_flag == "true" ? "false" : "true",
          scenarioid: Id,
        };
        dispatch(changeManipulationStatus(payload, Id));
      }
    });
  };
  useEffect(() => {
    if (router.query.type) {
      setScenType(router.query.type);
    }
  }, [router.query.type]);
  const handleReturnView = (props) => {
    push({
      pathname: `/scenarios_view/${props?.scenariouuid}`,
      query: { backType: scenType },
    });
  };

  const handleReturnFromEdit = () => {
    // setView(previousView);
    dispatch(handleManageView(previousView));
  };

  const handleFiles = (props, action = "view") => {
    if (props?.instruction_file) {
      const fileUrl = `${process.env.API_URL_FILEMANAGER}${props.instruction_file}`;

      if (action === "view") {
        window.open(fileUrl, "_blank", "noopener,noreferrer"); // Opens in a new tab for viewing
      } else if (action === "download") {
        const newWindow = window.open(fileUrl, "_blank");
        if (newWindow) {
          setTimeout(() => {
            const link = document.createElement("a");
            link.href = fileUrl;
            link.setAttribute("download", "");
            newWindow.document.body.appendChild(link);
            link.click();
            newWindow.document.close();
          }, 2000);
        }
      }
    }
  };

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleShowEditView={true}
          handleEdit={handleEdit}
          handleFiles={handleFiles}
          propsVal={props}
          handleShowEdit={true}
          handleDelete={handleDelete}
        />
      );
    },

    actionSwitchRenderer: function (props) {
      return (
        <ToggleButton
          data={props?.data}
          handleStatusSwitch={handleStatusSwitch}
        />
      );
    },
    actionManipulationSwitchRenderer: function (props) {
    return (
    <ManipulationToggleButton
      data={props?.data}
      handleManipulationStatusSwitch={handleManipulationStatusSwitch}  // pass wrapped function as handleStatusSwitch
    />
  );
  },

  };

  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const colarray = [6, 4, 3, 2];
  const zoomIn = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex > 0) {
      setColumnsPerRow(colarray[currentIndex - 1]);
    }
  };
  const zoomOut = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex < colarray.length - 1) {
      setColumnsPerRow(colarray[currentIndex + 1]);
    }
  };

  const handleImportModal = () => {
    setOpenImportModal(!openImportModal);
  };

  useEffect(() => {
      setHasLoadedScenarioList(true);
    if (hasGetScenarioListSucc) {
      let filtered = [...hasGetScenarioListSucc];

      if (scenStatus !== "") {
        filtered = filtered.filter((d) => d.status.toString() === scenStatus);
      }

      if (scenType !== "") {
        filtered = filtered.filter((d) => d.scenario_type === scenType);
      }

      setRowData(filtered);
      setGridData(filtered);
    }
  }, [hasGetScenarioListSucc, scenStatus, scenType]);

  return (
    <>
      <Seo title="Scenarios" />
      <ToastContainer />
      <Row className="row-sm">
        {view != "Form" && (
          <Col md={12}>
            <Card className="custom-card overflow-hidden">
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Scenarios</h5>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <button
                            onClick={zoomOut}
                            className="btn bd bd-success text-success mx-1"
                            title="Zoom In"
                          >
                            <i className="fas fa-search-plus"></i>
                          </button>
                          <button
                            onClick={zoomIn}
                            className="btn bd bd-success text-success"
                            title="Zoom Out"
                          >
                            <i className="fas fa-search-minus"></i>
                          </button>
                          &nbsp;
                        </>
                      )}
                      <Button
                        type="button"
                        title="Card View"
                        variant="outline-success"
                        onClick={() => {
                          handleChangeView("card");
                          dispatch(handleManageView("card"));
                        }}
                        className={
                          view === "card" ? "mx-1 active text-white" : "mx-1"
                        }
                      >
                        <i className="fe fe-grid"></i>
                      </Button>
                      <Button
                        type="button"
                        title="List View"
                        variant="outline-success"
                        onClick={() => {
                          handleChangeView("list");
                          dispatch(handleManageView("list"));
                        }}
                        className={view === "list" ? "active text-white" : ""}
                      >
                        <i className="fe fe-list"></i>
                      </Button>
                      &nbsp;&nbsp;
                      <ToggleButtonGroup
                        color="success"
                        value={scenStatus}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          setscenStatus(e.target.value);
                          dispatch(getScenarioList({ status: e.target.value }));
                        }}
                        aria-label="Platform"
                      >
                        <CustomToggleButton value="">All</CustomToggleButton>
                        <CustomToggleButton value="true" defaultChecked>
                          Active
                        </CustomToggleButton>
                        <CustomToggleButton value="false">
                          Inactive
                        </CustomToggleButton>
                      </ToggleButtonGroup>
                      &nbsp;&nbsp;
                      <ToggleButtonGroup
                        color="success"
                        value={scenType}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          setScenType(e.target.value);
                        }}
                      >
                        <CustomToggleButton value="Public">
                          Public
                        </CustomToggleButton>
                        <CustomToggleButton value="Private">
                          Private
                        </CustomToggleButton>
                      </ToggleButtonGroup>
                      &nbsp;
                      <Button
                        type="button"
                        variant="outline-warning"
                        onClick={() => setShowImportModal(true)}
                        className="mx-1"
                        title="Import Scenario"
                      >
                        <i className="fa fa-upload me-1" /> Import
                      </Button>
                      &nbsp;
                      <Button
                        type="button"
                        variant="outline-primary"
                        onClick={() => {
                          // setView("Form");
                          dispatch(handleManageView("Form"));
                          setBackView(view);
                          setRowId("");
                          handleOneClick(false);
                        }}
                      >
                        <i className="fa fa-plus"></i> Add
                      </Button>
                      &nbsp;
                      <input
                        className="form-control bd bd-2 ms-2 w-auto"
                        value={quickFilter}
                        placeholder="Search..."
                        type="text"
                        onChange={(e) => onFilterChanged(e.target.value)}
                      />
                    </div>
                  </div>
                </Col>
                <Col md={12}>
                  {view == "list" ? (
                    <div
                      className="ag-theme-alpine mt-2"
                      style={{
                        height: `${gridHeight}px`, //  dynamic, grows with page size
                        width: "100%",
                        overflow: "visible", // no internal scrollbar
                      }}
                    >
                      <AgGridReact
                        id="cat_grid"
                        headerHeight={35}
                        rowHeight={40}
                        gridOptions={gridOptions}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        pagination={true}
                        onGridReady={onGridReady}
                        components={frameworkComponents}
                        paginationPageSize={20}
                        onPaginationChanged={onPaginationChanged} //  track page size changes
                        defaultColDef={defaultColDef}
                        //  overlayNoRowsTemplate={
                        //   rowData && rowData.length === 0 ? "No Rows to Show" : "Loading..."
                        // }
                      ></AgGridReact>
                    </div>
                  ) : (
                    ""
                  )}
                </Col>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={12}>
          {view === "card" ? (
            <>
              {listLoading ? (
                <Row>
                  <Col sm={12}>
                    <Card className="custom-card">
                      <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
                        <div className="text-center">
                          <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                          <h5 className="mt-3 mb-0">Loading...</h5>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              ) : hasLoadedScenarioList && gridData && gridData.length > 0 ? (
                <Row className="g-3 mb-3">
                  {gridData.map((item, index) => (
                    <Col key={index} md={12 / columnsPerRow}>
                      {/* <Card className="card custom-card our-team h-100 shadow-sm"> */}
                      <Card
                        className={`card custom-card our-team h-100 custom-scenario-card ${
                          item.scenariostatus === "Publish"
                            ? "shadow-publish"
                            : item.scenariostatus === "Draft"
                              ? "shadow-draft"
                              : ""
                        }`}
                      >
                        <Card.Body className="p-3 position-relative d-flex flex-column justify-content-between text-center" style={{ minHeight: "340px" }}>
                          {item.requestedby_role === "Admin" &&
                            item.vm_steps === "Running" &&
                            ["Start", "Resume", "Pause"].includes(
                              item.vm_status,
                            ) && (
                              <span
                                className="position-absolute top-0 end-0 m-2 px-1 py-1 rounded-pill text-white"
                                style={{
                                  fontSize: "11px",
                                  backgroundColor:
                                    item.vm_status === "Pause"
                                      ? "orange"
                                      : "green",
                                }}
                              >
                                {item.vm_status === "Pause"
                                  ? "Pause"
                                  : "Running"}
                              </span>
                            )}

                          <div className="mb-3">
                            {/* Scenario Title */}
                            <div
                              className="rounded-circle mx-auto d-flex justify-content-center align-items-center "
                              style={{
                                width: "100px",
                                height: "100px",
                              }}
                            >
                              <img
                                alt="avatar"
                                src={
                                  item?.scenarioimage
                                    ? `${process.env.API_URL_FILEMANAGER}${item.scenarioimage}`
                                    : dummy_network.src
                                }
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = dummy_network.src;
                                }}
                              />
                            </div>

                         
                            <h5 className="text-dark mt-2 mb-1 fs-6 pointer">
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>{item.scenariotitle}</Tooltip>
                                }
                              >
                                <span className="w-100 wrap-text">
                                  {item.scenariotitle}
                                </span>
                              </OverlayTrigger>
                            </h5>

                            {/* Scenario Identification */}
                            <p className="text-success mb-1">
                              {item.scenarioidentification}
                            </p>

                            {/* scenario Instructor */}
                            <p className="text-muted mb-0 fs-6">
                              {item.instructor_name}
                            </p>
                          </div>
                          <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                            {/* Category */}
                            <div className="btn btn-sm ripple bg-warning-transparent rounded-circle text-warning">
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    {item.scenariocategory} -{" "}
                                    {item.scenariosubcategory}
                                  </Tooltip>
                                }
                              >
                                <i className="fa fa-th-large"></i>
                              </OverlayTrigger>
                            </div>

                            {/* Scenario Level */}
                            <div className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle">
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>{item.scenariolevel}</Tooltip>
                                }
                              >
                                <i className="fa fa-star-o"></i>
                              </OverlayTrigger>
                            </div>

                            {/* Duration */}
                            <div className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle ">
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>{item.duration ?? 0} mins</Tooltip>
                                }
                              >
                                <i className="fe fe-clock"></i>
                              </OverlayTrigger>
                            </div>

                            {/* Quiz */}
                            <div
                              className="btn btn-sm ripple bg-info-transparent text-dark rounded-circle"
                              onClick={() =>
                                push(`/scenario_quiz/${item?.scenariouuid}`)
                              }
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>Quiz</Tooltip>}
                              >
                                <i className="fa fa-building text-dark"></i>
                              </OverlayTrigger>
                            </div>
                            {/* Expport */}
                            <div
                              className="btn btn-sm ripple bg-info text-dark rounded-circle"
                              onClick={() => handleScenarioExport(item.scenarioid)}
                              style={{ pointerEvents: exportingIds.includes(item.scenarioid) ? "none" : "auto" }}
                            >
                              <OverlayTrigger placement="bottom" overlay={<Tooltip>Export</Tooltip>}>
                                {exportingIds.includes(item.scenarioid)
                                  ? <i className="fa fa-spinner fa-spin" />
                                  : <i className="fa fa-file-excel-o" />
                                }
                              </OverlayTrigger>
                            </div>
                            {/* Instruction File Download */}
                            <div
                              className="btn btn-sm ripple bg-success-transparent rounded-circle"
                              onClick={() => handleFiles(item, "download")}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>Download Instruction File</Tooltip>
                                }
                              >
                                <i className="fa fa-cloud-download"></i>
                              </OverlayTrigger>
                            </div>
                          </div>

                          {/* Second row for actions */}
                          <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                            {/* Edit Button */}
                            {/* {!(
                              userType === "Instructor" &&
                              item.scenariostatus === "Publish"
                            ) && ( */}
                            <div
                              className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
                              onClick={() => handleEdit(item)}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>Update</Tooltip>}
                              >
                                <i className="fe fe-edit"></i>
                              </OverlayTrigger>
                            </div>
                            {/* )} */}

                            {/* View Button */}
                            <div
                              className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                              onClick={() =>
                                push({
                                  pathname: `/scenarios_view/${item?.scenariouuid}`,
                                  query: { backType: scenType },
                                })
                              }
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>View</Tooltip>}
                              >
                                <i className="fe fe-eye"></i>
                              </OverlayTrigger>
                            </div>

                            {item.scenariostatus === "Publish" && (
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() =>
                                  push({
                                    pathname: `/scenarios_view_start/${item?.scenariouuid}`,
                                    query: { backType: scenType },
                                  })
                                }
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Start Scenario</Tooltip>}
                                >
                                  <i className="fe fe-play"></i>
                                </OverlayTrigger>
                              </div>
                            )}

                            <div
                              className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle"
                              onClick={() => {
                                handleDeletecard(item);
                              }}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>Delete</Tooltip>}
                              >
                                <i className="fe fe-trash"></i>
                              </OverlayTrigger>
                            </div>

                            {/* Status Switch */}
                            {!(
                              userType === "Instructor" &&
                              item.scenariostatus === "Publish"
                            ) && (
                              <div className="btn btn-sm ripple me-1">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Change Status</Tooltip>}
                                >
                                  <label className="custom-switch mb-0">
                                    <input
                                      type="checkbox"
                                      className="custom-switch-input"
                                      checked={item?.status === "true"}
                                      onChange={() => handleStatusSwitch(item)}
                                    />
                                    <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                  </label>
                                </OverlayTrigger>
                              </div>
                            )}
                            {/* {item.manipulation === "1"&& (
                                <div className="btn btn-sm ripple me-1">
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={<Tooltip>Manipulation Change Status</Tooltip>}
                                  >
                                    <label className="custom-switch mb-0">
                                      <input
                                        type="checkbox"
                                        className="custom-switch-input"
                                        checked={item?.status === "true"}
                                        onChange={() => handleManipulationStatusSwitch(item)}
                                      />
                                      <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                    </label>
                                  </OverlayTrigger>
                                </div>
                              )} */}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Row>
                  <Col sm={12}>
                    <Card className="custom-card">
                      <Card.Body className="overflow-auto pd-t-10">
                        <Row className="text-center" style={{ height: "70vh" }}>
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center mt-5">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150 mt-5"
                                  />
                                  <h5 className="mt-4">No data found.</h5>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

            </>
          ) : (
            ""
          )}
        </Col>
      </Row>
      {view == "Form" ? (
        <ScenarioForm
          setView={handleReturnFromEdit}
          rowId={rowId}
          handleOneClick={handleOneClick}
          oneClick={oneClick}
          backView={backview}
          manipulation={manipulation}
        />
      ) : (
        <></>
      )}
      <ScenarioModal
        openImportModal={openImportModal}
        handleImportModal={handleImportModal}
        showListImort={showListImort}
        setShowListImport={setShowListImport}
      />
      <ScenarioImportModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onImportStarted={(importid) => {
          setActiveImportId(importid);
        }}
        onImportFinished={() => {
          setActiveImportId(null);
          // localStorage.removeItem("activeImport");
        }}
      />
    </>
  );
};
ManageScenarios.layout = "Contentlayout";
export default ManageScenarios;




