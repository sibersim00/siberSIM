import React, { useState, useEffect, useMemo,useRef,useCallback  } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as XLSX from "xlsx";
import FormWidgets from "../../../../shared/data/mastersModal/widgetsForm";
import {
  clearHasError,
  getwidgetList,
  savewidget,
  clearSavewidget,
  clearupdatewidget,
  clearimportFaqModal,
  changeStatusFaq,
  clearFaqChangeStatus,
  deleteWidget,
  clearVerifyFaqModel,
  cleardeleteWidget,
} from "../../../../shared/redux/slices/masters/widgets";
import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../../shared/data/masterButtons/toggleButton";
import { useTranslation } from "react-i18next";
import ImportFaqsList from "../../../../shared/data/mastersModal/importFaqsList";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;


const Widgets = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [openImportModal, setOpenImportModal] = useState(false);
  const [showListImort, setShowListImport] = useState(true);
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setformModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    webbrowserwidgetid: 0,
    widget_name: "",
    widget_url: "",
    status: true,
    order: 0,
  });

  const [oneClick, setOneClick] = useState(false);
      const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  const {
    hasGetwidgetListSucc,
    hasGetSavewidgetSucc,
    hasGetUpdateWidgetSucc,
    editStatusFaqsResData,
    errorData,
    hasGetDeletewidgetSucc,
    ImportFaqsListData,
  } = useSelector((state) => {
    return {
      hasGetwidgetListSucc:
        state &&
        state.widgets &&
        state.widgets.getwidgetData &&
        state.widgets.getwidgetData.data,

      hasGetSavewidgetSucc: state && state.widgets && state.widgets.savewidget,

      hasGetUpdateWidgetSucc:
        state && state.widgets && state.widgets.updateWidget,

      editStatusFaqsResData:
        state && state.widgets && state.widgets.statusChangeFaqs,

      hasGetDeletewidgetSucc:
        state && state.widgets && state.widgets.deletewidget,

      errorData: state && state.widgets && state.widgets.error,

      ImportFaqsListData: state?.widgets?.importFaqs,
    };
  });

  useEffect(() => {
    dispatch(getwidgetList());
  }, []);
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      floatingFilter: true,
      maxWidth: 80,
       sortable: false,
    },
    {
      headerName: "Widget Name",
      field: "widget_name",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Widget URL",
      field: "widget_url",
      filter: true,
      flex: 1,
      floatingFilter: true,
    },
    {
      headerName: "Order",
      field: "order",
      filter: true,
      maxWidth: 100,
      floatingFilter: true,
    },
    {
      headerName: "Status",
      field: "status",
      pinned: "right",
      cellRenderer: "actionSwitchRenderer",
      width: 80,
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      cellRenderer: "actionButtonRenderer",
      width: 100,
    },
  ];

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };
  //Function to Download Excel file
  const handleExport = () => {
    const filteredData = hasGetwidgetListSucc.filter((row) => {
      if (compStatus === "") return true; // All
      return row.status === compStatus;
    });
    const exportData = filteredData.map((row) => {
      const createdDate = row.createdon ? new Date(row.createdon) : null;
      const modifiedDate = row.modifiedon ? new Date(row.modifiedon) : null;

      const createdDateOnly =
        createdDate && !isNaN(createdDate)
          ? createdDate.toLocaleDateString()
          : "N/A";
      const createdTime =
        createdDate && !isNaN(createdDate)
          ? createdDate.toLocaleTimeString()
          : "N/A";

      const modifiedDateOnly =
        modifiedDate && !isNaN(modifiedDate)
          ? modifiedDate.toLocaleDateString()
          : " ";
      const modifiedTime =
        modifiedDate && !isNaN(modifiedDate)
          ? modifiedDate.toLocaleTimeString()
          : " ";

      return [
        row.webbrowserwidgetid,
        row.widget_name,
        row.widget_url,
        row.order,
        row.status === "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "FAQs Id",
      "widget_name",
      "widget_url",
      "Order By",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Widgets");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15); // YYYYMMDD_HHMMSS

    const filePrefix =
      compStatus === ""
        ? "Widgets_All"
        : compStatus === "true"
        ? "Widgets_Active"
        : "Widgets_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
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
    let val = data.toLowerCase();

    const filterFn = (d) => {
      return (
        d.widget_name?.toLowerCase().includes(val) ||
        d.widget_url?.toLowerCase().includes(val) ||
        d.order?.toString().includes(val) ||
        !val
      );
    };

    const filterDataByStatus = (statusCheck) => {
      const filteredData = hasGetwidgetListSucc.filter(
        (item) => item?.status?.toString() === statusCheck
      );
      const temp = filteredData.filter(filterFn);
      setGridData(temp);
      setRowData(temp);
    };

    if (compStatus === "") {
      const temp = hasGetwidgetListSucc.filter(filterFn);
      setGridData(temp);
      setRowData(temp);
    } else if (compStatus === "true") {
      filterDataByStatus("true");
    } else if (compStatus === "false") {
      filterDataByStatus("false");
    }
  };

  useEffect(() => {
    if (hasGetwidgetListSucc) {
      if (compStatus === "") {
        setRowData(hasGetwidgetListSucc);
        setGridData(hasGetwidgetListSucc);
      } else if (compStatus === "true") {
        const filteredData = hasGetwidgetListSucc.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = hasGetwidgetListSucc.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      }
    }
  }, [hasGetwidgetListSucc, compStatus]);
  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    if (compStatus == "") {
      setRowData(hasGetwidgetListSucc);
      setGridData(hasGetwidgetListSucc);
    } else if (compStatus == "true") {
      const filteredData =
        hasGetwidgetListSucc.length > 0 &&
        hasGetwidgetListSucc.filter(
          (data) => data?.status?.toString() == "true"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        hasGetwidgetListSucc.length > 0 &&
        hasGetwidgetListSucc.filter(
          (data) => data?.status?.toString() == "false"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };

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

  useEffect(() => {
    setOpenImportModal(false);
  }, []);

  useEffect(() => {
    if (hasGetSavewidgetSucc?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasGetSavewidgetSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getwidgetList());
      dispatch(clearSavewidget());
    }
  }, [hasGetSavewidgetSucc]);

  useEffect(() => {
    if (hasGetUpdateWidgetSucc?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasGetUpdateWidgetSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getwidgetList());
      dispatch(clearupdatewidget());
    }
  }, [hasGetUpdateWidgetSucc]);


  useEffect(() => {
    if (editStatusFaqsResData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusFaqsResData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getwidgetList());
      dispatch(clearFaqChangeStatus());
    }
  }, [editStatusFaqsResData]);

  useEffect(() => {
    if (ImportFaqsListData?.statusCode) {
      setOpenImportModal(false);
      dispatch(getwidgetList());
    }
  }, [ImportFaqsListData]);

  useEffect(() => {
    if (hasGetDeletewidgetSucc?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasGetDeletewidgetSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getwidgetList());
      dispatch(cleardeleteWidget());
    }
  }, [hasGetDeletewidgetSucc]);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    };
  }, []);

  const handleEdit = (props) => {
    handleOneClick(false);
    if (props && props.widget_name) {
      setRowValues({
        title: "Update",
        webbrowserwidgetid: props.webbrowserwidgetid,
        widget_name: props.widget_name,
        status: props.status,
        widget_url: props.widget_url,
        order: props.order, // new
      });
      setformModal(true);
    }
  };

  const handleView = (props) => {
    handleOneClick(false);
    if (props && props.widget_name) {
      setRowValues({
        title: "View",
        webbrowserwidgetid: props.webbrowserwidgetid,
        widget_name: props.widget_name,
        status: props.status,
        widget_url: props.widget_url,
        order: props.order,
      });
      setViewModal(true);
    }
  };

  const handleDeletecard = (item) => {
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_delete"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          webbrowserwidgetid: item?.webbrowserwidgetid,
        };
        dispatch(deleteWidget(payload));
      }
    });
  };
  const handleDelete = (props, flag) => {
    if (flag == true) {
      const payload = {
        webbrowserwidgetid: props?.webbrowserwidgetid,
      };
      dispatch(deleteWidget(payload));
    }
  };

  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to change the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const Id = data?.webbrowserwidgetid;
        const payload = {
          status: data.status == "false" ? "true" : "false",
          webbrowserwidgetid: Id,
        };
        dispatch(changeStatusFaq(payload, Id));
      }
    });
  };

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
          handleDelete={handleDelete}
        />
      );
    },

    actionSwitchRenderer: function (props) {
      return (
        <ToggleButton
          data={props?.data}
          handleStatusSwitch={handleStatusSwitch}
        />
      );
    },
  };

  const handleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues({
      title: "Add",
      webbrowserwidgetid: 0,
      widget_name: "",
      widget_url: "",
      status: true,
    });
    setformModal(flag);
  };
  const handleViewModal = (flag) => {
    handleOneClick(false);
    setViewModal(flag);
  };
  const [columnsPerRow, setColumnsPerRow] = useState(3); // Default value
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

  const handleImportModal = () => {
    setOpenImportModal(!openImportModal);
  };
  return (
    <>
      <Seo title="Widgets" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Widgets</h5>
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
                        setCompStatus(e.target.value);
                        dispatch(getwidgetList({ status: e.target.value }));
                      }}
                      aria-label="Platform"
                    >
                      <CustomToggleButton value="">All</CustomToggleButton>
                      <CustomToggleButton value="true" defaultChecked>
                        Active
                      </CustomToggleButton>
                      <CustomToggleButton value="false">
                        Inactive
                      </CustomToggleButton>
                    </ToggleButtonGroup>
            
                    <Button
                      type="button"
                      variant="outline-info"
                      onClick={() => handleExport()}
                    >
                      <i className="fa fa-file-excel-o"></i> Export
                    </Button>
                    &nbsp;
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={() => handleFormModal(true)}
                    >
                      <i className="fa fa-plus"></i> Add
                    </Button>
                    &nbsp;
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
                      paginationPageSize={20}
                      onGridReady={onGridReady}
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
                         onPaginationChanged={onPaginationChanged} //  track page size changes
                    ></AgGridReact>
                  </div>
                ) : (
                  ""
                )}
              </Col>
            </Card.Body>
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
                        <Card className="card custom-card our-team h-90">
                          <Card.Body className="p-3">
                            <div className="text-center mb-2">
                              <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                <a>
                                  {item.widget_name &&
                                  item.widget_name.lengt > 20
                                    ? `${item.widget_name.substring(0, 20)}...`
                                    : item.widget_name}{" "}
                                </a>
                              </h5>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              <div
                                className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
                                onClick={() => handleEdit(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Update</Tooltip>}
                                >
                                  <i className="fe fe-edit"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                               <div
                                className="btn btn-sm ripple bg-primary-transparent text-primary rounded-circle"
                               
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip><a>order : {item.order} </a></Tooltip>}
                                >
                                  <i className="fe fe-grid"></i>
                                </OverlayTrigger>
                              </div>
                              <div
                                className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle"
                                onClick={() => {
                                  const url = item.widget_url?.startsWith(
                                    "http"
                                  )
                                    ? item.widget_url
                                    : `https://${item.widget_url}`;
                                  window.open(url, "_blank");
                                }}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>URL</Tooltip>}
                                >
                                  <i className="fa fa-external-link"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle"
                                onClick={() => {
                                  handleDeletecard(item);
                                }}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Delete</Tooltip>}
                                >
                                  <i className="fe fe-trash"></i>
                                </OverlayTrigger>
                              </div>
                              <div className="btn btn-sm ripple me-1 mg-t-5">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{"Change Status"}</Tooltip>}
                                >
                                  <label className="custom-switch mg-t-50">
                                    <input
                                      type="checkbox"
                                      name="custom-switch-checkbox1"
                                      className="custom-switch-input"
                                      checked={item?.status === "true"}
                                      onChange={() => handleStatusSwitch(item)}
                                    />
                                    <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                  </label>
                                </OverlayTrigger>
                              </div>
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
                          className="text-center"
                          style={{ height: "70vh" }}
                        >
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center mt-5">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150 mt-5"
                                  />
                                  <h5 className="mt-4">No data found.</h5>
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
        <ImportFaqsList
          openImportModal={openImportModal}
          handleImportModal={handleImportModal}
          showListImort={showListImort}
          setShowListImport={setShowListImport}
        />
      </Row>

      <FormWidgets
        openFlag={formModal}
        handleFormModal={handleFormModal}
        rowValues={rowValues}
        oneClick={oneClick}
        handleOneClick={handleOneClick}
      />
      {/* <ViewFaqs
        openFlag={viewModal}
        handleViewModal={handleViewModal}
        rowValues={rowValues}
        oneClick={oneClick}
        handleOneClick={handleOneClick}
      /> */}
    </>
  );
};

Widgets.layout = "Contentlayout";
export default Widgets;

