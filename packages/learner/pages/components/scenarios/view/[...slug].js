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
import { OverlayTrigger, Tooltip } from "react-bootstrap";
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
  deletescenario,
  cleardeletescenario,
  getTabList,
  pausescenario,
  resumescenario,
  canresumescenario,
} from "../../../../shared/redux/slices/scenarios/scenarios";
import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import ScenarioDiagram from "./scenariodiagram";
import ChatBox from "./chatbox";
import ScenarioQuiz from "./quiz";
import dynamic from "next/dynamic";

const PdfLoader = dynamic(
  () => import("../../../../shared/data/common/PdfLoader"),
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> }
);

const ScenariosView = () => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const router = useRouter();
  const { backView, categoryId, subcategoryName } = router.query;
  const [rowId, setRowId] = useState("");
  const [rowValues, setRowValues] = useState({});
  const [activeTab, setActiveTab] = useState("Basic Information");
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
  const [pdfNotFound, setPdfNotFound] = useState(false);
  const [dynamicTab, setDynamicTab] = useState("Basic Information");
  const [isAnyScenarioRunning, setIsAnyScenarioRunning] = useState(false);
  // const [actionLoading, setActionLoading] = useState(false);

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
    tabListSucc,
    hasdeletescenarioSucc,
    haspausescenarioSucc,
    hasresumescenarioSucc,
    errorData,
  } = useSelector((state) => ({
    getSingleScenariosSucc: state?.scenarios?.singleScenarios?.data,
    saveScenariosData: state?.scenarios?.saveScenarios,

    hasGetSessionStatusListData:
      state?.scenarios?.getSessionStatusListData?.data,
    hasGetLogsListData: state?.scenarios?.getLogsData?.data,
    hasUpdateCompletedTerminatedSucc:
      state?.scenarios?.updateCompletedTerminatedData?.data,
    hasdeletescenarioSucc: state?.scenarios?.hasdeletescenarioSuccData?.data,
    tabListSucc: state?.scenarios?.getTabListData?.data,
    haspausescenarioSucc: state?.scenarios?.pausescenarioData,
    hasresumescenarioSucc: state?.scenarios?.resumescenarioData,

    errorData: state?.scenarios?.error,
  }));
  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData
  );
