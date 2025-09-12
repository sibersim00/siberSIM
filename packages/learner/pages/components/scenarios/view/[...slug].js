import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Button,
  Nav,
  Tab,
  Modal,
  Alert,
  Badge,
} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import { useRouter } from "next/router";
import {
  getSingleScenarios,
  clearSingleScenarios,
  saveScenarios,
  updateSessionStatus,
  getSessionStatusList,
  clearHasError,
  clearSaveScenarios,
  getConfigurations,
  updateCompletedTerminated,
  getLogs,
  clearGetSessionStatusList,
  clearUpdateCompletedTerminated,
} from "../../../../shared/redux/slices/scenarios/scenarios";
import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import ScenarioDiagram from "./scenariodiagram";
import ChatBox from "./chatbox";
import ScenarioQuiz from "./quiz";

const ScenariosView = () => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const [rowId, setRowId] = useState("");
  const [rowValues, setRowValues] = useState({});
  const [activeTab, setActiveTab] = useState("basic_info");
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const backTo = query?.backView;
  const [showChat, setShowChat] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isNotified, setIsNotified] = useState(false);
  const [replyReceived, setReplyReceived] = useState(false);
  const [scenarioStatus, setScenarioStatus] = useState("Pending");
  const [vmStep, setVmStep] = useState("");
  const pollingRef = useRef(null);
  const [countdown, setCountdown] = useState(10);
  const [countdownActive, setCountdownActive] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [isScenarioError400, setIsScenarioError400] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isTerminatingOrCompleting, setIsTerminatingOrCompleting] =
    useState(false);

  const vmStepsOrder = [
    "Initializing",
    "Cloning",
    "Bridge Configuration",
    "Starting",
    "Running",
  ];

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
    "light-transparent": "text-dark",
  };

  const {
    getSingleScenariosSucc,
    saveScenariosData,
    hasGetSessionStatusListData,
    hasGetLogsListData,
    hasUpdateCompletedTerminatedSucc,
    errorData,
  } = useSelector((state) => ({
    getSingleScenariosSucc: state?.scenarios?.singleScenarios?.data,
    saveScenariosData: state?.scenarios?.saveScenarios,

    hasGetSessionStatusListData:
      state?.scenarios?.getSessionStatusListData?.data,
    hasGetLogsListData: state?.scenarios?.getLogsData?.data,
    hasUpdateCompletedTerminatedSucc:
      state?.scenarios?.updateCompletedTerminatedData?.data,
    errorData: state?.scenarios?.error,
  }));

  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData
  );

  useEffect(() => {
    if (getSingleScenariosSucc && getSingleScenariosSucc.length > 0) {
      const scenario = getSingleScenariosSucc[0];
      setRowValues(scenario);
      setScenarioStatus(scenario.status);

      if (scenario.calculated_timer) {
        const [h, m, s] = scenario.calculated_timer.split(":").map(Number);
        const totalSeconds = h * 3600 + m * 60 + s;
        setElapsedSeconds(totalSeconds);

        if (scenario.status === "Start" || scenario.status === "Resume") {
          setTimerActive(true);
          setTimerPaused(false);
        }
      }
    }
  }, [getSingleScenariosSucc]);

  useEffect(() => {
    if (saveScenariosData?.statusCode == 200) {
      setActionLoading(false); //  Reset loading for Start action
      setIsTerminatingOrCompleting(false); // Reset loading for Start action
      dispatch(getSingleScenarios(query.slug[0]));

      handleClone(saveScenariosData?.scenariolearnersessionuuid);
      const payload = {
        scenarioid: rowValues?.scenarioid,
        learnerid: getUserDataFromLocal?.learner_id,
        scenariolearnersessionid: saveScenariosData?.scenariolearnersessionid,
      };
      dispatch(getConfigurations(payload));
      setShowCloneModal(true);
      dispatch(clearSaveScenarios());
    }
  }, [saveScenariosData]);

  useEffect(() => {
    if (
      hasUpdateCompletedTerminatedSucc?.statusCode ||
      errorData?.statusCode === 400
    ) {
      if (hasUpdateCompletedTerminatedSucc?.statusCode === 200) {
        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
            {hasUpdateCompletedTerminatedSucc?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: false,
            theme: "colored",
          }
        );
        setScenarioStatus(
          confirmAction === "terminate" ? "Terminated" : "Completed"
        );
      }
      setActionLoading(false); // Remove loading
      dispatch(clearUpdateCompletedTerminated());
      dispatch(getSingleScenarios(query.slug[0]));
    }
  }, [hasUpdateCompletedTerminatedSucc, errorData]);

  useEffect(() => {
    if (activeTab === "logs") {
      const payload = {
        scenariouuid: rowValues?.scenariouuid,
      };
      dispatch(getLogs(payload));
    }
  }, [activeTab, rowValues?.scenarioid]);

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

  useEffect(() => {
    if (query.slug) {
      setRowId(query.slug[0]);
      dispatch(getSingleScenarios(query.slug[0]));
    }
  }, [query.slug]);

  const baseUrl = process.env.API_URL_FILEMANAGER;

  const pdfUrl = rowValues?.instruction_file
    ? `${baseUrl}${rowValues.instruction_file}`
    : null;

  const viewerUrl = pdfUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(
        pdfUrl
      )}&embedded=true`
    : null;

  const handleStart = () => {
    setIsScenarioError400(false);
    setConfirmAction("initializing");
    setShowConfirm(true);
  };

  const handleTerminate = () => {
    setIsTerminatingOrCompleting(true); // Hide Raise Request
    setConfirmAction("terminate");
    setShowConfirm(true);
    setTimerPaused(true);
    setTimerActive(false);
  };

  const handleComplete = () => {
    setIsTerminatingOrCompleting(true); // Hide Raise Request
    setConfirmAction("complete");
    setShowConfirm(true);
    setTimerPaused(true);
    setTimerActive(false);
  };

  const handleConfirmAction = async () => {
    try {
      setActionLoading(true);
      const scenarioData = getSingleScenariosSucc?.[0];
      const mappedStatus = {
        start: "Start",
        terminate: "Terminated",
        complete: "Completed",
        initializing: "Initializing",
      };

      // ⏸ Pause timer ONLY when confirmed terminate/complete
      if (confirmAction === "terminate" || confirmAction === "complete") {
        setTimerPaused(true);
        setTimerActive(false);
      }

      const payload = {
        scenarioid: scenarioData?.scenarioid,
        learner_id: getUserDataFromLocal?.learner_id,
        instructor_id: scenarioData?.instructor_id,
        status: mappedStatus[confirmAction],
        timer:
          confirmAction === "initializing"
            ? "00:00:00"
            : formatTime(elapsedSeconds),
        scenariolearnerid: scenarioData?.scenariolearnerid,
        scenariolearnersessionid: scenarioData?.scenariolearnersessionid,
        type: "learner",
      };

      if (confirmAction === "initializing") {
        dispatch(saveScenarios(payload));
      } else if (
        confirmAction === "terminate" ||
        confirmAction === "complete"
      ) {
        dispatch(updateSessionStatus(payload));
        dispatch(updateCompletedTerminated(payload));
      }

      setShowConfirm(false);
    } catch (err) {
      alert("Failed to update scenario status. Please try again.");
      setActionLoading(false);
    }
  };

  const handleCancelAction = () => {
    setShowConfirm(false);
    setIsTerminatingOrCompleting(false);
    if (timerActive === false && timerPaused === true) {
      setTimerPaused(false);
      setTimerActive(true);
    }
  };

  const handleConfirm = () => {
    try {
      if (isScenarioError400) {
        setShowConfirm(false);
        setShowCloneModal(false);
      }
      if (scenarioStatus === "Pending" || confirmAction === "initializing") {
        handleConfirmAction();
      } else {
        handleConfirmAction();
      }
    } catch (err) {
      alert("Something went wrong while confirming the action.");
    }
  };

  const handlePause = async () => {
    try {
      setTimerPaused(true);
      setTimerActive(false);

      const scenarioData = getSingleScenariosSucc?.[0];
      const payload = {
        scenarioid: scenarioData?.scenarioid,
        learner_id: getUserDataFromLocal?.learner_id,
        instructor_id: scenarioData?.instructor_id,
        status: "Pause",
        timer: formatTime(elapsedSeconds),
        scenariolearnerid: scenarioData?.scenariolearnerid,
        scenariolearnersessionid: scenarioData?.scenariolearnersessionid,
      };

      dispatch(updateSessionStatus(payload));
      setScenarioStatus("Pause");
    } catch (err) {
      alert("Failed to pause scenario.");
    }
  };

  const handleResume = async () => {
    try {
      setTimerPaused(false);
      setTimerActive(true);

      const scenarioData = getSingleScenariosSucc?.[0];
      const payload = {
        scenarioid: scenarioData?.scenarioid,
        learner_id: getUserDataFromLocal?.learner_id,
        instructor_id: scenarioData?.instructor_id,
        status: "Resume",
        timer: formatTime(elapsedSeconds),
        scenariolearnerid: scenarioData?.scenariolearnerid,
        scenariolearnersessionid: scenarioData?.scenariolearnersessionid,
      };

      dispatch(updateSessionStatus(payload));

      setScenarioStatus("Resume");
    } catch (err) {
      alert("Failed to resume scenario.");
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${mins}:${secs}`;
  };

  const handleClone = (scenariolearnersessionuuid) => {
    if (!scenariolearnersessionuuid) return;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setShowCloneModal(true);
    dispatch(getSessionStatusList(scenariolearnersessionuuid));
    setTimeout(() => {
      pollingRef.current = setInterval(() => {
        dispatch(getSessionStatusList(scenariolearnersessionuuid));
      }, 10000);
    }, 100);
  };

  useEffect(() => {
    if (!showCloneModal || hasGetSessionStatusListData?.vm_steps === "Failed") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [showCloneModal, hasGetSessionStatusListData?.vm_steps]);

  useEffect(() => {
    const step = hasGetSessionStatusListData?.vm_steps;
    setVmStep(step);
    if (step === "Running") {
      setCountdown(10);
      setCountdownActive(true);
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (step === "Failed") {
      setVmStep(" ");
      setShowCloneModal(false);
      setShowFailureModal(true);
      setScenarioStatus("Initializing");
      dispatch(getSingleScenarios(query.slug[0]));
    }
  }, [hasGetSessionStatusListData]);

  useEffect(() => {
    let timer;
    if (countdownActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCountdownActive(false);
      setShowCloneModal(false);
      setScenarioStatus("Initializing");
      setTimerActive(true);
      setTimerPaused(false);
      dispatch(getSingleScenarios(query.slug[0]));
    }

    return () => clearInterval(timer);
  }, [countdownActive, countdown]);

  const getStepClass = (step) => {
    if (vmStep === "Running") return "text-success";

    const currentIndex = vmStepsOrder.indexOf(vmStep);
    const stepIndex = vmStepsOrder.indexOf(step);
    if (stepIndex < currentIndex) return "text-success";
    if (stepIndex === currentIndex) return "text-warning font-weight-bold";

    return "text-danger";
  };

  const iconBackground = (step) => {
    if (vmStep === "Running") return "product-icon-bg-success-transparent";

    const currentIndex = vmStepsOrder.indexOf(vmStep);
    const stepIndex = vmStepsOrder.indexOf(step);
    if (stepIndex < currentIndex) return "product-icon-bg-success-transparent";
    if (stepIndex === currentIndex)
      return "product-icon-bg-warning-transparent font-weight-bold";
    return "product-icon-bg-danger-transparent";
  };
  const handleOkClick = () => {
    setShowCloneModal(false);
    setTimerActive(true);
    setTimerPaused(false);
    setScenarioStatus("Initializing");
    dispatch(getSingleScenarios(query.slug[0]));
  };

  useEffect(() => {
    let interval;
    if (timerActive && !timerPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerPaused]);

  const isTerminated = rowValues?.isnotitermination === "Yes";
  // timer is visible when you're in the same branch where you render the timer box
  const isTimerVisible = !(
    isScenarioError400 ||
    ["Terminated", "Completed", "Pending", "Failed", "Initializing"].includes(
      scenarioStatus
    )
  );

  return (
    <>
      <Seo title="View Scenario" />

      <ToastContainer />
      <Row className="view-component-row-sm">
        <Col md={12}>
          <Card className="view-component-card overflow-hidden mb-3">
            <Card.Body className="p-3">
              <Row className="view-component-row-sm">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
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
                              className={`me-1 ${
                                star <= filledStars
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

                    <div
                      className="d-flex align-items-center"
                      style={{ gap: "12px", maxWidth: "50%" }}
                    >
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          push(`/scenarios?view=${backTo || "list"}`);
                          dispatch(clearSingleScenarios());
                        }}
                      >
                        <i className="fe fe-arrow-left"></i>
                      </Button>
                    </div>
                  </div>
                </Col>

                <Col
                  md={12}
                  className="d-flex justify-content-between align-items-center my-3"
                >
                  {isScenarioError400 ||
                  ["Terminated", "Completed", "Pending", "Failed"].includes(
                    scenarioStatus
                  ) ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Button variant="success" size="sm" onClick={handleStart}>
                        <i className="fe fe-play"></i> Start
                      </Button>
                    </div>
                  ) : ["Initializing"].includes(scenarioStatus) ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() =>
                          handleClone(rowValues?.scenariolearnersessionuuid)
                        }
                      >
                        <i
                          className="fas fa-spinner fa-spin"
                          style={{ marginRight: "6px" }}
                        ></i>{" "}
                        Initializing
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          backgroundColor: "#e0f7fa",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "20px",
                          fontWeight: "bold",
                          fontFamily: "monospace",
                          color: "#006064",
                        }}
                      >
                        <i
                          className="fas fa-clock"
                          style={{ marginRight: "8px" }}
                        ></i>
                        <span>{formatTime(elapsedSeconds)}</span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <>
                          {scenarioStatus === "Pause" ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleResume}
                              disabled={actionLoading} // Disable when Terminate/Complete is in progress
                            >
                              Resume
                            </Button>
                          ) : (
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={handlePause}
                              disabled={actionLoading} // Disable when Terminate/Complete is in progress
                            >
                              Pause
                            </Button>
                          )}

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={handleTerminate}
                            disabled={actionLoading}
                          >
                            {actionLoading && confirmAction === "terminate" ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>{" "}
                                Terminating...
                              </>
                            ) : (
                              "Terminate"
                            )}
                          </Button>

                          <Button
                            variant="success"
                            size="sm"
                            onClick={handleComplete}
                            disabled={actionLoading}
                          >
                            {actionLoading && confirmAction === "complete" ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>{" "}
                                Completing...
                              </>
                            ) : (
                              "Complete"
                            )}
                          </Button>

                          <Button
                            variant={
                              isNotified && !replyReceived ? "danger" : "info"
                            }
                            size="sm"
                            onClick={() => {
                              setShowChat(true);
                              setSelectedSession(rowValues);
                              if (isNotified) setReplyReceived(false);
                            }}
                            disabled={isTerminatingOrCompleting}
                            className="position-relative"
                          >
                            <i className="fa fa-hand-paper text-white me-1"></i>{" "}
                            Raise Request
                            {rowValues.unseen_instructor_admin_message_count >
                              0 && (
                              <span
                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                style={{
                                  fontSize: "0.6rem",
                                  minWidth: "18px",
                                  height: "18px",
                                  padding: " 5px",
                                }}
                              >
                                {rowValues.unseen_instructor_admin_message_count >
                                99
                                  ? "99+"
                                  : rowValues.unseen_instructor_admin_message_count}
                                <span className="visually-hidden">
                                  unread messages
                                </span>
                              </span>
                            )}
                          </Button>
                        </>
                      </div>
                    </>
                  )}
                </Col>

                <Col md={12} className="px-0">
                  {isTerminated && (
                    <Alert
                      variant="warning"
                      className="w-100 alert-dismissible fade show custom-alert-icon shadow-sm d-flex align-items-center"
                      role="alert"
                      style={{ borderRadius: "0", marginBottom: "0" }}
                    >
                      <svg
                        className="me-2 svg-warning"
                        xmlns="http://www.w3.org/2000/svg"
                        height="1.5rem"
                        width="1.5rem"
                        viewBox="0 0 24 24"
                        fill="#ffc107"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M1 21h22L12 2 1 21z" />
                        <path
                          d="M12 16v-4"
                          stroke="#000"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="18" r="1" fill="#000" />
                      </svg>

                      <div style={{ flex: 1 }}>
                        It looks like the resource has been idle for a while. To
                        keep things efficient, we’ll automatically shut it down
                        in 4 hours. Need more time? Just reconnect...{" "}
                        <span
                          style={{
                            color: "#0d6efd",
                            cursor: "pointer",
                            textDecoration: "underline",
                            whiteSpace: "nowrap",
                          }}
                          onClick={() => setShowChat(true)}
                        >
                          Click here
                        </span>
                        .
                      </div>

                      <Button
                        variant="close"
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="alert"
                        aria-label="Close"
                      />
                    </Alert>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

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
                              onClick={() => setActiveTab("quiz")}
                              style={{ flex: 1, textAlign: "start" }}
                            >
                              <Nav.Link
                                eventKey="quiz"
                                className="masterlist"
                                style={{
                                  color:
                                    activeTab === "quiz" ? "#007bff" : "gray",
                                  fontWeight:
                                    activeTab === "quiz" ? "bold" : "normal",
                                }}
                              >
                                Quiz
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

                        <Row>
                          <Col md={12} className="pt-3">
                            <Tab.Content>
                              <Tab.Pane eventKey="basic_info">
                                <Row className="gy-4">
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
                                        <div className="fw-semibold text-dark mb-1">
                                          {rowValues?.scenariolevel || "—"}
                                        </div>
                                        <small className="text-muted">
                                          Level
                                        </small>
                                      </div>
                                    </div>
                                  </Col>

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
                                {rowValues?.instruction_file ? (
                                  <iframe
                                    src={viewerUrl}
                                    width="100%"
                                    height="600px"
                                    style={{
                                      border: "1px solid #ccc",
                                      borderRadius: "8px",
                                    }}
                                    title="Instruction PDF"
                                  ></iframe>
                                ) : (
                                  <Row>
                                    <Col sm={12}>
                                      <Card className="custom-card">
                                        <Card.Body className="overflow-auto pd-t-10">
                                          <Row className="signpages text-center">
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
                                                      alt="No data"
                                                      className="wd-150"
                                                    />
                                                    <h5 className="mt-4">
                                                      No instruction PDF
                                                      provided.
                                                    </h5>
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
                              </Tab.Pane>

                              <Tab.Pane eventKey="diagram">
                                <div>
                                  <ScenarioDiagram
                                    scenarioId={rowId}
                                    isTimerVisible={isTimerVisible}
                                    scenariodiagram={
                                      rowValues?.scenariodiagram &&
                                      rowValues.scenariodiagram.trim() !== ""
                                        ? rowValues.scenariodiagram
                                        : ""
                                    }
                                  />
                                </div>
                              </Tab.Pane>

                              <Tab.Pane eventKey="quiz">
                                <div
                                  style={{
                                    maxHeight: "600px",
                                    overflowY: "auto",
                                  }}
                                >
                                  <ScenarioQuiz />
                                </div>
                              </Tab.Pane>

                              <Tab.Pane eventKey="logs">
                                <div>
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
                                    <Row>
                                      <Col sm={12}>
                                        <Card className="custom-card">
                                          <Card.Body className="overflow-auto pd-t-10">
                                            <Row className="signpages text-center">
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
                                                        alt="No data"
                                                        className="wd-150"
                                                      />
                                                      <h5 className="mt-4">
                                                        No logs available.
                                                      </h5>
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

          <Modal
            show={showCloneModal}
            onHide={() => {}}
            backdrop="static"
            keyboard={false}
            size="md"
            centered
          >
            <Modal.Header>
              <Modal.Title>Scenario configuration steps</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="row">
                <div className="col-12">
                  <Card className="custom-card">
                    <div className="product-timeline card-body pt-3 mt-1">
                      <ul className="timeline-1 mb-0">
                        {[
                          {
                            icon: "fa-cogs",
                            label: "Initializing Configure",
                            text: "Preparing settings...",
                            step: "Initializing",
                          },
                          {
                            icon: "fa-clone",
                            label: "Starting Cloning VMs",
                            text: "Duplicating virtual machines...",
                            step: "Cloning",
                          },
                          {
                            icon: "fa-sliders-h",
                            label: "VM Configuration",
                            text: "Configuring resources and network...",
                            step: "Bridge Configuration",
                          },
                          {
                            icon: "fab fa-linux",
                            label: "Starting VMs",
                            text: "Starting VMs...",
                            step: "Starting",
                          },
                          {
                            icon: "fa-shield-alt",
                            label: "Launching the scenario",
                            text: "Launching the scenario...",
                            step: "Running",
                          },
                        ].map((item, idx) => {
                          return (
                            <li
                              key={idx}
                              className="mt-0 d-flex justify-content-between align-items-start"
                            >
                              <div className="d-flex">
                                <i
                                  className={`fa ${item.icon} ${iconBackground(
                                    item.step
                                  )} product-icon ${getStepClass(item.step)}`}
                                ></i>
                                <div className="ml-2">
                                  <span
                                    className={`font-weight-semibold mb-4 tx-14 ${getStepClass(
                                      item.step
                                    )}`}
                                  >
                                    {item.label}
                                  </span>
                                  <p className="mb-0 text-muted tx-12">
                                    {item.text}
                                  </p>
                                </div>
                              </div>
                              {getStepClass(item.step).includes(
                                "text-warning"
                              ) && (
                                <i className="fas fa-spinner fa-spin text-warning ml-3 mt-1" />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Card>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              {vmStep === "Running" && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Button variant="success" onClick={handleOkClick}>
                    OK ({countdown})
                  </Button>
                </div>
              )}
            </Modal.Footer>
          </Modal>

          <Modal show={showConfirm} onHide={handleCancelAction} centered>
            <Modal.Header closeButton>
              <Modal.Title>Confirm action</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {confirmAction === "initializing" && (
                <p>Are you sure you want to start the scenario?</p>
              )}
              {confirmAction === "terminate" && (
                <p>Are you sure you want to terminate the scenario?</p>
              )}
              {confirmAction === "complete" && (
                <p>Are you sure you want to complete the scenario?</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onClick={handleCancelAction}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleConfirm}>
                Confirm
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal
            show={showFailureModal}
            onHide={() => setShowFailureModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Configuration failed</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Your configuration has failed. Please try again later.</p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="success"
                onClick={() => {
                  setShowFailureModal(false);
                  dispatch(clearGetSessionStatusList());
                }}
              >
                OK
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
      <ChatBox
        showChat={showChat}
        setShowChat={setShowChat}
        scenarioTitle={rowValues?.scenariotitle}
        rowValues={rowValues}
      />
    </>
  );
};

ScenariosView.layout = "Contentlayout";
export default ScenariosView;
