import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { Row, Col, Card, Button, OverlayTrigger, Modal, Tooltip} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { clearHasError, handleManageView, getScenarioExportList, getExportComponents, getInProgressExportsScenario, downloadScenarioZIP, downloadScenarioComponent
} from "../../../shared/redux/slices/scenario/scenarioManage";
import Seo from "../../../shared/layout-components/seo/seo";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 220;

const ScenarioExportPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [backview, setBackView] = useState("card");
  const [downloadingIds, setDownloadingIds] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const [downloadingFile, setDownloadingFile] = useState(null); // tracks which file is downloading

  const colarray = [6, 4, 3, 2];
  const gridRef = useRef(null);
  const [componentDetails, setComponentDetails] = useState({})
  const [componentModal, setComponentModal] = useState({ show: false, item: null });
  const [componentLoading, setComponentLoading] = useState(false);

  const gridHeight =
    HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4;

  const {
    errorData,
    viewNameResp,
    getUserDataFromLocal,
    hasGetScenarioexportListSucc,
    getInProgressExportsSuccess
  } = useSelector((state) => ({
    hasGetScenarioexportListSucc:state?.scenarioManage?.ScenarioexportList?.data,
    getInProgressExportsSuccess:state?.scenarioManage?.getInProgressExports,
    errorData: state?.scenarioManage?.error,
    getUserDataFromLocal: state?.localData?.getLocalData,
    viewNameResp: state?.scenarioManage?.viewNameResp,
  }));

useEffect(() => {
  dispatch(getScenarioExportList());
  if (viewNameResp !== "list") dispatch(handleManageView("card"));
}, []);

useEffect(() => {
  const incoming = getInProgressExportsSuccess?.data || [];
  if (!incoming.length) return;

  setRowData((prev) =>
    prev.map((item) => {
      const found = incoming.find((i) => i.exportid === item.exportid);
      return found || item;
    })
  );
  setGridData((prev) =>
    prev.map((item) => {
      const found = incoming.find((i) => i.exportid === item.exportid);
      return found || item;
    })
  );
}, [getInProgressExportsSuccess]);


useEffect(() => {
  const exportsList = hasGetScenarioexportListSucc || [];
  const hasInProgress = exportsList.some(
    (e) => e.status === "Inprogress" || e.status === "Running"
  );
  if (!hasInProgress) return;
  const timer = setInterval(async () => {
    const response = await dispatch(      
      getInProgressExportsScenario()
    );
    // if no more running exports
    if (!response?.data?.length) {
      clearInterval(timer);
      // refresh final export list
      dispatch(getScenarioExportList());
    }
  }, 10000);
  return () => clearInterval(timer);
}, [hasGetScenarioexportListSucc]);


const handleCardClick = async (item) => {
  setComponentModal({ show: true, item });
  setComponentLoading(true);

  if (!componentDetails[item.exportid]) {
    try {
      const res = await dispatch(
        getExportComponents({ exportid: item.exportid, scenarioid: item.scenarioid })
      );
      setComponentDetails((prev) => ({ ...prev, [item.exportid]: res?.data || [] }));
    } catch (e) {
      console.error("Failed to fetch components", e);
    }
  }
  setComponentLoading(false);
};

  // ── Sync grid data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasGetScenarioexportListSucc) {
      setRowData(hasGetScenarioexportListSucc);
      setGridData(hasGetScenarioexportListSucc);
    }
  }, [hasGetScenarioexportListSucc]);

  useEffect(() => {
    if (viewNameResp) setView(viewNameResp);
  }, [viewNameResp]);

  useEffect(() => {
    if (gridApi) gridApi.sizeColumnsToFit();
  }, [gridApi]);

  useEffect(() => {
    if (errorData?.statusCode) {
      errorData.errors?.length > 0
        ? errorData.errors.forEach((msg) =>
            toast.error(msg, {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }),
          )
        : toast.error(errorData?.message, {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: true,
            theme: "colored",
          });
      dispatch(clearHasError());
    }
  }, [errorData]);
