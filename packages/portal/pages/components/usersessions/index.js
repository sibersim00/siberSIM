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
  terminateScenario,
  terminateScenarioByAdInst,
  clearSentNotification,
  clearTerminateScenario,
  clearTerminateScenarioByAdInst,
} from "../../../shared/redux/slices/usersession/usersessionManage";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import ChatBox from "./chatbox"; // Import the ChatBox component
// import { color } from "@mui/system";
import dummy_profile from "../../../public/assets/img/dummy_profile.png";


const UserSession = () => {
  const dispatch = useDispatch();
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null); // State to manage chat visibility
  const { push } = useRouter();
  const {
    hasGetUserSessionListSucc,
    hasSendNotificationSucc,
    hasGetTerminationSucc,
    hasGetTerminationByAdInstSucc,
  } = useSelector((state) => {
    return {
      hasGetUserSessionListSucc:
        state.usersessionManage.getUserSessionListData?.data,
      hasSendNotificationSucc: state.usersessionManage.sendNotification,
      hasGetTerminationSucc: state.usersessionManage.saveTermination,
      hasGetTerminationByAdInstSucc: state.usersessionManage.sendTermination,
    };
  });
  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData
  );
  // Debug - log notification state
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "",
      cellRenderer: "srNoRender",
      maxWidth: 80,
      sortable: false
    },
    {
      headerName: "Scenario",
      field: "scenariotitle",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
    },
    {
      headerName: "User",
      field: "learner_name",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Start Time",
      field: "startedon",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
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
          ? new Date(d.startedon).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
          }).toLowerCase()
          : '';

        return (
          (d.scenario_learner_status &&
            d.scenario_learner_status.toLowerCase().includes(val)) ||
          (d.scenariotitle &&
            d.scenariotitle.toLowerCase().includes(val)) ||
          (d.learner_name &&
            d.learner_name.toLowerCase().includes(val)) ||
          formattedStartedOn.includes(val) ||
          !val // show all if search box is empty
        );
      });

    setGridData(filtered);
    setRowData(filtered);
  };



  useEffect(() => {
    if (hasGetUserSessionListSucc) {
      setRowData(hasGetUserSessionListSucc);
      setGridData(hasGetUserSessionListSucc);
    }
  }, [hasGetUserSessionListSucc]);

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
        }
      );
      dispatch(getUserSessionList());
      dispatch(clearSentNotification());

    }
  }, [hasSendNotificationSucc]);

  // termination
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
        }
      );
      dispatch(getUserSessionList());
      dispatch(clearTerminateScenario());

    }
  }, [hasGetTerminationSucc]);

  // termination by Admin or Instructor
  useEffect(() => {
    if (hasGetTerminationByAdInstSucc.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasGetTerminationByAdInstSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getUserSessionList());
      dispatch(clearTerminateScenarioByAdInst());

    }
  }, [hasGetTerminationByAdInstSucc]);

  useEffect(() => {
    dispatch(getUserSessionList());
    return () => { };
  }, []);

  const handleReturnView = (props) => {
    push(`/usersession_view/${props?.scenariolearneruuid}`);

    console.log("props", props);
  };

  const handleSentTerminationNotification = (data) => {
    console.log("data", data);

    // Check if termination notification is already sent
    const isTerminationSent = data?.isnotitermination === "Yes";

    // Set dynamic message and confirm button text
    const swalText = isTerminationSent
      ? "Do you really want to remove the Termination Notification?"
      : "Do you really want to send the Termination Notification?";

    const swalTitle = isTerminationSent
      ? "Remove Notification?"
      : "Send Notification?";
    const confirmBtnText = isTerminationSent
      ? "Yes, remove it!"
      : "Yes, send it!";

    Swal.fire({
      title: swalTitle,
      text: swalText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: confirmBtnText,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          scenarioid: data?.scenarioid,
          scenariolearnersessionid: data?.currentsession_id,
          scenariolearnerid: data?.scenariolearnerid,
          learner_id: data?.learner_id,
        };

        dispatch(sentNotification(payload, data?.scenarioid));
        dispatch(clearSentNotification());
      }
    });
  };

  const handleToTerminate = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to Terminate the User Session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes!",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const scenariolearnersessionid = data?.currentsession_id;
        const type = getUserDataFromLocal?.usertype;

        const firstPayload = {
          scenariolearnersessionid,
          type,
        };

        // Call first API
        dispatch(terminateScenarioByAdInst(firstPayload))
          .then((res1) => {
            // Optional: check res1 for success before calling the second API
            const secondPayload = {
              scenariolearnersessionid,
              type,
              status: "Terminated",
            };

            // Call second API
            dispatch(terminateScenario(secondPayload));
            dispatch(clearTerminateScenario());
          })
          .catch((err) => {
            console.error("First API failed:", err);
            // Optionally show an error message
          });
      }
    });
  };

  const handleToSentRaiserequest = (sessionData) => {
    console.log("sessionData==============", sessionData);
    setSelectedSession(sessionData); // set the session data for the chatbox
    setShowChat(true); // open the chatbox
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
          terminationNotification={handleSentTerminationNotification}
          handleShowTerminationNotification={true}
          terminateStudent={handleToTerminate}
          handleShowTerminateStudent={true}
          raiseRequest={handleToSentRaiserequest} // Open chat on raiseRequest
          handleShowRaiseRequest={true} // Open chat on raiseRequest
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
    setRowData(hasGetUserSessionListSucc);
    setGridData(hasGetUserSessionListSucc);
  };

  return (
    <>
      <Seo title="User Session" />
      <ToastContainer />
      <Row className="row-sm">
        {view != "Form" && (
          <Col md={12}>
            <Card className="custom-card overflow-hidden">
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>User Session</h5>
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
                      <Card
                        className="card custom-card our-team h-100 shadow-sm"
                        style={{
                          // backgroundColor: "#f8f9fc",
                          transition:
                            "transform 0.2s ease, box-shadow 0.2s ease",
                          border:
                            item.isnotitermination === "Yes"
                              ? "2px solid rgba(240, 151, 151, 0.7)"
                              : "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 10px 20px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0,0,0,0.04)";
                        }}
                      >
                        <Card.Body className="p-3 position-relative d-flex flex-column justify-content-between text-center">
                          {/* Card Content */}
                          <div className="">
                            <div className="picture avatar-lg online text-center">
                              <div
                                className="rounded-circle pointer"
                                style={{
                                  width: "100px",        // fixed width
                                  height: "100px",       // fixed height
                                  overflow: "hidden",    // crop the overflow
                                  display: "inline-block"
                                }}
                              >
                                <img
                                  alt="avatar"
                                  onError={(e) => { e.target.onerror = null; e.target.src = dummy_profile.src }}
                                  src={
                                    item?.profile
                                      ? `${process.env.API_URL_FILEMANAGER}${item?.profile}`
                                      : dummy_profile.src
                                  }
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"    // keeps aspect ratio and fills circle
                                  }}
                                />
                              </div>
                            </div>
                            {/* Learner Name */}
                            <p className="text-success mt-4 mb-1">
                              {item.learner_name}
                            </p>
                            {/* Scenario Title */}
                            <h5 className="text-dark  mb-1 fs-5 pointer">
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

                            {/* scenario Instructor */}
                            <p className="text-muted mb-3 fs-6">
                              {new Date(item.startedon).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </p>

                            <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap ">
                              <div
                                className="btn btn-sm ripple rounded-circle"
                                style={{
                                  backgroundColor:
                                    item.isnotitermination === "Yes"
                                      ? "rgba(220, 53, 69, 0.2)" // bg-danger-transparent
                                      : "rgba(255, 193, 7, 0.2)", // bg-warning-transparent
                                  color:
                                    item.isnotitermination === "Yes"
                                      ? "rgb(220, 53, 69)" // text-danger
                                      : "rgb(255, 193, 7)", // text-warning
                                  transition:
                                    "background-color 0.3s ease, color 0.3s ease",
                                }}
                                onClick={() =>
                                  handleSentTerminationNotification(item)
                                }
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip>
                                      Sent Termination Notification
                                    </Tooltip>
                                  }
                                >
                                  <i className="fa fa-bell"></i>
                                </OverlayTrigger>
                              </div>

                              {/* chat Button */}

                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle position-relative"
                                onClick={() => {
                                  setSelectedSession(item);
                                  setShowChat(true);
                                }}
                                style={{ overflow: "visible" }}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>ChatBox</Tooltip>}
                                >
                                  {/* Icon wrapper must be position-relative for correct badge placement */}
                                  <span className="d-inline-block position-relative">
                                    <i className="fas fa-comments fs-6"></i>

                                    {item.unseen_message_count > 0 && (
                                      <span
                                        className="position-absolute top-0 start-100 translate-middle-y bg-danger badge rounded-pill text-white 
             px-1 py-0 small"
                                        style={{
                                          transform: "translate(30%, -40%)",
                                          zIndex: 1,
                                        }}
                                      >
                                        {item.unseen_message_count > 99
                                          ? "99+"
                                          : item.unseen_message_count}

                                        <span className="visually-hidden">
                                          unread messages
                                        </span>
                                      </span>
                                    )}
                                  </span>
                                </OverlayTrigger>
                              </div>

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

                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() =>
                                  push(
                                    `/usersession_view/${item?.scenariolearneruuid}`
                                  )
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
                        <Row
                          className="signpages text-center"
                          style={{ height: "70vh" }}
                        >
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                                backgroundColor: "#f6f7fb",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150"
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

      {/* ChatBox Component */}
      {showChat && (
        <ChatBox
          showChat={showChat}
          setShowChat={setShowChat}
          scenarioTitle={selectedSession?.scenariotitle}
          rowData={selectedSession}
        />
      )}
    </>
  );
};
UserSession.layout = "Contentlayout";
export default UserSession;
