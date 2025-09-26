import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { Row, Col, Card, Button } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import Modal from "react-bootstrap/Modal";
import { clearHasError } from "../../../shared/redux/slices/component/componentManage.js";
import {
  fetchapilogslist,
  clearfetchlogs,
  fetchApiLogById,
  clearfetchlogbyid
} from "../../../shared/redux/slices/ApiLogs/apilogsManage.js";
import Seo from "../../../shared/layout-components/seo/seo.js";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button.js";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton.js";
import "../../../shared/utils/i18n.js";
import * as XLSX from "xlsx";

const ManageComponent = () => {
  const dispatch = useDispatch();
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [compStatus, setCompStatus] = useState("Available");
  const [oneClick, setOneClick] = useState(false);
  const { hasFetchapilogsSuccesslist, errorData,hasFetchApiLogByIdSuccess } = useSelector((state) => ({
    errorData: state?.componentManage?.error,
    hasFetchNetworkSuccess: state?.apilogsManage?.networkData,
    hasFetchapilogsSuccesslist: state?.apilogsManage?.apilogsDatalist?.data,
     hasFetchApiLogByIdSuccess: state?.apilogsManage?.selectedLogData,
  }));


const columnDefs = [
  {
    headerName: "Sr. No.",
    field: "Sr No.",
    cellRenderer: "srNoRender",
    tooltipValueGetter: (params) => `Sr. No: ${params.value}`,
    minWidth: 80,
    sortable: false,
  },
  {
    headerName: "API Endpoint",
    field: "api_end_point",
    filter: true,
    floatingFilter: true,
    minWidth: 600,
    tooltipField: "api_end_point",
  },
  {
    headerName: "VM Process",
    field: "vm_process",
    filter: true,
    floatingFilter: true,
    minWidth: 150,
    tooltipField: "vm_process",
  },
  {
    headerName: "Response Code",
    field: "response_code",
    filter: true,
    floatingFilter: true,
    minWidth: 150,
    cellRenderer: "responseCodeRenderer",
    tooltipField: "response_code",
  },
  {
    headerName: "Request Timestamp",
    field: "request_datetime",
    filter: true,
    floatingFilter: true,
    minWidth: 150,
    valueFormatter: (params) => formatDate(params.value),
    tooltipValueGetter: (params) => `Request Time: ${formatDate(params.value)}`,
  },
  {
    headerName: "Response Timestamp",
    field: "response_datetime",
    filter: true,
    floatingFilter: true,
    minWidth: 150,
    valueFormatter: (params) => formatDate(params.value),
    tooltipValueGetter: (params) => `Response Time: ${formatDate(params.value)}`,
  },
  {
    headerName: "Duration (ms)",
    field: "duration",
    filter: true,
    floatingFilter: true,
    minWidth: 100,
    tooltipField: "duration",
  },
  {
    headerName: "IP Address",
    field: "ip_address",
    filter: true,
    floatingFilter: true,
    minWidth: 80,
    tooltipField: "ip_address",
  },
];


  useEffect(() => {
  if (hasFetchApiLogByIdSuccess) {
    setSelectedLog(hasFetchApiLogByIdSuccess);
  }
}, [hasFetchApiLogByIdSuccess]);


const handleExport = () => {
  const filteredData = rowData; // Replace with filtered logic if needed

  const exportData = filteredData.map((row, index) => {
    const formatCell = (val) =>
      val ? new Date(val).toLocaleString() : "N/A";

    return [
      index + 1, // Sr. No.
      row.api_end_point || "",
      row.ip_address || "",
      formatCell(row.request_datetime),
      formatCell(row.response_datetime),
      row.response_code || "",
      row.duration !== undefined ? row.duration : "N/A",
    ];
  });

  const header = [
    "Sr. No.",
    "API Endpoint",
    "IP Address",
    "Request Timestamp",
    "Response Timestamp",
    "Response Code",
    "Duration (ms)",
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "API Logs");

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:\.]/g, "")
    .slice(0, 15);

  XLSX.writeFile(workbook, `API_Logs_${timestamp}.xlsx`);
};

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    }),
    []
  );

  useEffect(() => {
    dispatch(fetchapilogslist());
  }, []);

  useEffect(() => {
    if (
      hasFetchapilogsSuccesslist &&
      Array.isArray(hasFetchapilogsSuccesslist)
    ) {
      setRowData(hasFetchapilogsSuccesslist);
    }
  }, [hasFetchapilogsSuccesslist]);

  useEffect(() => {}, [hasFetchapilogsSuccesslist]);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi, rowData]);

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  useEffect(() => {
    if (errorData?.statusCode) {
      if (errorData.errors && errorData.errors.length > 0) {
        errorData.errors.forEach((data) => {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">{data}</p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        });
      } else {
        toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {errorData?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: true,
            theme: "colored",
          }
        );
      }
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData, dispatch]);

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const handleShowModal = (log) => {
  const logId = log.id; // assuming the log has an 'id' field
  dispatch(fetchApiLogById(logId));
  setShowModal(true); // open modal immediately (optionally use loader)
};

  const handleCloseModal = () => {
  setSelectedLog(null);
  setShowModal(false);
  dispatch(clearfetchlogbyid());
};


  const getResponseInfo = (code) => {
    const info = {
      200: { message: "OK", color: "success" },
      201: { message: "Created", color: "success" },
      204: { message: "No Content", color: "success" },
      301: { message: "Moved Permanently", color: "info" },
      302: { message: "Found", color: "info" },
      400: { message: "Bad Request", color: "warning" },
      401: { message: "Unauthorized", color: "warning" },
      403: { message: "Forbidden", color: "warning" },
      404: { message: "Not Found", color: "warning" },
      500: { message: "Internal Server Error", color: "danger" },
      502: { message: "Bad Gateway", color: "danger" },
      503: { message: "Service Unavailable", color: "danger" },
    };

    return info[code] || { message: "Unknown", color: "secondary" };
  };

  const getFormattedResponse = (response) => {
    if (!response) return "N/A";
    if (typeof response === "string") return response;
    if (Array.isArray(response)) return response.join("");
    if (typeof response === "object") return JSON.stringify(response, null, 2);
    return String(response);
  };

  const frameworkComponents = {
    srNoRender: (props) => props.node.rowIndex + 1,
    actionButtonRenderer: (props) => <ActionButtonRenderer propsVal={props} />,

    responseCodeRenderer: (props) => {
      console.log("propsprops",props)
  const code = props.value;
  const { message, color } = getResponseInfo(Number(code));
  return (
    <span
      className={`badge bg-${color}`}
      style={{ cursor: "pointer" }}
      onClick={() => handleShowModal(props.data)} // this data should include `id`
      title="Click to view details"
    >
      {code} - {message}
    </span>
  );
},

    actionSwitchRenderer: (props) => (
      <ToggleButton
        data={props?.data}
        handleStatusSwitch={handleStatusSwitch}
      />
    ),
  };
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  console.log("getResponseInfo", getResponseInfo);
  return (
    <>
      <Seo title="Proxmox Logs" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Proxmox Logs</h5>
                  <div className="d-flex align-items-center">
                    <Button
                      type="button"
                      variant="outline-info"
                      onClick={() => handleExport()}
                    >
                      <i className="fa fa-file-excel-o"></i> Export
                    </Button>
                    &nbsp;
                  </div>
                </div>
              </Col>
            </Card.Body>

            <Col md={12}>
              <div
                className="ag-theme-alpine mt-2"
                style={{ height: "40em", width: "100%" }}
              >
                <AgGridReact
                  id="cat_grid"
                  headerHeight={35}
                  rowHeight={40}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  pagination={true}
                  paginationPageSize={10}
                  onGridReady={onGridReady}
                  frameworkComponents={frameworkComponents}
                  defaultColDef={defaultColDef}
                  enableBrowserTooltips={true} 
                />
              </div>
            </Col>
          </Card>
        </Col>
      </Row>
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">API Log Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: "15px", lineHeight: "1.6" }}>
          <div className="mb-4">
            <strong className="mb-2">Response:</strong>
            <pre
              style={{
                // background: "#f1f3f5",
                padding: "10px",
                borderRadius: "6px",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                maxHeight: "300px",
                overflowY: "auto",
                fontSize: "15px",
              }}
            >
              {(() => {
                if (!selectedLog?.response) return "N/A";

                try {
                  const parsed = JSON.parse(selectedLog.response);

                  if (typeof parsed === "string") {
                    return parsed;
                  }

                  if (typeof parsed === "object" && parsed !== null) {
                    // Nicely format nested objects/arrays
                    return Object.entries(parsed)
                      .map(([key, value]) => {
                        if (typeof value === "object") {
                          return `${key}: ${JSON.stringify(value, null, 2)}`;
                        }
                        return `${key}: ${value}`;
                      })
                      .join("\n\n"); // space between entries
                  }

                  return parsed;
                } catch {
                  return selectedLog.response;
                }
              })()}
            </pre>
          </div>

          <div className="mb-4">
            <strong className="mb-2">Request Payload:</strong>
            <pre
              style={{
                // background: "#f1f3f5",
                padding: "10px",
                borderRadius: "6px",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontSize: "15px",
              }}
            >
              {selectedLog?.request_payload
                ? Object.entries(JSON.parse(selectedLog.request_payload))
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\n")
                : "N/A"}
            </pre>
          </div>
          <div className="mb-4">
            <strong>Request Headers:</strong>
            <pre
              style={{
                // background: "#f1f3f5",
                padding: "10px",
                borderRadius: "6px",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontSize: "15px",
              }}
            >
              {selectedLog?.request_headers
                ? Object.entries(JSON.parse(selectedLog.request_headers))
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\n")
                : "N/A"}
            </pre>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
ManageComponent.layout = "Contentlayout";
export default ManageComponent;
