import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

import {
  Row,
  Col,
  Card,
  Nav,
  Tab,
  Container,
  Button,
  Alert,
    Table,
 
} from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import Seo from "../../../../shared/layout-components/seo/seo";
import {
  getNormalusersInfo,
  clearNormalusersInfo,
} from "../../../../shared/redux/slices/normalusers/normalUserManage";
import { useTranslation } from "react-i18next";
// import {
//   PieChart, Pie, Cell, Tooltip,
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
// } from 'recharts';

// Typically done once in a global chart config file or root component
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);
import { Pie } from "react-chartjs-2";
import dummy_profile from "../../../../public/assets/img/dummy_profile.png";

const NormalUsersView = () => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const { t } = useTranslation();
  const [rowId, setRowId] = useState("");
  const [rowValues, setRowValues] = useState({});
  const backTo = query && query.backView;
  const { hasgetNormalusersInfoSucc } = useSelector((state) => {
    return {
      hasgetNormalusersInfoSucc:
        state &&
        state.normalUSerData &&
        state.normalUSerData.normaluserInfoResp &&
        state.normalUSerData.normaluserInfoResp.data,
    };
  });

  console.log("hasgetNormalusersInfoSucc", hasgetNormalusersInfoSucc);

  useEffect(() => {
    if (hasgetNormalusersInfoSucc && hasgetNormalusersInfoSucc !== "") {
      setRowValues(hasgetNormalusersInfoSucc);
    }
  }, [hasgetNormalusersInfoSucc]);

  useEffect(() => {
    if (query.slug) {
      setRowId(query.slug[0]);
      dispatch(getNormalusersInfo(query.slug[0]));
    }
  }, [query.slug]);
  console.log("query.slug:", query.slug);

  // Static data

  const [activeTab, setActiveTab] = useState("profile");

  console.log("rowValues",rowValues);

  return (
    <>
      <Seo title="Learners" />
      <ToastContainer />
      <Container className="py-4">
        {/* Header */}
        <Card className="mb-4 shadow-sm rounded-4">
          <Card.Body>
            {/* Top Row: Title + Back Button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0">
                <i className="fe fe-user me-2"></i>{" "}
                {`${rowValues.firstname} ${rowValues.lastname || ""}`}
              </h4>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  push(`/users-management/?view=${backTo || "list"}`);
                  dispatch(clearNormalusersInfo());
                }}
              >
                <i className="fe fe-arrow-left"></i>
              </Button>
            </div>

            {/* Header */}
            <div className="d-flex align-items-center mb-4">
              <img
                src={
                  rowValues?.profile
                    ? `${process.env.API_URL_FILEMANAGER}${rowValues?.profile}`
                    : dummy_profile.src
                }
                onError={(e) => { e.target.onerror = null; e.target.src = dummy_profile.src }}
                
                alt="Profile"
                className="rounded-circle"
                width="64"
                height="64"
              />
              <div className="ms-3">
                <h5 className="mb-0">{rowValues.email || "-"}</h5>
                <small className="text-muted">
                  <i className="fe fe-phone me-1"></i>
                  {rowValues.mobile || "-"}
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Summary Cards */}
        <Row className="mb-4">
          {/* Total Events Attended */}
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="text-center">
                <div className="fw-bold text-muted">
                  <i className="fe fe-calendar me-2 text-info"></i>Events
                  Attended
                </div>
                <h4 className="mt-2">{rowValues.totalEvents || "-"}</h4>
              </Card.Body>
            </Card>
          </Col>

          {/* Scenarios Completed */}
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="text-center">
                <div className="fw-bold text-muted">
                  <i className="fe fe-check-circle me-2 text-success"></i>
                  Scenarios
                </div>
                <h4 className="mt-2">{rowValues.totalEvents || "-"}</h4>
              </Card.Body>
            </Card>
          </Col>

          {/* Quiz Accuracy */}
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="text-center">
                <div className="fw-bold text-muted">
                  <i className="fe fe-trending-up me-2 text-primary"></i>Quiz
                  Accuracy
                </div>
                <h4 className="mt-2">
  {typeof rowValues?.quizStats?.accuracy === "number"
    ? `${rowValues.quizStats.accuracy}%`
    : "-"}
