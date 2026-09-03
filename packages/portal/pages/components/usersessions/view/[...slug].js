import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Nav, Tab, Badge } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

import { useRouter } from "next/router";

import {
  sentNotification,
  terminateScenario,
  terminateScenarioByAdInst,
  getSingleUserSession,
  clearSingleUserSession,
  getLogs,
  clearSentNotification,
  clearTerminateScenario,
  clearTerminateScenarioByAdInst,
} from "../../../../shared/redux/slices/usersession/usersessionManage";

import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import ScenarioDiagram from "./scenariodiagram";
import ChatBox from "../chatbox"; // Import the ChatBox component

const PdfLoader = dynamic(
  () => import("../../../../shared/data/common/PdfLoader"),
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> }
);

const UserSessionView = () => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const [rowValues, setRowValues] = useState({});
  const [activeTab, setActiveTab] = useState("basic_info");
  const backTo = query?.backView;
  const [rowId, setRowId] = useState("");
  const [selectedSession, setSelectedSession] = useState(null); // State to manage chat visibility
  const [showChat, setShowChat] = useState(false);
  const {
    hasGetSingleUserSessionSucc,
    hasGetLogsListData,
    hasSendNotificationSucc,
    hasGetTerminationSucc,
    hasGetTerminationByAdInstSucc,
    errorData,
  } = useSelector((state) => ({
    hasGetSingleUserSessionSucc:
      state.usersessionManage.singleUserSession?.data,
    hasGetLogsListData: state?.usersessionManage?.getLogsData?.data,
    hasSendNotificationSucc: state.usersessionManage.sendNotification,
    hasGetTerminationSucc: state.usersessionManage.saveTermination,
    hasGetTerminationByAdInstSucc: state.usersessionManage.sendTermination,

    errorData: state?.scenarios?.error,
  }));
  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData
  );
  const statusBadgeMap = {
    Start: "primary-transparent",
    Pause: "warning-transparent",
    Resume: "info-transparent",
    Terminated: "danger-transparent",
    Completed: "success-transparent",
    Failed: "dark-transparent",
    Initiated: "secondary-transparent",
  };

  const typeBadgeMap = {
    Learner: "primary-transparent",
    Instructor: "success-transparent",
    Admin: "danger-transparent",
    System: "secondary-transparent",
  };

  const badgeTextColorMap = {
    "primary-transparent": "text-primary",
    "secondary-transparent": "text-secondary",
    "success-transparent": "text-success",
    "danger-transparent": "text-danger",
    "warning-transparent": "text-warning",
    "info-transparent": "text-info",
    "dark-transparent": "text-dark",
    "light-transparent": "text-dark", // light bg needs dark text
  };
  useEffect(() => {
    if (query.slug) {
      setRowId(query.slug[0]);

      dispatch(getSingleUserSession(query.slug[0]));
    }
  }, [query.slug]);
  useEffect(() => {
    if (hasGetSingleUserSessionSucc && hasGetSingleUserSessionSucc.length > 0) {
      setRowValues(hasGetSingleUserSessionSucc[0]); // Get the first (and probably only) item
    }
  }, [hasGetSingleUserSessionSucc]);
  useEffect(() => {
    if (activeTab === "logs") {
      const payload = {
        vmrequestid: rowValues?.vmrequestid,
      };
      dispatch(getLogs(payload));
    }
  }, [activeTab, rowValues?.vmrequestuuid]);

  const vmrequestid = rowValues?.vmrequestuuid;

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
      // dispatch(getSingleUserSession(vmrequestid));
      dispatch(getSingleUserSession(query.slug[0]));

      dispatch(clearSentNotification());
    }
  }, [hasSendNotificationSucc]);

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
      dispatch(getSingleUserSession(query.slug[0]));

      dispatch(clearTerminateScenario());
    }
  }, [hasGetTerminationSucc]);

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
      dispatch(getSingleUserSession(query.slug[0]));
      dispatch(clearTerminateScenarioByAdInst());
    }
  }, [hasGetTerminationByAdInstSucc]);

  useEffect(() => {
    if (errorData?.statusCode === 400) {
      setIsScenarioError400(true);
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
      dispatch(clearHasError());
    }
  }, [errorData]);

  const baseUrl = process.env.API_URL_FILEMANAGER;

  const pdfUrl = rowValues?.instruction_file
    ? `${baseUrl}${rowValues.instruction_file}`
    : null;

  const handleSentTerminationNotification = (data) => {
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
          vmrequestid: data?.vmrequestid,
          vmrequestuuid: data?.vmrequestuuid,
          learner_id: data?.learner_id,
        };
        dispatch(sentNotification(payload, data?.scenarioid));
        dispatch(clearSentNotification());
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: "Cancelled",
          text: "Termination notification was not changed.",
          icon: "info",
          confirmButtonColor: "var(--primary-bg-color)",
        });
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
        const scenariolearnersessionid = data?.scenariolearnersessionid;
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
    setSelectedSession(sessionData); // set the session data for the chatbox
    setShowChat(true); // open the chatbox
  };
  return (
    <>
      <Seo title="User Session" />
      <ToastContainer />
      <Row className="view-component-row-sm">
        <Col md={12}>
          <Card className="view-component-card overflow-hidden mb-3">
            <Card.Body className="p-3">
              <Row className="view-component-row-sm">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    {/* Left side: Difficulty Stars + Scenario Title */}
                    <div className="d-flex align-items-center">
                      {/* Difficulty Stars */}
                      <div className="me-3 d-flex align-items-center">
                        {(() => {
                          const level = rowValues?.scenariolevel;
                          const filledStars =
                            level === "Easy"
                              ? 1
                              : level === "Medium"
                                ? 2
                                : level === "Hard"
                                  ? 3
                                  : 0;
                          const colorClass =
                            level === "Easy"
                              ? "text-success"
                              : level === "Medium"
                                ? "text-warning"
                                : level === "Hard"
                                  ? "text-danger"
                                  : "text-muted";

                          return [1, 2, 3].map((star) => (
                            <i
                              key={star}
                              className={`me-1 ${star <= filledStars
                                  ? `fas fa-star ${colorClass}`
                                  : "far fa-star text-muted"
                                }`}
                              style={{ fontSize: "18px" }}
                            ></i>
                          ));
                        })()}
                      </div>
                      <span
                        className="fw-semibold"
                        style={{ fontSize: "18px" }}
                      >
                        {rowValues?.scenarioidentification || "—"} -{" "}
                        {rowValues?.scenariotitle || "—"}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      {/* Buttons group */}
                      <div className="d-flex gap-2 me-2">
                        <div
                          className="btn btn-sm ripple rounded-circle"
                          style={{
                            backgroundColor:
                              rowValues?.isnotitermination === "Yes"
                                ? "rgba(220, 53, 69, 0.2)"
                                : "rgba(255, 193, 7, 0.2)",
                            color:
                              rowValues?.isnotitermination === "Yes"
                                ? "rgb(220, 53, 69)"
                                : "rgb(255, 193, 7)",
                            transition:
                              "background-color 0.3s ease, color 0.3s ease",
                          }}
                          onClick={() =>
                            handleSentTerminationNotification(rowValues)
                          }
                        >
                          <i className="fa fa-bell"></i>
                        </div>

                        <div
                          className="btn btn-sm ripple bg-success-transparent text-success rounded-circle position-relative"
                          onClick={() => {
                            setSelectedSession(rowValues);
                            setShowChat(true);
                          }}
                          style={{ overflow: "visible" }}
                        >
                          <span className="d-inline-block position-relative">
                            <i className="fas fa-comments fs-6"></i>

                            {rowValues?.unseen_message_count > 0 && (
                              <span
                                className="position-absolute top-0 start-100 translate-middle-y bg-danger badge rounded-pill text-white 
             px-1 py-0 small"
                                style={{
                                  transform: "translate(30%, -40%)",
                                  zIndex: 1,
                                }}
                              >
                                {rowValues?.unseen_message_count > 99
                                  ? "99+"
                                  : rowValues?.unseen_message_count}
                                <span className="visually-hidden">
                                  unread messages
                                </span>
                              </span>
                            )}
                          </span>
                        </div>

                        {/* <div
                          className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle"
                          onClick={() => handleToTerminate(rowValues)}
                        >
                          <i className="fas fa-user-lock"></i>
                        </div> */}
                      </div>

                      {/* Back Button */}
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          push(`/user-sessions?view=${backTo || "list"}`);
                          dispatch(clearSingleUserSession());
                        }}
                      >
                        <i className="fe fe-arrow-left"></i>
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Custom Tabs Section (Instruction & Diagram) */}
        <Col md={12}>
          <Card className="bg-white shadow-sm rounded-4 border-0 mb-4">
            <Card.Body>
              <Row className="mg-b-10 text-wrap">
                <div className="panel panel-primary tabs-style-2 w-100">
                  <div className="tab-menu-heading">
                    <div className="tabs-menu">
                      <Tab.Container id="scenario-tabs" activeKey={activeTab}>
                        <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                          <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white w-100">
                            <Nav.Item
                              onClick={() => setActiveTab("basic_info")}
                              style={{ flex: 1, textAlign: "start" }}
                            >
                              <Nav.Link
                                eventKey="basic_info"
                                className="masterlist"
                                style={{
                                  color:
                                    activeTab === "basic_info"
                                      ? "#007bff"
                                      : "gray",
                                  fontWeight:
                                    activeTab === "basic_info"
                                      ? "bold"
                                      : "normal",
                                }}
                              >
                                Basic Information
                              </Nav.Link>
                            </Nav.Item>

                            <Nav.Item
                              onClick={() => setActiveTab("instruction")}
                              style={{ flex: 1, textAlign: "start" }}
                            >
                              <Nav.Link
                                eventKey="instruction"
                                className="masterlist"
                                style={{
                                  color:
                                    activeTab === "instruction"
                                      ? "#007bff"
                                      : "gray",
                                  fontWeight:
                                    activeTab === "instruction"
                                      ? "bold"
                                      : "normal",
                                }}
                              >
                                Instruction Details
                              </Nav.Link>
                            </Nav.Item>

                            <Nav.Item
                              onClick={() => setActiveTab("diagram")}
                              style={{ flex: 1, textAlign: "start" }}
                            >
                              <Nav.Link
                                eventKey="diagram"
                                className="masterlist"
                                style={{
                                  color:
                                    activeTab === "diagram"
                                      ? "#007bff"
                                      : "gray",
                                  fontWeight:
                                    activeTab === "diagram" ? "bold" : "normal",
                                }}
                              >
                                Scenario Diagram
                              </Nav.Link>
                            </Nav.Item>

                            <Nav.Item
                              onClick={() => setActiveTab("logs")}
                              style={{ flex: 1, textAlign: "start" }}
                            >
                              <Nav.Link
                                eventKey="logs"
                                className="masterlist"
                                style={{
                                  color:
                                    activeTab === "logs" ? "#007bff" : "gray",
                                  fontWeight:
                                    activeTab === "logs" ? "bold" : "normal",
                                }}
                              >
                                Logs
                              </Nav.Link>
                            </Nav.Item>
                          </Nav>
                        </Row>

                        {/* Tab content with 100% width */}
                        <Row>
                          <Col md={12} className="pt-3">
                            <Tab.Content>
                              <Tab.Pane eventKey="basic_info">
                                <Row className="gy-4">
                                  {/* Learner Name */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-user text-primary fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.firstname || "—"}{" "}
                                          {rowValues?.lastname || ""}
                                        </div>
                                        <small className="text-muted">
                                          User Name
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Learner Email */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-mail text-danger fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.email || "—"}
                                        </div>
                                        <small className="text-muted">
                                          Email
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Learner Mobile */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-phone text-success fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.mobile || "—"}
                                        </div>
                                        <small className="text-muted">
                                          Mobile Number
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Category */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-layers text-success fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.scenariocategory_name ||
                                            "—"}
                                        </div>
                                        <small className="text-muted">
                                          Scenario Category
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Subcategory */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-tag text-success fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.scenariosubcategory_name ||
                                            "—"}
                                        </div>
                                        <small className="text-muted">
                                          Scenario Subcategory
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Duration */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-clock text-danger fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.duration
                                            ? `${rowValues.duration} mins`
                                            : "0 mins"}
                                        </div>
                                        <small className="text-muted">
                                          Duration (In Minutes)
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-bar-chart text-warning fs-4 mt-1"></i>
                                      <div>
                                        <div className=" d-flex align-items-center  mb-1">
                                          {(() => {
                                            const level =
                                              rowValues?.scenariolevel;
                                            const filledStars =
                                              level === "Easy"
                                                ? 1
                                                : level === "Medium"
                                                  ? 2
                                                  : level === "Hard"
                                                    ? 3
                                                    : 0;
                                            const colorClass =
                                              level === "Easy"
                                                ? "text-success"
                                                : level === "Medium"
                                                  ? "text-warning"
                                                  : level === "Hard"
                                                    ? "text-danger"
                                                    : "text-muted";

                                            return [1, 2, 3].map((star) => (
                                              <i
                                                key={star}
                                                className={`me-1 ${star <= filledStars
                                                    ? `fas fa-star ${colorClass}`
                                                    : "far fa-star text-muted"
                                                  }`}
                                                style={{ fontSize: "18px" }}
                                              ></i>
                                            ));
                                          })()}
                                        </div>
                                        <small className="text-muted">
                                          Level
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Total VM */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-server text-primary fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.component_count}
                                        </div>
                                        <small className="text-muted">
                                          Total VM
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Virtual CPU */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-cpu text-info fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.virtual_cpu} Cores
                                        </div>
                                        <small className="text-muted">
                                          Virtual CPU
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Virtual Memory */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-box text-warning fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.virtual_memory} M
                                        </div>
                                        <small className="text-muted">
                                          Virtual Memory
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Storage Size */}
                                  <Col md={3}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-hard-drive text-success fs-4 mt-1"></i>
                                      <div>
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.storage_size} GB
                                        </div>
                                        <small className="text-muted">
                                          Storage Size
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

                                  {/* Description */}
                                  <Col md={12}>
                                    <div className="d-flex align-items-start gap-3">
                                      <i className="fe fe-file-text text-dark fs-4 mt-1"></i>
                                      <div>
                                        <div
                                          className="fw-semibold text-dark mb-2"
                                          dangerouslySetInnerHTML={{
                                            __html:
                                              rowValues?.scenariodescription ||
                                              "—",
                                          }}
                                        />
                                        <small className="text-muted">
                                          Description
                                        </small>
                                      </div>
                                    </div>
                                  </Col>
                                </Row>
                              </Tab.Pane>

                              <Tab.Pane eventKey="instruction">
                                {activeTab === "instruction" &&
                                  (pdfUrl ? (
                                    <PdfLoader fileUrl={pdfUrl} />
                                  ) : (
                                    <p className="text-muted">
                                      No instruction PDF provided.
                                    </p>
                                  ))}
                              </Tab.Pane>
                              <Tab.Pane eventKey="diagram">
                                <div>
                                  <ScenarioDiagram
                                    scenarioId={rowId}
                                    scenariodiagram={
                                      rowValues?.scenariodiagram &&
                                        rowValues.scenariodiagram.trim() !== ""
                                        ? rowValues.scenariodiagram
                                        : ""
                                    }
                                    isEditFlag={rowValues?.isedit}
                                  />
                                </div>
                              </Tab.Pane>

                              <Tab.Pane eventKey="logs">
                                <div className="p-3">
                                  {hasGetLogsListData &&
                                    hasGetLogsListData.length > 0 ? (
                                    <div
                                      style={{
                                        maxHeight: "600px",
                                        overflowY: "auto",
                                        border: "1px solid #ddd",
                                        borderRadius: "6px",
                                      }}
                                    >
                                      <table className="table text-nowrap table-bordered">
                                        <thead className="table-info">
                                          <tr>
                                            <th>Session Start</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Log Date</th>
                                            <th>Remark</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {hasGetLogsListData.map(
                                            (log, index) => {
                                              const statusColor =
                                                statusBadgeMap[log.status] ||
                                                "light-transparent";
                                              const typeColor =
                                                typeBadgeMap[log.type] ||
                                                "light-transparent";

                                              const statusTextClass =
                                                badgeTextColorMap[
                                                statusColor
                                                ] || "text-dark";
                                              const typeTextClass =
                                                badgeTextColorMap[typeColor] ||
                                                "text-dark";

                                              return (
                                                <tr key={index}>
                                                  <td>
                                                    {new Date(
                                                      log.startedon
                                                    ).toLocaleString("en-US", {
                                                      year: "numeric",
                                                      month: "short",
                                                      day: "2-digit",
                                                      hour: "numeric",
                                                      minute: "2-digit",
                                                      second: "2-digit",
                                                      hour12: true,
                                                    })}
                                                  </td>

                                                  <td>
                                                    <Badge
                                                      bg={typeColor}
                                                      className={`rounded-pill ${typeTextClass}`}
                                                    >
                                                      {log.type}
                                                    </Badge>
                                                  </td>

                                                  <td>
                                                    <Badge
                                                      bg={statusColor}
                                                      className={`rounded-pill ${statusTextClass}`}
                                                    >
                                                      {log.status}
                                                    </Badge>
                                                  </td>

                                                  <td>
                                                    {new Date(
                                                      log.createdon
                                                    ).toLocaleString("en-US", {
                                                      year: "numeric",
                                                      month: "short",
                                                      day: "2-digit",
                                                      hour: "numeric",
                                                      minute: "2-digit",
                                                      second: "2-digit",
                                                      hour12: true,
                                                    })}
                                                  </td>

                                                  <td>{log.remark}</td>
                                                </tr>
                                              );
                                            }
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-muted">
                                      No logs available.
                                    </p>
                                  )}
                                </div>
                              </Tab.Pane>
                            </Tab.Content>
                          </Col>
                        </Row>
                      </Tab.Container>
                    </div>
                  </div>
                </div>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* ChatBox Component */}
      {showChat && (
        <ChatBox
          showChat={showChat}
          setShowChat={setShowChat}
          scenarioTitle={rowValues?.scenariotitle}
          rowData={rowValues}
        />
      )}
    </>
  );
};

UserSessionView.layout = "Contentlayout";
export default UserSessionView;
