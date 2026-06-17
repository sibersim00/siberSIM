import { useState, useEffect, useMemo, useRef,useCallback  } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import {
  getComponentList,
  clearHasError,
} from "../../../../shared/redux/slices/customcomponent/customcomponentManage";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import "../../../../shared/utils/i18n";
import CustomComponentForm from "../../../../shared/data/customComponent/customComponentForm";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../../public/assets/img/dummy.jpg";
import { useTranslation } from "react-i18next";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const ManageCustomComponent = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { push } = useRouter();
  const statusFromQuery = router.query.status || "pending";
  const [compStatus, setCompStatus] = useState(statusFromQuery);
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [rowId, setRowId] = useState("");
  const [oneClick, setOneClick] = useState(false);
  const [backview, setBackView] = useState("card");
  const viewType = router.query.view || "card";
     const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  useEffect(() => {
    if (viewType == "") {
      setView("list");
    } else {
      setView(viewType);
    }
  }, [viewType]);
  const {
    hasGetComponentListSucc,
    errorData,
  } = useSelector((state) => {
    return {
      hasGetComponentListSucc:
        state &&
        state.customComponent &&
        state.customComponent.getComponentListData &&
        state.customComponent.getComponentListData.data,

      errorData: state && state.customComponent && state.customComponent.error,
    };
  });
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      minWidth: 80,
      sortable: false,
    },
    {
      headerName: "Component Category",
      field: "categoryname",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },

    {
      headerName: "Type",
      field: "componenttype",
      filter: true,
      floatingFilter: true,
      minWidth: 100,
    },
    {
      headerName: "Vmid",
      field: "vmid",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      cellRenderer: "vmidWithImageRenderer",
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) => {
        if (!params.value) return "";
        return params.value.charAt(0).toUpperCase() + params.value.slice(1);
      },
    },

    {
      headerName: "Name",
      field: "componentname",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Configuration Delay",
      field: "duration",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) =>
        params.value != null ? `${params.value} Sec` : "N/A",
    },

    {
      headerName: "Virtual Memory",
      field: "main_memory",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) => (params.value ? `${params.value} M` : "N/A"),
    },
    {
      headerName: "Virtual CPU",
      field: "main_cores",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) =>
        params.value !== undefined && params.value !== null
          ? `${params.value} Cores`
          : "N/A",
    },
    {
      headerName: "Storage Size",
      field: "main_storage",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueFormatter: (params) => {
        const val = params.value;
        if (val == null || val === "") return "N/A";
        const match = val.toString().match(/^([\d.]+)([KMGTP])$/i);
        if (match) {
          const size = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          const sizeInGB = {
            K: size / (1024 * 1024),
            M: size / 1024,
            G: size,
            T: size * 1024,
            P: size * 1024 * 1024,
          }[unit];
          return `${Math.round(sizeInGB)} GB`;
        }
        const numeric = parseFloat(val);
        return isNaN(numeric) ? "N/A" : `${Math.round(numeric)} GB`;
      },
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      minWidth: 130,
      cellRenderer: "actionButtonRenderer",
    },
  ];
  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

 const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };

