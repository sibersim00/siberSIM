import React, { useEffect, useState, useMemo, useRef } from "react";
import { Container, Row, Col, Card, OverlayTrigger, Tooltip, Popover } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import { useDispatch, useSelector } from "react-redux";
import { getCustomerDashboard } from "../../../shared/redux/slices/customers/customer";
import { AgGridReact } from "ag-grid-react";
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

const CustomerDashboard = () => {
  const dispatch = useDispatch();
  const [nextExpiringData, setNextExpiringData] = useState([]);
  const [expiredData, setExpiredData] = useState([]);
  const [openTooltip, setOpenTooltip] = useState({ gridId: null, rowIndex: null });
  const nextGridApiRef = useRef(null);
  const expiredGridApiRef = useRef(null);

  const { getCustomerDashboardResp } = useSelector((state) => {
    return {
      getCustomerDashboardResp:
        state &&
        state.customerData &&
        state.customerData.getCustomerDashboardResp &&
        state.customerData.getCustomerDashboardResp.data,
    };
  });

  const hasNextExpiring = Array.isArray(nextExpiringData) && nextExpiringData.length > 0;
  const hasExpired = Array.isArray(expiredData) && expiredData.length > 0;

  const y_m_d = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const dd = ("0" + d.getDate()).slice(-2);
    const mm = ("0" + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    if (!getCustomerDashboardResp) return;

    if (Array.isArray(getCustomerDashboardResp.next_expiring_list)) {
      setNextExpiringData(getCustomerDashboardResp.next_expiring_list);
    } else {
      setNextExpiringData([]);
    }

    if (Array.isArray(getCustomerDashboardResp.expired_list)) {
      setExpiredData(getCustomerDashboardResp.expired_list);
    } else {
      setExpiredData([]);
    }
  }, [getCustomerDashboardResp]);

  useEffect(() => {
    dispatch(getCustomerDashboard());
  }, []);

  useEffect(() => {
    const api = nextGridApiRef.current;
    if (api) {
      api.setRowData(nextExpiringData);
      if (api.paginationGoToFirstPage) api.paginationGoToFirstPage();
    }
  }, [nextExpiringData]);

  useEffect(() => {
    const api = expiredGridApiRef.current;
    if (api) {
      api.setRowData(expiredData);
      if (api.paginationGoToFirstPage) api.paginationGoToFirstPage();
    }
  }, [expiredData]);

  const onNextGridReady = (params) => {
    nextGridApiRef.current = params.api;
    if (nextExpiringData && nextExpiringData.length) {
      params.api.setRowData(nextExpiringData);
    }
  };

  const onExpiredGridReady = (params) => {
    expiredGridApiRef.current = params.api;
    if (expiredData && expiredData.length) {
      params.api.setRowData(expiredData);
    }
  };


  const gridOptionsNext = useMemo(() => ({ pagination: true, paginationPageSize: 5 }), []);
  const gridOptionsExpired = useMemo(() => ({ pagination: true, paginationPageSize: 5 }), []);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);

  const commonColumnDefs = useMemo(
    () => [
      {
        headerName: "Sr No.",
        valueGetter: "node.rowIndex + 1",
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        floatingFilter: true,
      },
      {
        headerName: "Customer Name",
        field: "customer_name",
        filter: true,
        width: 150,
        minWidth: 150,
        floatingFilter: true,
        tooltipField: "customer_name",
      },
      {
        headerName: "Domain URL",
        field: "domain_url",
        filter: true,
        width: 340,
        minWidth: 340,
        floatingFilter: true,
        tooltipField: "domain_url",
      },
      {
        headerName: "Start Date",
        field: "start_date",
        filter: true,
        width: 100,
        minWidth: 100,
        floatingFilter: true,
        valueFormatter: (params) => y_m_d(params.value),
        tooltipValueGetter: (params) => y_m_d(params.value),
      },
      {
        headerName: "End Date",
        field: "expiry_date",
        filter: true,
        width: 100,
        minWidth: 100,
        floatingFilter: true,
        valueFormatter: (params) => y_m_d(params.value),
        tooltipValueGetter: (params) => y_m_d(params.value),
      },

      {
        headerName: "License Key",
        field: "license_key",
        sortable: false,
        cellRenderer: "viewLicenseButtonRenderer",
        maxWidth: 110,
        pinned: "right",

        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      }

    ],
    [y_m_d, openTooltip]
  );
  const frameworkComponents = {

    viewLicenseButtonRenderer: function (props) {
      const licenseKey = props.data.license_key;
      const [copied, setCopied] = React.useState(false);

      const handleCopy = (e) => {
        e.stopPropagation();
        copyToClipboard(licenseKey);
        setCopied(true);

        setTimeout(() => setCopied(false), 1200);
      };

      const popover = (
        <Popover id="license-popover" style={{ minWidth: "220px" }}>
          <Popover.Header as="h3">License Key</Popover.Header>
          <Popover.Body>
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ fontSize: "14px" }}
            >
              <span>{licenseKey}</span>

              {/* COPY or TICK ICON */}
              {!copied ? (
                <i
                  className="mdi mdi-content-copy"
                  style={{ cursor: "pointer", fontSize: "18px" }}
                  title="Copy"
                  onClick={handleCopy}
                ></i>
              ) : (
                <i
                  className="mdi mdi-check"
                  style={{ cursor: "pointer", fontSize: "18px", color: "green", fontWeight: "bold" }}
                ></i>
              )}
            </div>
          </Popover.Body>
        </Popover>
      );

      return (
        <OverlayTrigger trigger="click" placement="left" overlay={popover} rootClose>
          <div
            className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle"
            style={{ cursor: "pointer" }}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fe fe-eye"></i>
          </div>
        </OverlayTrigger>
      );
    },

  };
  return (
    <>
      <Seo title=" Customer Dashboard" />

      <Container fluid>
        <Row className="g-4">
          <Col md={12}>
            <Row className="mb-2"></Row>
            <Row className="row-sm">
              <Col sm={12} md={6} lg={6} xl={4}>
                <Card className="custom-card" style={{ cursor: "pointer" }}>
                  <Card.Body>
                    <div className="card-order">
                      <label className="main-content-label mb-3 pt-1">
                        Total Customers
                      </label>
                      <h2 className="text-end card-item-icon card-icon">
                        <i className="mdi mdi-account-multiple float-start text-primary"></i>
                        <span className="font-weight-bold">
                          {getCustomerDashboardResp?.counts?.total_customers || 0}
                        </span>
                      </h2>
                      <p className="mb-0 text-success">
                        Active & Verified
                        <span className="float-end">
                          {getCustomerDashboardResp?.counts?.total_active_customers || 0}
                        </span>
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
  <Col sm={12} md={6} lg={6} xl={4}>
                <Card className="custom-card" style={{ cursor: "pointer" }}>
                  <Card.Body>
                    <div className="card-order">
                      <label className="main-content-label mb-3 pt-1">
                        Expired Licenses
                      </label>
                      <h2 className="text-end card-item-icon card-icon">
                        <i className="mdi mdi-account-multiple float-start text-primary"></i>
                        <span className="font-weight-bold">
                          {getCustomerDashboardResp?.counts?.expired_customers || 0}
                        </span>
                      </h2>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>

          {hasNextExpiring && (
            <>
              <h6 className="main-content-label mt-3 mb-3">
                Licenses Expiring in Next 10 Days
              </h6>

              <div
                className="ag-theme-alpine mt-2"
                style={{ height: "45vh", width: "100%" }}
              >
                <AgGridReact
                  id="next_expiring_grid"
                  headerHeight={35}
                  rowHeight={40}
                  gridOptions={gridOptionsNext}
                  rowData={nextExpiringData}
                  columnDefs={commonColumnDefs}
                  pagination={true}
                  paginationPageSize={5}
                  defaultColDef={defaultColDef}
                  onGridReady={onNextGridReady}
                  components={frameworkComponents}
                  context={{ gridId: "next_expiring_grid" }}
                />
              </div>
            </>
          )}

          {hasExpired && (
            <>
              <h6 className="main-content-label mt-4 mb-3">
                Expired License List
              </h6>

              <div
                className="ag-theme-alpine mt-2 mb-1"
                style={{ height: "45vh", width: "100%" }}
              >
                <AgGridReact
                  id="expired_grid"
                  headerHeight={35}
                  rowHeight={40}
                  gridOptions={gridOptionsExpired}
                  rowData={expiredData}
                  columnDefs={commonColumnDefs}
                  pagination={true}
                  paginationPageSize={5}
                  defaultColDef={defaultColDef}
                  onGridReady={onExpiredGridReady}
                  components={frameworkComponents}
                  context={{ gridId: "expired_grid" }}
                />
              </div>
            </>
          )}

        </Row>
      </Container>
    </>
  );
};

CustomerDashboard.layout = "Contentlayout";
export default CustomerDashboard;