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
  Form,
  Table,
} from "react-bootstrap";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
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
  Learnerlistbyinstructor, 
  getLearnersByVmRequest,
  cleargetLearnersByVmRequest,    
  DeleteInviteLearnerController,
  clearDeleteInviteLearnerController,
  saveInviteLearners,
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
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> },
);

const scenarioConfigurationSteps = [
  {
    icon: "fa-cogs",
    accent: "red",
    label: "Preparing configuration",
    text: "Validating the scenario settings and resources.",
    step: "Initializing",
  },
  {
    icon: "fa-clone",
    accent: "orange",
    label: "Cloning virtual machines",
    text: "Creating the virtual machines required for this session.",
    step: "Cloning",
  },
  {
    icon: "fa-sliders-h",
    accent: "yellow",
    label: "Configuring network",
    text: "Applying resource and network bridge settings.",
    step: "Bridge Configuration",
  },
  {
    icon: "fab fa-linux",
    accent: "blue",
    label: "Starting virtual machines",
    text: "Powering on the configured virtual machines.",
    step: "Starting",
  },
  {
    icon: "fa-shield-alt",
    accent: "green",
    label: "Launching scenario",
    text: "Finalizing the environment and making it available.",
    step: "Running",
  },
];

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
  const [configurationElapsed, setConfigurationElapsed] = useState(0);
  const [isScenarioError400, setIsScenarioError400] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfNotFound, setPdfNotFound] = useState(false);
  const [dynamicTab, setDynamicTab] = useState("Basic Information");
  const [learnerDropdown, setLearnerDropdown] = useState([]);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [learnerSelectionError, setLearnerSelectionError] = useState("");
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [showAssignedModal, setShowAssignedModal] = useState(false);
  const [showAssignedBtn, setShowAssignedBtn] = useState(false);
  const { t } = useTranslation();

  const [isTerminatingOrCompleting, setIsTerminatingOrCompleting] =
    useState(false);
  const vmStepsOrder = [
    "Initializing",
    "Cloning",
    "Bridge Configuration",
    "Starting",
    "Running",
  ];
  const {
    getSingleScenariosSucc,
    saveScenariosData,
    hasGetSessionStatusListData,
    hasGetLogsListData,
    hasUpdateCompletedTerminatedSucc,
    tabListSucc,
    hasdeletescenarioSucc,
    hasGetlearnerlistbyinstructorData,
    hasGetLearnersByVmRequestDataData,
    hasdeleteInviteLearnerControllerData,
    hasGetsaveInviteLearnersData,
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
    hasGetlearnerlistbyinstructorData:
      state?.scenarios?.learnerlistbyinstructor?.data,
    hasGetLearnersByVmRequestDataData:
      state?.scenarios?.getLearnersByVmRequestData?.data,
    hasdeleteInviteLearnerControllerData:
      state?.scenarios?.deleteInviteLearnerController,
    hasGetsaveInviteLearnersData:
      state?.scenarios?.hasGetsaveInviteLearnersData,

    errorData: state?.scenarios?.error,
  }));
  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData,
  );
  const learnerId = getUserDataFromLocal?.learner_id;

  const isLearnerLoading =
  hasGetLearnersByVmRequestDataData === undefined ||
  hasGetLearnersByVmRequestDataData === null;