const learnerId = getUserDataFromLocal?.learner_id;

  useEffect(() => {
    dispatch(getTabList());
  }, [dispatch]);

  const formatEventKey = (name) =>
    name?.toLowerCase()?.replace(/\s+/g, "_") ?? "";

  useEffect(() => {
    if (tabListSucc && Array.isArray(tabListSucc)) {
      const enabledTabs = tabListSucc
        .filter((tab) => tab.tab_status === "True")
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
  console.log("getSingleScenariosSuccgetSingleScenariosSucc",getSingleScenariosSucc);
  
  const activeScenarioIdRef = useRef(null);
  useEffect(() => {
    if (!getSingleScenariosSucc?.length || !query.slug?.[0]) return;

    const scenario = getSingleScenariosSucc[0];

    if (String(scenario.scenariouuid) !== String(query.slug[0])) {
      return;
    }

    activeScenarioIdRef.current = scenario.scenariouuid;

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
  }, [getSingleScenariosSucc, query.slug?.[0]]);
  useEffect(() => {
    if (saveScenariosData?.statusCode == 200) {
      setActionLoading(false); //  Reset loading for Start action
      setIsTerminatingOrCompleting(false); // Reset loading for Start action
      dispatch(getSingleScenarios(query.slug[0]));

      handleClone(saveScenariosData?.vmrequestid);
      const payload = {
        scenarioid: rowValues?.scenarioid,
        learnerid: getUserDataFromLocal?.learner_id,
        vmrequestid: saveScenariosData?.vmrequestid,
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
      dispatch(getSingleScenarios(query.slug[0]));
    }
  }, [hasdeletescenarioSucc, errorData]);

  useEffect(() => {
    if (activeTab === "Logs") {
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
  const handleDelete = () => {
    setIsTerminatingOrCompleting(true);
    setConfirmAction("delete");
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
        learner_id: getUserDataFromLocal?.learner_id,
        status: mappedStatus[confirmAction],
        timer:
          confirmAction === "initializing"
            ? "00:00:00"
            : formatTime(elapsedSeconds),
        vmrequestid: scenarioData?.vmrequestid,
        type: "Learner",
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
      // 🔥 THE NEW DELETE API
      else if (confirmAction === "delete") {
        dispatch(updateSessionStatus(payload));
        dispatch(deletescenario(payload));
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
      setConfirmAction("pause");
      setActionLoading(true);

      const scenarioData = getSingleScenariosSucc?.[0];
      const payload = {
        scenarioid: scenarioData?.scenarioid,
        learner_id: getUserDataFromLocal?.learner_id,
        instructor_id: scenarioData?.instructor_id,
        status: "Pause",
        timer: formatTime(elapsedSeconds),
        vmrequestid: scenarioData?.vmrequestid,
        // scenariolearnersessionid: scenarioData?.scenariolearnersessionid,
      };

      // 🔹 Step 1: pause first
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
      dispatch(getSingleScenarios(query.slug[0]));
    } catch (err) {
      toast.error("Failed to pause scenario.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleResume = async () => {
    try {
      setConfirmAction("resume");
      setActionLoading(true);
      const scenarioData = getSingleScenariosSucc?.[0];
      const payload = {
        scenarioid: scenarioData?.scenarioid,
        learner_id: getUserDataFromLocal?.learner_id,
        instructor_id: scenarioData?.instructor_id,
        status: "Resume",
        timer: formatTime(elapsedSeconds),
        vmrequestid: scenarioData?.vmrequestid,
      };

      //Step 1: Validate with backend
      const canResumeRes = await dispatch(canresumescenario(payload));

      const canResumeOk = canResumeRes?.statusCode === 200;

      if (!canResumeOk) {
        return;
      }

      // Step 2: Call Proxmox resume API
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
      dispatch(getSingleScenarios(query.slug[0]));
    } catch (err) {
      console.error("Resume failed:", err);
      toast.error("An error occurred while resuming the scenario.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
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
    if (step === "Running" || step === "Pause") {
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
console.log("rowValuesrowValuesrowValuesrowValues",rowValues);

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
                    {pdfUrl && !pdfNotFound && (
                      <Col className="text-end">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => window.open(pdfUrl, "_blank")}
                        >
                          <i className="fa fa-cloud-download"></i> View /
                          Download PDF
                        </Button>
                      </Col>
                    )}
                    <div
                      className="d-flex align-items-center"
                      style={{ gap: "12px", maxWidth: "50%" }}
                    >
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          const { from, fromTab } = router.query;
                          if (fromTab === "Approve") {
                            router.push("/customscenarios");
                            return;
                          }
                          if (from === "pause") {
                            router.push("/scenarios");
                            dispatch(clearSingleScenarios());
                            return;
                          }
                          if (categoryId && subcategoryName) {
                            router.push(
                              `/scenarios?categoryId=${categoryId}&subcategoryName=${subcategoryName}&view=${
                                backView || "list"
                              }`
                            );
                          } else if (categoryId) {
                            router.push(
                              `/scenarios?categoryId=${categoryId}&view=${
                                backView || "list"
                              }`
                            );
                          } else {
                            router.push(
                              `/scenarios?view=${backView || "list"}`
                            );
                          }

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
                            // ➤ Resume is visible → Show Delete button
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleResume}
                                disabled={actionLoading}
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

                              {/* DELETE BUTTON BECAUSE RESUME IS PRESENT */}
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                                disabled={actionLoading}
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
                            // ➤ Pause is visible → Show Terminate + Complete
                            <>
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={handlePause}
                                disabled={actionLoading}
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

                              {/* TERMINATE BUTTON */}
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={handleTerminate}
                                disabled={actionLoading}
                              >
                                {actionLoading &&
                                confirmAction === "terminate" ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i>{" "}
                                    Terminating...
                                  </>
                                ) : (
                                  "Terminate"
                                )}
                              </Button>

                              {/* COMPLETE BUTTON */}
                              <Button
                                variant="success"
                                size="sm"
                                onClick={handleComplete}
                                disabled={actionLoading}
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
                              ?.filter((tab) => tab.tab_status === "True")
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
                                ?.filter((tab) => tab.tab_status === "True")
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
                                        scenarioId={rowId}
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

                                    {tab.tab_name === "Quiz" && (
                                      <div
                                        style={{
                                          maxHeight: "600px",
                                          overflowY: "auto",
                                        }}
                                      >
                                        <ScenarioQuiz />
                                      </div>
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
              {confirmAction === "delete" && (
                <p>Are you sure you want to delete this scenario?</p>
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
        learner_id={getUserDataFromLocal?.learner_id}
      />
    </>
  );
};

ScenariosView.layout = "Contentlayout";
export default ScenariosView;
