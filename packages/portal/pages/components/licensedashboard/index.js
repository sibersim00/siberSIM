import React, { useEffect, useState, useMemo } from "react";
import { Row, Col, Card, Modal, Button, ProgressBar } from "react-bootstrap";
import {PieChart,Pie,Cell,Tooltip as ReTooltip,BarChart,Bar,XAxis,YAxis,LineChart,Line,CartesianGrid,Legend,ResponsiveContainer,AreaChart,Area,} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { getLicenseDashboardData } from "../../../shared/redux/slices/licenseDashboard/licenseDashbaordManage";

const LicenseDashboard = () => {
  const dispatch = useDispatch();
  const [range, setRange] = useState("today");
  const [countdown, setCountdown] = useState("");

  const [allowedUsersModal, setAllowedUsersModal] = useState(false);
  const [allowedUsersData, setAllowedUsersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { getLicenseDashboardListData, licenseStatistics } = useSelector(
    (state) => ({
      getLicenseDashboardListData:state?.licenseDashboard?.getLicenseDashboardData?.data?.licenseDashboard,
      licenseStatistics:state?.licenseDashboard?.getLicenseDashboardData?.data?.licenseStatistics,
    }),
  );

  useEffect(() => {
    dispatch(getLicenseDashboardData({ range }));
  }, [dispatch, range]);

  /* ---------------- CORE METRICS ---------------- */
  const totalSeats = getLicenseDashboardListData?.totalUserLicenses || 0;
  const usedSeats = getLicenseDashboardListData?.activeConcurrentUsers
    ? parseInt(getLicenseDashboardListData.activeConcurrentUsers.split("/")[0])
    : 0;
  const availableSeats = totalSeats - usedSeats;
  const isLimitReached = usedSeats >= totalSeats;
  const isFullNow = usedSeats >= totalSeats;
  const utilizationPercent = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;
  const displayPercent = utilizationPercent;
  const percent = utilizationPercent;

  const expiryText = getLicenseDashboardListData?.licenseExpiryCountdown || "";
  const isExpiringSoon = expiryText.toLowerCase().includes("day");

  /* ---------------- CIRCULAR RING ---------------- */
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (utilizationPercent / 100) * circumference;

  const todayLabels = licenseStatistics?.peakConcurrentUsage?.today?.labels || [];

  const todayValues = licenseStatistics?.peakConcurrentUsage?.today?.values || [];

  const todayData = todayLabels.map((label, i) => ({
    name: label,
    value: todayValues[i] || 0,
  }));

  const todayTotal = todayValues.reduce((a, b) => a + b, 0);

  // Week---- bar chart — Mon to Sun
  const weekData =
    licenseStatistics?.peakConcurrentUsage?.week?.labels?.map((day, i) => ({
      day,
      value: licenseStatistics.peakConcurrentUsage.week.values[i] || 0,
    })) || [];

  // Month----- line chart — Jan to Dec
  const monthData =
    licenseStatistics?.peakConcurrentUsage?.month?.labels?.map((month, i) => ({
      week: month,
      value: licenseStatistics.peakConcurrentUsage.month.values[i] || 0,
    })) || [];

  const maxWeek =
    weekData.length > 0 ? Math.max(...weekData.map((d) => d.value)) : 0;

  /* ---------------- RANGE USAGE (left panel) ---------------- */
  const rangeUsageValue = (() => {
    // if (range === "today") return usedSeats;

      if (range === "today") {
      const vals = licenseStatistics?.peakConcurrentUsage?.today?.values || [];
      return vals.reduce((acc, v) => acc + (v || 0), 0);
    }

    if (range === "week") {
      const vals = licenseStatistics?.peakConcurrentUsage?.week?.values || [];
      return vals.reduce((acc, v) => acc + (v || 0), 0);
    }

    if (range === "month") {
      const vals = licenseStatistics?.peakConcurrentUsage?.month?.values || [];
      return vals.reduce((acc, v) => acc + (v || 0), 0);
    }

    return 0;
  })();

  const rangePercent = totalSeats > 0 ? Math.round((rangeUsageValue / totalSeats) * 100) : 0;

  /* ---------------- GAUGE STATUS ---------------- */
  let statusText = "Safe";
  let statusColor = "#22c55e";
  if (displayPercent >= 80) {
    statusText = "Critical - System Full";
    statusColor = "#ef4444";
  } else if (displayPercent >= 60) {
    statusText = "High Usage";
    statusColor = "#f97316";
  } else if (displayPercent >= 30) {
    statusText = "Moderate Load";
    statusColor = "#eab308";
  }

  /* ---------------- STATS ---------------- */
  const isAlert = percent === 100;
  const fullHits = licenseStatistics?.fullUsageCount || 0;
  const noSeats = licenseStatistics?.noSeatsCount || 0;

  /* ---------------- COUNTDOWN TIMER ---------------- */
  useEffect(() => {
    if (!licenseStatistics?.labSession?.datetime) return;
    const interval = setInterval(() => {
      const diff =
        new Date(licenseStatistics.labSession.datetime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Starting now");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,);
    }, 1000);
    return () => clearInterval(interval);
  }, [licenseStatistics?.labSession]);

  const handleUpgrade = () => window.open("/activate-account?mode=upgrade", "_blank");

  const statusColors = {
    Start: "#22c55e",
    Resume: "#3b82f6",
    Running: "#06b6d4",
    Completed: "#15803d",
    Failed: "#ef4444",
    Terminated: "#f97316",
    "Operation Failed": "#dc2626",
  };

  const handleOpenAllowedUsersModal = () => {
    setAllowedUsersData(licenseStatistics?.labSession?.allowedUsers || []);
    setAllowedUsersModal(true);
  };

  const handleCloseAllowedUsersModal = () => {
    setAllowedUsersModal(false);
  };

  const filteredUsers = useMemo(() => {
    return (allowedUsersData || []).filter((user) => {
      const value = searchTerm.toLowerCase();
      return (
        user.name?.toLowerCase().includes(value) ||
        user.email?.toLowerCase().includes(value)
      );
    });
  }, [allowedUsersData, searchTerm]);

  return (
    <>
      {/* ================= ROW 1 ================= */}
      <Row className="g-4">
        <Col md={6}>
          <Card className={`border-0 h-100 ${isFullNow ? "card-alert" : ""}`}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="title text-uppercase text-gradient d-flex align-items-center">
                  <i className="fa fa-tachometer me-2 " />
                  License Saturation
                </h6>
              </div>

              <div className="premium-gauge ">
                <svg viewBox="0 0 300 200" className="gauge-svg">
                  <defs>
                    <filter id="shadow">
                      <feDropShadow
                        dx="0"
                        dy="6"
                        stdDeviation="8"
                        floodColor="#000"
                        floodOpacity="0.4"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M50 160 A100 100 0 0 1 250 160"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="26"
                  />
                  <path
                    d="M50 160 A100 100 0 0 1 250 160"
                    stroke="#22c55e"
                    strokeWidth="22"
                    fill="none"
                    strokeDasharray="94 314"
                    strokeDashoffset="0"
                    filter="url(#shadow)"
                  />
                  <path
                    d="M50 160 A100 100 0 0 1 250 160"
                    stroke="#eab308"
                    strokeWidth="22"
                    fill="none"
                    strokeDasharray="63 314"
                    strokeDashoffset="-94"
                  />
                  <path
                    d="M50 160 A100 100 0 0 1 250 160"
                    stroke="#f97316"
                    strokeWidth="22"
                    fill="none"
                    strokeDasharray="63 314"
                    strokeDashoffset="-157"
                  />
                  <path
                    d="M50 160 A100 100 0 0 1 250 160"
                    stroke="#ef4444"
                    strokeWidth="22"
                    fill="none"
                    strokeDasharray="94 314"
                    strokeDashoffset="-220"
                  />
                  <line
                    x1="150"
                    y1="160"
                    x2="150"
                    y2="70"
                    stroke="#03aefd"
                    strokeWidth="4"
                    strokeLinecap="round"
                    transform={`rotate(${(displayPercent / 100) * 180 - 90},150,160)`}
                    className="needle"
                  />
                  <circle cx="150" cy="160" r="10" fill="#020617" />
                  <circle cx="150" cy="160" r="5" fill="#fff" />
                </svg>
                <div className="gauge-center-value">{displayPercent}%</div>
              </div>
              <div
                className="status-text text-center fw-semibold"
                style={{ color: statusColor }}
              >
                {statusText}
              </div>
              <div className="info-section">
                <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
                  <span>
                    <i className="fa fa-key me-2 text-primary" />
                    Total Licenses
                  </span>
                  <b>{totalSeats}</b>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 ">
                  <span>
                    <i className="fa fa-users me-2 text-warning" />
                    In Use
                  </span>
                  <b>{usedSeats}</b>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <i className="fa fa-check-circle me-2 text-success" />
                    Available
                  </span>
                  <b>{totalSeats - usedSeats}</b>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Row className="g-4">
            <Col md={12}>
              <Card className=" mb-1">
                <Card.Body>
                  <div className="fusion-header ">
                    <h6 className="text-uppercase text-warning ">
                      <i className="fa fa-calendar me-2" />
                      License Expiry
                    </h6>
                    <button
                      className="upgrade-btn-pulse"
                      onClick={handleUpgrade}
                    >
                      <i className="fa fa-arrow-up me-2" />
                      Upgrade Limit
                    </button>
                  </div>
                  <div className="fusion-content">
                    <div>
                      <p>Expiry Date</p>
                      <h3>{getLicenseDashboardListData?.licenseExpiryDate}</h3>
                    </div>
                    <div
                      className={`fusion-badge ${isExpiringSoon ? "danger" : "safe"}`}
                    >
                      {expiryText}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={12}>
              <Card>
                <Card.Body>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="lic-icon">
                        <i className="fa fa-shield"></i>
                      </div>
                      <div>
                        <h6 className=" text-uppercase text-warning m-0 ">
                          License Compliance
                        </h6>
                        <p className="lic-subtitle">System license status</p>
                      </div>
                    </div>
                  </div>

                  <div className="lic-row mt-2">
                    <span className="lic-label">Name of License Owner</span>
                    <span className="lic-value">
                      {getLicenseDashboardListData?.licenseOwnerName || "N/A"}
                    </span>
                  </div>

                  <div className="lic-row mb-2 mt-2">
                    <span className="lic-label">Owner Status</span>

                    {getLicenseDashboardListData?.ownerStatus === "Active" ? (
                      <span className="status-badge active">
                        <span className="dot"></span>
                        Active
                      </span>
                    ) : (
                      <span className="status-badge inactive">
                        <span className="dot"></span>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="lic-note mt-4">
                    <i className="fa fa-check-circle"></i>
                    <span>All users are within licensed limits</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      {/* ================= ROW 2 ================= */}
      <Row className="g-4 mt-2 mb-2">
        <Col md={4}>
          <Card className=" h-100 border-0">
            <Card.Body className="neon-body">
              <div className="neon-header text-uppercase mb-2">
                <span>Failed Sessions</span>
              </div>
              <div className="neon-center">
                <div className="ring">
                  <h1 className="neon-count">
                    {licenseStatistics?.failedStartScenario ?? 0}
                  </h1>
                </div>
              </div>
              <div className="neon-footer">License limit reached</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card
            className="h-100 border-0 shadow-sm"
            style={{ cursor: "pointer" }}
            onClick={handleOpenAllowedUsersModal}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="fw-semibold text-gradient text-uppercase">
                  <i className="fa fa-clock me-2  text-primary" />
                  Upcoming Lab
                </h6>
                <span className="live-dot" />
              </div>
              <h4 className="mt-3 upcoming-title">
                {licenseStatistics?.labSession ? (
                  <>
                    Your upcoming lab :{" "}
                    <span className="fw-bold text-info">
                      {licenseStatistics.labSession.bookingName}
                    </span>{" "}
                    is in <span className="timer-blink">{countdown}</span>
                  </>
                ) : (
                  "No upcoming lab"
                )}
              </h4>
              {licenseStatistics?.labSession && (
                <div className="mt-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="lab-mini-card h-100">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fa fa-book me-2 text-primary" />
                          <small className="lab-mini-label">Session</small>
                        </div>
                        <div className="lab-mini-value">
                          {licenseStatistics.labSession.bookingName}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="lab-mini-card h-100">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fa fa-clock me-2 text-warning" />
                          <small className="lab-mini-label">Duration</small>
                        </div>
                        <div className="lab-mini-value">
                          {licenseStatistics.labSession.duration} hrs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= ROW 3 ================= */}
      <Row className="g-4 mt-2 mb-2">
        <Col md={12}>
          <Card className="neo-card p-0 overflow-hidden">
            <div className="flex-layout">
              <div className="left-panel p-3 d-flex flex-column">
                <div className="mb-4">
                  <h6 className="neo-title text-uppercase">Control Panel</h6>
                  <small className="neo-sub">Usage analytics</small>
                </div>
                <div className="neo-toggle">
                  {["today", "week", "month"].map((r) => (
                    <button
                      key={r}
                      className={`neo-btn ${range === r ? "active" : ""}`}
                      onClick={() => setRange(r)}
                    >
                      <span className="neo-dot" />
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="neo-usage mt-4">
                  <p>
                    {range === "today"
                      ? "Today Total Usage"
                      : range === "week"
                        ? "Weekly Total Usage"
                        : "Monthly Total Usage"}
                  </p>
                  <h2>{rangeUsageValue}</h2>
                  <div className="neo-bar">
                    <div
                      className="neo-fill"
                      style={{ width: `${rangePercent}%` }}
                    />
                  </div>
                </div>
                {isLimitReached && (
                  <div className="neo-alert mt-3">⚠ SYSTEM FULL</div>
                )}
              </div>

              <div className="right-panel p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold  text-uppercase text-gradient  mb-0">
                      <i className="fa fa-area-chart me-2" />
                      Usage Insights
                    </h5>
                    <small className="text-muted">
                      Real-time system usage analytics
                    </small>
                  </div>
                  <span className="live-badge">Live</span>
                </div>

                {/* TODAY — Pie Chart */}
                {range === "today" && (
                  <Row className="g-4">
                    <Col md={12}>
                      <div style={{ position: "relative" }}>
                        {todayTotal === 0 ? (
                          <div className="no-data-box">
                            <i className="fa fa-info-circle me-2" />
                            No users active today
                          </div>
                        ) : (
                          <>
                            <ResponsiveContainer width="100%" height={260}>
                              <PieChart>
                                <Pie
                                  data={todayData}
                                  dataKey="value"
                                  innerRadius={70}
                                  outerRadius={100}
                                >
                                  {todayData.map((entry, i) => (
                                    <Cell
                                      key={i}
                                      fill={
                                        statusColors[entry.name] || "#94a3b8"
                                      }
                                    />
                                  ))}
                                </Pie>
                                <ReTooltip position={{ x: 250, y: 20 }} />
                              </PieChart>
                            </ResponsiveContainer>

                            <div className="pie-center ">
                              <h3>{todayTotal}</h3>
                              {/* <span>Total Count</span>   */}
                            </div>

                            <div className="mt-3 w-100 d-flex justify-content-center fw-semibold text-muted">
                              Today's Current Users
                            </div>
                          </>
                        )}
                      </div>
                    </Col>
                  </Row>
                )}

                {/* WEEK — Bar Chart */}
                {/* WEEK — Bar Chart */}
                {range === "week" && (
                  <div>
                    {weekData.length === 0 ? (
                      <div className="no-data">No weekly data 📭</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={weekData}>
                          <defs>
                            <linearGradient
                              id="barGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#38bdf8" />
                              <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, "dataMax"]} tickCount={6} />
                          <ReTooltip
                            cursor={{ fill: "transparent" }}
                            content={({ active, payload, label }) => {
                              if (
                                !active ||
                                !payload?.length ||
                                payload[0].value === 0
                              )
                                return null;
                              return (
                                <div
                                  style={{
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: 6,
                                    padding: "6px 12px",
                                    color: "#f1f5f9",
                                    fontSize: 13,
                                  }}
                                >
                                  <div style={{ fontWeight: 600 }}>{label}</div>
                                  <div>
                                    Sessions: <b>{payload[0].value}</b>
                                  </div>
                                </div>
                              );
                            }}
                          />

                          <Legend />
                          <Bar
                            dataKey="value"
                            radius={[10, 10, 0, 0]}
                            barSize={30}
                          >
                            {weekData.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={
                                  entry.value === maxWeek
                                    ? "#ef4444"
                                    : "url(#barGrad)"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* MONTH — Area Chart */}
                {range === "month" && (
                  <div>
                    {monthData.length === 0 ? (
                      <div className="no-data">No monthly data 📭</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={monthData}>
                          <defs>
                            <linearGradient
                              id="colorUsage"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#22c55e"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#22c55e"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <ReTooltip
                            content={({ active, payload, label }) => {
                              if (
                                !active ||
                                !payload?.length ||
                                payload[0].value === 0
                              )
                                return null;
                              return (
                                <div
                                  style={{
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: 6,
                                    padding: "6px 12px",
                                    color: "#f1f5f9",
                                    fontSize: 13,
                                  }}
                                >
                                  <div style={{ fontWeight: 600 }}>{label}</div>
                                  <div>
                                    Sessions: <b>{payload[0].value}</b>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorUsage)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ================= ROW 4 ================= */}
      <Row className="g-4 mt-2 mb-2">
        <Col md={6}>
          <Card
            className={` border-0 h-100 ${isAlert ? "alert-mode" : "safe-mode"}`}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center ">
                <h6 className="title text-uppercase text-gradient">
                  <i className="fa fa-exclamation-triangle me-2" />
                  Full Capacity Monitor
                </h6>
                <span className={`status-badge ${isAlert ? "danger" : "safe"}`}>
                  {isAlert ? "⚠ Alert" : "✔ Stable"}
                </span>
              </div>
              <div className="text-center mt-3">
                <h1 className="big-value">{fullHits}</h1>
                <p className="sub-text">Times system reached 100% usage</p>
              </div>
              <div className="progress-bar-wrap mt-3">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(fullHits * 10, 100)}%` }}
                />
              </div>
              <div className="details-box mt-3">
                <div className="detail-row">
                  <span>
                    <i className="fa fa-ban me-2 text-danger" />
                    No Seats Available
                  </span>
                  <strong>{noSeats}</strong>
                </div>
                <div className="detail-row">
                  <span>
                    <i className="fa fa-bolt me-2 text-warning" />
                    Overload Events
                  </span>
                  <strong>{fullHits}</strong>
                </div>
              </div>
              <div className="insight-msg text-center mt-3">
                {fullHits > 5 ? (
                  <>
                    <i className="fa fa-exclamation-triangle text-danger me-2" />
                    Critical overload on licence. Immediate scaling required.
                  </>
                ) : fullHits > 0 ? (
                  <>
                    <i className="fa fa-bolt text-warning me-2" />
                    Moderate spikes detected.
                  </>
                ) : (
                  <>
                    <i className="fa fa-check-circle text-success me-2" />
                    System operating perfectly.
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="sphura-card h-100">
            <Card.Body>
              <h6 className="mb-3 text-uppercase text-success">
                <i className="fa fa-microchip me-2" />
                Core Utilization
              </h6>

              <div className="core-data-center">
                <Row className="text-center justify-content-center align-items-center w-100 g-0">
                  <Col
                    xs={4}
                    className="d-flex flex-column align-items-center justify-content-center"
                  >
                    <div className="metric-value text-success">
                      {availableSeats}
                    </div>
                    <div className="metric-label">Available Seats</div>
                  </Col>

                  <Col
                    xs={4}
                    className="d-flex flex-column align-items-center justify-content-center"
                  >
                    <div className="util-ring">
                      <svg height={radius * 2} width={radius * 2}>
                        <circle
                          stroke="#1e293b"
                          fill="transparent"
                          strokeWidth={stroke}
                          r={normalizedRadius}
                          cx={radius}
                          cy={radius}
                        />
                        <circle
                          stroke="url(#utilGradient)"
                          fill="transparent"
                          strokeWidth={stroke}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          r={normalizedRadius}
                          cx={radius}
                          cy={radius}
                          className="progress-ring"
                        />
                        <defs>
                          <linearGradient id="utilGradient">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>
                      </svg>

                      <div className="ring-center">
                        <h4>{utilizationPercent}%</h4>
                        <small>Used</small>
                      </div>
                    </div>

                    <div className="mt-3 ms-4  fw-semibold text-center">
                      {getLicenseDashboardListData?.activeConcurrentUsers}
                    </div>
                  </Col>

                  <Col
                    xs={4}
                    className="d-flex flex-column align-items-center justify-content-center"
                  >
                    <div className="metric-value text-info">{totalSeats}</div>
                    <div className="metric-label">Total Licensed</div>
                  </Col>
                </Row>

                <ProgressBar
                  now={utilizationPercent}
                  className="mt-4 w-75"
                  variant={utilizationPercent > 80 ? "danger" : "success"}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* =======================modal=-====================== */}
      <Modal
        show={allowedUsersModal}
        onHide={handleCloseAllowedUsersModal}
        centered
        size="md"
        dialogClassName="glass-users-dialog"
        contentClassName="glass-users-modal"
      >
        <Modal.Header className="glass-users-header" closeButton>
          <div>
            <h5 className="glass-title">Allowed Users</h5>
          </div>
        </Modal.Header>
        <Modal.Body className="glass-users-body">
          <div className="glass-search-wrap">
            <i className="fe fe-search"></i>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
            />
          </div>
          <div className="glass-user-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, i) => (
                <div key={i} className="glass-user-card">
                  <div className="glass-avatar">
                    <i className="fe fe-user"></i>
                  </div>

                  <div className="glass-info">
                    <div className="glass-name">{user.name}</div>
                    <div className="glass-email">{user.email}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-empty">No users found</div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="glass-footer">
          <span>
            {" "}
            Total Users :<b> {allowedUsersData?.length || 0}</b>
          </span>
          <button onClick={handleCloseAllowedUsersModal}>Close</button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

LicenseDashboard.layout = "Contentlayout";
export default LicenseDashboard;
