import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card,
  Button,
} from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend
} from "chart.js";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import { getLocalStorageData } from "../../../../shared/redux/slices/localstorage/LocalStorage";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../../shared/layout-components/seo/seo";
import {
  getAdminLogsList
} from "../../../../shared/redux/slices/reports/reportManage";

const Adminuser = () => {
  const dispatch = useDispatch();
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const {
    adminlistLogData,
    errorData,

  } = useSelector((state) => {
    return {
      adminlistLogData: state && state.reportData && state.reportData.getAdminLogListData?.data,
      errorData: state && state.user && state.user.error,
    };
  });

  useEffect(() => {
    dispatch(getAdminLogsList());
  }, [dispatch]);

  useEffect(() => {
    if (adminlistLogData) {
      setRowData(adminlistLogData);
      if (gridApi) {
        gridApi.setRowData(adminlistLogData);
      }
    }
  }, [adminlistLogData, gridApi]);

  // Chart Dependencies
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Legend);

  const AdminLoginChart = ({ data }) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const loginCounts = Array(12).fill(0);
    const logoutCounts = Array(12).fill(0);

    data.forEach((log) => {
      if (log.last_login) {
        const month = new Date(log.last_login).getMonth();
        loginCounts[month]++;
      }
      if (log.last_logout) {
        const month = new Date(log.last_logout).getMonth();
        logoutCounts[month]++;
      }
    });

    const chartData = {
      labels: months,
      datasets: [
        {
          label: "Login Count",
          data: loginCounts,
          backgroundColor: "rgba(54, 162, 235, 0.7)",
        },
        {
          label: "Logout Count",
          data: logoutCounts,
          backgroundColor: "rgba(255, 99, 132, 0.7)",
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "SIMMaster Login/Logout Stats" },
      },
    };
    return (
      <div style={{ height: "450px" }}>
        <Bar
          options={{ ...options, maintainAspectRatio: false }}
          data={chartData}
        />
      </div>
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"));
    }
  }, []);

  const handleDateFilter = (filterType) => {
    setActiveFilter(filterType);

    switch (filterType) {
      case "yesterday":
        setSelectedDate(new Date(Date.now() - 86400000).toISOString().split("T")[0]);
        break;
      case "mtd":
        setSelectedDate("");
        break;
      case "ytd":
        setSelectedDate("");
        break;
      case "custom":
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (activeFilter === "custom" && selectedDate) {
    }
  }, [selectedDate, activeFilter]);
  const gridOptions = {
    pagination: true,
    paginationPageSize: 20,
  };
  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    let filteredList = adminlistLogData ?? [];
    const temp = filteredList.filter((d) => {
      const fullName = `${d.firstname ?? ""} ${d.lastname ?? ""}`.toLowerCase();

      return (
        fullName.includes(val) ||
        (d.firstname ?? "").toLowerCase().includes(val) ||
        (d.lastname ?? "").toLowerCase().includes(val) ||
        (d.loginid ?? "").toLowerCase().includes(val) ||
        (d.email ?? "").toLowerCase().includes(val) ||
        (d.usertype ?? "").toLowerCase().includes(val) ||
        (d.mobile !== null &&
          d.mobile !== undefined &&
          d.mobile.toString().toLowerCase().includes(val)) ||
        (d.last_login ?? "").toLowerCase().includes(val) ||
        (d.last_logout ?? "").toLowerCase().includes(val) ||
        !val
      );
    });

    setGridData(temp);
    setRowData(temp);
  };

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    if (compStatus == "") {
      setRowData(adminlistLogData

      );
      setGridData(adminlistLogData);
    } else if (compStatus == "true") {
      const filteredData =
        adminlistLogData.length > 0 && adminlistLogData.filter((data) => data?.status == "true");
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        adminlistLogData.length > 0 && adminlistLogData

          .filter((data) => data?.status == "false");
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };
  useEffect(() => {
    if (adminlistLogData) {
      setRowData(adminlistLogData);
    }
  }, [adminlistLogData]);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  useEffect(() => {
    if (errorData?.statusCode) {
      errorData.errors && errorData.errors.length > 0
        ? errorData.errors.map((data) => {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {data}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        })
        : toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {errorData?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: true,
            theme: "colored",
          }
        );
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEdit={handleEdit}
          propsVal={props}
          handleShowEdit={true}
        />
      );
    },
  };

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      maxWidth: 80,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
    {
      headerName: "User Name",
      field: "loginid",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "First Name",
      field: "firstname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Last Name",
      field: "lastname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Email",
      field: "email",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Mobile",
      field: "mobile",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Login In Time",
      field: "last_login",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Log Out Time",
      field: "last_logout",
      filter: true,
      floatingFilter: true,
    },

  ];

  return (
    <>
      <Seo title="SIMMaster Logs" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              {/* Header with Buttons */}
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <h4>SIMMaster Logs</h4>
                  <div className="d-flex align-items-center flex-wrap">
                    {/* View Buttons */}
                    <Button
                      type="button"
                      title="Card View"
                      variant="outline-success"
                      onClick={() => handleChangeView("card")}
                      className={`${view === "card" ? "active text-white" : ""}`}
                    >
                      <i className="fe fe-grid"></i>
                    </Button>
                    <Button
                      type="button"
                      title="List View"
                      variant="outline-success"
                      onClick={() => handleChangeView("list")}
                      className={`mx-1 ${view === "list" ? "active text-white" : ""}`}
                    >
                      <i className="fe fe-list"></i>
                    </Button>

                    <div className="mx-1">
                      <input
                        className="form-control bd bd-2"
                        value={quickFilter}
                        placeholder="Search..."
                        type="text"
                        onChange={(e) => onFilterChanged(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Col>

              {/* Chart View */}
              {view === "card" && (
                <Col md={12} className="mt-3">
                  <AdminLoginChart data={adminlistLogData ?? []} />
                </Col>
              )}

              {/* List View */}
              {view === "list" && (
                <Col md={12} className="mt-3">
                  <div className="ag-theme-alpine" style={{ height: "40em", width: "100%" }}>
                    <AgGridReact
                      id="cat_grid"
                      headerHeight={35}
                      rowHeight={40}
                      gridOptions={gridOptions}
                      rowData={rowData}
                      columnDefs={columnDefs}
                      pagination={true}
                      onGridReady={onGridReady}
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
                    />
                  </div>
                </Col>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Optional Card View Below */}
        {view === "card" && (
          <Col md={12}>
            {/* Your Card View Content */}
          </Col>
        )}
      </Row>


    </>
  );
};

Adminuser.layout = "Contentlayout";
export default Adminuser;
