import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
  Badge,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import CustomToggleButton from "@mui/material/ToggleButton";
import { useRouter } from "next/router";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as XLSX from "xlsx";
import FormBatches from "../../../shared/data/batches/batchesForm";
import {
  clearHasError,
  getBatchesList,
  clearSaveBatches,
  changeStatusBatch,
  clearBatchChangeStatus,
  deleteBatch,
  clearDeleteBatch,
} from "../../../shared/redux/slices/batches/batches";
import Seo from "../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import { useTranslation } from "react-i18next";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";

const Batches = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [compStatus, setCompStatus] = useState("true");
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [gridData, setGridData] = useState([]);
  const { t } = useTranslation();
  const [view, setView] = useState("card");
  const [oneClick, setOneClick] = useState(false);
  const [previousView, setPreviousView] = useState("card");
  const [backview, setBackView] = useState("card");
  const viewType = router.query.view || "card";
  useEffect(() => {
    if (viewType == "") {
      setView("list");
    } else {
      setView(viewType);
    }
  }, [viewType]);
  const {
    listBatchData,
    addBatchData,
    editStatusBatchResData,
    errorData,
    deleteBatchResp,
  } = useSelector((state) => {
    return {
      listBatchData:
        state &&
        state.batches &&
        state.batches.getBatchesListData &&
        state.batches.getBatchesListData.data,

      addBatchData: state && state.batches && state.batches.saveBatches,

      editStatusBatchResData:
        state && state.batches && state.batches.statusChangeBatch,

      deleteBatchResp: state && state.batches && state.batches.deleteBatches,

      errorData: state && state.batches && state.batches.error,
    };
  });
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      floatingFilter: true,
      maxWidth: 100,
    },
    {
      headerName: "Batch Name",
      field: "batchname",
      filter: true,
      floatingFilter: true,
      minWidth: 200,
      maxWidth: 350,
      flex: 2,
    },

    {
      headerName: "Student Count",
      field: "learner_count",
      filter: true,
      floatingFilter: true,
      cellRenderer: "studentCountRenderer",
      flex: 1,
    },
    {
      headerName: "Created By",
      field: "createdby_username",
      filter: true,
      floatingFilter: true,
      minWidth: 200,
      maxWidth: 300,
      flex: 2,
    },
    {
      headerName: "Status",
      field: "status",
      cellRenderer: "actionSwitchRenderer",
      pinned: "right",
      maxWidth: 80,
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      pinned: "right",
      maxWidth: 150,
    },
  ];

  const handleExport = () => {
    const filteredData = listBatchData.filter((row) => {
      if (compStatus === "") return true; // All
      return row.status === compStatus;
    });
    const exportData = filteredData
      .map((row) => {
        return row.learner_data.map((learner) => {
          const fullname = learner.firstname + " " + learner.lastname || " ";

          // Handling created and modified dates and times with fallback for invalid or null data
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
            row.batchname,
            fullname,
            row.status === "true" ? "Active" : "Inactive",
            createdDateOnly,
            createdTime,
            modifiedDateOnly,
            modifiedTime,
          ];
        });
      })
      .flat();

    const header = [
      "Batch Name",
      "Student Name",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batches");

    const formattedMenuName = "Batches";
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const filePrefix =
      compStatus === ""
        ? "Batches_All"
        : compStatus === "true"
          ? "Batches_Active"
          : "Batches_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    let val = data.toLowerCase();

    const filteredData = listBatchData.filter((d) => {
      const matchesBatchName =
        d.batchname && d.batchname.toLowerCase().indexOf(val) !== -1;
      const matchesLearnerCount =
        (typeof d.learner_count === "number" ||
          typeof d.learner_count === "string") &&
        String(d.learner_count).toLowerCase().indexOf(val) !== -1;
      const matchesCreatedBy =
        d.createdby_username &&
        d.createdby_username.toLowerCase().indexOf(val) !== -1; // Check the Created By field

      return matchesBatchName || matchesLearnerCount || matchesCreatedBy; // Return true if any match
    });

    if (compStatus === "true") {
      setRowData(filteredData.filter((data) => data.status === "true"));
      setGridData(filteredData.filter((data) => data.status === "true"));
    } else if (compStatus === "false") {
      setRowData(filteredData.filter((data) => data.status === "false"));
      setGridData(filteredData.filter((data) => data.status === "false"));
    } else {
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };

  useEffect(() => {
    if (listBatchData) {
      if (compStatus === "") {
        setGridData(listBatchData);

        setRowData(listBatchData);
      } else if (compStatus === "true") {
        const filteredData = listBatchData.filter(
          (data) => data.status === "true"
        );
        setGridData(filteredData);

        setRowData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = listBatchData.filter(
          (data) => data.status === "false"
        );
        setGridData(filteredData);

        setRowData(filteredData);
      }
    }
  }, [listBatchData, compStatus]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    setBackView(thisView);
    router.push(`/batches?view=${thisView || "list"}`);
    if (compStatus == "") {
      setRowData(listBatchData);
      setGridData(listBatchData);
    } else if (compStatus == "true") {
      const filteredData =
        listBatchData.length > 0 &&
        listBatchData.filter((data) => data?.status?.toString() == "true");
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        listBatchData.length > 0 &&
        listBatchData.filter((data) => data?.status?.toString() == "false");
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

  const handleEdit = (props) => {
    handleOneClick(false);
    setPreviousView(view);
    setBackView(view);
    if (props && props.batchid) {
      setRowId(props.batchid);
      setView("Form");
    }
  };

  const handleReturnFromEdit = () => {
    setView(previousView);
  };

  useEffect(() => {
    if (addBatchData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addBatchData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      setView("list");
      dispatch(getBatchesList());
      dispatch(clearSaveBatches());
    }
  }, [addBatchData]);

  useEffect(() => {
    if (editStatusBatchResData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusBatchResData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getBatchesList());
      dispatch(clearBatchChangeStatus());
    }
  }, [editStatusBatchResData]);

  useEffect(() => {
    dispatch(getBatchesList());
  }, []);

  useEffect(() => {
    if (deleteBatchResp?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {deleteBatchResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getBatchesList());
      dispatch(clearDeleteBatch());
    }
  }, [deleteBatchResp]);

  const handleReturnView = (props) => {
    router.push(`/batches_view/${props?.batchid}?backView=${view}`);
  };

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
    };
  }, []);

  const [rowId, setRowId] = useState("");
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
        const payload = {
          batchid: data.batchid.toString(),
          status: data.status.toString() === "false" ? "true" : "false",
        };

        dispatch(changeStatusBatch(payload));
      }
    });
  };

  const frameworkComponents = {
    studentCountRenderer: function (props) {
      const learnerCount = props.value;
      const truncatedCount =
        learnerCount && learnerCount.length > 20
          ? `${learnerCount.substring(0, 20)}...`
          : learnerCount;

      return (
        <Badge
          pill
          bg="dark"
          className="pro-user-desc mb-1 mt-1 jsutify-content-center"
          onClick={() => handleReturnView(props.data)}
        >
          {truncatedCount}
        </Badge>
      );
    },

    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },

    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleShowEditView={true}
          handleEdit={handleEdit}
          propsVal={props}
          handleShowEdit={true}
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

  const handleOneClick = (flag) => {
    setOneClick(flag);
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
      <Seo title={t("batches.title")} />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            {(view === "list" || view === "card") && (
              <Card.Body>
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center ">
                    <h5>Batches </h5>
                    <div className="d-flex align-items-center">
                      {view === "card" && (
                        <>
                          <button
                            onClick={zoomOut}
                            className="btn bd bd-success text-success mx-1 "
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
                          setCompStatus(e.target.value),
                          dispatch(getBatchesList({ status: e.target.value }));
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
                      &nbsp;&nbsp;
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
                        onClick={() => {
                          setBackView(view);
                          setView("Form");
                          setRowId("");
                        }}
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
              </Card.Body>
            )}

            {view === "list" && (
              <Card.Body>
                <Col md={12}>
                  {view == "list" ? (
                    <div
                      className="ag-theme-alpine mt-2"
                      style={{ height: "40em", width: "100%" }}
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
                        components={frameworkComponents}
                        defaultColDef={defaultColDef}
                        overlayNoRowsTemplate={
                          rowData && rowData.length === 0 ? "No Rows to Show" : "Loading..."
                        }
                      ></AgGridReact>
                    </div>
                  ) : (
                    ""
                  )}
                </Col>
              </Card.Body>
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
                        <Card className="card custom-card our-team">
                          <Card.Body className="p-3">
                            <div className="text-center mb-2">
                              <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                <a>
                                  {item.batchname && item.batchname.lengt > 20
                                    ? `${item.batchname.substring(0, 20)}...`
                                    : item.batchname}{" "}
                                </a>
                              </h5>
                              <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                <p className="pro-user-desc text-muted mb-1 mt-1 fs-6">
                                  {item.createdby_username &&
                                    item.createdby_username.lengt > 20
                                    ? `${item.createdby_username.substring(
                                      0,
                                      20
                                    )}...`
                                    : item.createdby_username}{" "}
                                </p>
                              </h5>
                              <Badge
                                pill
                                bg="dark"
                                className="pro-user-desc mb-1 mt-1"
                                onClick={() => handleReturnView(item)}
                              >
                                {item.learner_count &&
                                  item.learner_count.length > 20
                                  ? `${item.learner_count.substring(0, 20)}...`
                                  : item.learner_count}
                              </Badge>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() => handleReturnView(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>View</Tooltip>}
                                >
                                  <i className="fe fe-eye"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
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
                          className="signpages ext-center"
                          style={{ height: "70vh" }}
                        >
                          <Col md={10} className="mx-auto">
                            <Card
                              style={{
                                border: "none",
                                backgroundColor: "#f6f7fb",
                              }}
                            >
                              <Card.Body>
                                <div className="text-center">
                                  <img
                                    src={crossEvalicon.src}
                                    alt="user-img"
                                    className="wd-150"
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
      </Row>
      {view == "Form" ? (
        <FormBatches
          setView={handleReturnFromEdit}
          rowId={rowId}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
          backView={backview}
        />
      ) : (
        <></>
      )}
    </>
  );
};
Batches.layout = "Contentlayout";
export default Batches;
