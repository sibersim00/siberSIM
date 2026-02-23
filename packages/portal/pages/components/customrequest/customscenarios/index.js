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
  handleManageView,
} from "../../../../shared/redux/slices/customScenarios/customscenarioManage";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import ScenarioForm from "../../../../shared/data/customScenario/scenariosForm"
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import { Fab } from "@mui/material";
import dummy_network from "../../../../public/assets/img/dummy.jpg";
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [approvalFilter, setApprovalFilter] = useState("Pending");
  const {
    hasGetScenarioListSucc,
    errorData,
    deleteScenariosRes,
    hasScenariosStatusSucc,
    viewNameResp,
    getUserDataFromLocal,
  } = useSelector((state) => {
    return {
      hasGetScenarioListSucc:
        state &&
        state.customScenario &&
        state.customScenario.getScenarioListData.data,
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
    const maxLength = 20;
    const title = value || "";
    const truncatedTitle =
      title.length > maxLength ? title.substring(0, maxLength) + "..." : title;

    return (
      <div className="d-flex align-items-center position-relative">
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>{title}</Tooltip>}
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
      headerName: "Approval Status",
      field: "approval_status",
      filter: true,
      floatingFilter: true,
      minWidth: 160,
      cellRendererFramework: (params) => {
        const status = params.value?.toLowerCase();

        let colorClass = "text-secondary"; // default
        if (status === "approved") colorClass = "text-success";
        else if (status === "pending") colorClass = "text-warning";
        else if (status === "reject" || status === "rejected")
          colorClass = "text-danger";

        return (
          <span className={`fw-semibold ${colorClass}`}>
            {params.value
              ? params.value.charAt(0).toUpperCase() + params.value.slice(1)
              : "—"}
          </span>
        );
      },
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
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const onFilterChanged = (value) => {
    setQuickFilter(value);
    const val = value.toLowerCase();

    if (!hasGetScenarioListSucc) return;

    let filtered = [...hasGetScenarioListSucc];
    if (approvalFilter) {
      filtered = filtered.filter(
        (item) =>
          item.approval_status &&
          item.approval_status.toLowerCase() === approvalFilter.toLowerCase()
      );
    }
    if (scenStatus === "true" || scenStatus === "false") {
      filtered = filtered.filter(
        (item) => item?.status?.toString() === scenStatus
      );
    }
    if (val) {
      filtered = filtered.filter((d) => {
        return (
          d.scenarioidentification?.toLowerCase().includes(val) ||
          d.scenariotitle?.toLowerCase().includes(val) ||
          d.scenariolevel?.toLowerCase().includes(val) ||
          d.scenariocategory?.toLowerCase().includes(val) ||
          d.scenariosubcategory?.toLowerCase().includes(val) ||
          (d.instructor_name?.toLowerCase() || "").includes(val) ||
          (typeof d.duration === "number" &&
            d.duration.toString().includes(val))
        );
      });
    }

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
    let filtered = [...hasGetScenarioListSucc];
    if (approvalFilter) {
      filtered = filtered.filter(
        (item) =>
          item.approval_status &&
          item.approval_status.toLowerCase() === approvalFilter.toLowerCase()
      );
    }
    if (scenStatus === "true" || scenStatus === "false") {
      filtered = filtered.filter(
        (item) => item?.status?.toString() === scenStatus
      );
    }
    setRowData(filtered);
    setGridData(filtered);
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
    if (props && props.custom_scenariouuid) {
      title: "Add", setRowId(props.custom_scenariouuid);
      setView("Form");
      dispatch(handleManageView("Form"));
      console.log("first", props.custom_scenariouuid);
    }
  };
  useEffect(() => {
    if (router.query.filter) {
      setApprovalFilter(router.query.filter);
      handleApprovalFilter(router.query.filter);
    }
  }, [router.query.filter]);
  const handleReturnView = (props) => {
    push({
      pathname: `/custom_scenarios_view/${props?.custom_scenariouuid}`,
      query: { backView: approvalFilter },
    });
  };

  const handleReturnFromEdit = () => {
    setView(previousView);
    dispatch(handleManageView(previousView));
  };
  const handleFiles = (props, action = "view") => {
    if (props?.instruction_file) {
      const fileUrl = `${process.env.API_URL_FILEMANAGER}${props.instruction_file}`;

      if (action === "view") {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
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
      const approvalStatus = props?.data?.approval_status?.toLowerCase();

      return (
        <ActionButtonRenderer
          handleEdit={handleEdit}
          handleEditView={handleReturnView}
          handleShowEditView={true}
          propsVal={props}
          handleShowEdit={approvalStatus === "pending"}
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
  const handleApprovalFilter = (status) => {
    setApprovalFilter(status);

    if (hasGetScenarioListSucc && hasGetScenarioListSucc.length > 0) {
      const filtered = hasGetScenarioListSucc.filter(
        (item) =>
          item.approval_status &&
          item.approval_status.toLowerCase() === status.toLowerCase()
      );

      setRowData(filtered);
      setGridData(filtered);
    }
  };
  useEffect(() => {
    if (hasGetScenarioListSucc && hasGetScenarioListSucc.length > 0) {
      const filtered = hasGetScenarioListSucc.filter(
        (item) =>
          item.approval_status &&
          item.approval_status.toLowerCase() === approvalFilter.toLowerCase()
      );

      setRowData(filtered);
      setGridData(filtered);
    }
  }, [hasGetScenarioListSucc, approvalFilter]);
  return (
    <>
      <Seo title="Custom Scenarios" />
      <ToastContainer />
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
                      &nbsp;
                      <ToggleButtonGroup
                        color="success"
                        value={approvalFilter}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          const selected = e.target.value;
                          if (selected) handleApprovalFilter(selected);
                        }}
                      >

                        <CustomToggleButton value="Pending">
                          Pending
                        </CustomToggleButton>
                        <CustomToggleButton value="Approve">
                          Approved
                        </CustomToggleButton>
                        <CustomToggleButton value="Reject">
                          Rejected
                        </CustomToggleButton>
                      </ToggleButtonGroup>
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
                      {console.log(
                        "itemitemitemitemitemitemitemitemitemitem",
                        item
                      )}
                      <Card
                        className={`card custom-card our-team h-100 custom-scenario-card ${item.scenariostatus === "Publish"
                          ? "shadow-publish"
                          : item.scenariostatus === "Draft"
                            ? "shadow-draft"
                            : ""
                          }`}
                      >
                        <Card.Body className="p-3 position-relative d-flex flex-column text-center">
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
                            <p className=" mb-1 fs-6">{item.learner_name}</p>
                          </div>

                          {/* Second row for actions */}
                          <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                            {item.approval_status?.toLowerCase() ===
                              "pending" && (
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
                                  pathname: `/custom_scenarios_view/${item?.custom_scenariouuid}`,
                                  query: { backView: approvalFilter }, //  preserve current filter
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
                  const blob = await dispatch();
                  // exportSelectedScenariosAction({ scenarioIds: selectedScenarios.map(s => s.value) })

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
    </>
  );
};
ManageScenarios.layout = "Contentlayout";
export default ManageScenarios;
