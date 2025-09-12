import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  getDashboardListData,
  handleManageView,
} from "../../../shared/redux/slices/Dashboard/dashboardManage";
import { useRouter } from "next/router";
import Seo from "../../../shared/layout-components/seo/seo";

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [userType, setUserType] = useState("");
  const {
    geDashboardListData,
    getUserDataFromLocal,
    hasHandleManageSuc,
  } = useSelector((state) => ({
    geDashboardListData: state?.dashboarData?.getDashboardData?.data,
    hasHandleManageSuc: state?.dashboarData?.viewNameResp,
    getUserDataFromLocal:
      state && state.localData && state.localData.getLocalData,
  }));

  const {
    webBrowserWidgets = [],
  } = geDashboardListData || {};

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

  useEffect(() => {
    dispatch(getDashboardListData());
  }, [dispatch]);

  const handleCardClick = (viewName) => {
    dispatch(handleManageView(viewName)); // Store viewName in Redux

    // Redirect based on viewName
    const routeMap = {
      adminuser: "/adminusers",
      instructor: "/instructors",
      learner: "/normalusers",
      component: "/components",
      network: "/network",
      scenario: "/scenarios",
      event: "/events",
      usersession: "/user-sessions",
    };

    const route = routeMap[viewName];
    if (route) {
      router.push(route);
    }
  };

  const rowData = geDashboardListData || {};

  console.log("rowDatarowDatarowData", rowData)


  return (
    <>
      <Seo title="Dashboard" />

      <Container fluid>
        <Row className="g-4">
          <Col md={12}>
            <Row className="mb-2">
            </Row>
            <Row className="row-sm">
              <Col sm={12} md={6} lg={6} xl={userType === "Instructor" ? 4 : 3}>
                <Card className="custom-card" style={{ cursor: "pointer" }} onClick={() => handleCardClick("learner")}>
                  <Card.Body>
                    <div className="card-order">
                      <label className="main-content-label mb-3 pt-1">Total Users</label>
                      <h2 className="text-end card-item-icon card-icon">
                        <i className="mdi mdi-account-multiple float-start text-primary"></i>
                        <span className="font-weight-bold">
                          {rowData?.learnerCounts?.totalaccounts || 0}
                        </span>
                      </h2>
                      <p className="mb-0 text-success">
                        Active & Verified<span className="float-end">
                          {rowData?.learnerCounts?.active_verified_accounts || 0}
                        </span>
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              {/* <!-- COL END --> */}

              {userType !== "Instructor" ? (
                <>
                  {/* Instructor Card */}
                  <Col sm={12} md={6} lg={6} xl={3}>
                    <Card
                      className="custom-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCardClick("instructor")}
                    >
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Instructors
                          </label>
                          <h2 className="text-end">
                            <i className="mdi mdi-account-multiple float-start text-warning"></i>
                            <span className="font-weight-bold">
                              {rowData?.instructorCounts?.total_instructors ||
                                0}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Active & Verified<span className="float-end">
                              {rowData?.instructorCounts
                                ?.active_verified_instructors || 0}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Admin Card */}
                  <Col sm={12} md={6} lg={6} xl={3}>
                    <Card
                      className="custom-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCardClick("adminuser")}
                    >
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Admin Users
                          </label>
                          <h2 className="text-end">
                            <i className="mdi mdi-account-multiple float-start text-danger"></i>
                            <span className="font-weight-bold">
                              {rowData?.adminStats?.total_admins || 0}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Active<span className="float-end">
                              {rowData?.adminStats?.active_admins || 0}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Event Count  */}

                  <Col sm={12} md={6} lg={6} xl={3}>
                    <Card
                      className="custom-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCardClick("event")}
                    >
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Event Count
                          </label>
                          <h2 className="text-end">
                            <i className="ti ti-dropbox float-start text-secondary"></i>
                            <span className="font-weight-bold">
                              {rowData?.eventStats?.total_events || 0}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Completed <span className="float-end">
                              {rowData?.eventStats?.completed_events || 0}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Extra Admin-Specific Cards */}

                  {/* 1. Total Component Count */}
                  <Col sm={12} md={6} lg={6} xl={3}>
                    <Card
                      className="custom-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCardClick("component")}
                    >
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Component
                          </label>
                          <h2 className="text-end">
                            <i className="fa fa-cubes float-start text-secondary"></i>
                            <span className="font-weight-bold">
                              {rowData?.componentStats?.total_components || 0}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Active LXC & QMU <span className="float-end">
                              {rowData?.componentStats?.active_components || 0}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* 2. Total Network Count */}
                  <Col sm={12} md={6} lg={6} xl={3}>
                    <Card
                      className="custom-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCardClick("network")}
                    >
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Network
                          </label>
                          <h2 className="text-end">
                            <i className="fa fa-podcast float-start text-primary"></i>
                            <span className="font-weight-bold">
                              {rowData?.networkStats?.total_networks || 0}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Available Network<span className="float-end">
                              {rowData?.networkStats?.available_networks || 0}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* 3. Total Published Scenarios */}
                  <Col sm={12} md={6} lg={6} xl={3}>
                    <Card
                      className="custom-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCardClick("scenario")}
                    >
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Scenario
                          </label>
                          <h2 className="text-end">
                            <i className="fa fa-cube float-start text-info"></i>
                            <span className="font-weight-bold">
                              {rowData?.scenarioCounts?.reduce(
                                (acc, curr) =>
                                  acc + Number(curr.total_scenarios || 0),
                                0
                              )}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Published<span className="float-end">
                              {rowData?.scenarioCounts?.reduce(
                                (acc, curr) =>
                                  acc + Number(curr.published_scenarios || 0),

                                0
                              )}


                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* 3. Total Running Scenarios */}
                  <Col sm={12} md={6} lg={6} xl={3}>
                    <Card className="custom-card" 
                
                     style={{ cursor: "pointer" }}
                      onClick={() => handleCardClick("usersession")}
                    >

                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Running User Session
                          </label>
                          <h2 className="text-end">
                            <i className="	fa fa-server float-start text-mute"></i>
                            <span className="font-weight-bold">
                              {Number(rowData?.sessionStats?.running_sessions || 0)}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Running <span className="float-end">
                              {Number(rowData?.sessionStats?.running_sessions || 0)}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  {/* three widge in row virtual cpu storage memory */}
                  <Col md={12}>
                    <Card className="custom-card p-0">
                      <Row className="g-0"> {/* removes all gutters between columns */}
                        {/* CPU */}
                        <Col xl={4} lg={4} sm={12} className="border-end">
                          <Card.Body className="d-flex flex-column justify-content-between h-100">
                            <label className="main-content-label mb-2 pt-1">TOTAL VIRTUAL CPU</label>
                            <h2 className="d-flex justify-content-between align-items-center">
                              <i className="fe fe-cpu text-danger"></i>
                              <span className="font-weight-bold">
                                {rowData?.vmStatsTotals?.reduce((acc, curr) => acc + Number(curr.total_cores || 0), 0)}
                              </span>
                            </h2>
                            <p className="mb-0 text-success d-flex justify-content-between">
                              <span>Status</span>
                              <span>{rowData?.vmStatsTotals?.[0]?.status || "N/A"}</span>
                            </p>
                          </Card.Body>
                        </Col>

                        {/* Memory */}
                        <Col xl={4} lg={4} sm={12} className="border-end">
                          <Card.Body className="d-flex flex-column justify-content-between h-100">
                            <label className="main-content-label mb-2 pt-1">TOTAL VIRTUAL MEMORY</label>
                            <h2 className="d-flex justify-content-between align-items-center">
                              <i className="fe fe-box text-warning"></i>
                              <span className="font-weight-bold">
                                {rowData?.vmStatsTotals?.reduce((acc, curr) => acc + Number(curr.total_memory || 0), 0)}
                              </span>
                            </h2>
                            <p className="mb-0 text-success d-flex justify-content-between">
                              <span>Status</span>
                              <span>{rowData?.vmStatsTotals?.[0]?.status || "N/A"}</span>
                            </p>
                          </Card.Body>
                        </Col>

                        {/* Storage */}
                        <Col xl={4} lg={4} sm={12}>
                          <Card.Body className="d-flex flex-column justify-content-between h-100">
                            <label className="main-content-label mb-2 pt-1">TOTAL STORAGE SIZE</label>
                            <h2 className="d-flex justify-content-between align-items-center">
                              <i className="fe fe-hard-drive text-success"></i>
                              <span className="font-weight-bold">
                                {rowData?.vmStatsTotals?.reduce((acc, curr) => acc + Number(curr.total_storage || 0), 0)}
                              </span>
                            </h2>
                            <p className="mb-0 text-success d-flex justify-content-between">
                              <span>Status</span>
                              <span>{rowData?.vmStatsTotals?.[0]?.status || "N/A"}</span>
                            </p>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  </Col>

                  {/* <Row className="row-sm"> */}
                  <Col md={12}>

                    {webBrowserWidgets?.length > 0 ? (
                      webBrowserWidgets.map((widget) => (
                        <Card key={widget.webbrowserwidgetid} className="mb-4 shadow-sm">
                          <Card.Body>
                            <h6
                              className="mb-3 text-truncate"
                              title={widget.widget_name}
                            >
                              {widget.widget_name}
                            </h6>

                            <div className="position-relative overflow-hidden border rounded" style={{ height: '300px' }}>
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
                      <p className="text-muted text-center"></p>
                    )}

                  </Col>
                  {/* </Row> */}


                </>
              ) : (
                <>
                  {/* Instructor-Specific: Total Scenarios Card */}
                  <Col sm={12} md={6} lg={6} xl={4}>
                    <Card className="custom-card">
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total Scenarios
                          </label>
                          <h2 className="text-end">
                            <i className="mdi mdi-file-document float-start text-info"></i>
                            <span className="font-weight-bold">
                              {rowData?.scenarioCounts?.reduce(
                                (acc, curr) =>
                                  acc + Number(curr.total_scenarios || 0),
                                0
                              )}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Published <span className="float-end">
                              {rowData?.scenarioCounts?.reduce(
                                (acc, curr) =>
                                  acc + Number(curr.published_scenarios || 0),
                                0
                              )}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Instructor-Specific: Total User Sessions Card */}
                  <Col sm={12} md={6} lg={6} xl={4}>
                    <Card className="custom-card">
                      <Card.Body>
                        <div className="card-widget">
                          <label className="main-content-label mb-3 pt-1">
                            Total User Sessions
                          </label>
                          <h2 className="text-end">
                            <i className="mdi mdi-timer-sand float-start text-dark"></i>
                            <span className="font-weight-bold">
                              {rowData?.runningSessions?.reduce(
                                (sum, s) =>
                                  sum + Number(s.running_sessions || 0),
                                0
                              )}
                            </span>
                          </h2>
                          <p className="mb-0 text-success">
                            Running <span className="float-end">
                              {rowData?.runningSessions?.reduce(
                                (sum, s) =>
                                  sum + Number(s.running_sessions || 0),
                                0
                              )}
                            </span>
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>


                  <Col md={12}>
                    {webBrowserWidgets?.length > 0 ? (
                      webBrowserWidgets.map((widget) => (
                        <Card key={widget.webbrowserwidgetid} className="mb-4 shadow-sm">
                          <Card.Body>
                            <h6 className="mb-3 text-truncate" title={widget.widget_name}>
                              {widget.widget_name}
                            </h6>

                            <div
                              className="position-relative overflow-hidden border rounded"
                              style={{ height: '300px' }}
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
                    ) : 
                    (
                      <p className="text-muted text-center"></p>
                    )
                    }
                  </Col>

                </>
              )}
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

Dashboard.layout = "Contentlayout";
export default Dashboard;