const handleDownloadZip = async (row) => {
  console.log("rowrowrowrowrowrow",row);
  
  try {
    const blob = await dispatch(
      downloadScenarioZIP({
        exportid: row.exportid,
        scenarioid: row.scenarioid,
      }),
    );

    if (!blob) return;

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `scenario_${row.scenarioid}.zip`,
    );

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("ZIP download failed:", error);
  }
};
const handleDownloadComponent = async (exportid, file_name) => {
  if (downloadingFile) return;

  setDownloadingFile(file_name);

  toast.success(
    <p className="mx-2 tx-16 d-flex align-items-center mb-0">
      Preparing your file for download. This may take a few minutes for large files
    </p>,
    { position: toast.POSITION.TOP_RIGHT, hideProgressBar: false, theme: "colored", autoClose: 5000 },
  );

  try {
    const blob = await dispatch(downloadScenarioComponent({ exportid, file_name }));
    if (!blob) return;
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", file_name.split("/").pop());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Component download failed:", error);
    toast.error(
      <p className="mx-2 tx-16 d-flex align-items-center mb-0">
        Download failed: {error.message}
      </p>,
      { position: toast.POSITION.TOP_RIGHT, hideProgressBar: true, theme: "colored" },
    );
  } finally {
    setDownloadingFile(null);
  }
};
  const handleChangeView = (thisView) => {
    setQuickFilter("");
    dispatch(handleManageView(thisView));
    setBackView(thisView);
    setRowData(hasGetScenarioexportListSucc);
    setGridData(hasGetScenarioexportListSucc);
  };

  const zoomIn = () => {
    const i = colarray.indexOf(columnsPerRow);
    if (i > 0) setColumnsPerRow(colarray[i - 1]);
  };
  const zoomOut = () => {
    const i = colarray.indexOf(columnsPerRow);
    if (i < colarray.length - 1) setColumnsPerRow(colarray[i + 1]);
  };
  // ── Search filter ─────────────────────────────────────────────────────────
  const onFilterChanged = (val) => {
    setQuickFilter(val);
    const lower = val.toLowerCase();
    const filtered = (hasGetScenarioexportListSucc || []).filter(
      (d) =>
        d.file_name?.toLowerCase().includes(lower) ||
        d.exported_by?.toLowerCase().includes(lower) ||
        d.scenario_type?.toLowerCase().includes(lower) ||
        d.scenarioidentification?.toLowerCase().includes(lower) ||
        d.scenariotitle?.toLowerCase().includes(lower) ||
        d.status?.toLowerCase().includes(lower) ||
        !val,
    );
    setGridData(filtered);
    setRowData(filtered);
  };

  // ── AG Grid ───────────────────────────────────────────────────────────────
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    }),
    [],
  );

    const columnDefs = [
      {
        headerName: "Sr No.",
        field: "",
        cellRenderer: "srNoRender",
        floatingFilter: true,
        maxWidth: 120,
        sortable: false,
      },
      {
        headerName: "Identification No",
        field: "scenarioidentification",
        filter: true,
        floatingFilter: true,
        maxWidth: 240,
      },
      {
        headerName: "Scenario Title",
        field: "scenariotitle",
        filter: true,
        floatingFilter: true,
        minWidth: 240,
      },
      {
        headerName: "Exported By",
        field: "exported_by",
        filter: true,
        floatingFilter: true,
        maxWidth: 200,
      },
      {
        headerName: "Export Status",
        field: "status",
        filter: true,
        floatingFilter: true,
        cellRenderer: "vmStatusRenderer",
        maxWidth: 200,
      },
      {
        headerName: "Created On",
        field: "createdon",
        filter: true,
        floatingFilter: true,
        maxWidth: 200,
      },
      {
        headerName: "Action",
        field: "status",
        sortable: false,
        pinned: "right",
        maxWidth: 110,
        cellRenderer: "actionButtonRenderer",
      },
    ];

  const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };
  const onGridReady = useCallback((params) => {
  gridRef.current = params.api;
  const initialPageSize = params.api.paginationGetPageSize();
  const totalRows = params.api.getDisplayedRowCount();
  const newSize = Math.min(initialPageSize, totalRows);
  setPageSize((prev) => (prev !== newSize ? newSize : prev)); // ← only update if changed
}, []);

