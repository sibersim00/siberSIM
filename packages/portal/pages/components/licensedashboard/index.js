import React, { useEffect } from "react";
import { Row, Col, Card, ProgressBar ,Dropdown } from "react-bootstrap";
// import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from "react-redux";
import { getLicenseDashboardData } from "../../../shared/redux/slices/licenseDashboard/licenseDashbaordManage";

const LicenseDashboard = () => {
  const dispatch = useDispatch();
  const [range, setRange] = React.useState("month");

  const { getLicenseDashboardListData ,licenseStatistics} = useSelector((state) => ({
    getLicenseDashboardListData:
      state?.licenseDashboard?.getLicenseDashboardData?.data
        ?.licenseDashboard,
    licenseStatistics:
      state?.licenseDashboard?.getLicenseDashboardStats?.data
        ?.licenseStatistics,
  }));

  useEffect(() => {
    dispatch(getLicenseDashboardData({ range }));
  }, [dispatch, range]);

  /* ---------------- DATA LOGIC ---------------- */
  const totalSeats = getLicenseDashboardListData?.totalUserLicenses || 0;

  const usedSeats = getLicenseDashboardListData?.activeConcurrentUsers
    ? parseInt(
      getLicenseDashboardListData.activeConcurrentUsers.split("/")[0]
    )
    : 0;

  const availableSeats = totalSeats - usedSeats;

  const utilizationPercent =
    totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

  const expiryText =
    getLicenseDashboardListData?.licenseExpiryCountdown || "";

  const isExpiringSoon = expiryText.toLowerCase().includes("day");

  /* -------- Circular Progress Config -------- */
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (utilizationPercent / 100) * circumference;

  const usageChartOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      categories: licenseStatistics?.peakConcurrentUsage?.labels || [],
    },
    yaxis: {
      title: {
        text: "Concurrent Users",
      },
    },
    colors: ["#3b82f6"],
  };

  const usageChartSeries = [
    {
      name: "Peak Usage",
      data: licenseStatistics?.peakConcurrentUsage?.values || [],
    },
  ];


  return (
    <>
      {/* ================= ROW 1 ================= */}
      <Row className="g-4">
        {/* -------- Core Utilization -------- */}
        <Col md={6}>
          <Card className="sphura-card h-100">
            <Card.Body>
              <h6 className="mb-4">
                <i className="fa fa-microchip me-2" />
                Core Utilization
              </h6>

              {/* <Row className="align-items-center text-center">
                <Col xs={4}>
                  <div className="metric-value text-success">
                    {availableSeats}
                  </div>
                  <div className="metric-label">Available Seats</div>
                </Col>

                <Col xs={4}>
                  
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

                  <div className="mt-2 fw-semibold">
                    {getLicenseDashboardListData?.activeConcurrentUsers}
                  </div>
                </Col>

                <Col xs={4}>
                  <div className="metric-value text-info">
                    {totalSeats}
                  </div>
                  <div className="metric-label">Total Licensed</div>
                </Col>
              </Row> */}
              <Row className="align-items-center text-center">
                <Col xs={4}>
                  <div className="metric-value text-success">{availableSeats}</div>
                  <div className="metric-label">Available Seats</div>
                </Col>

                <Col xs={4}>
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

                  <div className="mt-2 fw-semibold">
                    <div className="ml-2">
                      {getLicenseDashboardListData?.activeConcurrentUsers}

                    </div>
                  </div>
                </Col>

                <Col xs={4}>
                  <div className="metric-value text-info">{totalSeats}</div>
                  <div className="metric-label">Total Licensed</div>
                </Col>
              </Row>


              <ProgressBar
                now={utilizationPercent}
                className="mt-4"
                variant={utilizationPercent > 80 ? "danger" : "success"}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* -------- Right Side -------- */}
        <Col md={6}>
          <Row className="g-4">
            {/* License Expiry */}
            <Col md={12}>
              <Card className="sphura-card">
                <Card.Body>
                  <h6>
                    <i className="fa fa-calendar me-2" />
                    License Expiry Status
                  </h6>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div>
                      <small className="text-muted">Expiry Date</small>
                      <h6 className="mb-0">
                        {getLicenseDashboardListData?.licenseExpiryDate}
                      </h6>
                    </div>

                    <span
                      className={`badge ${isExpiringSoon ? "badge-danger" : "bg-success"
                        }`}
                    >
                      {expiryText}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Compliance */}
            <Col md={12}>
              <Card className="sphura-card border-success">
                <Card.Body>
                  <h6>
                    <i className="fa fa-shield me-2" />
                    License Compliance
                  </h6>

                  <div className="text-success mt-3">
                    <i className="fa fa-check-circle me-2" />
                    All users are within licensed limits
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* ================= ROW 2 ================= */}
      <Row className="g-4 mt-1">
        {/* Usage Trends */}
        <Col md={8}>
          <Card className="sphura-card h-100">
            <Card.Body>
              <h6>
                <i className="fa fa-line-chart me-2" />
                Usage Trends
              </h6>

              {/* <div className="chart-placeholder">
                Usage analytics coming soon
              </div> */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-semibold">Peak Concurrent Usage</span>

                <Dropdown>
                  <Dropdown.Toggle size="sm" variant="outline-secondary">
                    {range === "today"
                      ? "Today"
                      : range === "week"
                        ? "Week"
                        : "Month"}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setRange("today")}>
                      Today
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setRange("week")}>
                      Week
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setRange("month")}>
                      Month
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* <ReactApexChart
                options={usageChartOptions}
                series={usageChartSeries}
                type="line"
                height={280}
              /> */}

              <div className="mt-3 text-muted small">
                Avg Usage / Day:{" "}
                <strong>
                  {licenseStatistics?.averageConcurrentUsagePerDay || 0}
                </strong>
              </div>

            </Card.Body>
          </Card>
        </Col>

        {/* License Summary */}
        <Col md={4}>
          <Card className="sphura-card h-100">
            <Card.Body>
              <h6>
                <i className="fa fa-id-badge me-2" />
                License Summary
              </h6>

              <div className="summary-item">
                <span>Owner</span>
                <strong>{getLicenseDashboardListData?.licenseOwnerName}</strong>
              </div>

              <div className="summary-item">
                <span>Seats Used</span>
                <strong>
                  {getLicenseDashboardListData?.activeConcurrentUsers}
                </strong>
              </div>

              <div className="summary-item">
                <span>Total Seats</span>
                <strong>{totalSeats}</strong>
              </div>

              <div className="summary-item">
                <span>Status</span>
                <strong className="text-success">Active</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

LicenseDashboard.layout = "Contentlayout";
export default LicenseDashboard;
