import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Row, Col, Card, Badge } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  getDashboardListData,
  handleManageView,
} from "../../../shared/redux/slices/Dashboard/dashboardManage";
import { useRouter } from "next/router";
import Seo from "../../../shared/layout-components/seo/seo";
import LicenseExpiryPopup from "../../../shared/data/admin/modals/licenseExpiryPopup";

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({
  title,
  value,
  helper,
  icon,
  tone = "primary",
  onClick,
  accent,
  stagger = 0,
}) => (
  // <Card
  //   className={`dashboard-stat-card dashboard-tone-${tone} dashboard-animate-card ${onClick ? "is-clickable" : ""}`}
  //   onClick={onClick}
  //   style={{ animationDelay: `${stagger}ms` }}
  // >
  <Card
  className={`dashboard-stat-card dashboard-tone-${tone} dashboard-animate-card ${onClick ? "is-clickable" : ""}`}
  onClick={onClick}
  style={{ animationDelay: `${stagger}ms`, "--stat-delay": `${stagger}ms` }}
>
    <Card.Body>
      <div className="dashboard-stat-top">
        <div>
          <p className="dashboard-stat-label">{title}</p>
          <h2 className="dashboard-stat-value">{value}</h2>
        </div>
        <div className="dashboard-stat-icon" aria-hidden="true">
          <i className={icon}></i>
        </div>
      </div>
      <div className="dashboard-stat-footer">
        <span>{helper}</span>
        {accent ? <strong>{accent}</strong> : null}
      </div>
    </Card.Body>
  </Card>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [userType, setUserType] = useState("");
  const [showLicensePopup, setShowLicensePopup] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState({
    daysLeft: null,
    expiryDate: "",
    companyName: "",
  });

  const { geDashboardListData, getUserDataFromLocal } = useSelector((state) => ({
    geDashboardListData: state?.dashboarData?.getDashboardData?.data,
    getUserDataFromLocal: state?.localData?.getLocalData,
  }));

  const rowData = geDashboardListData || {};
  const webBrowserWidgets = rowData?.webBrowserWidgets || [];

  useEffect(() => {
    if (getUserDataFromLocal?.usertype) {
      setUserType(getUserDataFromLocal.usertype);
    }
  }, [getUserDataFromLocal]);

  useEffect(() => {
    dispatch(getDashboardListData());
    checkLicenseAndShowPopup();
  }, [dispatch]);

  const checkLicenseAndShowPopup = () => {
    const isLicenseExpiryFlag = localStorage.getItem("is_license_expiry") === "true";
    const storedSettings = localStorage.getItem("company_settings");
    if (!storedSettings) return;

    try {
      const parsedSettings = JSON.parse(storedSettings);
      const licenseData = parsedSettings?.data?.licenseStatus
        ? parsedSettings.data
        : parsedSettings?.licenseStatus
          ? parsedSettings
          : parsedSettings?.statusCode === 200 && parsedSettings?.data
            ? parsedSettings.data
            : null;

      if (licenseData?.licenseStatus?.expiry_date) {
        const expiryDate = new Date(licenseData.licenseStatus.expiry_date);
        const currentDate = new Date();
        const expiryUTC = Date.UTC(
          expiryDate.getUTCFullYear(),
          expiryDate.getUTCMonth(),
          expiryDate.getUTCDate(),
        );
        const currentUTC = Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
        );
        const daysLeft = Math.ceil((expiryUTC - currentUTC) / (1000 * 3600 * 24));

        const formatDateDDMMYYYY = (dateObj) => {
          const day = String(dateObj.getUTCDate()).padStart(2, "0");
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
          const year = dateObj.getUTCFullYear();
          return `${day}-${month}-${year}`;
        };

        if (daysLeft <= 30 && isLicenseExpiryFlag) {
          setLicenseInfo({
            daysLeft,
            expiryDate: formatDateDDMMYYYY(expiryDate),
            companyName: licenseData.name || "Your Company",
          });
          setShowLicensePopup(true);
        }
      }
    } catch (err) {
      console.error("Error checking license expiry:", err);
    }
  };

  const handleLicensePopupClose = () => {
    setShowLicensePopup(false);
    localStorage.setItem("is_license_expiry", "false");
  };

  const handleCardClick = (viewName) => {
    dispatch(handleManageView(viewName));
    const routeMap = {
      adminuser: "/adminusers",
      instructor: "/instructors",
      learner: "/normalusers",
      component: "/components",
      network: "/network",
      scenario: "/scenarios",
      event: "/events",
      usersession: "/user-sessions",
      labs: "/labs",
    };

    const route = routeMap[viewName];
    if (route) {
      router.push(route);
    }
  };

  const scenarioCountTotal =
    rowData?.scenarioCounts?.reduce((acc, curr) => acc + Number(curr?.total_scenarios || 0), 0) ?? 0;
  const scenarioPublishedTotal =
    rowData?.scenarioCounts?.reduce((acc, curr) => acc + Number(curr?.published_scenarios || 0), 0) ?? 0;
  const runningSessionTotal = Number(rowData?.sessionStats?.running_sessions || 0);
  const vmTotals = rowData?.vmStatsTotals || [];

  const cards = [
    {
      title: "Total SIMUser",
      value: rowData?.learnerCounts?.totalaccounts || 0,
      helper: `${rowData?.learnerCounts?.active_verified_accounts || 0} active & verified`,
      icon: "mdi mdi-account-multiple",
      tone: "primary",
      onClick: () => handleCardClick("learner"),
    },
    ...(userType !== "Instructor"
      ? [
          {
            title: "Total SIMManager",
            value: rowData?.instructorCounts?.total_instructors || 0,
            helper: `${rowData?.instructorCounts?.active_verified_instructors || 0} active & verified`,
            icon: "mdi mdi-account-multiple",
            tone: "warning",
            onClick: () => handleCardClick("instructor"),
          },
          {
            title: "Total SIMMaster",
            value: rowData?.adminStats?.total_admins || 0,
            helper: `${rowData?.adminStats?.active_admins || 0} active admins`,
            icon: "mdi mdi-account-multiple",
            tone: "danger",
            onClick: () => handleCardClick("adminuser"),
          },
        ]
      : []),
    {
      title: "Total Event Count",
      value: rowData?.eventStats?.total_events || 0,
      helper: `${rowData?.eventStats?.completed_events || 0} completed`,
      icon: "fa fa-calendar",
      tone: "warning",
      onClick: () => handleCardClick("event"),
    },
    {
      title: "Total Component",
      value: rowData?.componentStats?.total_components || 0,
      helper: `${rowData?.componentStats?.active_components || 0} active components`,
      icon: "fa fa-cubes",
      tone: "success",
      onClick: () => handleCardClick("component"),
    },
    {
      title: "Total Network",
      value: rowData?.networkStats?.total_networks || 0,
      helper: `${rowData?.networkStats?.available_networks || 0} available networks`,
      icon: "fa fa-podcast",
      tone: "info",
      onClick: () => handleCardClick("network"),
    },
    {
      title: "Total Scenarios",
      value: scenarioCountTotal,
      helper: `${scenarioPublishedTotal} published scenarios`,
      icon: "fa fa-cube",
      tone: "primary",
      onClick: () => handleCardClick("scenario"),
    },
    {
      title: "Running User Sessions",
      value: runningSessionTotal,
      helper: `${Number(rowData?.sessionStats?.pause_resume_count || 0)} lifecycle events`,
      icon: "fa fa-server",
      tone: "warning",
      onClick: () => handleCardClick("usersession"),
    },
    {
      title: "Scenario Exports",
      value: rowData?.scenarioExportStats?.total_exports || 0,
      helper: `${rowData?.scenarioExportStats?.completed_exports || 0} completed`,
      icon: "fa fa-file-archive-o",
      tone: "success",
      onClick: () => handleCardClick("scenario"),
      accent: `${rowData?.scenarioExportStats?.running_exports || 0} in progress`,
    },
    {
      title: "Lab Sessions",
      value: rowData?.labSessionStats?.total_labs || 0,
      helper: `${rowData?.labSessionStats?.active_labs || 0} active`,
      icon: "fa fa-flask",
      tone: "danger",
      onClick: () => handleCardClick("labs"),
      accent: `${rowData?.labSessionStats?.inactive_labs || 0} inactive`,
    },
  ];

  const featured = cards.slice(0, 3);
  const secondary = cards.slice(3, 6);
  const tertiary = cards.slice(6);

  return (
    <>
      <Seo title="Dashboard" />
      {showLicensePopup && (
        <LicenseExpiryPopup
          show={showLicensePopup}
          onClose={handleLicensePopupClose}
          licenseInfo={licenseInfo}
        />
      )}

      <Container fluid className="dashboard-shell">
        <div className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <Badge className="dashboard-hero-badge">Operations overview</Badge>
            <h1>Dashboard</h1>
            <p>
              A cleaner command center for learners, scenarios, exports, labs, and the infrastructure behind them.
            </p>
          </div>
          <div className="dashboard-hero-metrics">
            <div><span>Scenarios</span><strong>{scenarioCountTotal}</strong></div>
            <div><span>Components</span><strong>{rowData?.componentStats?.total_components || 0}</strong></div>
            <div><span>Labs</span><strong>{rowData?.labSessionStats?.total_labs || 0}</strong></div>
          </div>
        </div>

        <Row className="g-4 gy-2 dashboard-grid">

           {featured.map((card, index) => (
            <Col key={card.title} md={4} sm={12} className="d-flex">
              <StatCard {...card} stagger={180 + index * 70} />
            </Col>
          ))}


          {secondary.map((card, index) => (
            <Col key={card.title} md={4} sm={12} className="d-flex">
              <StatCard {...card} stagger={180 + index * 70} />
            </Col>
          ))}

          {tertiary.map((card, index) => (
            <Col key={card.title} md={6} sm={12} className="d-flex">
              <StatCard {...card} stagger={360 + index * 70} />
            </Col>
          ))}

          <Col md={12}>
            <Card className="dashboard-panel dashboard-vm-panel dashboard-animate-card">
              <Card.Body>
                <div className="dashboard-panel-heading">
                  <div>
                    <p className="dashboard-panel-kicker">System capacity</p>
                    <h3>Virtual resources</h3>
                  </div>
                  <Badge bg="light" text="dark" className="dashboard-chip">
                    Live totals
                  </Badge>
                </div>
                <Row className="g-3">
                  <Col xl={4} lg={4} sm={12}>
                    <div className="dashboard-metric-block">
                      <span>Total Virtual CPU</span>
                      <strong>{vmTotals.reduce((acc, curr) => acc + Number(curr.total_cores || 0), 0)}</strong>
                      <small>{vmTotals?.[0]?.status || "N/A"}</small>
                    </div>
                  </Col>
                  <Col xl={4} lg={4} sm={12}>
                    <div className="dashboard-metric-block">
                      <span>Total Virtual Memory</span>
                      <strong>{vmTotals.reduce((acc, curr) => acc + Number(curr.total_memory || 0), 0)}</strong>
                      <small>{vmTotals?.[0]?.status || "N/A"}</small>
                    </div>
                  </Col>
                  <Col xl={4} lg={4} sm={12}>
                    <div className="dashboard-metric-block">
                      <span>Total Storage Size</span>
                      <strong>{vmTotals.reduce((acc, curr) => acc + Number(curr.total_storage || 0), 0)}</strong>
                      <small>{vmTotals?.[0]?.status || "N/A"}</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col md={12}>
            <div className="dashboard-section-header mt-3">
              <div>
                <h3>Web widgets</h3>
              </div>
            </div>
          </Col>

          {webBrowserWidgets.length > 0 ? (
            webBrowserWidgets.map((widget, index) => (
              <Col key={widget.webbrowserwidgetid} md={12} className="d-flex">
                <Card
                  className="dashboard-panel dashboard-widget-panel dashboard-animate-card w-100"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <Card.Body>
                    <div className="dashboard-widget-head">
                      <div>
                        <p className="dashboard-panel-kicker"></p>
                        <h4 title={widget.widget_name}>{widget.widget_name}</h4>
                      </div>
                    </div>
                    <div className="dashboard-iframe-wrap">
                      <iframe
                        src={widget.widget_url.startsWith("http") ? widget.widget_url : `https://${widget.widget_url}`}
                        title={widget.widget_name}
                        className="w-100 h-100 border-0"
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col md={12}>
              <Card className="dashboard-panel dashboard-empty-panel w-100">
                <Card.Body>No active widgets are configured yet.</Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </Container>
    </>
  );
};

Dashboard.layout = "Contentlayout";
export default Dashboard;