</h4>

              </Card.Body>
            </Card>
          </Col>

          {/* Time Spent */}
          {/* <Col md={3}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="text-center">
                <div className="fw-bold text-muted">
                  <i className="fe fe-clock me-2 text-warning"></i>Time Spent
                </div>
                <h4 className="mt-2">24h 30m</h4>
              </Card.Body>
            </Card>
          </Col> */}
        </Row>

        {/* Tabs */}
        <Card className="shadow-sm border-0 rounded-4 mb-4">
          <Card.Body>
            <Tab.Container id="overview-tabs" activeKey={activeTab}>
              <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white w-100">
                  <Nav.Item
                    onClick={() => setActiveTab("profile")}
                    style={{ flex: 1, textAlign: "start" }}
                  >
                    <Nav.Link
                      eventKey="profile"
                      className="masterlist"
                      style={{
                        color: activeTab === "profile" ? "#007bff" : "gray",
                        fontWeight: activeTab === "profile" ? "bold" : "normal",
                      }}
                    >
                      User Profile
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
                        color: activeTab === "quiz" ? "#007bff" : "gray",
                        fontWeight: activeTab === "quiz" ? "bold" : "normal",
                      }}
                    >
                      Quiz Stats
                    </Nav.Link>
                  </Nav.Item>

                  <Nav.Item
                    onClick={() => setActiveTab("session")}
                    style={{ flex: 1, textAlign: "start" }}
                  >
                    <Nav.Link
                      eventKey="session"
                      className="masterlist"
                      style={{
                        color: activeTab === "session" ? "#007bff" : "gray",
                        fontWeight: activeTab === "session" ? "bold" : "normal",
                      }}
                    >
                      Session Details
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
                        color: activeTab === "logs" ? "#007bff" : "gray",
                        fontWeight: activeTab === "logs" ? "bold" : "normal",
                      }}
                    >
                      Event Stats
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Row>

              <Row>
                <Col md={12} className="pt-3">
                  <Tab.Content>
                    <Tab.Pane eventKey="profile">
                      <Row className="ms-3">
                        <Col md={6}>
                          <p>
                            <i className="fe fe-user me-2 text-muted"></i>
                            <strong>First Name:</strong>{" "}
                            {rowValues.firstname || "-"}
                          </p>
                          <p>
                            <i className="fe fe-mail me-2 text-muted"></i>
                            <strong>Email:</strong> {rowValues.email || "-"}
                          </p>
                          <p>
                            <i className="fe fe-at-sign me-2 text-muted"></i>
                            <strong>Username:</strong>{" "}
                            {rowValues.username || rowValues.loginid || "-"}
                          </p>
                          <p>
                            <i className="fe fe-check-circle me-2 text-muted"></i>
                            <strong>Is Verified:</strong>{" "}
                            {rowValues.isverified === "Yes" ? "Yes" : "No"}
                          </p>
                        </Col>
                        <Col md={6}>
                          <p>
                            <i className="fe fe-user-plus me-2 text-muted"></i>
                            <strong>Last Name:</strong>{" "}
                            {rowValues.lastname || "-"}
                          </p>
                          <p>
                            <i className="fe fe-phone me-2 text-muted"></i>
                            <strong>Mobile:</strong> {rowValues.mobile || "-"}
                          </p>
                          <p>
                            <i className="fe fe-check me-2 text-muted"></i>
                            <strong>Status:</strong> {rowValues.status || "-"}
                          </p>

                          <p>
                            <i className="fe fe-user-check me-2 text-muted"></i>
                            <strong>Instructor:</strong>{" "}
                            {rowValues.instructor_name}
                          </p>
                        </Col>

                        
                        <Col md={6}>
                          <p>
                            <i className="fe fe-calendar me-2 text-muted"></i>
                            <strong>Enrollment Date:</strong>{" "}
                            {rowValues.enrollmentDate?.split("T")[0] || "-"}
                          </p>
                        </Col>
                      </Row>
                    </Tab.Pane>

                    <Tab.Pane eventKey="quiz">
                      {rowValues.quizzes && rowValues.quizzes.length > 0 ? (
                        <>
                          {rowValues.quizzes.map((quiz, index) =>
                            index % 2 === 0 ? (
                              <Row key={index} className="mb-4">
                                <Col md={6}>
                                  <Card className="shadow-sm border-0 rounded-4 mb-4">
                                    <Card.Body>
                                      <Row>
                                        <Col md={8}>
                                          <h5 className="fw-bold mb-2 text-primary">
                                            <i className="fe fe-file-text me-2 text-primary"></i>
                                            {quiz.scenario_title}
                                          </h5>
                                          <p className="mb-1">
                                            <i className="fe fe-clock me-2 text-muted"></i>
                                            <strong>Started On:</strong>{" "}
                                            {new Date(
                                              quiz.startedon
                                            ).toLocaleString()}
                                          </p>
                                          <p className="mb-1">
                                            <i className="fe fe-clock me-2 text-muted"></i>
                                            <strong>Ended On:</strong>{" "}
                                            {new Date(
                                              quiz.endedon
                                            ).toLocaleString()}
                                          </p>
                                          <p className="mb-1">
                                            <i className="fe fe-list me-2 text-muted"></i>
                                            <strong>Total Questions:</strong>{" "}
                                            {quiz.total_questions}
                                          </p>
                                          <p className="mb-1">
                                            <i className="fe fe-check-circle me-2 text-success"></i>
                                            <strong>
                                              Total Correct Answers:
                                            </strong>{" "}
                                            {quiz.total_correct_answers}
                                          </p>
                                          <p className="mb-1">
                                            <i className="fe fe-activity me-2 text-primary"></i>
                                            <strong>Accuracy:</strong>{" "}
                                            <span
                                              style={{
                                                color:
                                                  quiz.total_questions > 0 &&
                                                  (quiz.total_correct_answers /
                                                    quiz.total_questions) *
                                                    100 <
                                                    50
                                                    ? "red"
                                                    : "green",
                                              }}
                                            >
                                              {quiz.total_questions > 0
                                                ? `${Math.round(
                                                    (quiz.total_correct_answers /
                                                      quiz.total_questions) *
                                                      100
                                                  )}%`
                                                : "0%"}
                                            </span>
                                          </p>
                                          <div className="mt-2">
                                            <i className="fa fa-circle text-success me-1"></i>{" "}
                                            Correct{" "}
                                            <i className="fa fa-circle text-danger ms-3 me-1"></i>{" "}
                                            Incorrect
                                          </div>
                                        </Col>
                                        <Col md={4}>
                                          <div style={{ height: "200px" }}>
                                            <Pie
                                              data={{
                                                labels: [
                                                  "Correct",
                                                  "Incorrect",
                                                ],
                                                datasets: [
                                                  {
                                                    data: [
                                                      quiz.total_correct_answers,
                                                      quiz.total_questions -
                                                        quiz.total_correct_answers,
                                                    ],
                                                    backgroundColor: [
                                                      "#28a745",
                                                      "#dc3545",
                                                    ],
                                                    borderWidth: 1,
                                                  },
                                                ],
                                              }}
                                              options={{
                                                maintainAspectRatio: false,
                                                plugins: {
                                                  legend: {
                                                    position: "bottom",
                                                  },
                                                },
                                              }}
                                            />
                                          </div>
                                        </Col>
                                      </Row>
                                    </Card.Body>
                                  </Card>
                                </Col>

                                {rowValues.quizzes[index + 1] && (
                                  <Col md={6}>
                                    <Card className="shadow-sm border-0 rounded-4 mb-4">
                                      <Card.Body>
                                        <Row>
                                          <Col md={8}>
                                            <h5 className="fw-bold mb-2 text-primary">
                                              <i className="fe fe-file-text me-2 text-primary"></i>
                                              {
                                                rowValues.quizzes[index + 1]
                                                  .scenario_title
                                              }
                                            </h5>

                                            <p className="mb-1">
                                              <i className="fe fe-clock me-2 text-muted"></i>
                                              <strong>Started On:</strong>{" "}
                                              {new Date(
                                                rowValues.quizzes[
                                                  index + 1
                                                ].startedon
                                              ).toLocaleString()}
                                            </p>

                                            <p className="mb-1">
                                              <i className="fe fe-clock me-2 text-muted"></i>
                                              <strong>Ended On:</strong>{" "}
                                              {new Date(
                                                rowValues.quizzes[
                                                  index + 1
                                                ].endedon
                                              ).toLocaleString()}
                                            </p>

                                            <p className="mb-1">
                                              <i className="fe fe-list me-2 text-muted"></i>
                                              <strong>Total Questions:</strong>{" "}
                                              {
                                                rowValues.quizzes[index + 1]
                                                  .total_questions
                                              }
                                            </p>

                                            <p className="mb-1">
                                              <i className="fe fe-check-circle me-2 text-success"></i>
                                              <strong>
                                                Total Correct Answers:
                                              </strong>{" "}
                                              {
                                                rowValues.quizzes[index + 1]
                                                  .total_correct_answers
                                              }
                                            </p>

                                            <p className="mb-1">
                                              <i className="fe fe-activity me-2 text-primary"></i>
                                              <strong>Accuracy:</strong>{" "}
                                              <span
                                                style={{
                                                  color:
                                                    rowValues.quizzes[index + 1]
                                                      .total_questions > 0 &&
                                                    (rowValues.quizzes[
                                                      index + 1
                                                    ].total_correct_answers /
                                                      rowValues.quizzes[
                                                        index + 1
                                                      ].total_questions) *
                                                      100 <
                                                      50
                                                      ? "red"
                                                      : "green",
                                                }}
                                              >
                                                {rowValues.quizzes[index + 1]
                                                  .total_questions > 0
                                                  ? `${Math.round(
                                                      (rowValues.quizzes[
                                                        index + 1
                                                      ].total_correct_answers /
                                                        rowValues.quizzes[
                                                          index + 1
                                                        ].total_questions) *
                                                        100
                                                    )}%`
                                                  : "0%"}
                                              </span>
                                            </p>

                                            <div className="mt-2">
                                              <i className="fa fa-circle text-success me-1"></i>{" "}
                                              Correct{" "}
                                              <i className="fa fa-circle text-danger ms-3 me-1"></i>{" "}
                                              Incorrect
                                            </div>
                                          </Col>

                                          <Col md={4}>
                                            <div style={{ height: "200px" }}>
                                              <Pie
                                                data={{
                                                  labels: [
                                                    "Correct",
                                                    "Incorrect",
                                                  ],
                                                  datasets: [
                                                    {
                                                      data: [
                                                        rowValues.quizzes[
                                                          index + 1
                                                        ].total_correct_answers,
                                                        rowValues.quizzes[
                                                          index + 1
                                                        ].total_questions -
                                                          rowValues.quizzes[
                                                            index + 1
                                                          ]
                                                            .total_correct_answers,
                                                      ],
                                                      backgroundColor: [
                                                        "#28a745",
                                                        "#dc3545",
                                                      ],
                                                      borderWidth: 1,
                                                    },
                                                  ],
                                                }}
                                                options={{
                                                  maintainAspectRatio: false,
                                                  plugins: {
                                                    legend: {
                                                      position: "bottom",
                                                    },
                                                  },
                                                }}
                                              />
                                            </div>
                                          </Col>
                                        </Row>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                )}
                              </Row>
                            ) : null
                          )}
                        </>
                      ) : (
                        <p>No quiz data available.</p>
                      )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="session">
                      <Card className="border-0 shadow-sm mb-4 rounded-4">
                        <Card.Body>
                          <Row className="mb-4">
                            <Col md={6}>
                              <Card className="shadow-sm border-0 rounded-4">
                                <Card.Body>
                                  <h6 className="fw-bold mb-3">
                                    Scenario Completion Status
                                  </h6>

                                  <div
                                    style={{ width: "100%", height: "250px" }}
                                  >
                                    <Pie
                                      data={{
                                        labels: ["Completed", "Terminated"],
                                        datasets: [
                                          {
                                            data: [
                                              rowValues.sessions?.filter(
                                                (s) => s.status === "Completed"
                                              )?.length || 0,
                                              rowValues.sessions?.filter(
                                                (s) => s.status === "Terminated"
                                              )?.length || 0,
                                            ],
                                            backgroundColor: [
                                              "#00C49F",
                                              "#FF0000",
                                            ],
                                            borderWidth: 1,
                                          },
                                        ],
                                      }}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                          legend: {
                                            position: "bottom",
                                          },
                                        },
                                      }}
                                    />
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={6}>
                              <Card className="shadow-sm border-0 rounded-4">
                                <Card.Body>
                                  <h6 className="fw-bold mb-3">
                                    Current Scenario
                                  </h6>
                                  {rowValues.currentScenario ? (
                                    <>
                                      <p>
                                        <strong>Title:</strong>{" "}
                                        {rowValues.currentScenario.title}
                                      </p>
                                      <p>
                                        <strong>VM Steps:</strong>{" "}
                                        {rowValues.currentScenario.vm_steps}
                                      </p>
                                      <p>
                                        <strong>Started On:</strong>{" "}
                                        {new Date(
                                          rowValues.currentScenario.startedon
                                        ).toLocaleString()}
                                      </p>
                                    </>
                                  ) : (
                                    <p>No current scenario available.</p>
                                  )}
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>

                          <h6 className="fw-bold mb-3 mt-4">
                            Completed / Terminated Sessions
                          </h6>
                          <Row>
                            {rowValues?.sessions?.length > 0 ? (
                              rowValues.sessions.map((session) => (
                                <Col
                                  md={6}
                                  lg={4}
                                  key={session.scenariolearnersessionid}
                                  className="mb-4"
                                >
                                  <Card className="shadow-sm border-0 rounded-4 h-100">
                                    <Card.Body>
                                      <h6 className="fw-bold mb-2 text-primary">
                                        {session.scenario_title}
                                      </h6>
                                      <p>
                                        <i className="fe fe-activity me-2 text-muted"></i>
                                        <strong>Status:</strong>{" "}
                                        {session.status}
                                      </p>
                                      <p>
                                        <i className="fe fe-cpu me-2 text-muted"></i>
                                        <strong>VM Steps:</strong>{" "}
                                        {session.vm_steps}
                                      </p>
                                      <p>
                                        <i className="fe fe-clock me-2 text-muted"></i>
                                        <strong>Time Spent:</strong>{" "}
                                        {session.timer}
                                      </p>
                                      <p>
                                        <i className="fe fe-play me-2 text-muted"></i>
                                        <strong>Started:</strong>{" "}
                                        {new Date(
                                          session.startedon
                                        ).toLocaleString()}
                                      </p>
                                      {session.completedon && (
                                        <p>
                                          <i className="fe fe-check-circle me-2 text-muted"></i>
                                          <strong>Completed:</strong>{" "}
                                          {new Date(
                                            session.completedon
                                          ).toLocaleString()}
                                        </p>
                                      )}
                                      {session.terminatedon && (
                                        <p>
                                          <i className="fe fe-alert-circle me-2 text-muted"></i>
                                          <strong>Terminated:</strong>{" "}
                                          {new Date(
                                            session.terminatedon
                                          ).toLocaleString()}
                                        </p>
                                      )}
                                    </Card.Body>
                                  </Card>
                                </Col>
                              ))
                            ) : (
                              <Col>
                                <Alert variant="info">
                                  No session data found.
                                </Alert>
                              </Col>
                            )}
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Logs Timeline */}

 
 
 

 
 
 
  <Tab.Pane eventKey="logs">
                      {/* <Row className="mb-4">
    <Col md={3}>
      <Card className="border-0 shadow-sm rounded-4 text-center p-3">
        <h5 className="mb-1">Total Events</h5>
        <h3 className="fw-bold">{rowValues?.eventStats?.total || 0}</h3>
      </Card>
    </Col>
    <Col md={3}>
      <Card className="border-0 shadow-sm rounded-4 text-center p-3">
        <h5 className="mb-1">Completed Events</h5>
        <h3 className="fw-bold">{rowValues?.eventStats?.completed || 0}</h3>
      </Card>
    </Col>
    <Col md={3}>
      <Card className="border-0 shadow-sm rounded-4 text-center p-3">
        <h5 className="mb-1">Average Time per Event</h5>
        <h3 className="fw-bold">{rowValues?.eventStats?.avgTimeMinutes || 0} minutes</h3>
      </Card>
    </Col>
    <Col md={3}>
      <Card className="border-0 shadow-sm rounded-4 text-center p-3">
        <h5 className="mb-1">Completion Rate</h5>
        <h3 className="fw-bold">{rowValues?.eventStats?.completionRate || 0}%</h3>
      </Card>
    </Col>
  </Row> */}
 
                      <h5 className="fw-bold mb-2">Event Scenarios</h5>
                     
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
  <Card.Body>
    <Table className="table text-nowrap" responsive hover>
      <thead className="table-info">
        <tr>
          <th scope="col">Scenario Title</th>
          <th scope="col">Total Events</th>
          <th scope="col">Completed Events</th>
        </tr>
      </thead>
      <tbody>
        {rowValues?.eventScenarioSummary?.map((item, idx) => (
          <tr key={idx}>
            <td scope="row">{item.scenario}</td>
            <td>{item.total_events}</td>
            <td>{item.completed_events}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </Card.Body>
</Card>
 
 
 
                      <h5 className="fw-bold mb-2">Event Records</h5>
                      <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body>
                          <Table  responsive hover>
                            <thead className="table-info">
                              <tr>
                                <th>Event Name</th>
                                <th>Team Name</th>
                                <th>Scenario Title</th>
 
                                <th>User Status</th>
                                <th>Timer</th>
                                <th>Start Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rowValues?.events?.map((event, idx) => (
                                <tr key={idx}>
                                  <td>{event.eventname}</td>
                                  <td>{event.team_name}</td>
                                  <td>{event.scenariotitle}</td>
 
                                  <td>
                                    <span className={`badge bg-${event.learner_status === 'Completed' ? 'success' : event.learner_status === 'Failed' ? 'danger' : 'secondary'}`}>
                                      {event.learner_status}
                                    </span>
                                  </td>
                                  <td>{event.timer || '-'}</td>
                                  <td>{event.startedon ? new Date(event.startedon).toLocaleString() : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
 
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

NormalUsersView.layout = "Contentlayout";
export default NormalUsersView;
