import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import {
  Container,
  Row,
  Col,
  Card,
  Nav,
  Tab,
  Badge,
  Pagination,
  Accordion,
} from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import { getInstructor } from "../../../../shared/redux/slices/instructor/instructor";

const InstructorView = () => {
  const dispatch = useDispatch();
  const { query } = useRouter();
  const [rowId, setRowId] = useState("");
  const [rowValues, setRowValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { hasgetInstructorInfoSucc } = useSelector((state) => ({
    hasgetInstructorInfoSucc: state?.InstructorData?.getInstructorData?.data,
  }));

  useEffect(() => {
    if (hasgetInstructorInfoSucc) {
      setRowValues(hasgetInstructorInfoSucc);
    }
  }, [hasgetInstructorInfoSucc]);

  useEffect(() => {
    if (query.slug) {
      setRowId(query.slug[0]);
      dispatch(getInstructor(query.slug[0]));
    }
  }, [query.slug, dispatch]);

  const students = rowValues.instructor_student_map || [];
  const scenarios = rowValues.scenarios || [];

  return (
    <>
      <Seo title="Instructor" />
      <ToastContainer />
      <Container className="py-4">
        <h4 className="fw-bold mb-4">
          <i className="fe fe-user me-2"></i>Instructor Details
        </h4>

        {/* Instructor Header */}
        <div className="d-flex align-items-center mb-4 bg-light p-3 rounded-3 shadow-sm">
          <div className="me-3">
            <i className="bi bi-person-circle fs-1 text-primary"></i>
          </div>
          <div>
            <h5 className="mb-1">{rowValues.Instructor_name || ""}</h5>
            <small className="text-muted d-block">
              <i className="bi bi-envelope me-1"></i> {rowValues.email || ""}
            </small>
          </div>
        </div>

        {/* Summary Cards */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="text-center">
                <i className="bi bi-people fs-2 text-primary mb-2"></i>
                <h5 className="fw-bold">{rowValues.mapped_student_count || 0}</h5>
                <div className="text-muted">Students Mapped</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="text-center">
                <i className="bi bi-file-earmark-text fs-2 text-info mb-2"></i>
                <h5 className="fw-bold">{rowValues.totalscenariocount || 0}</h5>
                <div className="text-muted">Scenarios Created</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs Section */}
        <Card className="shadow-sm border-0 rounded-4 mb-4">
          <Card.Body>
            <Tab.Container defaultActiveKey="details">
              <Nav variant="pills" className="mb-3">
                <Nav.Item>
                  <Nav.Link eventKey="details">Instructor Details</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="students">Students</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="scenarios">Scenarios</Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="details">
                  <Row>
                    <Col md={4}>
                      <Card className="border-0 shadow-sm rounded-4 p-3 h-100">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person fs-3 text-primary me-3"></i>
                          <div>
                            <div className="fw-bold">{rowValues.Instructor_name}</div>
                            <small className="text-muted">Instructor Name</small>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col md={8}>
                      <Row className="gy-3">
                        <Col sm={6}>
                          <Card className="border-0 shadow-sm rounded-4 p-3 h-100">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-envelope fs-3 text-primary me-3"></i>
                              <div>
                                <div className="fw-bold">{rowValues.email}</div>
                                <small className="text-muted">Email Address</small>
                              </div>
                            </div>
                          </Card>
                        </Col>
                        <Col sm={6}>
                          <Card className="border-0 shadow-sm rounded-4 p-3 h-100">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-telephone fs-3 text-success me-3"></i>
                              <div>
                                <div className="fw-bold">{rowValues.mobile || "N/A"}</div>
                                <small className="text-muted">Mobile Number</small>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey="students">
                  <h5 className="fw-bold mb-4">Mapped Students</h5>
                  <Row className="gy-4">
                    {students.map((student, idx) => {
                      const isActive = student.status === "Active";
                      return (
                        <Col md={6} lg={4} key={idx}>
                          <Card
                            className={`shadow-sm rounded-4 h-100 border-3 ${
                              isActive ? "border-success" : "border-danger"
                            }`}
                          >
                            <Card.Body className="d-flex flex-column align-items-start">
                              <div className="d-flex align-items-center mb-3">
                                <div
                                  className={`avatar bg-gradient-${
                                    isActive ? "success" : "danger"
                                  } text-white rounded-circle me-3`}
                                  style={{
                                    width: 48,
                                    height: 48,
                                    fontSize: "1.25rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {student.learner_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h6 className="fw-semibold mb-0">{student.learner_name}</h6>
                                  <small className="text-muted">{student.email}</small>
                                </div>
                              </div>
                              <div className="w-100 mt-auto small">
                                <div><strong>Mobile:</strong> {student.mobile || "N/A"}</div>
                                <div><strong>Learner ID:</strong> {student.learner_id}</div>
                                <div>
                                  <strong>Status:</strong>{" "}
                                  <Badge bg={isActive ? "success" : "danger"}>{student.status}</Badge>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                  <div className="d-flex justify-content-end mt-4">
                    <Pagination className="mb-0">
                      {[...Array(totalPages)].map((_, index) => (
                        <Pagination.Item
                          key={index + 1}
                          active={index + 1 === currentPage}
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </Pagination.Item>
                      ))}
                    </Pagination>
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="scenarios">
                  <h6 className="fw-bold mb-3">Scenarios Created</h6>
                  <Accordion defaultActiveKey="0">
                    {scenarios.map((scenario, index) => (
                      <Accordion.Item eventKey={index.toString()} key={index}>
                        <Accordion.Header>{scenario.scenariotitle}</Accordion.Header>
                        <Accordion.Body>
                          <p>
                            <strong>Created On:</strong>{" "}
                            {new Date(scenario.createdon).toLocaleString()}
                          </p>
                          <p>
                            <strong>Status:</strong>{" "}
                            <Badge bg={scenario.status?.toLowerCase() === "active" ? "success" : "secondary"}>{scenario.status}</Badge>
                          </p>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

InstructorView.layout = "Contentlayout";
export default InstructorView;


