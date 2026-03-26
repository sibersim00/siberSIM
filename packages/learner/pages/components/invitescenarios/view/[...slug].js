import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Nav, Tab, Alert } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import {
  clearSingleScenarios,
  clearHasError,
  getLogs,
  getTabList,
} from "../../../../shared/redux/slices/scenarios/scenarios";
import { getInviteScenarioByID } from "../../../../shared/redux/slices/invitescenario/invitescenario";
import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import ScenarioDiagram from "../../scenarios/view/scenariodiagram";
import ScenarioQuiz from "../../scenarios/view/quiz";
import dynamic from "next/dynamic";

const PdfLoader = dynamic(
  () => import("../../../../shared/data/common/PdfLoader"),
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> },
);

const InviteLearnerView = () => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const router = useRouter();
  const { view } = router.query;
  const { backView, categoryId, subcategoryName } = router.query;
  const [rowId, setRowId] = useState("");
  const [rowValues, setRowValues] = useState({});
  const [activeTab, setActiveTab] = useState("Basic Information");
  const [showChat, setShowChat] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [scenarioStatus, setScenarioStatus] = useState("Pending");
  const [isScenarioError400, setIsScenarioError400] = useState(false);
  const [pdfNotFound, setPdfNotFound] = useState(false);
  const [dynamicTab, setDynamicTab] = useState("Basic Information");
  const [currentView, setCurrentView] = useState("");
  const { t } = useTranslation();
  const { slug } = router.query;
  const { getSingleScenariosSucc, hasGetLogsListData, tabListSucc, errorData } =
    useSelector((state) => ({
      getSingleScenariosSucc:
        state?.invitescenarioReducer?.singleScenarios?.data,
      tabListSucc: state?.scenarios?.getTabListData?.data,
      errorData: state?.invitescenarioReducer?.error,
    }));

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
       setActionLoading(false);
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
    if (!router.isReady) return;
     setActionLoading(true);
    dispatch(getInviteScenarioByID(slug));
    setRowId(slug?.[0]);
  }, [router.isReady, slug]);

  useEffect(() => {
    if (router.isReady && getSingleScenariosSucc === null) {
      router.push("/invitescenarios");
    }
  }, [getSingleScenariosSucc]);

  useEffect(() => {
    if (getSingleScenariosSucc) {
      setRowValues(getSingleScenariosSucc);
      setScenarioStatus(getSingleScenariosSucc?.status);
       setActionLoading(false); 
    }
  }, [getSingleScenariosSucc]);

  const baseUrl = process.env.API_URL_FILEMANAGER;

  const pdfUrl = rowValues?.instruction_file
    ? `${baseUrl}${rowValues.instruction_file}`
    : null;

  const isTerminated = rowValues?.isnotitermination === "Yes";
  const isTimerVisible = !(
    isScenarioError400 ||
    ["Terminated", "Completed", "Pending", "Failed", "Initializing"].includes(
      scenarioStatus,
    )
  );


useEffect(() => {
  if (view) {
    setCurrentView(view);
  }
}, [view]);

  const vmDisplayStatus =
    rowValues?.vm_steps === "Running"
      ? rowValues?.status === "Pause"
        ? "Pause"
        : "Running"
      : "";

  return (
    <>
      <Seo title="View Scenario" />
      <ToastContainer />
      <Row className="view-component-row-sm">
        <Col md={12}>
          {!actionLoading && (
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

                        <div className="me-3 ms-4 d-flex align-items-center">
                          {vmDisplayStatus && (
                            <Button
                              size="sm"
                              className={`rounded-pill px-4  ${
                                vmDisplayStatus === "Running"
                                  ? "btn-success"
                                  : "btn-warning text-dark"
                              }`}
                            >
                              {vmDisplayStatus}
                            </Button>
                          )}
                        </div>
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
                           router.push({
                             pathname: "/invitescenarios",
                             query: { view: currentView  },
                           });
                            dispatch(clearSingleScenarios());
                          }}
                        >
                          <i className="fe fe-arrow-left"></i>
                        </Button>
                      </div>
                    </div>
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
                          It looks like the resource has been idle for a while.
                          To keep things efficient, we’ll automatically shut it
                          down in 4 hours. Need more time? Just reconnect...{" "}
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
          )}
        </Col>

        <Col md={12}>
          {!actionLoading && (
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
                                ?.sort(
                                  (a, b) => a.tab_ordering - b.tab_ordering,
                                )
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
                                      {/* Conditional rendering per tab name */}
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

                                      {tab.tab_name ===
                                        "Instruction Details" && (
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
                                              ? rowValues?.scenariodiagram
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
          )}
        </Col>
      </Row>
    </>
  );
};

InviteLearnerView.layout = "Contentlayout";
export default InviteLearnerView;
