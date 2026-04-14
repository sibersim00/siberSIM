import { useEffect, useState, useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
  terminateFailedScenario,
  terminateFailedEvents,
  terminateFailedLogs,
  terminateFailedEventLogs,
  clearterminateFailedScenario,
  clearterminateFailedEvents
} from "../../../shared/redux/slices/scenario/scenarioManage";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const ManageScenarioTermination = () => {
  const dispatch = useDispatch();

  // const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("scenario");

  // Separate loading states
  const [loadingScenarioTab, setLoadingScenarioTab] = useState(false);
  const [loadingEventTab, setLoadingEventTab] = useState(false);
  const [loadingTerminateScenario, setLoadingTerminateScenario] = useState(false);
  const [loadingTerminateEvent, setLoadingTerminateEvent] = useState(false);

  const {
    hasGetterminateFailedLogs,
    hasGetterminateFailedScenario,
    hasGetterminateFailedEventLogs,
    hasGetterminateFailedEvent,
  } = useSelector((state) => ({
    hasGetterminateFailedScenario: state?.scenarioManage?.saveTermination,
    hasGetterminateFailedLogs:
      state?.scenarioManage?.saveTerminationlogs?.data || [],
    hasGetterminateFailedEventLogs:
      state?.scenarioManage?.saveTerminationeventslogs?.data || [],
    hasGetterminateFailedEvent: state?.scenarioManage?.saveTerminationevents,
  }));

  // Fetch logs when tab changes
  // useEffect(() => {
  //   if (activeTab === "scenario") {
  //     setLoadingScenarioTab(true);
  //     dispatch(terminateFailedLogs()).finally(() =>
  //       setLoadingScenarioTab(false)
  //     );
  //   } else {
  //     setLoadingEventTab(true);
  //     dispatch(terminateFailedEventLogs()).finally(() =>
  //       setLoadingEventTab(false)
  //     );
  //   }
  // }, [dispatch, activeTab]);

  useEffect(() => {
  const fetchLogs = async () => {
    try {
      if (activeTab === "scenario") {
        setLoadingScenarioTab(true);
        await dispatch(terminateFailedLogs());
      } else {
        setLoadingEventTab(true);
        await dispatch(terminateFailedEventLogs());
      }
    } finally {
      setLoadingScenarioTab(false);
      setLoadingEventTab(false);
    }
  };
  fetchLogs();
}, [dispatch, activeTab]);


  // Derive logs directly, no local state
const logs = activeTab === "scenario"
  ? hasGetterminateFailedLogs || []
  : hasGetterminateFailedEventLogs || [];


  // Success toast for Scenario
  useEffect(() => {
    if (hasGetterminateFailedScenario?.statusCode === 200) {
      toast.success(hasGetterminateFailedScenario.message, {
        position: toast.POSITION.TOP_RIGHT,
        theme: "colored",
      });
      dispatch(clearterminateFailedScenario());
    }
  }, [hasGetterminateFailedScenario, dispatch]);

  // Success toast for Event
  
  useEffect(() => {
    if (hasGetterminateFailedEvent?.statusCode === 200) {
      toast.success(hasGetterminateFailedEvent.message, {
        position: toast.POSITION.TOP_RIGHT,
        theme: "colored",
      });
      dispatch(clearterminateFailedEvents());
    }
  }, [hasGetterminateFailedEvent, dispatch]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const handleToTerminateAllScenario = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to terminate all failed scenarios?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, Terminate All!",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingTerminateScenario(true);
        dispatch(terminateFailedScenario())
          .then(() => dispatch(terminateFailedLogs()))
          .finally(() => setLoadingTerminateScenario(false))
          .catch(() => Swal.fire("Error", "Something went wrong.", "error"));
      }
    });
  };

  const handleToTerminateAllEvents = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to terminate all failed events?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, Terminate All!",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingTerminateEvent(true);
        dispatch(terminateFailedEvents())
          .then(() => dispatch(terminateFailedEventLogs()))
          .finally(() => setLoadingTerminateEvent(false))
          .catch(() => Swal.fire("Error", "Something went wrong.", "error"));
      }
    });
  };

const columnDefs = useMemo(() => {
  const nameColumn =
    activeTab === "scenario"
      ? { headerName: "Scenario Name", field: "scenario_name", filter: true, floatingFilter: true }
      : { headerName: "Event Name", field: "event_name", filter: true, floatingFilter: true };

  const baseColumns = [
    nameColumn,
    { headerName: "User Name", field: "learner_name", filter: true, floatingFilter: true },
    { headerName: "VM Status", field: "vm_steps", filter: true, floatingFilter: true, cellRenderer: "vmStatusRenderer" },
    { headerName: "Start Date", field: "started_on", filter: true, floatingFilter: true, valueFormatter: (p) => formatDate(p.value) },
    { headerName: "End Date", field: "end_date", filter: true, floatingFilter: true },
  ];

  if (activeTab === "scenario") {
    // Add Session Status only for scenario tab
    baseColumns.splice(2, 0, {
      headerName: "Session Status",
      field: "session_status",
      filter: true,
      floatingFilter: true,
    });
  }

  return baseColumns;
}, [activeTab]);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      suppressMovable: true,
      flex: 1,
    }),
    []
  );

const frameworkComponents = {
    srNoRender: (props) => props.node.rowIndex + 1,
    actionButtonRenderer: (props) => <ActionButtonRenderer propsVal={props} />,

   vmStatusRenderer : (props) => {
  return (
    <span
      className="badge"
      style={{
        backgroundColor: "#ff4d94", // pink
        color: "white",
        cursor: "default",
      }}
    >
      {props.value}
    </span>
  );
},

    actionSwitchRenderer: (props) => (
      <ToggleButton
        data={props?.data}
        handleStatusSwitch={handleStatusSwitch}
      />
    ),
  };

  return (
    <>
      <Seo title="Scenario/Event Termination Logs" />
      <ToastContainer />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          {activeTab === "scenario" ? "Scenario Termination" : "Event Termination"}
        </h4>
        <div className="d-flex gap-2">
        <button
  className={`btn ${activeTab === "scenario" ? "btn-primary" : "btn-outline-primary"}`}
  onClick={() => setActiveTab("scenario")}
>
  Scenario
</button>

<button
  className={`btn ${activeTab === "event" ? "btn-primary" : "btn-outline-primary"}`}
  onClick={() => setActiveTab("event")}
>
  Event
</button>

          {activeTab === "scenario" && (
            <button
              className="btn btn-secondary"
              onClick={handleToTerminateAllScenario}
              disabled={loadingTerminateScenario}
            >
              {loadingTerminateScenario ? "Processing..." : "Terminate All Failed Scenarios"}
            </button>
          )}
          {activeTab === "event" && (
            <button
              className="btn btn-secondary"
              onClick={handleToTerminateAllEvents}
              disabled={loadingTerminateEvent}
            >
              {loadingTerminateEvent ? "Processing..." : "Terminate All Failed Events"}
            </button>
          )}
        </div>
      </div>

      <Row>
        <Col sm={12}>
          <div className="ag-theme-alpine" style={{ height: "50em", width: "100%" }}>
            <AgGridReact
              rowData={logs}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={20}
              components={frameworkComponents}
            />
          </div>
        </Col>
      </Row>
    </>
  );
};

ManageScenarioTermination.layout = "Contentlayout";
export default ManageScenarioTermination;