const onPaginationChanged = useCallback((params) => {
  if (params.api) {
    const newSize = Math.min(
      params.api.paginationGetPageSize(),
      params.api.getDisplayedRowCount(),
    );
    setPageSize((prev) => (prev !== newSize ? newSize : prev)); // ← only update if changed
  }
}, []);

  const frameworkComponents = {
    srNoRender: (props) => props.node.rowIndex + 1,

    vmStatusRenderer: (props) => {
      const map = {
        Inprogress: { bg: "orange", label: "In Progress" },
        Running: { bg: "#0d6efd", label: "Running" },
        Completed: { bg: "green", label: "Completed" },
        Complete: { bg: "green", label: "Completed" },
        Failed: { bg: "#dc3545", label: "Failed" },
      };
      const { bg, label } = map[props.value] || {
        bg: "#6c757d",
        label: props.value,
      };
      return (
        <span
          className="badge"
          style={{
            backgroundColor: bg,
            color: "white",
            fontSize: "12px",
            padding: "5px 10px",
            borderRadius: "12px",
          }}
        >
          {label}
        </span>
      );
    },

    actionButtonRenderer: (props) => {
      const status = props.data.status;
      const isDone = status === "Completed" || status === "Complete";
      const isDownloading = downloadingIds.includes(props.data.exportid);

      return isDone ? (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Download ZIP</Tooltip>}
        >
          <button
            className="btn btn-sm btn-success rounded-circle"
            onClick={() => handleDownloadZip(props.data)}
            disabled={isDownloading}
          >
            <i
              className={`fa ${isDownloading ? "fa-spinner fa-spin" : "fa-download"}`}
            />
          </button>
        </OverlayTrigger>
      ) : status === "Failed" ? (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Export Failed</Tooltip>}
        >
          <span className="text-danger">
            <i className="fa fa-times-circle" />
          </span>
        </OverlayTrigger>
      ) : (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Processing...</Tooltip>}
        >
          <span className="text-muted">
            <i className="fa fa-spinner fa-spin" />
          </span>
        </OverlayTrigger>
      );
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Seo title="Export Scenarios" />
      <ToastContainer />
      <Row className="row-sm">
        {view !== "Form" && (
          <Col md={12}>
            <Card className="custom-card overflow-hidden">
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="mb-0">Export Scenarios</h5>
                      {hasGetScenarioexportListSucc?.some(
                        (e) =>
                          e.status === "Inprogress" || e.status === "Running",
                      ) && (
                        <small className="text-muted">
                          <i className="fa fa-spinner fa-spin me-1" />
                          Checking status every 5s...
                        </small>
                      )}
                    </div>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <button
                            onClick={zoomOut}
                            className="btn bd bd-success text-success mx-1"
                            title="Zoom Out"
                          >
                            <i className="fas fa-search-plus" />
                          </button>
                          <button
                            onClick={zoomIn}
                            className="btn bd bd-success text-success"
                            title="Zoom In"
                          >
                            <i className="fas fa-search-minus" />
                          </button>
                          &nbsp;
                        </>
                      )}
                      <Button
                        type="button"
                        title="Card View"
                        variant="outline-success"
                        onClick={() => handleChangeView("card")}
                        className={
                          view === "card" ? "mx-1 active text-white" : "mx-1"
                        }
                      >
                        <i className="fe fe-grid" />
                      </Button>
                      <Button
                        type="button"
                        title="List View"
                        variant="outline-success"
                        onClick={() => handleChangeView("list")}
                        className={view === "list" ? "active text-white" : ""}
                      >
                        <i className="fe fe-list" />
                      </Button>
                      &nbsp;&nbsp;
                      <input
                        className="form-control bd bd-2 ms-2 w-auto"
                        value={quickFilter}
                        placeholder="Search..."
                        type="text"
                        onChange={(e) => onFilterChanged(e.target.value)}
                      />
                    </div>
                  </div>
                </Col>

                {/* ── List View ── */}
                <Col md={12}>
                  {view === "list" && (
                    <div
                      className="ag-theme-alpine mt-2"
                      style={{
                        height: `${gridHeight}px`,
                        width: "100%",
                        overflow: "visible",
                      }}
                    >
                      <AgGridReact
                        id="export_grid"
                        headerHeight={35}
                        rowHeight={40}
                        gridOptions={gridOptions}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        pagination={true}
                        paginationPageSize={20}
                        onGridReady={onGridReady}
                        components={frameworkComponents}
                        defaultColDef={defaultColDef}
                        onPaginationChanged={onPaginationChanged}
                      />
                    </div>
                  )}
                </Col>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* ── Card View ── */}
        <Col md={12}>
          {view === "card" &&
            (gridData?.length > 0 ? (
              <Row className="g-3 mb-3">
              {gridData.map((item, index) => {
            const isDone   = item.status === "Completed" || item.status === "Complete";
            const isFailed = item.status === "Failed";
            const isInProgress = !isDone && !isFailed;
            const isDownloading = downloadingIds.includes(item.exportid);
            // const isExpanded = expandedExportId === item.exportid;
            const components = componentDetails[item.exportid] || [];

            // Status-based box shadow
            const cardShadow = isDone
              ? "0 0 0 2px #27a85a33, 0 4px 16px #27a85a22"
              : isFailed
              ? "0 0 0 2px #e24b4a33, 0 4px 16px #e24b4a22"
              : "0 0 0 2px #f59e0b33, 0 4px 16px #f59e0b22";

  return (
    <Col key={index} md={12 / columnsPerRow}>
      <Card
        className="custom-card h-100 export-card"
        style={{ boxShadow: cardShadow, cursor: "pointer", transition: "all 0.2s ease-in-out" }}
        onClick={() => handleCardClick(item)}
      >
        <Card.Body className="p-3 d-flex flex-column justify-content-between text-center">
          <div>
         

            <h5 className="text-dark mt-2 mb-1 fs-5">
              <OverlayTrigger placement="top" overlay={<Tooltip>{item.scenariotitle}</Tooltip>}>
                <span className="d-inline-block text-truncate w-100" style={{ maxWidth: "100%" }}>
                  {item.scenariotitle?.length > 30
                    ? `${item.scenariotitle.substring(0, 27)}...`
                    : item.scenariotitle}
                </span>
              </OverlayTrigger>
            </h5>
            <p className="text-success mb-1">{item.scenarioidentification}</p>

            {/* Status badge */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              fontSize: "11px", fontWeight: 500, padding: "3px 10px",
              borderRadius: "20px", letterSpacing: "0.02em",
              background: isDone ? "#eaf3de" : isFailed ? "#fcebeb" : "#faeeda",
              color: isDone ? "#04973C" : isFailed ? "#a32d2d" : "#854f0b",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", display: "inline-block",
                background: isDone ? "#04973C" : isFailed ? "#e24b4a" : "#f59e0b",
                animation: isInProgress ? "pulse 1.2s infinite" : "none",
              }} />
              {isDone ? "Completed" : isFailed ? "Failed" : "In Progress"}
            </span>
          </div>
          {/* Action button */}
          <div onClick={(e) => e.stopPropagation()}>
            {isDone ? (
              <button onClick={() => handleDownloadZip(item)} disabled={isDownloading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "7px 18px", borderRadius: "8px", border: "none",
                  background: "#38a863", color: "#fff", fontSize: "13px",
                  fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                }}>
                <i className={`fa ${isDownloading ? "fa-spinner fa-spin" : "fa-download"}`} />
                {isDownloading ? "Downloading..." : "Download ZIP"}
              </button>
            ) : isFailed ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "8px",
                border: "0.5px solid #f7c1c1", background: "#fcebeb",
                color: "#a32d2d", fontSize: "12px",
              }}>
                <i className="fa fa-times-circle" />Export failed
              </span>
            ) : (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "8px",
                border: "0.5px solid #ddd", background: "#f8f8f8",
                color: "#888", fontSize: "12px",
              }}>
                <i className="fa fa-spinner fa-spin" />Processing backup…
              </span>
            )}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
})}
{/* ── Component Details Modal ── */}
{componentModal.show && (
  <Modal
    show={componentModal.show}
    onHide={() => setComponentModal({ show: false, item: null })}
    size="lg"
    centered
  >
    {/* ── Header ── */}
    <Modal.Header closeButton className="border-0 pb-0">
      <div className="w-100">
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}>
            <i className="fa fa-cubes fs-4 text-info" />
          </div>
          <div>
            <Modal.Title style={{ fontSize: "17px", fontWeight: 600, marginBottom: "2px" }}>
              {componentModal.item?.scenariotitle}
            </Modal.Title>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: "12px", opacity: 0.85 }}>
              <span><i className="fa fa-fingerprint me-1" />{componentModal.item?.scenarioidentification}</span>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "currentColor" }} />
              <span><i className="fa fa-file-archive me-1" />Export #{componentModal.item?.exportid}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal.Header>

    {/* ── Body ── */}
    <Modal.Body style={{ padding: "20px", maxHeight: "60vh", overflowY: "auto" }}>
      {componentLoading ? (
        <div className="text-center py-5">
          <div className="export-loader mx-auto mb-3" />
          <div className="fw-semibold text-secondary">Preparing component details...</div>
          <small className="text-muted">Please wait while we fetch export data</small>
        </div>

      ) : (componentDetails[componentModal.item?.exportid] || []).length === 0 ? (
        <div className="text-center py-5">
          <div className="mx-auto mb-3" style={{
            width: "70px", height: "70px", borderRadius: "20px",
            background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="fa fa-box-open fs-2 text-secondary" />
          </div>
          <h6 className="mb-1">No Components Found</h6>
          <small className="text-muted">This export does not contain any components.</small>
        </div>

      ) : (
        <div className="d-flex flex-column gap-3">
          {(componentDetails[componentModal.item?.exportid] || []).map((c, i) => {
            const isCompDone   = c.status === "Completed";
            const isCompFailed = c.status === "Failed";
            const isProcessing = !isCompDone && !isCompFailed;

            return (
              <div key={i} style={{
                borderRadius: "14px", padding: "14px 16px",
                border: "1px solid #072c5c",
                boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
              }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                  {/* Left — icon + info */}
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                      background: isCompDone ? "#ecfdf5" : isCompFailed ? "#fef2f2" : "#fff7ed",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <i className={`fa fs-5 ${
                        isCompDone   ? "fa-check-circle text-success" :
                        isCompFailed ? "fa-times-circle text-danger"  :
                                       "fa-sync-alt fa-spin text-warning"
                      }`} />
                    </div>

                    <div>
                      <div className="fw-bold" style={{ fontSize: "14px" }}>
                        {c.componentname}
                      </div>
                      <div className="d-flex align-items-center gap-3 mt-1"
                        style={{ fontSize: "11px", color: "#8fa3bb" }}>
                        <span><i className="fa fa-server me-1" />VMID: {c.vmid}</span>
                        <span><i className="fa fa-file me-1" />{c.file_name?.split("/").pop() || "No file"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right — status badge + download button */}
                  <div className="d-flex align-items-center gap-2">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "5px 11px", borderRadius: "20px",
                      fontSize: "11px", fontWeight: 600,
                      background: isCompDone ? "#dcfce7" : isCompFailed ? "#fee2e2" : "#ffedd5",
                      color:      isCompDone ? "#166534" : isCompFailed ? "#b91c1c" : "#9a3412",
                    }}>
                      <span style={{
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: "currentColor",
                        animation: isProcessing ? "pulse 1.2s infinite" : "none",
                      }} />
                      {isCompDone ? "Completed" : isCompFailed ? "Failed" : "Processing"}
                    </span>
                    {isCompDone && c.file_name && (
                      <button
                        onClick={() => handleDownloadComponent(
                          componentModal.item?.exportid,
                          c.file_name
                        )}
                        disabled={downloadingFile === c.file_name}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "5px 13px", borderRadius: "8px", border: "none",
                          background: downloadingFile === c.file_name ? "#6c757d" : "#0d6efd",
                          color: "#fff", fontSize: "12px", fontWeight: 500,
                          cursor: downloadingFile === c.file_name ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap", opacity: downloadingFile === c.file_name ? 0.7 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {downloadingFile === c.file_name ? (
                          <><i className="fa fa-spinner fa-spin" /> Downloading…</>
                        ) : (
                          <><i className="fa fa-download" /> Download .zst</>
                        )}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal.Body>

    {/* ── Footer — single row, clean ── */}
    <Modal.Footer className="border-0" style={{ padding: "14px 20px" }}>
      <div className="d-flex justify-content-between align-items-center w-100 gap-3">

        {/* Left — component count */}
        <span style={{ fontSize: "12px", fontWeight: 500, color: "#6c757d" }}>
          <i className="fa fa-cubes me-2 text-primary" />
          {(componentDetails[componentModal.item?.exportid] || []).length} component(s)
        </span>

        {/* Right — action buttons */}
        <div className="d-flex gap-2">
          <Button
            variant="light"
            onClick={() => setComponentModal({ show: false, item: null })}
            style={{ borderRadius: "10px", padding: "7px 18px", fontWeight: 500, fontSize: "13px" }}
          >
            Close
          </Button>
          {(componentModal.item?.status === "Completed" || componentModal.item?.status === "Complete") && (
            <Button
              variant="success"
              onClick={() => handleDownloadZip(componentModal.item)}
              style={{
                borderRadius: "10px", padding: "7px 18px",
                fontWeight: 600, fontSize: "13px",
                boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
              }}
            >
              <i className="fa fa-file-archive me-2" />
              Download Assets ZIP
            </Button>
          )}
        </div>

      </div>
    </Modal.Footer>
  </Modal>
)}
              </Row>
            ) : (
              <Row>
                <Col sm={12}>
                  <Card className="custom-card">
                    <Card.Body className="overflow-auto pd-t-10">
                      <Row className="text-center" style={{ height: "70vh" }}>
                        <Col md={10} className="mx-auto">
                          <Card style={{ border: "none" }}>
                            <Card.Body>
                              <div className="text-center mt-5">
                                <img
                                  src={crossEvalicon.src}
                                  alt="no-data"
                                  className="wd-150 mt-5"
                                />
                                <h5 className="mt-4">Loading...</h5>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            ))}
        </Col>
      </Row>
    </>
  );
};

ScenarioExportPage.layout = "Contentlayout";
export default ScenarioExportPage;
