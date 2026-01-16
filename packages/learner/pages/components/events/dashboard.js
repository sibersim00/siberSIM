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
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import { useRouter } from "next/router";
import {
  saveEvents,
  updateSessionStatus,
  getSessionStatusList,
  clearHasError,
  clearSaveScenarios,
  getEventsConfigurations,
  updateCompletedTerminated,
  getLogs,
  getEventList,
  eventRestart,
  deletescenario,
  clearEventRestart,
  clearGetSessionStatusList,
  pausescenario,
  resumescenario,
} from "../../../shared/redux/slices/events/events";
import { getTabList } from "../../../shared/redux/slices/scenarios/scenarios";
import Seo from "../../../shared/layout-components/seo/seo";
import "../../../shared/utils/i18n";
import ScenarioDiagram from "./scenariodiagram";
import ChatBox from "./eventchatbox";
import dynamic from "next/dynamic";

const PdfLoader = dynamic(
  () => import("../../../shared/data/common/PdfLoader"),
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> }
);

const Dashboard = () => {
  let navigate = useRouter();

  const dispatch = useDispatch();
  const [rowValues, setRowValues] = useState({});
  const [activeTab, setActiveTab] = useState("basic_info");
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isNotified, setIsNotified] = useState(false);
  const [showRestartFailureModal, setShowRestartFailureModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [reverseSeconds, setReverseSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(true);
  const [reverseTimerActive, setReverseTimerActive] = useState(false);
  const [scenarioStatus, setScenarioStatus] = useState("Pending");
  const [vmStep, setVmStep] = useState("");
  const pollingRef = useRef(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [countdownActive, setCountdownActive] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [isScenarioError400, setIsScenarioError400] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [isAutoComplete, setIsAutoComplete] = useState(false);
  const [dynamicTab, setDynamicTab] = useState("Basic Information");
  const [pdfNotFound, setPdfNotFound] = useState(false);

  const vmStepsOrder = [
    "Initializing",
    "Cloning",
    "Bridge Configuration",
    "Starting",
    "Running",
  ];
  const {
    hasGetEventSucc,
    saveScenariosData,
    hasGetUpdateSessionStatusSucc,
    hasGetSessionStatusListData,
    hasGetLogsListData,
    hasGetEventRestartSucc,
    hasdeletescenarioSucc,
    getSingleScenariosSucc,
    tabListSucc,
    errorData,
  } = useSelector((state) => ({
    hasGetEventSucc: state?.events?.getEventListData?.data,
    getSingleScenariosSucc: state?.scenarios?.singleScenarios?.data,
    saveScenariosData: state?.events?.saveEvents,
    hasGetUpdateSessionStatusSucc: state?.events?.updateSessionStatus,
    hasGetSessionStatusListData: state?.events?.getSessionStatusListData?.data,
    hasGetLogsListData: state?.events?.getLogsData?.data,
    tabListSucc: state?.scenarios?.getTabListData?.data,
    hasGetEventRestartSucc: state?.events?.eventRestart,
    hasdeletescenarioSucc: state?.scenarios?.hasdeletescenarioSuccData?.data,
    errorData: state?.events?.error,
  }));
  useEffect(() => {
    dispatch(getEventList());
  }, [dispatch]);
  useEffect(() => {
    if (hasGetEventSucc && hasGetEventSucc.length > 0) {
      const scenario = hasGetEventSucc[0];
      setRowValues(scenario);
      setScenarioStatus(scenario.status);

      if (scenario.calculated_timer) {
        const [h, m, s] = scenario.calculated_timer.split(":").map(Number);
        const totalSeconds = h * 3600 + m * 60 + s;
        setElapsedSeconds(totalSeconds);

        if (scenario.status === "Start") {
          setTimerActive(true);
        }
      }

      if (scenario.reverse_timer) {
        const [rh, rm, rs] = scenario.reverse_timer.split(":").map(Number);
        const reverseTotalSeconds = rh * 3600 + rm * 60 + rs;
        setReverseSeconds(reverseTotalSeconds);
        setReverseTimerActive(true);
      }
    }
  }, [hasGetEventSucc]);
  useEffect(() => {
    dispatch(getTabList());
  }, [dispatch]);

  useEffect(() => {
    let reverseInterval;

    if (reverseTimerActive && reverseSeconds > 0) {
      reverseInterval = setInterval(() => {
        setReverseSeconds((prev) => prev - 1);
      }, 1000);
    }
    if (reverseSeconds === 0 && reverseTimerActive) {
      setReverseTimerActive(false);
      setConfirmAction("complete");
      setIsAutoComplete(true); // Mark as auto-complete
      setShowConfirm(true);
    }
    return () => clearInterval(reverseInterval);
  }, [reverseTimerActive, reverseSeconds]);
  console.log("rowValuesrowValuesroddddddddwValues", saveScenariosData);

  useEffect(() => {
    if (saveScenariosData?.statusCode == 200) {
      dispatch(getEventList());

      handleClone(saveScenariosData?.vmrequestid);
      const payload = {
        scenarioid: rowValues?.scenarioid,
        learnerid: rowValues?.learner_id,
        vmrequestid: saveScenariosData?.vmrequestid,
        eventlearnerid: saveScenariosData?.eventlearnerid,
      };
      dispatch(getEventsConfigurations(payload));
      setShowCloneModal(true);
      dispatch(clearSaveScenarios());
    }
  }, [saveScenariosData]);

  useEffect(() => {
    if (
      hasGetUpdateSessionStatusSucc?.statusCode == 200 &&
      confirmAction !== "pause" &&
      confirmAction !== "resume"
    ) {
      // logout only for terminate/stop/similar actions
      localStorage.removeItem("userLearner");
      localStorage.removeItem("accessTokenLearner");
      localStorage.removeItem("menusLearner");
      localStorage.clear();
      dispatch({ type: "LOGOUT" });
      navigate.replace("/event-login", "", { shallow: true });
    }
  }, [hasGetUpdateSessionStatusSucc]);

  useEffect(() => {
    // Success case
    if (hasGetEventRestartSucc?.statusCode === 200) {
      dispatch(getEventList());
      handleClone(rowValues?.vmrequestid);
      setShowCloneModal(true);
      setIsActionInProgress(false);
      dispatch(clearEventRestart());
    }
    // Failure case — also catch 500s or network errors
    else if (
      hasGetEventRestartSucc?.statusCode &&
      hasGetEventRestartSucc?.statusCode !== 200
    ) {
      setShowRestartFailureModal(true);
      setIsActionInProgress(false);
      dispatch(clearEventRestart());
    }
  }, [hasGetEventRestartSucc]);

  useEffect(() => {
    if (activeTab === "logs") {
      const payload = {
        eventlearnerid: rowValues?.eventlearnerid,
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
              {typeof errorData?.message === "object"
                ? JSON.stringify(errorData?.message)
                : errorData?.message}
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
  console.log("hasGetEventSucchasGetEventSucchasGetEventSucc", hasGetEventSucc);

  useEffect(() => {
    if (hasGetEventSucc && hasGetEventSucc.length > 0) {
      const scenario = hasGetEventSucc[0];
      setRowValues(scenario);

      // 🔥 FIX: ONLY set from backend on first load, NOT after button click
      setScenarioStatus((prev) => {
        if (prev === "Pause" || prev === "Resume") return prev;
        return scenario.status;
      });

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
  }, [hasGetEventSucc]);

  const baseUrl = process.env.API_URL_FILEMANAGER;

  const pdfUrl = rowValues?.instruction_file
    ? `${baseUrl}${rowValues.instruction_file}`
    : null;

  // const viewerUrl = pdfUrl
  //   ? `https://docs.google.com/gview?url=${encodeURIComponent(
  //       pdfUrl
  //     )}&embedded=true`
  //   : null;

  const handleStart = () => {
    setIsScenarioError400(false);
    setConfirmAction("initializing");
    setShowConfirm(true);
  };

  const handleRestart = () => {
    setIsScenarioError400(false);
    setConfirmAction("restart");
    setShowConfirm(true);
  };

  const handleComplete = () => {
    setConfirmAction("complete");
    setShowConfirm(true);
  };

  const handlePause = async () => {
    try {
      setConfirmAction("pause");
      setActionLoading(true);

      const scenarioData = hasGetEventSucc?.[0];
      const payload = {
        scenarioid: scenarioData?.scenarioid,
        learner_id: scenarioData?.learner_id,
        vmrequestid: scenarioData?.vmrequestid,
        instructor_id: scenarioData?.instructor_id,
        status: "Pause",
        timer: formatTime(elapsedSeconds),
        eventlearnerid: scenarioData?.eventlearnerid,
        type: "learner",
      };

      const resPause = await dispatch(pausescenario(payload));
      const pauseOk =
        resPause?.payload?.statusCode === 200 || resPause?.statusCode === 200;

      if (!pauseOk) {
        console.error("Failed to pause scenario.");
        return;
      }

      // 🔹 Step 2: pause success → update session status
      const resUpdate = await dispatch(updateSessionStatus(payload));

      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Scenario Paused Successfully.
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      setScenarioStatus("Pause");
      dispatch(getEventList());
      // dispatch(getSingleScenarios(query.slug[0]));
    } catch (err) {
      console.error("Failed to pause scenario.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleResume = async () => {
    try {
      setConfirmAction("resume");
      setActionLoading(true);

      const scenarioData = hasGetEventSucc?.[0];
      const payload = {
        scenarioid: scenarioData?.scenarioid,
        learner_id: scenarioData?.learner_id,
        vmrequestid: scenarioData?.vmrequestid,
        instructor_id: scenarioData?.instructor_id,
        status: "Resume",
        timer: formatTime(elapsedSeconds),
        eventlearnerid: scenarioData?.eventlearnerid,
        type: "learner",
      };
      const resResume = await dispatch(resumescenario(payload));
      const resumeOk =
        resResume?.payload?.statusCode === 200 || resResume?.statusCode === 200;

      if (!resumeOk) {
        return;
      }
      // 🔹 Step 3: Update session status in DB
      await dispatch(updateSessionStatus(payload));

      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Scenario Resumed Successfully.
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      setScenarioStatus("Resume");
      dispatch(getEventList());
    } catch (err) {
      console.error("Resume failed:", err);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDelete = () => {
    setConfirmAction("delete");
    setShowConfirm(true);
    setTimerPaused(true);
    setTimerActive(false);
  };

  useEffect(() => {
    if (scenarioStatus === "Pause") {
      setTimerActive(false);
      setTimerPaused(true);
    } else if (scenarioStatus === "Resume" || scenarioStatus === "Running") {
      setTimerActive(true);
      setTimerPaused(false);
    }
  }, [scenarioStatus]);
  console.log("hasGetEventSucchasGetEventSucchasGetEventSucc", hasGetEventSucc);

  const handleConfirmAction = async () => {
    try {
      setActionLoading(true);
      const scenarioData = hasGetEventSucc?.[0];
      const mappedStatus = {
        start: "Start",
        terminate: "Terminated",
        complete: "Completed",
        delete: "Terminated",
        initializing: "Initializing",
      };
      if (
        confirmAction === "terminate" ||
        confirmAction === "complete" ||
        confirmAction === "delete"
      ) {
        setTimerPaused(true);
        setTimerActive(false);
      }

      const payload = {
        scenarioid: scenarioData?.scenarioid,
        vmrequestid: scenarioData?.vmrequestid,
        learner_id: scenarioData?.learner_id,
        status: mappedStatus[confirmAction],
        timer: formatTime(elapsedSeconds),
        eventlearnerid: scenarioData?.eventlearnerid,
        type: "learner",
      };

      if (confirmAction === "initializing") {
        dispatch(saveEvents(payload));
      } else if (
        confirmAction === "terminate" ||
        confirmAction === "complete"
      ) {
        dispatch(updateSessionStatus(payload));
        dispatch(updateCompletedTerminated(payload));
        setScenarioStatus(mappedStatus[confirmAction]);
      } else if (confirmAction === "restart") {
        setIsActionInProgress(true);
        dispatch(eventRestart(payload));
      } else if (confirmAction === "delete") {
        dispatch(updateSessionStatus(payload));
        dispatch(deletescenario(payload));
      }
      setShowConfirm(false);
    } catch (err) {
      alert("Failed to update scenario status. Please try again.");
      setIsActionInProgress(false);
    }
  };

  useEffect(() => {
    if (hasdeletescenarioSucc?.statusCode || errorData?.statusCode === 400) {
      if (hasdeletescenarioSucc?.statusCode === 200) {
        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
            {hasdeletescenarioSucc?.message}
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
      dispatch(cleardeletescenario());
      dispatch(hasGetEventSucc(query.slug[0]));
    }
  }, [hasdeletescenarioSucc, errorData]);
  const handleCancelAction = () => {
    setShowConfirm(false);
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
      console.error("handleConfirm error:", err);
      alert("Something went wrong while confirming the action.");
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

  const handleClone = (vmrequestid) => {
    if (!vmrequestid) return;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setShowCloneModal(true);
    dispatch(getSessionStatusList(vmrequestid));
    setTimeout(() => {
      pollingRef.current = setInterval(() => {
        dispatch(getSessionStatusList(vmrequestid));
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
    const stepstatus = hasGetSessionStatusListData?.status;
    setVmStep(step);
    if (step === "Running") {
      setCountdown(10);
      setCountdownActive(true);
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (stepstatus === "Failed") {
      setShowCloneModal(false);
      setShowFailureModal(true);
      setScenarioStatus("Initializing");
      dispatch(getEventList());
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
      dispatch(getEventList());
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
    setScenarioStatus("Initializing");
    dispatch(getEventList());
  };
  // useEffect(() => {
  //     let interval;
  //     if (timerActive && !timerPaused) {
  //       interval = setInterval(() => {
  //         setElapsedSeconds((prev) => prev + 1);
  //       }, 1000);
  //     }
  //     return () => clearInterval(interval);
  //   }, [timerActive, timerPaused]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatEventKey = (name) =>
    name?.toLowerCase()?.replace(/\s+/g, "_") ?? "";
  useEffect(() => {
    if (tabListSucc && Array.isArray(tabListSucc)) {
      const enabledTabs = tabListSucc
        .filter((tab) => tab.event_status === "True")
        .sort((a, b) => a.tab_ordering - b.tab_ordering);
      if (enabledTabs.length > 0) {
        const basicTab = enabledTabs.find(
          (tab) => tab.tab_name?.toLowerCase() === "Basic Information"
        );
        if (basicTab) {
          setDynamicTab(formatEventKey(basicTab.tab_name));
          setActiveTab(basicTab.tab_name);
        } else {
          const firstActive = enabledTabs[0];
          setDynamicTab(formatEventKey(firstActive.tab_name));
          setActiveTab(firstActive.tab_name);
        }
      }
    }
  }, [tabListSucc]);

  const isTerminated = rowValues?.isnotitermination === "Yes";

  const isTimerVisible = !(
    isScenarioError400 ||
    ["Terminated", "Completed", "Pending", "Failed", "Initializing"].includes(
      scenarioStatus
    )
  );
  console.log(
    "scenarioStatusscenarioStatussrrrrrrrrrrrrcenarioStatus",
    rowValues
  );

  return (
    <>
      <Seo title="Events" />

      <ToastContainer />
      <Row className="view-component-row-sm" style={{ marginTop: "6%" }}>
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
                    <>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={handleStart}
                        >
                          <i className="fe fe-play"></i> Start
                        </Button>
                      </div>
                    </>
                  ) : ["Initializing"].includes(scenarioStatus) ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleClone(rowValues?.vmrequestid)}
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
                          backgroundColor: "#ffebee",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "20px",
                          fontWeight: "bold",
                          fontFamily: "monospace",
                          color: "#c62828",
                        }}
                      >
                        <i
                          className="fas fa-hourglass-half"
                          style={{ marginRight: "8px" }}
                        ></i>
                        <span>{formatTime(reverseSeconds)}</span>
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
                            <>
                              {/* RESUME */}
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleResume}
                                disabled={
                                  actionLoading && confirmAction === "resume"
                                }
                              >
                                {actionLoading && confirmAction === "resume" ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i>{" "}
                                    Resuming...
                                  </>
                                ) : (
                                  "Resume"
                                )}
                              </Button>

                              {/* DELETE */}
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                                disabled={
                                  actionLoading && confirmAction === "delete"
                                }
                              >
                                {actionLoading && confirmAction === "delete" ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i>{" "}
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </>
                          ) : (
                            <>
                              {/* PAUSE */}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePause}
                                disabled={
                                  actionLoading && confirmAction === "pause"
                                }
                              >
                                {actionLoading && confirmAction === "pause" ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i>{" "}
                                    Pausing...
                                  </>
                                ) : (
                                  "Pause"
                                )}
                              </Button>

                              {/* RESTART */}
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={handleRestart}
                                disabled={isActionInProgress}
                              >
                                {isActionInProgress ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-2"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    Restarting...
                                  </>
                                ) : (
                                  <>
                                    <i className="fe fe-play"></i> Restart
                                  </>
                                )}
                              </Button>

                              {/* COMPLETE */}
                              <Button
                                variant="success"
                                size="sm"
                                onClick={handleComplete}
                                disabled={
                                  actionLoading && confirmAction === "complete"
                                }
                              >
                                {actionLoading &&
                                confirmAction === "complete" ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i>{" "}
                                    Completing...
                                  </>
                                ) : (
                                  "Complete"
                                )}
                              </Button>
                            </>
                          )}
                        </>

                        <Button
                          variant={
                            isNotified && !replyReceived ? "danger" : "info"
                          }
                          size="sm"
                          onClick={() => {
                            setShowChat(true);
                          }}
                          disabled={isActionInProgress}
                          className="position-relative "
                        >
                          <i className="fa fa-hand-paper text-white me-1 "></i>{" "}
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
                            {tabListSucc
                              ?.filter((tab) => tab.event_status === "True")
                              ?.sort((a, b) => a.tab_ordering - b.tab_ordering)
                              ?.map((tab) => (
                                <Nav.Item
                                  key={tab.scenariotabid}
                                  onClick={() => {
                                    setActiveTab(tab.tab_name);
                                  }}
                                  style={{ flex: 1, textAlign: "start" }}
                                >
                                  <Nav.Link
                                    eventKey={tab.tab_name}
                                    className="masterlist"
                                    style={{
                                      color:
                                        activeTab === tab.tab_name
                                          ? "#007bff"
                                          : "gray",
                                      fontWeight:
                                        activeTab === tab.tab_name
                                          ? "bold"
                                          : "normal",
                                    }}
                                  >
                                    {tab.tab_name}
                                  </Nav.Link>
                                </Nav.Item>
                              ))}
                          </Nav>
                        </Row>

                        <Row>
                          <Col md={12} className="pt-3">
                            <Tab.Content>
                              {tabListSucc
                                ?.filter((tab) => tab.event_status === "True")
                                ?.sort(
                                  (a, b) => a.tab_ordering - b.tab_ordering
                                )
                                ?.map((tab) => (
                                  <Tab.Pane
                                    eventKey={tab.tab_name}
                                    key={tab.scenariotabid}
                                  >
                                    {/* 👇 Conditional rendering per tab name */}
                                    {tab.tab_name === "Basic Information" && (
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
                                                {rowValues?.scenariolevel ||
                                                  "—"}
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
                                    )}

                                    {tab.tab_name === "Instruction Details" && (
                                      <Row className="align-items-center mb-2">
                                        <Col>
                                          <h5>Instruction Details</h5>
                                        </Col>
                                        <PdfLoader
                                          fileUrl={pdfUrl}
                                          setPdfNotFound={setPdfNotFound}
                                        />
                                      </Row>
                                    )}

                                    {tab.tab_name === "Scenario Diagram" && (
                                      <ScenarioDiagram
                                        // scenarioId={rowId}
                                        isTimerVisible={isTimerVisible}
                                        scenarioStatus={scenarioStatus}
                                        scenariodiagram={
                                          rowValues?.scenariodiagram?.trim() !==
                                          ""
                                            ? rowValues.scenariodiagram
                                            : ""
                                        }
                                      />
                                    )}

                                    {tab.tab_name === "Logs" && (
                                      <div>
                                        {hasGetLogsListData?.length > 0 ? (
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
                                                  (log, index) => (
                                                    <tr key={index}>
                                                      <td>
                                                        {log.startedon
                                                          ? new Date(
                                                              log.startedon
                                                            ).toLocaleString()
                                                          : "-"}
                                                      </td>
                                                      <td>{log.type}</td>
                                                      <td>{log.status}</td>
                                                      <td>
                                                        {new Date(
                                                          log.createdon
                                                        ).toLocaleString()}
                                                      </td>
                                                      <td>{log.remark}</td>
                                                    </tr>
                                                  )
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <div className="text-center py-4">
                                            No logs available
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* 👇 Flexible / Custom tab support */}
                                    {/* {tab.tab_type === "Flexible" &&
                                                        tab.widget_url && (
                                                          <iframe
                                                            src={tab.widget_url}
                                                            title={tab.tab_name}
                                                            style={{
                                                              width: "100%",
                                                              height: "600px",
                                                              border: "none",
                                                              borderRadius: "8px",
                                                            }}
                                                          ></iframe>
                                                        )} */}
                                    {/* 👇 Flexible / Custom tab support */}
                                    {tab.tab_type === "Flexible" &&
                                      tab.widget_url && (
                                        <div
                                          style={{
                                            width: "100%",
                                            position: "relative",
                                          }}
                                        >
                                          {/* === TOP BUTTON BAR === */}
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              marginBottom: "8px",
                                            }}
                                          >
                                            {/* LEFT SIDE BUTTONS */}
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: "8px",
                                              }}
                                            >
                                              <button
                                                onClick={() =>
                                                  window.history.back()
                                                }
                                                className="btn btn-light"
                                                title="Back (Alt + ←)"
                                              >
                                                <i className="fe fe-arrow-left"></i>
                                              </button>

                                              {/* Forward Button (Alt + Right Arrow) */}
                                              <button
                                                onClick={() =>
                                                  window.history.forward()
                                                }
                                                className="btn btn-light"
                                                title="Forward (Alt + →)"
                                              >
                                                <i className="fe fe-arrow-right"></i>
                                              </button>
                                            </div>

                                            {/* RIGHT SIDE BUTTONS */}
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: "8px",
                                              }}
                                            >
                                              {/* Refresh Iframe */}
                                              <button
                                                onClick={() => {
                                                  const frame =
                                                    document.getElementById(
                                                      `flex-iframe-${tab.tab_name}`
                                                    );
                                                  if (frame)
                                                    frame.src = frame.src;
                                                }}
                                                className="btn btn-light"
                                                title="Refresh"
                                              >
                                                <i className="fe fe-refresh-cw"></i>
                                              </button>

                                              {/* Fullscreen Iframe */}
                                              <button
                                                onClick={() => {
                                                  const frame =
                                                    document.getElementById(
                                                      `flex-iframe-${tab.tab_name}`
                                                    );
                                                  if (
                                                    frame &&
                                                    frame.requestFullscreen
                                                  ) {
                                                    frame.requestFullscreen();
                                                  }
                                                }}
                                                className="btn btn-light"
                                                title="Fullscreen"
                                              >
                                                <i className="fe fe-maximize"></i>
                                              </button>
                                            </div>
                                          </div>

                                          {/* === IFRAME === */}
                                          <iframe
                                            id={`flex-iframe-${tab.tab_name}`}
                                            src={tab.widget_url}
                                            title={tab.tab_name}
                                            style={{
                                              width: "100%",
                                              height: "900px",
                                              border: "none",
                                              borderRadius: "8px",
                                            }}
                                          ></iframe>
                                        </div>
                                      )}
                                  </Tab.Pane>
                                ))}
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
            <Modal.Header>
              <Modal.Title>Confirm action</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {confirmAction === "initializing" && (
                <p>Are you sure you want to start the event?</p>
              )}
              {confirmAction === "terminate" && (
                <p>Are you sure you want to terminate the event?</p>
              )}
              {confirmAction === "delete" && (
                <p>Are you sure you want to terminate the event?</p>
              )}
              {confirmAction === "complete" && !isAutoComplete && (
                <p>
                  Are you sure you want to complete the event? <br />
                  <strong>
                    You will be automatically logged out from this event.
                  </strong>
                </p>
              )}

              {confirmAction === "complete" && isAutoComplete && (
                <p>
                  Event time is over. <br />
                  <strong>
                    The event will now be completed and you will be logged out.
                  </strong>
                </p>
              )}

              {confirmAction === "restart" && (
                <p>Are you sure you want to restart the event?</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              {isAutoComplete ? (
                <Button variant="success" onClick={handleConfirm}>
                  Confirm
                </Button>
              ) : (
                <>
                  <Button variant="danger" onClick={handleCancelAction}>
                    Cancel
                  </Button>
                  <Button variant="success" onClick={handleConfirm}>
                    Confirm
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Modal>
          <Modal
            show={showRestartFailureModal}
            onHide={() => setShowRestartFailureModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Restart Failed</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                There is some issue in restarting the event. Please try
                restarting again or contact the administrator.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="success"
                onClick={() => setShowRestartFailureModal(false)}
              >
                OK
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

Dashboard.layout = "Eventlayout";
export default Dashboard;
