import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Tab, Nav } from "react-bootstrap";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import {
  getSingleScenarios,
  clearSingleScenarios,
} from "../../../../shared/redux/slices/scenario/scenarioManage";
import Seo from "../../../../shared/layout-components/seo/seo";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import ScenarioDiagram from "./scenariodiagram";
import {
  cleargetScenarioFlow,
  clearsaveScenarioFlow,
} from "../../../../shared/redux/slices/common/masters";
import { toast, ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";

const PdfLoader = dynamic(
  () => import("../../../../shared/data/common/PdfLoader"),
  { ssr: false, loading: () => <p>Loading PDF viewer...</p> }
);

const ScenarioView = () => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const { t } = useTranslation();
  const [rowId, setRowId] = useState("");
  const [rowValues, setRowValues] = useState({});
  const [activeTab, setActiveTab] = useState("description");
  const backTo = query && query.backView;
  const tab = query && query.tab;

  useEffect(() => {
    if (tab === "diagram") {
      setActiveTab("diagram");
    }
  }, [tab]);

  const { hasGetSingleScenariosSucc } = useSelector((state) => {
    return {
      hasGetSingleScenariosSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.singleScenarios &&
        state.scenarioManage.singleScenarios.data,
    };
  });
  useEffect(() => {
    if (hasGetSingleScenariosSucc && hasGetSingleScenariosSucc !== "") {
      setRowValues(hasGetSingleScenariosSucc);
    }
  }, [hasGetSingleScenariosSucc]);
  useEffect(() => {
    if (query.slug) {
      setRowId(query.slug[0]);
      dispatch(getSingleScenarios(query.slug[0]));
      //  dispatch(getSingleScenarios(query.slug[0]));
    }
  }, [query.slug]);

  console.log("rowValues", rowValues);
  console.log("rowId", rowId);
  const baseUrl = process.env.API_URL_FILEMANAGER;
  const pdfUrl = rowValues?.instruction_file
    ? `${baseUrl}${rowValues.instruction_file}`
    : null;

  return (
    <>
      <Seo title="Scenario" />
      <ToastContainer />
      <Row className="view-component-row-sm">
        {/* Scenario Details Card */}
        <Col md={12}>
          <Card className="view-component-card overflow-hidden mb-3">
            <Card.Body className="p-3">
              <Row className="view-component-row-sm">
                <Col md={12}>
                  <div className="d-flex justify-content-between view-component-mb-4">
                    <h4 className="view-component-card-header">
                      View Scenario
                    </h4>
                    <div>
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          push(`/scenarios?view=${backTo || "list"}`);
                          dispatch(clearSingleScenarios());
                          dispatch(cleargetScenarioFlow());
                        }}
                      >
                        <i className="fe fe-arrow-left"></i>&nbsp;
                        {t("")}
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Scenario Details */}
              <Card className="bg-white shadow-sm rounded-4 border-0 mb-4">
                <Card.Body className="p-4">
                  <Row className="gy-4">
                    {/* Identification Number and Scenario Title in One Row */}
                    <Col md={3}>
                      <div className="d-flex align-items-start gap-3">
                        <i className="fe fe-hash text-info fs-4 mt-1"></i>
                        <div>
                          <div className="fw-semibold text-dark mb-1">
                            {rowValues?.scenarioidentification || "—"}
                          </div>
                          <small className="text-muted">
                            Identification Number
                          </small>
                        </div>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="d-flex align-items-start gap-3">
                        <i className="fe fe-edit text-primary fs-4 mt-1"></i>
                        <div>
                          <div className="fw-semibold text-dark mb-1">
                            {rowValues?.scenariotitle || "—"}
                          </div>
                          <small className="text-muted">Scenario Title</small>
                        </div>
                      </div>
                    </Col>

                    {/* Level to Description in One Row */}

                    <Col md={3}>
                      <div className="d-flex align-items-start gap-3">
                        <i className="fe fe-bar-chart text-warning fs-4 mt-1"></i>
                        <div>
                          <div className="fw-semibold text-dark mb-1">
                            {rowValues?.scenariolevel || "—"}
                          </div>
                          <small className="text-muted">Level</small>
                        </div>
                      </div>
                    </Col>

                    <Col md={3}>
                      <div className="d-flex align-items-start gap-3">
                        <i className="fe fe-layers text-success fs-4 mt-1"></i>
                        <div>
                          <div className="fw-semibold text-dark mb-1">
                            {rowValues?.scenariocategory || "—"}
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
                            {rowValues?.scenariosubcategory || "—"}
                          </div>
                          <small className="text-muted">
                            Scenario Subcategory
                          </small>
                        </div>
                      </div>
                    </Col>
                    {/* Instruction Name and Duration in One Row */}
                    <Col md={3}>
                      <div className="d-flex align-items-start gap-3">
                        <i className="fe fe-user text-dark fs-4 mt-1"></i>
                        <div>
                          <div className="fw-semibold text-dark mb-1">
                            {rowValues?.instructor_name || "—"}
                          </div>
                          <small className="text-muted">SIMManager Name</small>
                        </div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="d-flex align-items-start gap-3">
                        <i className="fe fe-clock text-danger fs-4 mt-1"></i>
                        <div>
                          <div className="fw-semibold text-dark mb-1">
                            {rowValues?.duration
                              ? `${rowValues.duration} Mins`
                              : "0 mins"}
                          </div>
                          <small className="text-muted">
                            Duration<small>(In Minutes)</small>
                          </small>
                        </div>
                      </div>
                    </Col>
                    {/* Total VM */}
                    <Col md={3}>
                      <div className="d-flex align-items-start gap-3">
                        <i className="fe fe-server text-secondary fs-4 mt-1"></i>
                        <div>
                          <div className="fw-semibold text-dark mb-1">
                            {rowValues?.component_count}
                          </div>
                          <small className="text-muted">Total VM</small>
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
                          <small className="text-muted">Virtual CPU</small>
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
                          <small className="text-muted">Virtual Memory</small>
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
                          <small className="text-muted">Storage Size</small>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
        {/* for descriptio  new tab */}
        <Col md={12}>
          <Card className="bg-white shadow-sm rounded-4 border-0 mb-4">
            <Card.Body>
              <Row className="mg-b-10 text-wrap">
                <div className="panel panel-primary tabs-style-2 w-100">
                  <div className="tab-menu-heading">
                    <div className="tabs-menu">
                      <Tab.Container id="scenario-tabs" activeKey={activeTab}>
                        <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                          {/* Tabs: Description, Instruction, Diagram */}
                          <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white w-100">
                            <Nav.Item
                              onClick={() => setActiveTab("description")}
                              style={{ width: "33.33%" }}
                            >
                              <Nav.Link
                                eventKey="description"
                                className="masterlist"
                                style={{
                                  color:
                                    activeTab === "description"
                                      ? "#007bff"
                                      : "gray",
                                  fontWeight:
                                    activeTab === "description"
                                      ? "bold"
                                      : "normal",
                                }}
                              >
                                Description
                              </Nav.Link>
                            </Nav.Item>
                            <Nav.Item
                              onClick={() => setActiveTab("instruction")}
                              style={{ width: "33.33%" }}
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
                              style={{ width: "33.33%" }}
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
                          </Nav>
                        </Row>

                        {/* Tab content */}
                        <Row>
                          <Col md={12} className="pt-3">
                            <Tab.Content>
                              <Tab.Pane eventKey="description">
                                <div className="d-flex align-items-start gap-3">
                                  <i className="fe fe-file-text text-dark fs-4 mt-1"></i>
                                  <div>
                                    <label className="text-muted fw-semibold mb-2 d-block">
                                      Description
                                    </label>
                                    <div
                                      className="fw-medium text-dark"
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          rowValues?.scenariodescription || "—",
                                      }}
                                    />
                                  </div>
                                </div>
                              </Tab.Pane>

                              <Tab.Pane eventKey="instruction">
                                {pdfUrl ? (
                                  <PdfLoader fileUrl={pdfUrl} />
                                ) : (
                                  <p className="text-muted">
                                    No instruction PDF provided.
                                  </p>
                                )}
                              </Tab.Pane>

                              <Tab.Pane eventKey="diagram">
                                {/* <Col md={12}> */}
                                {/* <div className="d-flex justify-content-between align-items-center"> */}
                                {/* <h5 className="fw-semibold mb-3 text-dark">Diagram</h5> */}
                                {/* </div> */}
                                {/* </Col> */}
                                <ScenarioDiagram
                                  scenarioId={rowId}
                                  rowValues={rowValues}
                                  // scenariodiagram={
                                  //     rowValues?.scenariodiagram &&
                                  //         rowValues.scenariodiagram.trim() !== ''
                                  //         ? rowValues.scenariodiagram
                                  //         : ''
                                  // }
                                  scenariodiagram={
                                    rowValues?.scenariodiagram?.trim() ?? ""
                                  }
                                />
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
    </>
  );
};
ScenarioView.layout = "Contentlayout";
export default ScenarioView;