const hasInvitees =
  Array.isArray(hasGetLearnersByVmRequestDataData) &&
  hasGetLearnersByVmRequestDataData.length > 0;

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
          (tab) => tab.tab_name?.toLowerCase() === "Basic Information",
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
    if (getSingleScenariosSucc?.[0].vmrequestid) {
      const payload = {
        vmrequestid:
          getSingleScenariosSucc &&
          getSingleScenariosSucc?.[0] &&
          getSingleScenariosSucc?.[0].vmrequestid,
      };
      dispatch(getLearnersByVmRequest(payload));
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
        requestedby_id: getUserDataFromLocal?.learner_id,
        vmrequestid: saveScenariosData?.vmrequestid,
      };
      dispatch(getConfigurations(payload));

      setShowCloneModal(true);
      dispatch(clearSaveScenarios());
    }
  }, [saveScenariosData]);

  useEffect(() => {
    if (hasdeleteInviteLearnerControllerData?.statusCode == 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasdeleteInviteLearnerControllerData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );

      const payload = {
        vmrequestid: getSingleScenariosSucc?.[0].vmrequestid,
      };
      dispatch(getLearnersByVmRequest(payload));
      dispatch(clearDeleteInviteLearnerController());
    }
  }, [hasdeleteInviteLearnerControllerData]);

  const handleDeletecard = (learner) => {
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
          learnerid: learner.learner_id,
          vmrequestid: learner.vmrequestid,
        };
        dispatch(DeleteInviteLearnerController(payload));
      }
    });
  };

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
          },
        );
        setScenarioStatus(
          confirmAction === "terminate" ? "Terminated" : "Completed",
        );
      }
      setActionLoading(false); // Remove loading
      dispatch(clearUpdateCompletedTerminated());
      dispatch(getSingleScenarios(query.slug[0]));
      // const payload = {
      //   vmrequestid:
      //     getSingleScenariosSucc &&
      //     getSingleScenariosSucc?.[0] &&
      //     getSingleScenariosSucc?.[0].vmrequestid,
      // };
      // dispatch(getLearnersByVmRequest(payload));
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
          },
        );
        setScenarioStatus(
          confirmAction === "terminate" ? "Terminated" : "Completed",
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
              },
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
            },
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
    setShowAssignedBtn(false);
    // setShowInviteesBtn(false);
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
      //  THE NEW DELETE API
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
    setSelectedLearners([]);
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
      setShowAssignedBtn(false); // hide Assigned
      // setShowInviteesBtn(false); // hide Invitees
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
        },
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
        },
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
  if (query.slug?.[0]) {
    dispatch(cleargetLearnersByVmRequest());
    dispatch(getSingleScenarios(query.slug[0]));
  }
}, [query.slug]);

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
    setConfigurationElapsed(0);
    setShowCloneModal(true);
    dispatch(getSessionStatusList(scenariolearnersessionuuid));
    setTimeout(() => {
      pollingRef.current = setInterval(() => {
        dispatch(getSessionStatusList(scenariolearnersessionuuid));
      }, 25000);
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
    if (!showCloneModal || vmStep === "Running" || vmStep === "Pause") return;
    const elapsedTimer = setInterval(() => {
      setConfigurationElapsed((previous) => previous + 1);
    }, 1000);
    return () => clearInterval(elapsedTimer);
  }, [showCloneModal, vmStep]);

  useEffect(() => {
    const step = hasGetSessionStatusListData?.vm_steps;
    if (!step || !step.trim()) {
      return;
    }
    setVmStep(step);
    if (step === "Running" || step === "Pause") {
      setCountdown(10);
      setCountdownActive(true);
      clearInterval(pollingRef.current);
      pollingRef.current = null;

      setShowAssignedBtn(true);
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

  const isConfigurationComplete = vmStep === "Running" || vmStep === "Pause";
  const currentVmStepIndex = isConfigurationComplete
    ? vmStepsOrder.length - 1
    : vmStepsOrder.indexOf(vmStep);
  const configurationProgress = isConfigurationComplete
    ? 100
    : currentVmStepIndex >= 0
      ? Math.round(((currentVmStepIndex + 1) / vmStepsOrder.length) * 100)
      : 0;

  const getConfigurationStepState = (step) => {
    const stepIndex = vmStepsOrder.indexOf(step);
    if (isConfigurationComplete || stepIndex < currentVmStepIndex) {
      return "complete";
    }
    if (stepIndex === currentVmStepIndex) return "active";
    return "pending";
  };
  const handleOkClick = () => {
    setShowCloneModal(false);
    setTimerActive(true);
    setTimerPaused(false);
    setScenarioStatus("Initializing");
    dispatch(getSingleScenarios(query.slug[0]));
    setShowAssignedBtn(true);
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
      scenarioStatus,
    )
  );

  const customStyles = () => {
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

  useEffect(() => {
    if (hasGetlearnerlistbyinstructorData?.length > 0) {
      const dropdownData = hasGetlearnerlistbyinstructorData.map((item) => ({
        learner_id: item.learner_id,
        learner_name: item.learner_name,
      }));
      setLearnerDropdown(dropdownData);
    }
  }, [hasGetlearnerlistbyinstructorData]);

  const handleShowLearnerModal = () => {
    if (getSingleScenariosSucc?.[0]?.vmrequestid) {
      dispatch(
        getLearnersByVmRequest({
          vmrequestid: getSingleScenariosSucc?.[0].vmrequestid,
        }),
      );
      setShowLearnerModal(true);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedLearners?.length) {
      setLearnerSelectionError("Please select at least one learner.");
      return;
    }

    const payload = {
      vmrequestid: getSingleScenariosSucc?.[0]?.vmrequestid,
      invited_by_learner_id: getUserDataFromLocal?.learner_id,
      invitelearnerids: selectedLearners.map((item) => item.learner_id),
    };

    try {
      await dispatch(saveInviteLearners(payload));
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Invitees Assigned Successfully.
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(
        getLearnersByVmRequest({
          vmrequestid: getSingleScenariosSucc?.[0]?.vmrequestid,
        }),
      );
      setShowAssignedModal(false);
      setShowAssignedBtn(false);
      // setShowInviteesBtn(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignedModal = () => {
    dispatch(
      Learnerlistbyinstructor({
        vmrequestid: getSingleScenariosSucc?.[0]?.vmrequestid,
      }),
    );
    setLearnerSelectionError("");
    setShowAssignedModal(true);
  };

  const handleCloseAssignedModal = () => {
    setLearnerSelectionError("");
    setShowAssignedModal(false);
  };

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
                              }`,
                            );
                          } else if (categoryId) {
                            router.push(
                              `/scenarios?categoryId=${categoryId}&view=${
                                backView || "list"
                              }`,
                            );
                          } else {
                            router.push(
                              `/scenarios?view=${backView || "list"}`,
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
                    scenarioStatus,
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
                                  (a, b) => a.tab_ordering - b.tab_ordering,
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

                                        {/* {hasGetLearnersByVmRequestDataData?.length >
                                          0 &&
                                          ![
                                            "Completed",
                                            "Terminated",
                                            "Deleted",
                                          ].includes(scenarioStatus) && (
                                            <Col md={3}>
                                              <div className="d-flex align-items-start gap-3">
                                                <i className="fe fe-user-plus text-secondary fs-4 mt-1"></i>
                                                <div>
                                                  <div className="fw-semibold text-dark mb-2" />

                                                  <Button
                                                    size="sm"
                                                    className="rounded-pill d-flex align-items-center gap-1 px-3 btn-transparent "
                                                    onClick={
                                                      handleShowLearnerModal
                                                    }
                                                  >
                                                    <i className="fe fe-eye"></i>
                                                    Invitees
                                                  </Button>

                                                  <small className="text-muted">
                                                    Assigned Invitees
                                                  </small>
                                                </div>
                                              </div>
                                            </Col>
                                          )} */}

                                        {/* {!isLearnerLoading &&
                                          hasInvitees &&
                                          ![
                                            "Completed",
                                            "Terminated",
                                            "Deleted",
                                          ].includes(scenarioStatus) && ( */}
                                         {hasGetLearnersByVmRequestDataData?.length > 0 &&  ["Start", "Pause", "Resume"].includes(getSingleScenariosSucc?.[0]?.status) && (
                                            <Col md={3}>
                                              <div className="d-flex align-items-start gap-3">
                                                <i className="fe fe-user-plus text-secondary fs-4 mt-1"></i>
                                                <div>
                                                  <Button
                                                    size="sm"
                                                    className="rounded-pill d-flex align-items-center gap-1 px-3 btn-transparent"
                                                    onClick={
                                                      handleShowLearnerModal
                                                    }
                                                  >
                                                    <i className="fe fe-eye"></i>
                                                    Invitees
                                                  </Button>

                                                  <small className="text-muted">
                                                    Assigned Invitees
                                                  </small>
                                                </div>
                                              </div>
                                            </Col>
                                          )}

                                     {hasGetLearnersByVmRequestDataData?.length == 0 && ["Start", "Pause", "Resume"].includes(getSingleScenariosSucc?.[0]?.status) && (
                                          <Col md={3}>
                                            <div className="d-flex align-items-start gap-3">
                                              <i className="fe fe-check-circle me-2 text-primary fs-4 mt-1"></i>
                                              <div>
                                                <div className="fw-semibold text-dark mb-2" />

                                                <Button
                                                  size="sm"
                                                  className="rounded-pill d-flex align-items-center gap-1 px-3 btn-transparent"
                                                  onClick={
                                                    handleOpenAssignedModal
                                                  }
                                                >
                                                  <i className="fe fe-users"></i>{" "}
                                                  Assign Invitees
                                                </Button>

                                                <small className="text-muted">
                                                  Select Invitees
                                                </small>
                                              </div>
                                            </div>
                                          </Col>
                                        )}

                                        <Col md={6}>
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
                                        rowValues={rowValues}
                                        manipulationFlag={
                                          rowValues?.manipulation_flag
                                        }
                                        isrunning={rowValues?.status}
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
                                                              log.startedon,
                                                            ).toLocaleString()
                                                          : "-"}
                                                      </td>
                                                      <td>{log.type}</td>
                                                      <td>{log.status}</td>
                                                      <td>
                                                        {new Date(
                                                          log.createdon,
                                                        ).toLocaleString()}
                                                      </td>
                                                      <td>{log.remark}</td>
                                                    </tr>
                                                  ),
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
                                                      `flex-iframe-${tab.tab_name}`,
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
                                                      `flex-iframe-${tab.tab_name}`,
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
            backdropClassName="scenario-clone-backdrop"
            keyboard={false}
            size="md"
            centered
            className="scenario-clone-modal-shell"
            dialogClassName="scenario-clone-modal"
          >
            <Modal.Header className="scenario-clone-header border-0">
              <div className="scenario-clone-heading">
                <div>
                  <span className="scenario-clone-eyebrow">Live configuration</span>
                  <Modal.Title>Building your scenario</Modal.Title>
                  <p className="mb-0">
                    Allocating resources for your secure lab
                  </p>
                </div>
              </div>
            </Modal.Header>
            <Modal.Body className="scenario-clone-body">
              <div className="scenario-clone-progress-summary">
                <strong>Overall progress</strong>
                <strong>{formatTime(configurationElapsed)} elapsed</strong>
              </div>
              <div
                className="scenario-clone-progress"
                role="progressbar"
                aria-label="Scenario configuration progress"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={configurationProgress}
              >
                <div style={{ width: `${configurationProgress}%` }} />
              </div>

              <div className="scenario-clone-workspace">
                <div
                  className="scenario-clone-ring"
                  style={{
                    "--configuration-progress": `${configurationProgress * 3.6}deg`,
                  }}
                  aria-hidden="true"
                >
                  <div>
                    <strong>{configurationProgress}%</strong>
                    <span>{isConfigurationComplete ? "Ready" : "Initiated"}</span>
                  </div>
                </div>

                <div className="scenario-clone-steps">
                  {scenarioConfigurationSteps.map((item, idx) => {
                    const stepState = getConfigurationStepState(item.step);
                    return (
                      <div
                        key={item.step}
                        className={`scenario-clone-step is-${stepState} accent-${item.accent}`}
                        style={{ "--step-delay": `${idx * 70}ms` }}
                      >
                        <div className="scenario-clone-step-marker">
                          {stepState === "complete" && <i className="fas fa-check" />}
                          {stepState === "active" && <span />}
                        </div>
                        <div className="scenario-clone-step-copy">
                          <h6>{item.label}</h6>
                          {stepState === "active" && <p>{item.text}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Modal.Body>

            {isConfigurationComplete && (
              <Modal.Footer className="scenario-clone-footer border-0">
                <div className="scenario-clone-ready-action">
                  <span>Continuing automatically in {countdown}s</span>
                  <Button variant="success" onClick={handleOkClick}>
                    Enter scenario <i className="fas fa-arrow-right ms-2" />
                  </Button>
                </div>
              </Modal.Footer>
            )}
          </Modal>

          <Modal
            show={showConfirm}
            onHide={handleCancelAction}
            centered
            size="md"
          >
            <Modal.Header closeButton className="border-bottom">
              <Modal.Title className="fw-semibold">Start Scenario</Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-6 pb-6">
              {confirmAction === "initializing" && (
                <>
                  <p className="text-muted mb-3">
                    Are you sure you want to start this scenario?
                  </p>
                </>
              )}

              {confirmAction === "terminate" && (
                <p className="text-muted mb-0">
                  Are you sure you want to terminate this scenario?
                </p>
              )}

              {confirmAction === "complete" && (
                <p className="text-muted mb-0">
                  Are you sure you want to complete this scenario?
                </p>
              )}

              {confirmAction === "delete" && (
                <p className="text-danger mb-0">
                  Are you sure you want to delete this scenario?
                </p>
              )}
            </Modal.Body>

            <Modal.Footer className="border-top">
              <Button variant="outline-secondary" onClick={handleCancelAction}>
                Cancel
              </Button>

              <Button variant="primary" onClick={handleConfirm}>
                Confirm
              </Button>
            </Modal.Footer>
          </Modal>

          {/* dropdown modal */}
          <Modal
            show={showAssignedModal}
            onHide={handleCloseAssignedModal}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Select Invitees</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Form.Group>
                <Form.Label className="text-success fw-medium">
                  <i className="fe fe-users me-2"></i>
                  Select Invitees
                </Form.Label>

                <Select
                  isMulti
                  inputId="learner-invitees"
                  aria-invalid={Boolean(learnerSelectionError)}
                  aria-describedby={
                    learnerSelectionError ? "learner-invitees-error" : undefined
                  }
                  styles={customStyles()}
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary25: "var(--primary-bg-color)",
                      primary: "var(--primary-bg-color)",
                    },
                  })}
                  name="learner_id"
                  value={selectedLearners}
                  // options={learnerDropdown}
                  options={learnerDropdown.filter(
                    (item) =>
                      !selectedLearners?.some(
                        (selected) => selected.learner_id === item.learner_id,
                      ),
                  )}
                  getOptionLabel={(x) => x.learner_name}
                  getOptionValue={(x) => x.learner_id}
                  placeholder="Select Invitees"
                  onChange={(selectedOptions) => {
                    const learners = selectedOptions || [];
                    setSelectedLearners(learners);
                    if (learners.length > 0) {
                      setLearnerSelectionError("");
                    }

                    const selectedIds = learners.map(
                      (item) => item.learner_id,
                    );

                    const payload =
                      selectedIds.length > 0 ? { learner_id: selectedIds } : {};
                  }}
                  menuPosition="fixed"
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                {learnerSelectionError && (
                  <div
                    id="learner-invitees-error"
                    className="text-danger mt-1"
                    role="alert"
                  >
                    {learnerSelectionError}
                  </div>
                )}
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={handleCloseAssignedModal}
              >
                Cancel
              </Button>

              <Button variant="primary" onClick={handleAssignSubmit}>
                Save
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

          {/*  View Invitees */}
          <Modal
            show={showLearnerModal}
            onHide={() => setShowLearnerModal(false)}
            centered
            size="md"
          >
            <Modal.Header closeButton className="border-bottom shadow-sm">
              <Modal.Title className="text-success fw-bold">
                <i className="fe fe-users me-2"></i>
                View Invitees
              </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-3">
              <Table className="table table-hover table-bordered align-middle text-center shadow-sm">
                <thead className="table-secondary">
                  <tr>
                    <th style={{ width: "80px" }}>SR.</th>
                    <th>Invitees Name</th>
                    <th style={{ width: "100px" }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {hasGetLearnersByVmRequestDataData?.length > 0 ? (
                    hasGetLearnersByVmRequestDataData.map((learner, index) => (
                      <tr key={learner.learner_id}>
                        <td className="fw-semibold">{index + 1}</td>

                        <td className="text-capitalize fw-semibold">
                          {learner.learner_name}
                        </td>

                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger rounded-circle"
                            onClick={() => handleDeletecard(learner)}
                          >
                            <i className="fe fe-trash-2"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-3">
                        No Invitees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Modal.Body>
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
