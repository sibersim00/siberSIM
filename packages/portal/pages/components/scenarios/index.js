import React, { useState, useEffect, useMemo } from "react";
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
  Modal,
  Form,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import Router, { useRouter } from "next/router";
import Select from "react-select";
import {
  getScenarioList,
  changeStatusScenarios,
  clearScenariosChangeStatus,
  deleteScenarios,
  cleardeleteScenarios,
  clearHasError,
  handleManageView,
  exportSelectedScenariosAction,
  exportScenario,
  ScenarioExport,
} from "../../../shared/redux/slices/scenario/scenarioManage";
import * as XLSX from "xlsx";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import ScenarioForm from "../../../shared/data/scenarios/scenariosForm";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import { Fab } from "@mui/material";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";
import ScenarioModal from "../../../shared/data/scenarios/scenarioModal";
// import ImportScenarioZipFile from "../../../shared/data/scenarios/ImportScenarioZipFile";

const ManageScenarios = () => {
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
  const [showListImort, setShowListImport] = useState(true);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [oneClick, setOneClick] = useState(false);
  const [previousView, setPreviousView] = useState("card");
  const [backview, setBackView] = useState("card");
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState([]);

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

  console.log("rowDatarowDatarowDatarowDatarowDatarowDatarowData", rowData);
  const {
    hasGetScenarioListSucc,
    errorData,
    deleteScenariosRes,
    hasScenariosStatusSucc,
    viewNameResp,
    getUserDataFromLocal,
    hasGetScenarioExportSucc,
  } = useSelector((state) => {
    return {
      hasGetScenarioListSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.getScenarioListData.data,
      hasGetScenarioExportSucc:
        state && state.scenarioManage && state.scenarioManage.ScenarioExport,
      deleteScenariosRes:
        state && state.scenarioManage && state.scenarioManage.deleteScenarios,
      hasScenariosStatusSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.statusChangeScenarios,
      errorData: state && state.scenarioManage && state.scenarioManage.error,
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

  const columnDefs = [
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
    // {
    //   headerName: "Instruction File",
    //   field: "instruction_file",
    //   filter: true,
    //   flex: 1,
    //   floatingFilter: true,
    //   minWidth: 180,
    // },
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
      minWidth: 80,
      pinned: "right",
      cellRenderer: "actionSwitchRenderer",
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      minWidth: 160,
      pinned: "right",
      cellRenderer: "actionButtonRenderer",
    },
  ];
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

  const handleScenarioExport = (scenarioid) => {
    const payload = {
      scenarioid: scenarioid,
      learner_id: null,
      status: "Inprogress"
    };
    dispatch(ScenarioExport(payload));
  };

  useEffect(() => {
    if (hasGetScenarioExportSucc?.exportid) {
      const exportPayload = {
        scenarioid: hasGetScenarioExportSucc.scenarioid,
        exportid: hasGetScenarioExportSucc.exportid
      };

      dispatch(exportScenario(exportPayload));
    }
  }, [hasGetScenarioExportSucc]);

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

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
      console.log("culprit", filteredData.length);
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
    dispatch(getScenarioList());
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
      // setView("Form");
      dispatch(handleManageView("Form"));
      console.log("first", props.scenariouuid);
    }
  };
  console.log("rowIdrowId", rowId)
  const handleDeletecard = (item) => {
    console.log("itemitemitemitemitemitemitem", item);

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
  const router = useRouter();

  useEffect(() => {
    if (router.query.type) {
      setScenType(router.query.type);
    }
  }, [router.query.type]);
  console.log("scenTypescenTypescenTypescenType", scenType);

  // const handleReturnView = (props) => {
  //   push(`/scenarios_view/${props?.scenariouuid}`);
  // };
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
                      {/* <Button
                        type="button"
                        variant="outline-info"
                        onClick={() => setShowExportModal(true)}
                      >
                        <i className="fa fa-file-excel-o"></i> Export
                      </Button>
                      &nbsp;
                      <Button
                        type="button"
                        variant="outline-warning"
                        onClick={() => {
                          setShowListImport(true);
                          handleImportModal();
                        }}
                      >
                        <i className="fa fa-file-excel-o"></i> Import
                      </Button> */}
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
                {console.log(scenStatus, "000000000", rowData)}
                <Col md={12}>
                  {view == "list" ? (
                    <div
                      className="ag-theme-alpine mt-2"
                      style={{ height: "40em", width: "100%" }}
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
              {gridData && gridData.length > 0 ? (
                <Row className="g-3 mb-3">
                  {gridData.map((item, index) => (
                    <Col key={index} md={12 / columnsPerRow}>
                      {/* <Card className="card custom-card our-team h-100 shadow-sm"> */}
                      <Card
                        className={`card custom-card our-team h-100 custom-scenario-card ${item.scenariostatus === "Publish"
                          ? "shadow-publish"
                          : item.scenariostatus === "Draft"
                            ? "shadow-draft"
                            : ""
                          }`}
                      >
                        <Card.Body className="p-3 position-relative d-flex flex-column justify-content-between text-center">
                          {/* Published Badge */}
                          {/* {item.scenariostatus === "Publish" && (
                            <div className="position-absolute top-0 end-0 m-2 z-1 text-align-center">
                              <Badge bg="primary" pill>
                                <i className="fas fa-check-circle"></i>
                              </Badge>
                            </div>
                          )} */}
                          {/* {item.scenario_type && (
                            <div className="position-absolute top-0 end-0 m-2 z-1">
                              <Badge
                                bg={
                                  item.scenario_type === "Public"
                                    ? "success"
                                    : "secondary"
                                }
                                pill
                                className="px-2 py-1 text-uppercase shadow-sm"
                              >
                                {item.scenario_type}
                              </Badge>
                            </div>
                          )} */}
                          {/* Card Content */}
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

                            <h5 className="text-dark mt-2 mb-1 fs-5 pointer">
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>{item.scenariotitle}</Tooltip>
                                }
                              >
                                <span
                                  className="d-inline-block text-truncate w-100"
                                  style={{ maxWidth: "100%" }}
                                >
                                  {item.scenariotitle?.length > 30
                                    ? `${item.scenariotitle.substring(
                                      0,
                                      27
                                    )}...`
                                    : item.scenariotitle}
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
                            <div className="d-flex align-items-center rounded-circle btn btn-sm ripple bg-secondary-transparent text-secondary">
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
                            {/* <div
                              className="btn btn-sm ripple bg-info text-dark rounded-circle"
                              // onClick={() => handleExport(item.scenarioid)}
                              onClick={() => handleScenarioExport(item.scenariouuid)}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>Export</Tooltip>}
                              >
                                <i className="fa fa-file-excel-o"></i>
                              </OverlayTrigger>
                            </div> */}
                          </div>

                          {/* Second row for actions */}
                          <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
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

                            {/* Edit Button */}
                            {!(
                              userType === "Instructor" &&
                              item.scenariostatus === "Publish"
                            ) && (
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
                              )}

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
      {/* <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Export Scenarios</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Scenarios</Form.Label>
            <Select
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary25: "var(--primary-bg-color)",
                  primary: "var(--primary-bg-color)",
                },
              })}
              isMulti
            styles={getScenarioSelectStyles()}
              options={[
                { value: "all", label: "Select All Scenarios" },
                ...(Array.isArray(hasGetScenarioListSucc)
                  ? hasGetScenarioListSucc.map((s) => ({
                      value: s.scenarioid,
                      label: s.scenariotitle,
                    }))
                  : []),
              ]}
              value={selectedScenarios}
              onChange={(selected) => {
                if (selected.some((s) => s.value === "all")) {
                  setSelectedScenarios(
                    (hasGetScenarioListSucc || []).map((s) => ({
                      value: s.scenarioid,
                      label: s.scenariotitle,
                    }))
                  );
                } else {
                  setSelectedScenarios(selected);
                }
              }}
            />
          </Form.Group>

          <div className="mt-4 text-center">
            <Button
              variant="outline-success"
              onClick={handleExportExcel}
              className="me-3"
            >
              <i className="fa fa-file-excel-o"></i> Export Excel
            </Button>

            <Button
              variant="outline-primary"
              // onClick={handleExportZip}
            >
              <i className="fa fa-file-archive-o"></i> Export Selected Scenarios Zip
            </Button>
          </div>
        </Modal.Body>
      </Modal> */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Export Scenarios</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Scenarios</Form.Label>
            <Select
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary25: "var(--primary-bg-color)",
                  primary: "var(--primary-bg-color)",
                },
              })}
              isMulti
              styles={getScenarioSelectStyles()}
              options={[
                { value: "all", label: "Select All Scenarios" },
                ...(Array.isArray(hasGetScenarioListSucc)
                  ? hasGetScenarioListSucc.map((s) => ({
                    value: s.scenarioid,
                    label: s.scenariotitle,
                  }))
                  : []),
              ]}
              value={selectedScenarios}
              onChange={(selected) => {
                if (selected.some((s) => s.value === "all")) {
                  setSelectedScenarios(
                    (hasGetScenarioListSucc || []).map((s) => ({
                      value: s.scenarioid,
                      label: s.scenariotitle,
                    }))
                  );
                } else {
                  setSelectedScenarios(selected);
                }
              }}
              placeholder="Select scenarios to Export"
            />
          </Form.Group>

          <div className="mt-4 text-center">
            <Button
              variant="outline-success"
              onClick={handleExportExcel}
              // onClick={handleScenarioExport}
              className="me-3"
            >
              <i className="fa fa-file-excel-o"></i> Export Excel
            </Button>

            <Button
              variant="outline-primary"
              onClick={async () => {
                if (!selectedScenarios.length)
                  return alert("Select at least one scenario");

                try {
                  const blob = await dispatch(
                    exportSelectedScenariosAction({
                      scenarioIds: selectedScenarios.map((s) => s.value),
                    })
                  );

                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `scenarios_export.zip`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error(err);
                  alert("Export failed");
                }
              }}
            >
              <i className="fa fa-file-archive-o"></i> Export Selected Scenarios
              Zip
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {view == "Form" ? (
        <ScenarioForm
          setView={handleReturnFromEdit}
          rowId={rowId}
          handleOneClick={handleOneClick}
          oneClick={oneClick}
          backView={backview}
        />
      ) : (
        <></>
      )}
      {/* <ImportScenarioZipFile
              openImportModal={openImportModal}
              handleImportModal={handleImportModal}
              showListImort={showListImort}
              setShowListImport={setShowListImport}
            /> */}

      <ScenarioModal
        openImportModal={openImportModal}
        handleImportModal={handleImportModal}
        showListImort={showListImort}
        setShowListImport={setShowListImport}
      />
    </>
  );
};
ManageScenarios.layout = "Contentlayout";
export default ManageScenarios;
