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
  Nav,
  Tab,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { useRouter } from "next/router";
import Select from "react-select";
import {
  getScenarioList,
  handleManageView,
  getScenarioListapproved,
} from "../../../shared/redux/slices/customScenarios/customscenarioManage";
import Seo from "../../../shared/layout-components/seo/seo";
import ScenarioForm from "../../../shared/data/customScenario/scenariosForm";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";
const ManageScenarios = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const [scenStatus, setscenStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const { push } = useRouter();
  const [oneClick, setOneClick] = useState(false);
  const [previousView, setPreviousView] = useState("card");
  const [backview, setBackView] = useState("card");
  const [approvalFilter, setApprovalFilter] = useState("Approve");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [showTabs, setShowTabs] = useState(true);
  const {
    hasGetScenarioListSucc,
    hasGetScenarioListapprovedSucc,
    viewNameResp,
    getUserDataFromLocal,
  } = useSelector((state) => {
    return {
      hasGetScenarioListSucc:
        state &&
        state.customScenario &&
        state.customScenario.getScenarioListData.data,
      hasGetScenarioListapprovedSucc:
        state &&
        state.customScenario &&
        state.customScenario.getScenarioListapprovedData.data,
      getUserDataFromLocal:
        state && state.localData && state.localData.getLocalData,
      viewNameResp:
        state && state.customScenario && state.customScenario.viewNameResp,
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
      headerName: "Duration",
      field: "duration",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
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
    const filteredData = hasGetScenarioListSucc.filter((row) => {
      if (scenStatus === "") return true; // All
      return row.status === scenStatus;
    });

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
    const filePrefix =
      scenStatus === ""
        ? "Scenarios_All"
        : scenStatus === "true"
          ? "Scenarios_Active"
          : "Scenarios_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const getActiveDataSource = () => {
    if (approvalFilter === "Approve") {
      return hasGetScenarioListapprovedSucc || [];
    }
    return hasGetScenarioListSucc || [];
  };

  const onFilterChanged = (value) => {
    setQuickFilter(value);
    const val = value.toLowerCase();

    const sourceData = getActiveDataSource();

    if (!sourceData.length) {
      setRowData([]);
      setGridData([]);
      return;
    }
    const filtered = sourceData.filter((d) => {
      return (
        d.scenarioidentification?.toLowerCase().includes(val) ||
        d.scenariotitle?.toLowerCase().includes(val) ||
        d.approval_status?.toLowerCase().includes(val) ||
        d.scenariolevel?.toLowerCase().includes(val) ||
        d.scenariocategory?.toLowerCase().includes(val) ||
        d.scenariosubcategory?.toLowerCase().includes(val) ||
        (d.instructor_name?.toLowerCase() || "").includes(val) ||
        (typeof d.duration === "number" && d.duration.toString().includes(val))
      );
    });

    //  If nothing found → show empty (NOT fallback)
    setRowData(filtered);
    setGridData(filtered);
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
  };

  useEffect(() => {
    if (viewNameResp) {
      setView(viewNameResp);
    }
  }, [viewNameResp]);

  useEffect(() => {
    dispatch(getScenarioListapproved());
    if (viewNameResp != "list") {
      dispatch(handleManageView("card"));
    }
  }, []);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

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
    setShowTabs(false);
    handleOneClick(false);
    setPreviousView(view);
    setBackView(view);
    if (props && props.custom_scenariouuid) {
      title: "Add", setRowId(props.custom_scenariouuid);
      setView("Form");
      setApprovalStatus(props.approval_status);
      dispatch(handleManageView("Form"));
    }
  };

  useEffect(() => {
    if (approvalFilter === "Approve" && hasGetScenarioListapprovedSucc) {
      setRowData(hasGetScenarioListapprovedSucc);
      setGridData(hasGetScenarioListapprovedSucc);
    }

    if (approvalFilter === "Unapproved" && hasGetScenarioListSucc) {
      setRowData(hasGetScenarioListSucc);
      setGridData(hasGetScenarioListSucc);
    }
  }, [approvalFilter, hasGetScenarioListSucc, hasGetScenarioListapprovedSucc]);

  useEffect(() => {
    if (router.query.filter) {
      setApprovalFilter(router.query.filter);
      handleApprovalFilter(router.query.filter);
    }
  }, [router.query.filter]);

  const handleReturnView = (props) => {
    push({
      pathname: `/scenarios_view/${props?.scenariouuid}`,
      query: { status: props?.approval_status, tab: approvalFilter },
    });
  };
  const handleApprovalFilter = (status) => {
    setApprovalFilter(status);

    if (status === "Approve") {
      dispatch(getScenarioListapproved());
    } else {
      dispatch(getScenarioList());
    }
  };
  // Unapproved tab data
  useEffect(() => {
    if (approvalFilter === "Unapproved" && hasGetScenarioListSucc) {
      setRowData(hasGetScenarioListSucc);
      setGridData(hasGetScenarioListSucc);
    }
  }, [hasGetScenarioListSucc, approvalFilter]);

  // Approved tab data
  useEffect(() => {
    if (approvalFilter === "Approve" && hasGetScenarioListapprovedSucc) {
      setRowData(hasGetScenarioListapprovedSucc);
      setGridData(hasGetScenarioListapprovedSucc);
    }
  }, [hasGetScenarioListapprovedSucc, approvalFilter]);

  const handleReturnFromEdit = () => {
    setShowTabs(true);
    setView(previousView);
    dispatch(handleManageView(previousView));
  };
  useEffect(() => {
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
  }, [approvalFilter]);

  const frameworkComponents = {
    srNoRender: (props) => props.node.rowIndex + 1,

    actionButtonRenderer: (props) => {
      const item = props.data;
      const { approvalFilter } = props.context;

      return (
        <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
          {approvalFilter === "Unapproved" && (
            <div
              className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
              onClick={() => handleEdit(item)}
            >
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip>Edit</Tooltip>}
              >
                <i className="fe fe-edit"></i>
              </OverlayTrigger>
            </div>
          )}
          {approvalFilter === "Approve" && (
            <div
              className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
              onClick={() =>
                push({
                  pathname: `/scenarios_view/${item?.scenariouuid}`,
                  query: { status: "Approve", tab: "Approve" },
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
          )}
        </div>
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
  return (
    <>
      <Seo title="Custom Scenarios" />
      <ToastContainer />
      {showTabs && view != "Form" && (
        <Row className="mg-b-10 text-wrap">
          <Col md={12}>
            <div className="panel panel-primary tabs-style-2">
              <div className="tab-menu-heading">
                <div className="tabs-menu ">
                  <Tab.Container
                    id="scenario-tabs"
                    activeKey={approvalFilter}
                    onSelect={(key) => {
                      setApprovalFilter(key);
                      handleApprovalFilter(key);
                    }}
                  >
                    <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                      <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white">
                        <Nav.Item
                          className="mastermenu"
                          onClick={() => {
                            handleApprovalFilter("Approve");
                          }}
                        >
                          <Nav.Link
                            eventKey="Approve"
                            className="masterlist"
                            value={approvalFilter}
                            exclusive
                            style={{
                              color:
                                approvalFilter === "Approve"
                                  ? "#007bff"
                                  : "gray",
                              fontWeight:
                                approvalFilter === "Approve"
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            {" "}
                            Approved
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item
                          className="mastermenu"
                          onClick={() => {
                            handleApprovalFilter("Unapproved");
                          }}
                        >
                          <Nav.Link
                            eventKey="Unapproved"
                            className="masterlist"
                            value={approvalFilter}
                            exclusive
                            style={{
                              color:
                                approvalFilter === "Unapproved"
                                  ? "#007bff"
                                  : "gray",
                              fontWeight:
                                approvalFilter === "Unapproved"
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            Unapproved
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Row>
                  </Tab.Container>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      )}
      <Row className="row-sm">
        {view != "Form" && (
          <Col md={12}>
            <Card className="custom-card overflow-hidden">
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Custom Scenarios</h5>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <Button
                            type="button"
                            variant="outline-primary"
                            onClick={zoomOut}
                            className=" text-success mx-1"
                            title="Zoom In"
                          >
                            <i className="fas fa-search-plus"></i>
                          </Button>
                          <Button
                            type="button"
                            variant="outline-primary"
                            onClick={zoomIn}
                            className="text-success"
                            title="Zoom Out"
                          >
                            <i className="fas fa-search-minus"></i>
                          </Button>
                          &nbsp;
                        </>
                      )}
                      <Button
                        type="button"
                        title="Card View"
                        variant="outline-success"
                        onClick={() => {
                          handleApprovalFilter(approvalFilter);

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
                          handleApprovalFilter(approvalFilter);

                          handleChangeView("list");
                          dispatch(handleManageView("list"));
                        }}
                        className={view === "list" ? "active text-white" : ""}
                      >
                        <i className="fe fe-list"></i>
                      </Button>
                      &nbsp;&nbsp;
                      <Button
                        type="button"
                        variant="outline-primary"
                        onClick={() => {
                          // const hasPending = hasGetScenarioListSucc?.some(
                          //   (item) =>
                          //     item.approval_status &&
                          //     item.approval_status.toLowerCase() === "pending"
                          // );

                          // if (hasPending) {
                          //   toast.error(
                          //     "You cannot add a new scenario until the pending one is approved or rejected.",
                          //     {
                          //       position: "top-right",
                          //       autoClose: 3000,
                          //       hideProgressBar: false,
                          //       closeOnClick: true,
                          //       pauseOnHover: true,
                          //       draggable: true,
                          //       theme: "colored",
                          //     }
                          //   );
                          //   return;
                          // }

                          setView("Form");
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
                        context={{ approvalFilter }}
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
                      
                       onClick={
    approvalFilter === "Approve"
      ? () =>
          push({
            pathname: `/scenarios_view/${item?.scenariouuid}`,
            query: { fromTab: "Approve" },
          })
      : undefined
  }
                        className={`card custom-card pointer our-team h-100 custom-scenario-card ${item.scenariostatus === "Publish"
                            ? "shadow-publish"
                            : item.scenariostatus === "Draft"
                              ? "shadow-draft"
                              : ""
                          }`}
                      >
                        <Card.Body className="p-3 position-relative d-flex flex-column  text-center">
                          {/* VM Status Badge - Top Right */}
{approvalFilter === "Approve" && item.vm_status && (
  <div
    className="position-absolute top-0 end-0 m-2 z-1"
    style={{ pointerEvents: "none" }}
  >
    {(item.vm_status === "Start" || item.vm_status === "Resume") && (
      <span
        className="badge rounded-pill text-dark px-2 py-1 shadow-sm"
        style={{
          backgroundColor: "#28a745",
          color: "#fff",
          fontSize: "0.8rem",
        }}
      >
        Running
      </span>
    )}

    {item.vm_status === "Pause" && (
      <span
        className="badge rounded-pill bg-warning text-dark px-2 py-1 shadow-sm"
        style={{
          color: "#ffffff",
          fontSize: "0.8rem",
        }}
      >
        Pause
      </span>
    )}
  </div>
)}

                          {approvalFilter === "Unapproved" && (
                            <div
                              className="position-absolute top-0 end-0 m-2 z-1"
                              style={{ pointerEvents: "none" }}
                            >
                              {item.approval_status === "Pending" ? (
                                <span
                                  className="badge rounded-pill bg-secondary text-dark px-2 py-1 shadow-sm"
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Pending
                                </span>
                              ) : item.approval_status === "Reject" ? (
                                <span
                                  className="badge rounded-pill  text-white px-2 py-1 shadow-sm"
                                  style={{
                                    backgroundColor: "#892B3F",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Rejected
                                </span>
                              ) : item.approval_status === "Draft" ? (
                                <span
                                  className="badge rounded-pill bg-warning text-dark px-2 py-1 shadow-sm"
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Draft
                                </span>
                              ) : null}
                            </div>
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
                          </div>
                          {/* Second row for actions */}
                          <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                            {approvalFilter === "Unapproved" && (
                              <div
                                className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
                                onClick={() => handleEdit(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Edit</Tooltip>}
                                >
                                  <i className="fe fe-edit"></i>
                                </OverlayTrigger>
                              </div>
                            )}
                            {approvalFilter === "Approve" && (
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() =>
                                  push({
                                    pathname: `/scenarios_view/${item?.scenariouuid}`,
                                    query: { fromTab: "Approve" },
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
      {view == "Form" ? (
        <ScenarioForm
          setView={handleReturnFromEdit}
          rowId={rowId}
          handleOneClick={handleOneClick}
          oneClick={oneClick}
          approvalStatus={approvalStatus}
          backView={backview}
        />
      ) : (
        <></>
      )}
    </>
  );
};
ManageScenarios.layout = "Contentlayout";
export default ManageScenarios;