const onGridReady = useCallback((params) => {
  gridRef.current = params.api;

  // Set correct height on first load as well
  const initialPageSize = params.api.paginationGetPageSize();
  const totalRows = params.api.getDisplayedRowCount();
  const effectiveRows = Math.min(initialPageSize, totalRows);
  setPageSize(effectiveRows);
}, []);
  
    // Fires when page size changes via the built-in dropdown
   const onPaginationChanged = useCallback((params) => {
  if (params.api) {
    const newPageSize = params.api.paginationGetPageSize();
    const totalRows = params.api.getDisplayedRowCount(); // ✅ actual rows in data

    // Use whichever is smaller — actual rows vs page size
    const effectiveRows = Math.min(newPageSize, totalRows);
    setPageSize(effectiveRows);
  }
}, []);

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    let filteredList = hasGetComponentListSucc;

    if (compStatus !== "") {
      filteredList = filteredList.filter(
        (item) => item.status?.toLowerCase() === compStatus.toLowerCase()
      );
    }

    const temp = filteredList.filter((item) =>
      Object.keys(item).some((key) => {
        const fieldValue = item[key];
        if (typeof fieldValue === "string") {
          return fieldValue.toLowerCase().includes(val);
        }
        if (typeof fieldValue === "number") {
          return fieldValue.toString().includes(val);
        }
        return false;
      })
    );

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
    setBackView(thisView);
    router.push(`/customcomponent?view=${thisView || "list"}&status=${compStatus}`);
    if (compStatus === "") {
      setGridData(hasGetComponentListSucc);
      setRowData(hasGetComponentListSucc);
    }
    else if (compStatus === "true") {
      const filteredData = hasGetComponentListSucc.filter(
        (data) => data?.status?.toLowerCase() !== "false"
      );
      setGridData(filteredData);
      setRowData(filteredData);
    }
    else if (compStatus === "false") {
      const filteredData = hasGetComponentListSucc.filter(
        (data) => data?.status?.toLowerCase() === "false"
      );
      setGridData(filteredData);
      setRowData(filteredData);
    }

  };

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

  useEffect(() => {
    dispatch(getComponentList());
  }, []);
  const handleReturnView = (props) => {
    router.push(`/custom_component_view/${props?.customcomponentuuid}?backView=${view}&status=${compStatus}`);
  };

  useEffect(() => {
    if (hasGetComponentListSucc) {
      if (!compStatus) {
        setGridData(hasGetComponentListSucc);
        setRowData(hasGetComponentListSucc);
      } else {
        const filteredData = hasGetComponentListSucc.filter(
          (data) => data?.status?.toLowerCase() === compStatus.toLowerCase()
        );
        setGridData(filteredData);
        setRowData(filteredData);
      }
    }
  }, [hasGetComponentListSucc, compStatus]);

  const handleEdit = (props) => {
    handleOneClick(false);
    setBackView(view);
    if (props && props.customcomponentuuid) {
      setRowId(props.customcomponentuuid);

      setView("Form");
    }
  };

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      const status = props?.data?.status?.toLowerCase();
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleShowEditView={true}
          handleEdit={handleEdit}
          propsVal={props}
          handleShowEdit={status === "pending"}
        />


      );
    },
    vmidWithImageRenderer: function (props) {
      const { data } = props;
      const imageUrl = data?.componentimage
        ? `${process.env.API_URL_FILEMANAGER}${data.componentimage}`
        : dummy_network;

      return (
        <div className="d-flex align-items-center gap-2">
          <span>{data?.vmid} - </span>
          <img
            src={imageUrl}
            alt="vm"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = dummy_network.src;
            }}
            style={{
              width: "22px",
              height: "22px",
              objectFit: "cover",
            }}
          />
        </div>
      );
    },

    identificationRender: function (props) {
      return (
        <div className="identification-container">
          <span>{props?.data?.componentidentification}</span> &nbsp;
          {props?.data && props.data?.url ? (
            <a href={props.data.url} target="_blank">
              <Badge bg="danger">
                <i class="fa fa-link" aria-hidden="true"></i>
              </Badge>
            </a>
          ) : (
            ""
          )}
        </div>
      );
    },
  };

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
      <Seo title="Custom Components" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            {(view === "list" || view === "card") && (
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Custom Component</h5>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <button
                            onClick={zoomOut}
                            className="btn bd bd-success text-success mx-1"
                            title="Zoom In"
                          >
                            <i className="fas fa-search-plus"></i>
                          </button>
                          <button
                            onClick={zoomIn}
                            className="btn bd bd-success text-success"
                            title="Zoom Out"
                          >
                            <i className="fas fa-search-minus"></i>
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
                        <i className="fe fe-grid"></i>
                      </Button>
                      <Button
                        type="button"
                        title="List View"
                        variant="outline-success"
                        onClick={() => handleChangeView("list")}
                        className={view === "list" ? "active text-white" : ""}
                      >
                        <i className="fe fe-list"></i>
                      </Button>
                      &nbsp;&nbsp;
                      <ToggleButtonGroup
                        color="success"
                        value={compStatus}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;

                          setCompStatus(value);

                          router.push(
                            {
                              pathname: router.pathname,
                              query: { ...router.query, status: value },
                            },
                            undefined,
                            { shallow: true }
                          )
                        }}
                        aria-label="Platform"
                      >
                        <CustomToggleButton value="pending" defaultChecked>
                          Pending
                        </CustomToggleButton>
                        <CustomToggleButton value="approved">Approved</CustomToggleButton>
                        <CustomToggleButton value="reject">Rejected</CustomToggleButton>
                      </ToggleButtonGroup>
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
              </Card.Body>
            )}
            {view === "list" && (
              <Col md={12}>
                {view == "list" ? (
                  <div
                     className="ag-theme-alpine mt-2"
                       style={{
                          height: `${gridHeight}px`, //  dynamic, grows with page size
                          width: "100%",
                          overflow: "visible",        // no internal scrollbar
                        }}
                  >
                    <AgGridReact
                      id="cat_grid"
                      headerHeight={35}
                      rowHeight={40}
                      gridOptions={gridOptions}
                      rowData={rowData}
                      columnDefs={columnDefs}
                      pagination={true}
                      onGridReady={onGridReady}
                      paginationPageSize={20}
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
                      onPaginationChanged={onPaginationChanged} //  track page size changes
                      
                    ></AgGridReact>
                  </div>
                ) : (
                  ""
                )}
              </Col>
            )}
          </Card>
        </Col>

        <Col md={12}>
          {view == "card" ? (
            <>
              {gridData && gridData.length > 0 ? (
                <Row className="row-sm">
                  {gridData.map((item, index) => {
                    return (
                      <Col key={index} md={12 / columnsPerRow} className="p-0">
                        <Card className="card custom-card our-team component-status-card">
                          <Card.Body className="p-3">
                            <div className="text-center mb-2">
                              <div
                                className="rounded-circle mx-auto d-flex justify-content-center align-items-center "
                                style={{
                                  width: "100px",
                                  height: "100px",
                                }}
                              >
                                <img
                                  alt="avatar"
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                  }}
                                  src={
                                    `${process.env.API_URL_FILEMANAGER}${item?.componentimage}` ||
                                    dummy_network.src
                                  }
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = dummy_network.src;
                                  }}
                                />
                              </div>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-category">
                                    Category: {item.categoryname}
                                  </Tooltip>
                                }
                              >
                                <h6 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                  <a>{item.categoryname}</a>
                                </h6>
                              </OverlayTrigger>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-vmid-name pointer">
                                    VM Name: {item.componentname}
                                  </Tooltip>
                                }
                              >
                                <h5 className="pro-user-desc mb-1 mt-1 pointer">
                                  {item.componentname}
                                </h5>
                              </OverlayTrigger>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-vmid pointer">
                                    VMID: {item.vmid}
                                  </Tooltip>
                                }
                              >
                                <p className="pro-user-desc text-success mb-1 mt-1 pointer">
                                  {item.vmid}
                                </p>
                              </OverlayTrigger>
                            </div>
                            <div className="contact-info mb-0 text-center">

                              <div className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip>{item.componenttype}</Tooltip>
                                  }
                                >
                                  <i className="fe fe-box"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              {item?.status?.toLowerCase() === "pending" && (
                                <div
                                  className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
                                  onClick={() => handleEdit(item)}
                                >
                                  <OverlayTrigger placement="bottom" overlay={<Tooltip>Update</Tooltip>}>
                                    <i className="fe fe-edit"></i>
                                  </OverlayTrigger>
                                </div>
                              )}

                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() =>
                                  push(
                                    `/custom_component_view/${item?.customcomponentuuid}?backView=${view}&status=${compStatus}`
                                  )
                                }
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>View</Tooltip>}
                                >
                                  <i className="fe fe-eye"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;

                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <Row>
                  <Col sm={12}>
                    <Card className="custom-card">
                      <Card.Body className="overflow-auto pd-t-10">
                        <Row
                          className=" text-center"
                          style={{ height: "70vh" }}
                        >
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                                // backgroundColor: "#f6f7fb",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center mt-5">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
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
              )}
            </>
          ) : (
            ""
          )}
        </Col>
      </Row>
      {view == "Form" ? (
        <CustomComponentForm
          setView={setView}
          rowId={rowId}
          rowData={rowData}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
          backView={backview}
          mode={rowId ? "update" : "add"}
        />
      ) : (
        <></>
      )}
    </>
  );
};
ManageCustomComponent.layout = "Contentlayout";
export default ManageCustomComponent;



