import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import TB from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { AgGridReact } from "ag-grid-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../../shared/layout-components/seo/seo";
import AddLearner from "./add-learner";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import StatusBadgeRenderer from "../../../shared/data/masterButtons/status-badge";
import { useRouter } from "next/router";
import ImageViewer from "react-simple-image-viewer";
import "../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import ImportQuestion from "./import-learner";
import {
  getLearnersManageList,
  saveLearnersChangeStatus,
  clearSaveLearnersChangeStatus,
  clearHasError,
} from "../../../shared/redux/slices/learner/learnerManage";
import dummy_profile from "../../../public/assets/img/dummy_profile.png";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const ManageLearner = () => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const { t } = useTranslation();
  const [empStatus, setEmpStatus] = useState("true");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [view, setView] = useState("list");
  const [quickFilter, setQuickFilter] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [addLear, setAddLear] = useState(false);
  const [learnerDataItem, setLearnerDataItem] = useState("");
  const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  const { learnersListResp, manageLearnerStatus, errorData } = useSelector(
    (state) => {
      return {
        learnersListResp:
          state &&
          state.learnerData &&
          state.learnerData.getLearnersData &&
          state.learnerData.getLearnersData.data,
        manageLearnerStatus:
          state && state.learnerData && state.learnerData.statusChangeTutor,
        errorData: state && state.learnerData && state.learnerData.error,
      };
    }
  );

  useEffect(() => {
    dispatch(getLearnersManageList());
  }, []);

  let viewDemoShow = (modal) => {
    setLearnerDataItem("");
    setAddLear(true);
  };
  let viewDemoClose = (modal) => {
    switch (modal) {
      case "addLearner":
        setAddLear(false);
        setLearnerDataItem("");
        break;
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
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    if (learnersListResp && learnersListResp != undefined) {
      if (empStatus == "") {
        setRowData(learnersListResp);
        setGridData(learnersListResp);
      } else if (empStatus == "true") {
        const filteredData =
          learnersListResp.length > 0 &&
          learnersListResp.filter((data) => data?.status?.toString() == "true");
        setRowData(filteredData);
        setGridData(filteredData);
      } else if (empStatus == "false") {
        const filteredData =
          learnersListResp.length > 0 &&
          learnersListResp.filter(
            (data) => data?.status?.toString() == "false"
          );
        setRowData(filteredData);
        setGridData(filteredData);
      }
    }
  }, [learnersListResp, empStatus]);

  useEffect(() => {
    if (manageLearnerStatus?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {manageLearnerStatus?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      dispatch(getLearnersManageList());
      dispatch(clearSaveLearnersChangeStatus());
    }
  }, [manageLearnerStatus]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    if (empStatus == "") {
      setRowData(learnersListResp);
      setGridData(learnersListResp);
    } else if (empStatus == "true") {
      const filteredData =
        learnersListResp.length > 0 &&
        learnersListResp.filter((data) => data?.status?.toString() == "true");
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (empStatus == "false") {
      const filteredData =
        learnersListResp.length > 0 &&
        learnersListResp.filter((data) => data?.status?.toString() == "false");
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      width: 100,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.name"),
      field: "firstname",
      cellRenderer: "nameRenderer",
      filter: true,
      floatingFilter: true,
      width: 300,
      valueGetter: (params) =>
        params.data.firstname + " " + params.data.lastname,
    },
    {
      headerName: t("learner.columns.email_id"),
      field: "email",
      cellRenderer: "emailRenderer",
      resizable: true,
      filter: true,
      floatingFilter: true,
      valueFormatter: (params) => params.value || "-",
    },
    {
      headerName: t("learner.columns.mobile_no"),
      field: "mobile",
      filter: true,
      floatingFilter: true,
      valueFormatter: (params) => params.value || "-",
    },
    {
      headerName: t("learner.columns.username"),
      field: "username",
      resizable: true,
      filter: true,
      floatingFilter: true,
      valueFormatter: (params) => params.value || "-",
    },

    {
      headerName: t("learner.columns.status"),
      field: "status",
      cellRenderer: "actionStatusChange",
      width: 100,
    },
    {
      headerName: t("learner.columns.action"),
      field: "",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      width: 200,
    },
  ];

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
    };
  }, []);

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
    if (view == "card") {
      setQuickFilter(data);
      let val = data.toLowerCase();
      if (empStatus == "") {
        const temp =
          learnersListResp &&
          learnersListResp.filter((d) => {
            return (
              d.firstname.toLowerCase().indexOf(val) !== -1 ||
              (d.lastname &&
                d.lastname != null &&
                d.lastname.toLowerCase().indexOf(val) !== -1) ||
              (d.email &&
                d.email != null &&
                d.email.toLowerCase().indexOf(val) !== -1) ||
              !val
            );
          });
        setGridData(temp);
      } else if (empStatus == "true") {
        const filteredData =
          learnersListResp.length > 0 &&
          learnersListResp.filter((data) => data?.status?.toString() == "true");

        const temp =
          filteredData &&
          filteredData.filter((d) => {
            return (
              d.firstname.toLowerCase().indexOf(val) !== -1 ||
              (d.lastname &&
                d.lastname != null &&
                d.lastname.toLowerCase().indexOf(val) !== -1) ||
              (d.email &&
                d.email != null &&
                d.email.toLowerCase().indexOf(val) !== -1) ||
              (d.designation &&
                d.designation != null &&
                d.designation.toLowerCase().indexOf(val) !== -1) ||
              !val
            );
          });

        setGridData(temp);
      } else if (empStatus == "false") {
        const filteredData =
          learnersListResp.length > 0 &&
          learnersListResp.filter(
            (data) => data?.status?.toString() == "false"
          );

        const temp =
          filteredData &&
          filteredData.filter((d) => {
            return (
              d.firstname.toLowerCase().indexOf(val) !== -1 ||
              (d.lastname &&
                d.lastname != null &&
                d.lastname.toLowerCase().indexOf(val) !== -1) ||
              (d.email &&
                d.email != null &&
                d.email.toLowerCase().indexOf(val) !== -1) ||
              (d.designation &&
                d.designation != null &&
                d.designation.toLowerCase().indexOf(val) !== -1) ||
              !val
            );
          });
        setGridData(temp);
      }
    } else {
      gridApi.setQuickFilter(data);
      setQuickFilter(data);
    }
  };

  const handleProfileView = (params) => {
    push(`/components/learners/profile/${params?.learner_uuid}`);
  };

  const handleEdit = (item) => {
    setAddLear(true);
    setLearnerDataItem(item);
  };

  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_status"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          id: data?.learner_id,
          status: data.status == "true" ? "False" : "true",
        };
        dispatch(saveLearnersChangeStatus(payload));
      }
    });
  };

  const openImageViewer = useCallback((index, url) => {
    setCurrentImage(index);
    setIsViewerOpen(true);
    setImages([url]);
  }, []);

  const closeImageViewer = () => {
    setCurrentImage(0);
    setIsViewerOpen(false);
  };

  const autoSizeAll = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }, []);

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },
    nameRenderer: function (props) {
      return (
        <>
          <OverlayTrigger
            placement="bottom"
            overlay={
              <Tooltip>
                {props?.data?.firstname + " " + props?.data?.lastname}
              </Tooltip>
            }
          >
            <span>
              &nbsp; {props?.data?.firstname + " " + props?.data?.lastname}
            </span>
          </OverlayTrigger>
        </>
      );
    },
    emailRenderer: function (props) {
      return (
        <>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>{props?.data?.email}</Tooltip>}
          >
            <span>{props?.data?.email}</span>
          </OverlayTrigger>
        </>
      );
    },
    designationRenderer: function (props) {
      return (
        <>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>{props?.data?.designation}</Tooltip>}
          >
            <span>{props?.data?.designation}</span>
          </OverlayTrigger>
        </>
      );
    },
    logoRenderer: function (props) {
      return (
        <>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>{props?.data?.profile}</Tooltip>}
          >
            <img
              src={props?.data?.profile}
              className="ht-35 wd-35 pointer rounded-circle"
              alt="logo"
            />
          </OverlayTrigger>
        </>
      );
    },

    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          propsVal={props}
          handleEdit={handleEdit}
          handleShowEdit={true}
        />
      );
    },

    statusBadgeRenderer: function (props) {
      return <StatusBadgeRenderer propsVal={props} />;
    },
    actionStatusChange: function (props) {
      return (
        <label className="custom-switch">
          <input
            type="checkbox"
            name="custom-switch-checkbox1"
            className="custom-switch-input"
            checked={props?.data?.status == "true" ? true : false}
            onChange={() => handleStatusSwitch(props?.data)}
          />
          <span className="custom-switch-indicator custom-switch-indicator-md"></span>
        </label>
      );
    },
  };
  const handleExport = () => {
    const exportData = learnersListResp.map((row) => {
      const createdDate = new Date(row.createdon);
      const formattedDate = `${String(createdDate.getDate()).padStart(
        2,
        "0"
      )}-${String(createdDate.getMonth() + 1).padStart(
        2,
        "0"
      )}-${createdDate.getFullYear()}`;

      const modifiedDate = new Date(row.modifiedon);

      var formattedModifiedDate = "";
      if (row?.modifiedon) {
        formattedModifiedDate = `${String(modifiedDate.getDate()).padStart(
          2,
          "0"
        )}-${String(modifiedDate.getMonth() + 1).padStart(
          2,
          "0"
        )}-${modifiedDate.getFullYear()}`;
      } else {
        formattedModifiedDate = "";
      }
      return [
        row.learner_id,
        row.firstname + " " + row.lastname,
        row.email,
        row.mobile,
        row.username,
        row.status,
        formattedDate,
        formattedModifiedDate,
      ];
    });

    const header = [
      "Student Id",
      t("learner.columns.name"),
      t("learner.columns.email_id"),
      t("learner.columns.mobile_no"),
      t("learner.columns.username"),
      t("learner.columns.status"),
      "Created on",
      "Modified on",
    ];

    if (exportData && exportData.length > 0 && header && header.length > 0) {
      const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
      XLSX.writeFile(workbook, "Students_Data.xlsx");
    }
  };
  // =================== Import ========================
  const [impLer, setImpLer] = useState(false);


  return (
    <>
      <Seo title="Learners" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <div className="">
                <div className="d-flex flex-lg-nowrap flex-wrap justify-content-between align-items-center">
                  <div className="learnerTitle flex-grow-1 mg-r-5">
                    <h5>{t("learner.title")}</h5>
                  </div>
                  <div className="mg-r-2">
                    <ToggleButtonGroup
                      className="mg-r-10"
                      color="success"
                      value={empStatus}
                      size="small"
                      exclusive
                      onChange={(e) => {
                        setEmpStatus(e.target.value);
                      }}
                      aria-label="Platform"
                    >
                      <TB value="">{t("common.all")}</TB>
                      <TB value="true">{t("common.active")}</TB>
                      <TB value="false">{t("common.inactive")}</TB>
                    </ToggleButtonGroup>{" "}
                    <Button
                      className="ms-1"
                      variant="outline-primary"
                      onClick={() => viewDemoShow("addLear")}
                    >
                      <i className="fa fa-plus"></i>{" "}
                      <span className="d-none d-md-inline-block">Add</span>
                    </Button>
                    {rowData && rowData.length > 0 && (
                      <Button
                        className="ms-1"
                        type="button"
                        style={{ minHeight: "33px" }}
                        variant="outline-info"
                        onClick={() => handleExport()}
                      >
                        <i className="fa fa-file-excel-o"></i>
                        <span className="d-none d-md-inline-block">
                          {" "}
                          {t("common.export")}
                        </span>
                      </Button>
                    )}
                  </div>
                  <div className="d-flex mt-md-0 mt-2">
                    <div className="mg-r-5 d-none d-lg-block">
                      <Button
                        type="button"
                        style={{ minHeight: "33px" }}
                        variant="outline-secondary"
                        onClick={() => handleChangeView("list")}
                        className={
                          view == "list" ? "active text-white ms-1" : " ms-1"
                        }
                      >
                        <i className="fe fe-list"></i>
                      </Button>
                      <Button
                        type="button"
                        style={{ minHeight: "33px" }}
                        variant="outline-secondary"
                        onClick={() => handleChangeView("card")}
                        className={
                          view == "card" ? "active text-white ms-1" : " ms-1"
                        }
                      >
                        <i className="fe fe-grid"></i>
                      </Button>
                    </div>
                    <div>
                      <input
                        className="form-control bd bd-2"
                        value={quickFilter}
                        placeholder={t("common.search")}
                        type="text"
                        onChange={(e) => onFilterChanged(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                    id="staff_grid"
                    gridOptions={gridOptions}
                    rowData={rowData}
                    ref={gridRef}
                    columnDefs={columnDefs}
                    pagination={true}
                    onGridReady={onGridReady}
                    components={frameworkComponents}
                    defaultColDef={defaultColDef}
                    paginationPageSize={20}
                    overlayNoRowsTemplate="No data available"
                    suppressRowClickSelection={true}
                    onFirstDataRendered={autoSizeAll}
                    onPaginationChanged={onPaginationChanged} //  track page size changes
                  ></AgGridReact>
                </div>
              ) : (
                ""
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={12}>
          {view == "card" ? (
            <>
              {gridData && gridData.length > 0 ? (
                <Row className="row-sm">
                  {gridData &&
                    gridData.length > 0 &&
                    gridData.map((item, index) => {
                      return (
                        <Col md={3} key={index} className="p-0">
                          <Card className="card custom-card our-team">
                            <Card.Body>
                              <div className="picture avatar-lg online text-center">
                                <div className="rounded-circle pointer profile-img-container">
                                  <img
                                    alt="avatar"
                                    src={dummy_profile.src}
                                    onClick={() => handleProfileView(item)}
                                  />
                                </div>
                              </div>
                              <div className="text-center mt-3">
                                <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                  <a onClick={() => handleProfileView(item)}>
                                    {item.firstname} {item.lastname}{" "}
                                  </a>
                                </h5>
                                <p className="pro-user-desc text-muted mb-1 mt-1">
                                  {item.designation}
                                </p>
                                <p className="user-info-rating">
                                  <i className="fa fa-star text-warning"> </i>

                                  <i className="fa fa-star text-warning"> </i>

                                  <i className="fa fa-star text-warning"> </i>

                                  <i className="fa fa-star text-warning"> </i>

                                  <i className="far fa-star text-warning"> </i>
                                </p>
                              </div>
                              <div className="contact-info mb-0 text-center">
                                <div className="btn btn-sm ripple bg-primary-transparent text-primary rounded-circle me-1">
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={<Tooltip>{item.mobile}</Tooltip>}
                                  >
                                    <i className="fe fe-phone-call"></i>
                                  </OverlayTrigger>
                                </div>{" "}
                                <div className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle me-1">
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={<Tooltip>{item.email}</Tooltip>}
                                  >
                                    <i className="fe fe-mail"></i>
                                  </OverlayTrigger>
                                </div>{" "}
                                &nbsp;
                                <div
                                  className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
                                  onClick={() => handleEdit(item)}
                                >
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={<Tooltip>Upate</Tooltip>}
                                  >
                                    <i className="fe fe-edit"></i>
                                  </OverlayTrigger>
                                </div>
                                <div className="btn btn-sm ripple me-1 mg-t-5">
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                      <Tooltip>
                                        {t(
                                          "learner.tooltip_label.change_status"
                                        )}
                                      </Tooltip>
                                    }
                                  >
                                    <label className="custom-switch mg-t-50">
                                      <input
                                        type="checkbox"
                                        name="custom-switch-checkbox1"
                                        className="custom-switch-input"
                                        checked={item?.status === "Active"}
                                        onChange={() =>
                                          handleStatusSwitch(item)
                                        }
                                      />
                                      <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                    </label>
                                  </OverlayTrigger>
                                </div>{" "}
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
                                  <h5 className="mt-4">
                                    {empStatus == "false"
                                      ? `${t("learner.no_data_found", {
                                        name: t("learner.inactive"),
                                      })}`
                                      : empStatus == "true"
                                        ? `${t("learner.no_data_found", {
                                          name: t("learner.active"),
                                        })}`
                                        : `${t("learner.no_data_found", {
                                          name: "",
                                        })}`}
                                  </h5>
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

      {isViewerOpen && (
        <ImageViewer
          key={Math.random()}
          src={images}
          currentIndex={currentImage}
          onClose={closeImageViewer}
          disableScroll={false}
          backgroundStyle={{
            backgroundColor: "rgba(0,0,0,0.9)",
          }}
          closeOnClickOutside={true}
        />
      )}

      <AddLearner
        addLear={addLear}
        setAddLear={setAddLear}
        learnerData={learnerDataItem}
        setLearnerDataItem={setLearnerDataItem}
      />
      <ImportQuestion
        impLer={impLer}
        setImpLer={setImpLer}
        questionData={"questionData"}
      />
    </>
  );
};

ManageLearner.layout = "Contentlayout";
export default ManageLearner;
