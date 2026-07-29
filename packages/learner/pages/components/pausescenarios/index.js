import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { getScenariosPauseList } from "../../../shared/redux/slices/scenarios/scenarios";
import Seo from "../../../shared/layout-components/seo/seo";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";

const PauseScenarios = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const { push } = useRouter();

  const { hasGetScenariospauseListData, viewNameResp, getUserDataFromLocal } =
    useSelector((state) => {
      return {
        hasGetScenariospauseListData:
          state &&
          state.scenarios &&
          state.scenarios.getScenariospauseListData.data,
        getUserDataFromLocal:
          state && state.localData && state.localData.getLocalData,
        viewNameResp:
          state && state.customScenario && state.customScenario.viewNameResp,
      };
    });
  useEffect(() => {
    if (hasGetScenariospauseListData) {
      const normalized = hasGetScenariospauseListData.map((item) => ({
        ...item,
        scenariotitle: item.scenario_name || "", // frontend expects this
        scenarioidentification: item.scenarioid?.toString() || "", // optional
        scenariolevel: "",
        duration: "",
        instructor_name: "",
        scenariocategory: "",
        scenariosubcategory: "",
        scenarioimage: item.scenarioimage || "",
      }));
      setRowData(normalized);
      setGridData(normalized);
    }
  }, [hasGetScenariospauseListData]);

  useEffect(() => {
    dispatch(getScenariosPauseList());
  }, [dispatch]);

  useEffect(() => {
    if (viewNameResp) {
      setView(viewNameResp);
    }
  }, [viewNameResp]);
  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  const [userType, setUserType] = useState("");

  useEffect(() => {
    if (getUserDataFromLocal) {
      try {
        if (getUserDataFromLocal?.usertype) {
          setUserType(getUserDataFromLocal.usertype);
        }
      } catch (error) {
        console.error("Error retrieving user data:", error);
      }
    }
  }, [getUserDataFromLocal]);

  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const colarray = [6, 4, 3, 2];
  const zoomIn = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex > 0) {
      setColumnsPerRow(colarray[currentIndex - 1]);
    }
  };
  const zoomOut = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex < colarray.length - 1) {
      setColumnsPerRow(colarray[currentIndex + 1]);
    }
  };

  return (
    <>
      <Seo title="Pause Scenarios" />
      <ToastContainer />
      <Row className="row-sm">
        {view != "Form" && (
          <Col md={12}>
            <Card className="custom-card overflow-hidden">
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Pause Scenarios</h5>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <Button
                            type="button"
                            variant="outline-primary"
                            onClick={zoomOut}
                            className="text-success mx-1"
                            title="Zoom In"
                          >
                            <i className="fas fa-search-plus"></i>
                          </Button>
                          <Button
                            type="button"
                            variant="outline-primary"
                            onClick={zoomIn}
                            className="text-success"
                            title="Zoom Out"
                          >
                            <i className="fas fa-search-minus"></i>
                          </Button>
                          &nbsp;
                        </>
                      )}
                      <Button
                        type="button"
                        title="Card View"
                        variant="outline-success"
                        onClick={() => { }}
                        className={
                          view === "card" ? "mx-1 active text-white" : "mx-1"
                        }
                      >
                        <i className="fe fe-grid"></i>
                      </Button>
                      &nbsp;
                    </div>
                  </div>
                </Col>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={12}>
          {view === "card" ? (
            <>
              {gridData && gridData.length > 0 ? (
                <Row className="g-3 mb-3">
                  {gridData.map((item, index) => (

                    <Col key={index} md={12 / columnsPerRow}>
                      <Card
                        className={`card custom-card our-team h-100 custom-scenario-card ${item.scenariostatus === "Publish"
                          ? "shadow-publish"
                          : item.scenariostatus === "Draft"
                            ? "shadow-draft"
                            : ""
                          }`}
                      >
                        {/* Status Pill */}
                        {item.status && (
                          <span
                            className={`badge rounded-pill position-absolute top-0 end-0 m-2
      ${item.status === "Running"
                                ? "bg-success"
                                : item.status === "Pause"
                                  ? "bg-warning text-dark"
                                  : "bg-secondary"
                              }`}
                            style={{ fontSize: "12px" }}
                          >
                            {item.status}
                          </span>
                        )}

                        <Card.Body className="p-3 position-relative d-flex flex-column  text-center">
                          <div className="mb-3">
                            {/* Scenario Title */}
                            <div
                              className="rounded-circle mx-auto d-flex justify-content-center align-items-center "
                              style={{
                                width: "100px",
                                height: "100px",
                              }}
                            >
                              <img
                                alt="avatar"
                                src={
                                  item?.scenarioimage
                                    ? `${process.env.API_URL_FILEMANAGER}${item.scenarioimage}`
                                    : dummy_network.src
                                }
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = dummy_network.src;
                                }}
                              />
                            </div>

                            <h5 className="text-dark mt-2 mb-1 fs-5 pointer">
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>{item.scenario_name}</Tooltip>
                                }
                              >
                                <span
                                  className="d-inline-block text-truncate w-100"
                                  style={{ maxWidth: "100%" }}
                                >
                                  {item.scenariotitle?.length > 30
                                    ? `${item.scenariotitle.substring(
                                      0,
                                      27
                                    )}...`
                                    : item.scenariotitle}
                                </span>
                              </OverlayTrigger>
                            </h5>
                          </div>
                          {/* Second row for actions */}
                          <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                            <div
                              className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                              onClick={() => {
                                push({
                                  pathname: `/scenarios_view/${item?.scenariouuid}`,
                                  query: { from: "pause" },
                                });
                              }}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>View</Tooltip>}
                              >
                                <i className="fe fe-eye"></i>
                              </OverlayTrigger>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Row>
                  <Col sm={12}>
                    <Card className="custom-card">
                      <Card.Body className="overflow-auto pd-t-10">
                        <Row className="text-center" style={{ height: "70vh" }}>
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center mt-5">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150 mt-5"
                                  />
                                  <h5 className="mt-4">No data found.</h5>
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
            </>
          ) : (
            ""
          )}
        </Col>
      </Row>
    </>
  );
};
PauseScenarios.layout = "Contentlayout";
export default PauseScenarios;
