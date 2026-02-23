import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import {
  getUserSessionList,
  sentNotification,
  // terminateScenario,
  terminateScenarioByAdInst,
  clearSentNotification,
  clearTerminateScenario,
  clearTerminateScenarioByAdInst,
  deletescenario,
} from "../../../shared/redux/slices/usersession/usersessionManage";
import {
  fetchapilogslist,
  terminateScenario,
  stopcomponent,
  clearfetchlogs,
  fetchApiLogById,
  clearfetchlogbyid,
} from "../../../shared/redux/slices/runningComponents/runningComponents.js";
// import {
//   deletescenario
// } from "../../../shared/redux/slices/scenariostart/scenariostartmanage";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";

import dummy_profile from "../../../public/assets/img/dummy_profile.png";

const RunningComponent = () => {
  const dispatch = useDispatch();
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [scenType, setScenType] = useState("All"); // Public/Private

  const [selectedSession, setSelectedSession] = useState(null); // State to manage chat visibility
  const { push } = useRouter();
  const {
    hasGetUserSessionListSucc,
    hasSendNotificationSucc,
    hasGetTerminationSucc,
    hasGetDeleteSucc,
    hasGetTerminationByAdInstSucc,
    hasFetchapilogsSuccesslist,
  } = useSelector((state) => {
    return {
      hasGetUserSessionListSucc:
        state.usersessionManage.getUserSessionListData?.data,
      hasSendNotificationSucc: state.usersessionManage.sendNotification,
      hasGetTerminationSucc: state.usersessionManage.saveTermination,
      hasGetDeleteSucc: state.usersessionManage.hasdeletescenarioSuccData,
      hasGetTerminationByAdInstSucc: state.usersessionManage.sendTermination,
      hasFetchapilogsSuccesslist:
        state?.runningComponent?.apilogsDatalist?.data,
    };
  });

  console.log(
    "hasFetchapilogsSuccesslisthasFetchapilogsSuccesslist",
    hasFetchapilogsSuccesslist,
  );

  useEffect(() => {
    dispatch(fetchapilogslist());
  }, []);

  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData,
  );
  // Debug - log notification state
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "",
      cellRenderer: "srNoRender",
      maxWidth: 80,
      sortable: false,
    },
    {
      headerName: "Component Name",
      field: "componentname",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
    },
    {
      headerName: "Component Type",
      field: "componenttype",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
    },
    {
      headerName: "Scenario Name",
      field: "scenariotitle",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
      cellRenderer: "vmStatusRenderer",
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      minWidth: 150,
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

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    const filtered =
      hasGetUserSessionListSucc &&
      hasGetUserSessionListSucc.filter((d) => {
        const formattedStartedOn = d.startedon
          ? new Date(d.startedon)
              .toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: true,
              })
              .toLowerCase()
          : "";

        return (
          (d.status && d.status.toLowerCase().includes(val)) ||
          (d.componenttype && d.componenttype.toLowerCase().includes(val)) ||
          (d.scenariotitle && d.scenariotitle.toLowerCase().includes(val)) ||
          (d.componentname && d.componentname.toLowerCase().includes(val)) ||
          formattedStartedOn.includes(val) ||
          !val // show all if search box is empty
        );
      });

    setGridData(filtered);
    setRowData(filtered);
  };

  useEffect(() => {
    if (hasFetchapilogsSuccesslist) {
      setRowData(hasFetchapilogsSuccesslist);
      setGridData(hasFetchapilogsSuccesslist);
    }
  }, [hasFetchapilogsSuccesslist]);

  useEffect(() => {
    if (hasSendNotificationSucc.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasSendNotificationSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      // dispatch(getUserSessionList());
      dispatch(clearSentNotification());
    }
  }, [hasSendNotificationSucc]);

  // useEffect(() => {
  //   if (hasGetTerminationByAdInstSucc.statusCode === 200) {
  //     toast.success(
  //       <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
  //         {hasGetTerminationByAdInstSucc?.message}
  //       </p>,
  //       {
  //         position: toast.POSITION.TOP_RIGHT,
  //         hideProgressBar: false,
  //         theme: "colored",
  //       }
  //     );
  //     dispatch(getUserSessionList());
  //     dispatch(clearTerminateScenarioByAdInst());
  //   }
  // }, [hasGetTerminationByAdInstSucc]);
  useEffect(() => {
    if (hasGetTerminationSucc.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasGetTerminationSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      // dispatch(getUserSessionList());
      dispatch(clearTerminateScenarioByAdInst());
    }
  }, [hasGetTerminationSucc]);

  const handleToTerminate = (data) => {
    console.log("terminateScenarioterminateScenarioterminateScenario", data);

    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to destroy this component?To safely remove it, the system will stop it first and then destroy it.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes!",
      allowOutsideClick: false,
      showLoaderOnConfirm: true,

      preConfirm: async () => {
        try {
          // 🔄 Update modal → hide Yes button
          Swal.update({
            title: "Please wait...",
            text: "Your scenario is being terminated. This may take a few moments.",
            icon: "info",
            showCancelButton: false,
            showConfirmButton: false, // ✅ THIS is the key
          });

          const vmrequestid = data?.vmrequestid;
          const vmid = data?.vmid;
          const type = getUserDataFromLocal?.usertype;

          const basePayload = { vmrequestid, vmid };
console.log("basePayloadbasePayloadbasePayload",basePayload);

          // await dispatch(terminateScenarioByAdInst(basePayload));
          await dispatch(terminateScenario(basePayload));

          // dispatch(clearTerminateScenario());
          return true;
        } catch (err) {
          console.error("Terminate failed:", err);

          Swal.showValidationMessage(
            "Failed to terminate the scenario. Please try again.",
          );
          return false;
        }
      },
    });
  };

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    vmStatusRenderer: (props) => {
      const status = props.value;

      const bg =
        status === "Running"
          ? "green"
          : status === "Pause"
            ? "orange" // yellow
            : "#6c757d"; // grey default

      return (
        <span
          className="badge"
          style={{
            backgroundColor: bg,
            color: "white",
            fontSize: "12px",
            padding: "5px 10px",
            borderRadius: "12px",
          }}
        >
          {status}
        </span>
      );
    },

    actionButtonRenderer: function (props) {
      console.log("propspropspropspropsprops", props);
      return (
        <ActionButtonRenderer
          terminateStudent={handleToTerminate}
          handleShowTerminateStudent={true}
          propsVal={props}
        />
      );
    },
  };

  const [columnsPerRow, setColumnsPerRow] = useState(4); // Default value
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

  const handleChangeView = (thisView) => {
    setView(thisView);
    setQuickFilter("");
    setRowData(hasFetchapilogsSuccesslist);
    setGridData(hasFetchapilogsSuccesslist);
  };
  useEffect(() => {
    if (hasFetchapilogsSuccesslist) {
      let filtered = [...hasFetchapilogsSuccesslist];

      // All → no filter

      setRowData(filtered);
      setGridData(filtered);
    }
  }, [hasFetchapilogsSuccesslist, scenType]);

  return (
    <>
      <Seo title="Running Components" />
      <ToastContainer />
      <Row className="row-sm">
        {view != "Form" && (
          <Col md={12}>
            <Card className="custom-card overflow-hidden">
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Running Components</h5>
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
                        }}
                        className={view === "list" ? "active text-white" : ""}
                      >
                        <i className="fe fe-list"></i>
                      </Button>
                      &nbsp;
                      {/* <ToggleButtonGroup
                        color="success"
                        // value={scenType}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          setScenType(e.target.value);
                        }}
                      >
                        <CustomToggleButton value="All">
                          All
                        </CustomToggleButton>
                      </ToggleButtonGroup> */}
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
                        // overlayNoRowsTemplate="No data available"
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
                <Row className="g-3">
                  {gridData.map((item, index) => (
                    <Col key={index} md={12 / columnsPerRow}>
                      {/* <Card className="card custom-card our-team h-100 shadow-sm"> */}
                      {console.log("itemitemitemitemitem", item)}
                      <Card
                        className={`card custom-card our-team h-100 custom-scenario-card ${
                          item.scenario_status === "Resume"
                            ? "shadow-publish"
                            : item.scenario_status === "Pause"
                              ? "shadow-draft"
                              : ""
                        }`}
                        style={{
                          // backgroundColor: "#f8f9fc",
                          transition:
                            "transform 0.2s ease, box-shadow 0.2s ease",
                          border:
                            item.isnotitermination === "Yes"
                              ? "2px solid rgba(240, 151, 151, 0.7)"
                              : "none",
                        }}
                      >
                        <Card.Body className="p-3 position-relative d-flex flex-column justify-content-between text-center">
                          {/* Card Content */}
                          <div className="">
                            <div className="picture avatar-lg online text-center">
                              <div
                                className="rounded-circle pointer"
                                style={{
                                  width: "100px", // fixed width
                                  height: "100px", // fixed height
                                  overflow: "hidden", // crop the overflow
                                  display: "inline-block",
                                }}
                              >
                                <img
                                  alt="avatar"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = dummy_profile.src;
                                  }}
                                  src={
                                    item?.profile
                                      ? `${process.env.API_URL_FILEMANAGER}${item?.profile}`
                                      : dummy_profile.src
                                  }
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover", // keeps aspect ratio and fills circle
                                  }}
                                />
                              </div>
                            </div>
                            {/* Learner Name */}
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Component Name</Tooltip>}
                            >
                              <p className="text-success mt-4 mb-1 pointer">
                                {item.componentname}
                              </p>
                            </OverlayTrigger>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Scenario Title</Tooltip>}
                            >
                              <h5 className="text-dark mb-1 fs-5 pointer">
                                <span
                                  className="d-inline-block text-truncate w-100"
                                  style={{ maxWidth: "100%" }}
                                >
                                  {item.scenariotitle?.length > 30
                                    ? `${item.scenariotitle.substring(0, 27)}...`
                                    : item.scenariotitle}
                                </span>
                              </h5>
                            </OverlayTrigger>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Simuser</Tooltip>}
                            >
                              <p className="text-muted mb-3 fs-6 pointer">
                                {item.learnername}
                              </p>
                            </OverlayTrigger>

                            <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap ">
                              <div
                                className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle"
                                onClick={() => handleToTerminate(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Termination</Tooltip>}
                                >
                                  <i className="fas fa-user-lock"></i>
                                </OverlayTrigger>
                              </div>

                              <div className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip>{item.componenttype}</Tooltip>
                                  }
                                >
                                  <i className="fe fe-box"></i>
                                </OverlayTrigger>
                              </div>
                              <div className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{item.vmid}</Tooltip>}
                                >
                                  <i className="fe fe-grid"></i>
                                </OverlayTrigger>
                              </div>
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
    </>
  );
};
RunningComponent.layout = "Contentlayout";
export default RunningComponent;
