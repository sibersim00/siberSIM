import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";

import {
  Container,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { getStudentDashboard } from "../../../shared/redux/slices/dashboard/dashboard";
import { useRouter } from "next/router";

const Dashboard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { hasGetStudentDashboardListSucc } = useSelector((state) => ({
    hasGetStudentDashboardListSucc:
      state?.dashboard?.getStudentDashboardData?.data,
  }));

  console.log("hasGetStudentDashboardListSucc", hasGetStudentDashboardListSucc);

  useEffect(() => {
    dispatch(getStudentDashboard());
  }, [dispatch]);

  const {
    currentScenario = {},
    widgets = [],
    webBrowserWidgets = [],
  } = hasGetStudentDashboardListSucc || {};

  const widgetData = {
    completedScenarios: widgets.find((w) => w.title === "Completed Scenarios"),
    quizErrorRate: widgets.find((w) => w.title === "Quiz Score"),
    activeFailedSessions: widgets.find(
      (w) => w.title === "Active/Failed Sessions"
    ),
  };
  const handleReturnView = (props) => {
    console.log("propspropspropspropsddddd", props);

    router.push(`/scenarios_view/${props?.scenariouuid}`);
  };

  function parseTimeStringToSeconds(timeStr) {
    const [h = 0, m = 0, s = 0] = timeStr.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  }

  function formatSecondsToTime(totalSeconds) {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  }

  const isRunning = ["Start", "Resume"].includes(
    currentScenario?.session_status || ""
  );

  const [timerSeconds, setTimerSeconds] = useState(() =>
    parseTimeStringToSeconds(currentScenario?.calculated_timer || "00:00:00")
  );

  useEffect(() => {
    if (!currentScenario?.calculated_timer) return;

    const startSeconds = parseTimeStringToSeconds(
      currentScenario?.calculated_timer
    );
    setTimerSeconds(startSeconds);

    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentScenario?.calculated_timer, currentScenario?.session_status]);

  return (
    <>
      <Seo title="Dashboard" />
      <Container fluid>
        <Row className="">
          <Col md={12}>
            <Row className="">
              <Col md={12}>
                <div className="row row-sm mt-lg-4">
                  <div className="col-sm-12 col-lg-12 col-xl-12">
                    <div className="card bg-primary custom-card card-box">
                      <div className="card-body p-4">
                        <div className="row align-items-center">
                          <div className="col-xl-8 col-sm-6 col-12">
                            <h4 className="d-flex mb-3">
                              <span className="font-weight-bold text-white">
                                Welcome To siberSIM SIMUser Portal
                              </span>
                            </h4>
                            <p className="tx-white-7 mb-1">
                              You have two programs to finish, you had completed{" "}
                              <b className="text-warning">57%</b> from your
                              monthly level, Keep going to your level
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>


            <Row className="g-4">
              <Col xs={12}>
                {currentScenario?.scenariotitle && currentScenario?.scenarioidentification && (
                  <Card className="border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                    <Card.Body>
                      <Row className="align-items-center mb-4">
                        <Col
                          md={12}
                          className="d-flex align-items-center justify-content-between gap-3"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle bg-light d-flex justify-content-center align-items-center"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i
                                className={`mdi fs-5 ${{
                                    Terminated: "mdi-alert-circle text-danger",
                                    Completed: "mdi-check-circle text-success",
                                    Initializing: "mdi-timer-sand text-info",
                                    Start: "mdi-run text-warning",
                                    Pause: "mdi-pause text-warning",
                                    Resume: "mdi-run text-warning",
                                    Failed: "mdi-alert-circle text-danger",
                                  }[currentScenario?.session_status] ||
                                  "mdi-help-circle text-secondary"
                                  }`}
                              />
                            </div>

                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="d-flex align-items-center gap-1">
                                  {[0, 1, 2].map((i) => (
                                    <i
                                      key={i}
                                      className={`fa ${i <
                                          (currentScenario?.scenariolevel ===
                                            "Hard"
                                            ? 3
                                            : currentScenario?.scenariolevel ===
                                              "Medium"
                                              ? 2
                                              : 1)
                                          ? "fa-star"
                                          : "fa-star-o"
                                        }`}
                                      style={{
                                        color:
                                          currentScenario?.scenariolevel ===
                                            "Hard"
                                            ? "#dc3545"
                                            : currentScenario?.scenariolevel ===
                                              "Medium"
                                              ? "#ffc107"
                                              : "#28a745",
                                      }}
                                    />
                                  ))}
                                </span>
                                <h6 className="fw-bold mb-0 text-dark fs-6">
                                  {currentScenario?.scenariotitle}
                                </h6>
                              </div>

                              <i className="fas fa-history"></i>
                              <span className="badge bg-info-subtle text-secondary fw-semibold  fs-6">
                                {formatSecondsToTime(timerSeconds)}
                              </span>
                            </div>
                          </div>

                          <div className="text-end">
                            <button
                              className="btn btn-link text-primary text-decoration-none"
                              onClick={() => handleReturnView(currentScenario)}
                            >
                              Go to Scenario{" "}
                              <i className="fe fe-arrow-right ms-1" />
                            </button>
                          </div>
                        </Col>
                      </Row>

                      <Row className="text-muted small text-dark fw-medium">
                        <Col md={3}>
                          <div className="d-flex align-items-start gap-3 mb-3">
                            <i className="fas fa-id-badge text-success fs-4 mt-1" />
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.scenarioidentification}
                              </div>
                              <small className="text-muted">Scenario ID</small>
                            </div>
                          </div>

                          <div className="d-flex align-items-start gap-3 mb-3">
                            <i className="fe fe-cpu text-success fs-4 mt-1" />
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.virtual_cpu} Cores
                              </div>
                              <small className="text-muted">Virtual CPU</small>
                            </div>
                          </div>
                        </Col>

                        {/* Column 2 */}
                        <Col md={3}>
                          <div className="d-flex align-items-start gap-3 mb-3 ">
                            <i className="fe fe-clock text-info fs-4 mt-1" />
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.duration} mins
                              </div>
                              <small className="text-muted">Duration</small>
                            </div>
                          </div>

                          <div className="d-flex align-items-start gap-3 mb-3">
                            <i className="mdi mdi-memory text-secondary fs-4 mt-1" />
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.virtual_memory} M
                              </div>
                              <small className="text-muted">
                                Virtual Memory
                              </small>
                            </div>
                          </div>
                        </Col>

                        {/* Column 3 */}

                        <Col md={3}>
                          <div className="d-flex align-items-start gap-3 mb-3">
                            <i className="fe fe-layers text-success fs-4 mt-1"></i>
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.scenariocategory_name || "—"}
                              </div>
                              <small className="text-muted">
                                Scenario Category
                              </small>
                            </div>
                          </div>

                          <div className="d-flex align-items-start gap-3 mb-3">
                            <i className="mdi mdi-server text-danger fs-4 mt-1" />
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.component_count}
                              </div>
                              <small className="text-muted">Total VM</small>
                            </div>
                          </div>

                        </Col>

                        <Col md={3}>
                          <div className="d-flex align-items-start gap-3 mb-3">
                            <i className="fe fe-tag text-success fs-4 mt-1"></i>
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.scenariosubcategory_name ||
                                  "—"}
                              </div>
                              <small className="text-muted">
                                Scenario Subcategory
                              </small>
                            </div>
                          </div>
                          <div className="d-flex align-items-start gap-3 mb-3">
                            <i className="fe fe-hard-drive text-dark fs-4 mt-1" />
                            <div>
                              <div className="fw-semibold text-dark mb-1">
                                {currentScenario?.storage_size} GB
                              </div>
                              <small className="text-muted">Storage Size</small>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>

            <Row className="row-sm">
              <Col md={12} className="col-md-12">
                <Card className="custom-card">
                  <Row className="row-sm">
                    <Col xl={4} lg={4} sm={4} className="pe-0 ps-0 border-end">
                      <Card.Body className="text-center py-4">
                        <h6 className="text-uppercase fw-bold text-dark  mb-2">
                          Completed Scenario
                        </h6>
                        <h2 className="fw-bold  mb-2">
                          <span className="counter">
                            {widgetData?.completedScenarios?.value || "0.00"}
                          </span>
                        </h2>
                        <p className="mb-0 d-flex justify-content-center align-items-center">
                          <span className="me-1 text-success">
                            <i className="fe fe-arrow-up"></i>
                          </span>
                          <span className="text-success small">
                            {widgetData?.completedScenarios?.tooltip || ""}
                          </span>
                        </p>
                      </Card.Body>
                    </Col>

                    {/* QUIZ ERROR RATE */}
                    <Col xl={4} lg={4} sm={4} className="pe-0 ps-0 border-end">
                      <Card.Body className="text-center py-4 ">
                        <h6 className="text-uppercase fw-bold text-dark mb-2">
                          Quiz Error Rate
                        </h6>
                        <h2 className="fw-bold mb-2">
                          <span className="counter">
                            {widgetData?.quizErrorRate?.value || "0.00"}
                          </span>
                        </h2>
                        <p className="mb-0 d-flex justify-content-center align-items-center">
                          <span className="me-1 text-danger">
                            <i className="fe fe-arrow-down"></i>
                          </span>
                          <span className="text-danger small">
                            {widgetData?.quizErrorRate?.tooltip || ""}
                          </span>
                        </p>
                      </Card.Body>
                    </Col>

                    <Col xl={4} lg={4} sm={4} className="pe-0 ps-0">
                      <Card.Body className="text-center py-4">
                        <h6 className="text-uppercase fw-bold text-dark mb-2">
                          Number of Scenario
                        </h6>
                        <h2 className="fw-bold mb-2">
                          <span className="counter">
                            {widgetData?.activeFailedSessions?.value || "0"}
                          </span>
                        </h2>
                        <p className="mb-0 small text-muted">
                          {widgetData?.activeFailedSessions?.tooltip || ""}
                        </p>
                      </Card.Body>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
            <Row className="row-sm">
              <Col md={12}>
                {webBrowserWidgets?.length > 0 ? (
                  webBrowserWidgets.map((widget) => (
                    <Card
                      key={widget.webbrowserwidgetid}
                      className="mb-4 shadow-sm"
                    >
                      <Card.Body>
                        <h6
                          className="mb-3 text-truncate"
                          title={widget.widget_name}
                        >
                          {widget.widget_name}
                        </h6>

                        <div
                          className="position-relative overflow-hidden border rounded"
                          style={{ height: "300px" }}
                        >
                          <iframe
                            src={
                              widget.widget_url.startsWith("http")
                                ? widget.widget_url
                                : `https://${widget.widget_url}`
                            }
                            title={widget.widget_name}
                            className="w-100 h-100 border-0"
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted text-center">
                    {/* No Web Browser Widgets found. */}
                  </p>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

Dashboard.layout = "Contentlayout";
export default Dashboard;