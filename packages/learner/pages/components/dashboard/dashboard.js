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

import FirstLoginPasswordModal from '../../../shared/data/dashboard/FirstLoginPasswordModal';

const Dashboard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { hasGetStudentDashboardListSucc } = useSelector((state) => ({
    hasGetStudentDashboardListSucc:
      state?.dashboard?.getStudentDashboardData?.data,
  }));
  useEffect(() => {
    dispatch(getStudentDashboard());
  }, [dispatch]);

  const {
    currentScenario = {},
    dashboardProgress = {},
    widgets = [],
    webBrowserWidgets = [],
    upcomingScenarios = [],
    skillProficiency = [],
    recentActivity = [],
    weeklySessions =[],
  } = hasGetStudentDashboardListSucc || {};

  const widgetData = {
    completedScenarios: widgets.find((w) => w.title === "Completed Scenarios"),
    quizErrorRate: widgets.find((w) => w.title === "Quiz Score"),
    activeFailedSessions: widgets.find(
      (w) => w.title === "Active/Failed Sessions"
    ),
  };
  const progressPercentage = Math.min(
    100,
    Math.max(0, Number(dashboardProgress?.percentage) || 0)
  );
  const remainingScenarios = Number(dashboardProgress?.remaining) || 0;
  const hasCurrentScenario = Boolean(currentScenario?.scenarioid);
  const showFirstLoginModal =
    hasGetStudentDashboardListSucc?.is_password_reset === true ||
    String(hasGetStudentDashboardListSucc?.is_password_reset).toLowerCase() === 'true';
  const handleReturnView = (props) => {
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

  const currentScenarioStatus = currentScenario?.session_status || "";
  const normalizedScenarioStatus = currentScenarioStatus.toLowerCase();
  const isRunning = ["start", "resume", "running", "initializing"].includes(
    normalizedScenarioStatus
  );
  const isCurrentScenarioActive = isRunning || normalizedScenarioStatus === "pause";
  const scenarioStatusClass = ["failed", "terminated"].includes(normalizedScenarioStatus)
    ? "sc-running--danger"
    : normalizedScenarioStatus === "pause"
    ? "sc-running--warning"
    : "";

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
            <Container fluid className="dashboard-v3-wrap">
      <FirstLoginPasswordModal
        show={showFirstLoginModal}
        learnerName={hasGetStudentDashboardListSucc?.learner_firstname}
      />
{/* top section currect sceanrio  */}

  {/* Banner */}
  <div className="banner">
    <div className="ban-row">
      <div style={{ zIndex: 1 }}>
        <div className="ban-title">
          Welcome To siberSIM SIMUser Portal
        </div>

        <div className="ban-sub">
          You have {remainingScenarios} {remainingScenarios === 1 ? "scenario" : "scenarios"} to finish —
          <b> {progressPercentage}%</b> progress complete.
          Keep pushing to your next tier!
        </div>

        <div className="prog-wrap">
          <div className="prog-labels">
            <span className="prog-lbl">Overall progress</span>
            <span className="prog-val">{progressPercentage}%</span>
          </div>

          <div className="prog-track">
            <div
              className="prog-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="ban-badges">
        <div className="ban-badge">
          <div className="ban-badge-val">
            {widgetData?.completedScenarios?.value || 0}
          </div>
          <div className="ban-badge-lbl">Done</div>
        </div>

        <div className="ban-badge">
          <div className="ban-badge-val">
            {widgetData?.quizErrorRate?.value || "0/0"}
          </div>
          <div className="ban-badge-lbl">Score</div>
        </div>

        <div className="ban-badge">
          <div className="ban-badge-val">
            {widgetData?.activeFailedSessions?.value || 0}
          </div>
          <div className="ban-badge-lbl">Active</div>
        </div>
      </div>
    </div>
  </div>
  <div className="mid">

  {/* Current Scenario */}
  <div className={`sc-card ${isRunning ? "sc-card--running" : ""}`}>

<div className="sc-head">
  <div className="sc-head-left">
    <i className="ti ti-terminal-2"></i>

    <span className="sc-head-lbl">
      {hasCurrentScenario && !isCurrentScenarioActive
        ? "Latest Scenario"
        : "Current Scenario"}
    </span>
  </div>

  {hasCurrentScenario && (
    <div className={`sc-running ${scenarioStatusClass}`}>
      <div className="sc-dot"></div>

      <span>
        {["start", "resume", "running"].includes(
          normalizedScenarioStatus
        )
          ? "Running"
          : currentScenarioStatus === "Pause"
          ? "Paused"
          : currentScenarioStatus}
      </span>
    </div>
  )}
</div>

    <div className="sc-body">

      <div className="sc-top-row">

        <div>
          {hasCurrentScenario && <div className="sc-stars">
            {[0, 1, 2].map((i) => (
              <i
                key={i}
                className="ti ti-star-filled"
                style={{
                  color:
                    i <
                    (currentScenario?.scenariolevel === "Hard"
                      ? 3
                      : currentScenario?.scenariolevel === "Medium"
                      ? 2
                      : 1)
                      ? "#ef4444"
                      : "#1f2d45",
                }}
              />
            ))}
          </div>}

          <div className="sc-name">
              {hasCurrentScenario
                ? `${currentScenario?.scenariotitle} - ${currentScenario?.scenarioidentification}`
                : "No scenario in progress"}
          </div>
        </div>

        {hasCurrentScenario && <div className="timer-pill">
          <div className="timer-lbl">
            Elapsed Time
          </div>

          <div className="timer-val">
            {formatSecondsToTime(timerSeconds)}
          </div>
        </div>}
      </div>

      {/* Meta Grid */}
      {hasCurrentScenario && <div className="meta-grid">

        <div className="meta-cell">
          <div className="meta-key">
            Scenario ID
          </div>

          <div className="meta-val">
            {currentScenario?.scenarioidentification}
          </div>
        </div>

        <div className="meta-cell">
          <div className="meta-key">
            Duration
          </div>

          <div className="meta-val">
            {currentScenario?.duration} mins
          </div>
        </div>

        <div className="meta-cell">
          <div className="meta-key">
            Category
          </div>

          <div className="meta-val">
            {currentScenario?.scenariocategory_name}
          </div>
        </div>

        <div className="meta-cell">
          <div className="meta-key">
            Subcategory
          </div>

          <div className="meta-val">
            {currentScenario?.scenariosubcategory_name}
          </div>
        </div>

        <div className="meta-cell">
          <div className="meta-key">
            Virtual CPU
          </div>

          <div className="meta-val">
            {currentScenario?.virtual_cpu} Cores
          </div>
        </div>

        <div className="meta-cell">
          <div className="meta-key">
            Memory
          </div>

          <div className="meta-val">
            {currentScenario?.virtual_memory} M
          </div>
        </div>

        <div className="meta-cell">
          <div className="meta-key">
            Total VM
          </div>

          <div className="meta-val">
            {currentScenario?.component_count}
          </div>
        </div>

        <div className="meta-cell">
          <div className="meta-key">
            Storage
          </div>

          <div className="meta-val">
            {currentScenario?.storage_size} GB
          </div>
        </div>

      </div>}

      {hasCurrentScenario && (
        <button
          className="go-btn"
          onClick={() => handleReturnView(currentScenario)}
        >
          <i className="ti ti-arrow-right"></i>
          Go to Scenario
        </button>
      )}

    </div>
  </div>


  {/* RIGHT SIDE */}
  <div className="side">

    {/* Weekly Sessions */}
 {/* Weekly Sessions */}
<div className="side-card">
  <div className="mini-ttl">Weekly Sessions</div>

  <div className="bars">
    {weeklySessions.map((day, i) => {
      const maxTotal = Math.max(...weeklySessions.map(d => d.total), 1);
      const todayIndex = (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun
      // const barHeight = Math.round((day.total / maxTotal) * 65);
      const barHeight = day.total === 0 ? 4 : Math.round((day.total / maxTotal) * 65);

      return (
        <div className="bc" key={i}>
          <div
            className={`bb ${i > todayIndex ? "dim" : ""}`}
            style={{ height: `${barHeight}px` }}
            title={`${day.total} sessions`}
          ></div>
          <span className="bl">{day.day_name.charAt(0)}</span>
        </div>
      );
    })}
  </div>
</div>


    {/* Recent Activity */}
    <div className="side-card">

      <div className="mini-ttl">
        Recent Activity
      </div>

      <div className="act-list">

        {recentActivity.map((item, index) => {

          const statusClass =
            item.status === "Completed"
              ? "sc-g"
              : item.status === "Failed"
              ? "sc-r"
              : "sc-a";

          const dotClass =
            item.status === "Completed"
              ? "dot-g"
              : item.status === "Failed"
              ? "dot-r"
              : "dot-a";

          return (
              <div className="act-row" key={index}>
                <div className={`act-dot ${dotClass}`}></div>
                <div className="act-info">
                <div className="act-name" title={item.scenariotitle}>
              {item.scenariotitle}
            </div>

              <div className="act-time">
                {item.status === "Start" || item.status === "Resume" ? "Running" : item.status}
              </div>

              </div>
              <span className={`act-score ${statusClass}`}>
                {item.scenariolevel}
              </span>

            </div>
          );
        })}

      </div>
    </div>

  </div>
</div>

  {/* Stats */}
  <div className="stats">
    <div className="scard g">
      <div className="scard-top">
        <span className="scard-lbl">Completed Scenario</span>

        <div className="scard-icon g">
          <i className="ti ti-server"></i>
        </div>
      </div>

      <div className="scard-val">
        {widgetData?.completedScenarios?.value || "0"}
      </div>

      <div className="scard-foot">
        {Number(dashboardProgress?.completed) > 0 && (
          <span className="foot-chip up">
            <i className="ti ti-trending-up"></i> +{dashboardProgress.completed}
          </span>
        )}

        <span className="scard-foot-txt">
          {widgetData?.completedScenarios?.tooltip || ""}
        </span>
      </div>
    </div>
    <div className="scard b">
      <div className="scard-top">
        <span className="scard-lbl">Quiz Error Rate</span>

        <div className="scard-icon b">
          <i className="ti ti-server"></i>
        </div>
      </div>

      <div className="scard-val">
        {widgetData?.quizErrorRate?.value || "0"}
      </div>

      <div className="scard-foot">
        <span className="foot-chip dn">
          <i className="ti ti-trending-down"></i> 0%
        </span>

        <span className="scard-foot-txt">
          {widgetData?.quizErrorRate?.tooltip || ""}
        </span>
      </div>
    </div>

    <div className="scard p">
      <div className="scard-top">
        <span className="scard-lbl">Number of Scenarios</span>

        <div className="scard-icon p">
          <i className="ti ti-server"></i>
        </div>
      </div>

      <div className="scard-val">
        {widgetData?.activeFailedSessions?.value || "0"}
      </div>

      <div className="scard-foot">
        <span className="foot-chip nt">
           Total
        </span>

        <span className="scard-foot-txt">
          assigned to you
        </span>
      </div>
    </div>
  </div>

  

{/* =========================================
    MIDDLE
========================================= */}





{/* =========================================
    BOTTOM SECTION
========================================= */}

<div className="bottom">

  {/* Skill Proficiency */}
  <div className="bot-card">

    <div className="bot-ttl">
      Skill Proficiency
    </div>

    <div className="skill-list">

      {skillProficiency.map((item, index) => {

        const colors = [
          "#22c55e",
          "#60a5fa",
          "#f59e0b",
          "#f87171",
          "#a855f7",
        ];

        return (
          <div className="skill-row" key={index}>

            <div className="skill-top">

              <span className="skill-name">
                {item.categoryname}
              </span>

              {/* <span
                className="skill-pct"
                style={{
                  color: colors[index % colors.length]
                }}
              >
                {item.proficiency_percentage || 0}%
              </span> */}
              <div className="skill-right">

  <span
    className="skill-pct"
    style={{
      color: colors[index % colors.length]
    }}
  >
    {item.proficiency_percentage || 0}%
  </span>

  <span className="skill-count">
    {item.completed_sessions}/
    {item.total_sessions}
  </span>

</div>

            </div>

            <div className="skill-track">

              <div
                className="skill-bar"
                style={{
                  width: `${item.proficiency_percentage || 0}%`,
                  background: colors[index % colors.length]
                }}
              />

            </div>

          </div>
        );
      })}

    </div>
  </div>


  {/* Upcoming Scenarios */}
  <div className="bot-card">

    <div className="bot-ttl">
      Upcoming Scenarios
    </div>

    <div className="up-list">

      {upcomingScenarios.map((item) => (

        <div className="up-row" key={item.scenarioid}>

          <div
            className={`up-pill ${
              item.scenariolevel === "Easy"
                ? "easy"
                : item.scenariolevel === "Medium"
                ? "med"
                : "hard"
            }`}
          ></div>

          <div>

            <div className="up-name">
              {item.scenariotitle}
            </div>

            <div className="up-meta">
              {item.scenariolevel} · {item.category_name}
            </div>

          </div>

          <div className="up-dur">
            {item.duration} min
          </div>

        </div>
      ))}

    </div>
  </div>
</div>

{/* =========================================
    WEB BROWSER WIDGETS
========================================= */}

{webBrowserWidgets?.length > 0 && (
  <div
    style={{
      marginTop: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    }}
  >
    {webBrowserWidgets.map((widget) => (
      <div
        key={widget.webbrowserwidgetid}
        className="bot-card"
      >
        <div
          className="bot-ttl"
          style={{
            marginBottom: "16px",
          }}
        >
          {widget.widget_name}
        </div>

        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #1f2d45",
            background: "#0b0f1a",
          }}
        >
          <iframe
            src={
              widget.widget_url.startsWith("http")
                ? widget.widget_url
                : `https://${widget.widget_url}`
            }
            title={widget.widget_name}
            style={{
              width: "100%",
              height: "900px",
              border: "none",
              background: "#0b0f1a",
            }}
          />
        </div>
      </div>
    ))}
  </div>
)}
</Container>
    </>
  );
};

Dashboard.layout = "Contentlayout";
export default Dashboard;
