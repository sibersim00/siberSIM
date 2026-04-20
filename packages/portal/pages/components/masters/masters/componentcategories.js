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
import FormComponentCategory from "../../../../shared/data/mastersModal/componentCategoryForm";
import ViewComponentCategory from "../../../../shared/data/mastersModal/componentCategoryView";
import { getLocalStorageData } from "../../../../shared/redux/slices/localstorage/LocalStorage";
import {
  clearHasError,
  getCategoriesList,
  clearSaveCategories,
  clearUpdateCategories,
  clearimportComponentCategoryModal,
  changeStatusCat,
  clearCatChangeStatus,
  deleteComponentCat,
  clearVerifyComponentCategoryModel,
  clearDeleteCat,
} from "../../../../shared/redux/slices/masters/ComponentCategories";
import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../../shared/data/masterButtons/toggleButton";
import { useTranslation } from "react-i18next";
import ImportComponentCategoryList from "../../../../shared/data/mastersModal/importComponentCategorylist";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../../public/assets/img/dummy.jpg";


const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const ComponentCategories = () => {
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

    const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  const [rowValues, setRowValues] = useState({
    title: "Add",
    componentcategoryid: 0,
    educationcode: "",
    parentcategoryname: "",
    status: true,
    description: "",
    categoryimage: "",
  });
  const [oneClick, setOneClick] = useState(false);
  const {
    listCatData,
    addCatData,
    editCatData,
    editStatusCatResData,
    errorData,
    deleteComponentCatResp,
    ImportComponentCategoryListData,
  } = useSelector((state) => {
    return {
      listCatData:
        state &&
        state.componentcategories &&
        state.componentcategories.getCategoriesListData &&
        state.componentcategories.getCategoriesListData.data,

      addCatData:
        state &&
        state.componentcategories &&
        state.componentcategories.saveCategories,

      editCatData:
        state &&
        state.componentcategories &&
        state.componentcategories.updateCategories,

      editStatusCatResData:
        state &&
        state.componentcategories &&
        state.componentcategories.statusChangeCat,

      deleteComponentCatResp:
        state &&
        state.componentcategories &&
        state.componentcategories.deleteCat,

      errorData:
        state && state.componentcategories && state.componentcategories.error,

      ImportComponentCategoryListData:
        state?.componentcategories?.importComponentCategory,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"));
    }
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
      headerName: "Component Category",
      field: "parentcategoryname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Description",
      field: "description",
      filter: true,
      flex: 1,
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
    const filteredData = listCatData.filter((row) => {
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
        row.componentcategoryid,
        row.parentcategoryname,
        row.description,
        row.status === "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "Component Category Id",
      "Component Category",
      "Description",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Component Categories");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15); // YYYYMMDD_HHMMSS

    const filePrefix =
      compStatus === ""
        ? "ComponentCategories_All"
        : compStatus === "true"
          ? "ComponentCategories_Active"
          : "ComponentCategories_Inactive";

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
    if (compStatus == "") {
      const temp =
        listCatData &&
        listCatData.filter((d) => {
          return (
            d.parentcategoryname.toLowerCase().indexOf(val) !== -1 ||
            (d.description &&
              d.description != null &&
              d.description.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });
      setGridData(temp);
      setRowData(temp);
    } else if (compStatus == "true") {
      const filteredData =
        listCatData.length > 0 &&
        listCatData.filter((data) => data?.status?.toString() == "true");

      const temp =
        filteredData &&
        filteredData.filter((d) => {
          return (
            d.parentcategoryname.toLowerCase().indexOf(val) !== -1 ||
            (d.description &&
              d.description != null &&
              d.description.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });

      setGridData(temp);
      setRowData(temp);
    } else if (compStatus == "false") {
      const filteredData =
        listCatData.length > 0 &&
        listCatData.filter((data) => data?.status?.toString() == "false");

      const temp =
        filteredData &&
        filteredData.filter((d) => {
          return (
            d.parentcategoryname.toLowerCase().indexOf(val) !== -1 ||
            (d.description &&
              d.description != null &&
              d.description.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });
      setGridData(temp);
      setRowData(temp);
    }
  };
  useEffect(() => {
    if (listCatData) {
      if (compStatus === "") {
        setRowData(listCatData);
        setGridData(listCatData);
      } else if (compStatus === "true") {
        const filteredData = listCatData.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = listCatData.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      }
    }
  }, [listCatData, compStatus]);
  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    if (compStatus == "") {
      setRowData(listCatData);
      setGridData(listCatData);
    } else if (compStatus == "true") {
      const filteredData =
        listCatData.length > 0 &&
        listCatData.filter((data) => data?.status?.toString() == "true");
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        listCatData.length > 0 &&
        listCatData.filter((data) => data?.status?.toString() == "false");
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };
  useEffect(() => {
    dispatch(getCategoriesList());
    return () => { };
  }, []);

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
    if (addCatData?.statusCode) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addCatData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCategoriesList());
      dispatch(clearSaveCategories());
    }
  }, [addCatData]);

  useEffect(() => {
    if (editCatData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editCatData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCategoriesList());
      dispatch(clearUpdateCategories());
    }
  }, [editCatData]);

  useEffect(() => {
    if (ImportComponentCategoryListData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {ImportComponentCategoryListData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCategoriesList());
      dispatch(clearimportComponentCategoryModal());
    }
  }, [ImportComponentCategoryListData]);

  useEffect(() => {
    if (editStatusCatResData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusCatResData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCategoriesList());
      dispatch(clearCatChangeStatus());
    }
  }, [editStatusCatResData]);

  useEffect(() => {
    if (ImportComponentCategoryListData?.statusCode) {
      dispatch(clearVerifyComponentCategoryModel());
      dispatch(clearimportComponentCategoryModal());
      setOpenImportModal(false);
      dispatch(getCategoriesList());
    }
  }, [ImportComponentCategoryListData]);

  useEffect(() => {
    if (deleteComponentCatResp?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {deleteComponentCatResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getCategoriesList());
      dispatch(clearDeleteCat());
    }
  }, [deleteComponentCatResp]);

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
    if (props && props.parentcategoryname) {
      setRowValues({
        title: "Update",
        componentcategoryid: props.componentcategoryid,
        parentcategoryname: props.parentcategoryname,
        status: props.status,
        description: props.description,
        categoryimage: props.categoryimage,
      });
      setformModal(true);
    }
  };
  const handleView = (props) => {
    handleOneClick(false);
    if (props && props.parentcategoryname) {
      setRowValues({
        title: "View",
        componentcategoryid: props.componentcategoryid,
        parentcategoryname: props.parentcategoryname,
        status: props.status,
        description: props.description,
        categoryimage: props.categoryimage,

      });
      setViewModal(true);
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
        const Id = data?.componentcategoryid;
        const payload = {
          status: data.status == "false" ? "true" : "false",
          componentcategoryid: Id,
        };
        dispatch(changeStatusCat(payload, Id));
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
          handleEditView={handleView}
          handleShowEditView={true}
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
      componentcategoryid: 0,
      parentcategoryname: "",
      status: true,
    });
    setformModal(flag);
  };
  const handleViewModal = (flag) => {
    handleOneClick(false);
    setViewModal(flag);
  };
  const [columnsPerRow, setColumnsPerRow] = useState(4); // Default value
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
    dispatch(clearVerifyComponentCategoryModel());
    setOpenImportModal(!openImportModal);
  };
  return (
    <>
      <Seo title="Component Category" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Component Categories</h5>
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
                        dispatch(getCategoriesList({ status: e.target.value }));
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
                      variant="outline-warning"
                      onClick={() => {
                        setShowListImport(true);
                        handleImportModal();
                      }}
                    >
                      <i className="fa fa-file-excel-o"></i> Import
                    </Button>
                    &nbsp;
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
                        <Card className="card custom-card our-team">
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
                                  src={
                                    item?.categoryimage
                                      ? `${process.env.API_URL_FILEMANAGER}${item.categoryimage}`
                                      : dummy_network.src
                                  }
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = dummy_network.src;
                                  }}
                                />
                              </div>
                              <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                <a>
                                  {item.parentcategoryname &&
                                    item.parentcategoryname.lengt > 20
                                    ? `${item.parentcategoryname.substring(
                                      0,
                                      20
                                    )}...`
                                    : item.parentcategoryname}{" "}
                                </a>
                              </h5>
                              <p className="pro-user-desc text-muted mb-1 mt-1">
                                {item.description &&
                                  item.description.length > 20
                                  ? `${item.description.substring(0, 20)}...`
                                  : item.description}
                              </p>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() => handleView(item)}
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
        <ImportComponentCategoryList
          openImportModal={openImportModal}
          handleImportModal={handleImportModal}
          showListImort={showListImort}
          setShowListImport={setShowListImport}
        />
      </Row>

      <FormComponentCategory
        openFlag={formModal}
        handleFormModal={handleFormModal}
        rowValues={rowValues}
        oneClick={oneClick}
        handleOneClick={handleOneClick}
      />
      <ViewComponentCategory
        openFlag={viewModal}
        handleViewModal={handleViewModal}
        rowValues={rowValues}
        oneClick={oneClick}
        handleOneClick={handleOneClick}
      />
    </>
  );
};

ComponentCategories.layout = "Contentlayout";
export default ComponentCategories;
