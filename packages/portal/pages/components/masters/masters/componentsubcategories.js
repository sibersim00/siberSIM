import React, { useState, useEffect, useMemo,useRef,useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import Swal from "sweetalert2";
import {
  getSubCategoriesList,
  changeStatusSubCat,
  clearSubCatChangeStatus,
  deleteSubCat,
  clearDeleteSubcat,
  clearHasError,
} from "../../../../shared/redux/slices/masters/ComponentSubCategories";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as XLSX from "xlsx";
import Seo from "../../../../shared/layout-components/seo/seo";
import { AgGridReact } from "ag-grid-react";
import { getComponentDetails } from "../../../../shared/redux/slices/localstorage/LocalStorage";
import dummy_network from "../../../../public/assets/img/dummy.jpg";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import "../../../../shared/utils/i18n";
import { useTranslation } from "react-i18next";
import ComponentSubCategoriesForm from "../../../../shared/data/masters/componetSubCategory/componentSubcategoryForm";
import ComponentSubCategoriesView from "../../../../shared/data/masters/componetSubCategory/ComponentSubCategoriesView";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../../shared/data/masterButtons/toggleButton";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const ComponentSubCategories = () => {
  const dispatch = useDispatch();
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [backview, setBackView] = useState("card");
  const [oneClick, setOneClick] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [gridData, setGridData] = useState([]);
  const [empStatus, setEmpStatus] = useState("true");
  const { t } = useTranslation();

  const [pageSize, setPageSize] = useState(20);
    const gridRef = useRef(null);
     const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  const { subCatListResp, errorData, deleteSubCatRes, statusChangeSubCatRes } =
    useSelector((state) => {
      return {
        subCatListResp:
          state &&
          state.componentsubcategories &&
          state.componentsubcategories.getSubCategoriesListData &&
          state.componentsubcategories.getSubCategoriesListData.data,
        deleteSubCatRes:
          state &&
          state.componentsubcategories &&
          state.componentsubcategories.deleteSubCat &&
          state.componentsubcategories.deleteSubCat,
        statusChangeSubCatRes:
          state &&
          state.componentsubcategories &&
          state.componentsubcategories.statusChangeSubCat,
        errorData:
          state &&
          state.componentsubcategories &&
          state.componentsubcategories.error,
      };
    });
  useEffect(() => {
    if (statusChangeSubCatRes?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {statusChangeSubCatRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getSubCategoriesList());
      dispatch(clearSubCatChangeStatus());
    }
  }, [statusChangeSubCatRes]);

  useEffect(() => {
    if (deleteSubCatRes?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {deleteSubCatRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getSubCategoriesList());
      dispatch(clearDeleteSubcat());
    }
  }, [deleteSubCatRes]);
  useEffect(() => {
    dispatch(getSubCategoriesList());
  }, []);

  useEffect(() => {
    if (subCatListResp && subCatListResp != undefined) {
      if (empStatus == "") {
        setGridData(subCatListResp);
        setRowData(subCatListResp);
      } else if (empStatus == "true") {
        const filteredData =
          subCatListResp.length > 0 &&
          subCatListResp.filter((data) => data?.status?.toString() == "true");
        setGridData(filteredData);
        setRowData(filteredData);
      } else if (empStatus == "false") {
        const filteredData =
          subCatListResp.length > 0 &&
          subCatListResp.filter((data) => data?.status?.toString() == "false");
        setGridData(filteredData);
        setRowData(filteredData);
      }
    }
  }, [subCatListResp, empStatus]);
  const handleOneClick = (flag) => {
    setOneClick(flag);
  };


  const onFilterChanged = (data) => {
    setQuickFilter(data);
    let val = data.toLowerCase();
    if (empStatus == "") {
      const temp =
        subCatListResp &&
        subCatListResp.filter((d) => {
          return (
            d.categoryname.toLowerCase().indexOf(val) !== -1 ||
            (d.description &&
              d.description != null &&
              d.description.toLowerCase().indexOf(val) !== -1) ||
            (d.parentcategoryname &&
              d.parentcategoryname != null &&
              d.parentcategoryname.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });
      setGridData(temp);
      setRowData(temp);
    } else if (empStatus == "true") {
      const filteredData =
        subCatListResp.length > 0 &&
        subCatListResp.filter((data) => data?.status?.toString() == "true");

      const temp =
        filteredData &&
        filteredData.filter((d) => {
          return (
            d.categoryname.toLowerCase().indexOf(val) !== -1 ||
            (d.description &&
              d.description != null &&
              d.description.toLowerCase().indexOf(val) !== -1) ||
            (d.parentcategoryname &&
              d.parentcategoryname != null &&
              d.parentcategoryname.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });

      setGridData(temp);
      setRowData(temp);
    } else if (empStatus == "false") {
      const filteredData =
        subCatListResp.length > 0 &&
        subCatListResp.filter((data) => data?.status?.toString() == "false");

      const temp =
        filteredData &&
        filteredData.filter((d) => {
          return (
            d.categoryname.toLowerCase().indexOf(val) !== -1 ||
            (d.description &&
              d.description != null &&
              d.description.toLowerCase().indexOf(val) !== -1) ||
            (d.parentcategoryname &&
              d.parentcategoryname != null &&
              d.parentcategoryname.toLowerCase().indexOf(val) !== -1) ||
            !val
          );
        });
      setGridData(temp);
      setRowData(temp);
    }
  };
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      cellRenderer: "srNoRender",
      floatingFilter: true,
      maxWidth: 80,
    },
    {
      headerName: "Component Sub Category",
      field: "categoryname",
      filter: true,
      floatingFilter: true,
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
      cellRenderer: "descriptionRenderer",
      flex: 1,
      filter: true,
    },
    {
      headerName: "Status",
      field: "status",
      pinned: "right",
      width: 80,
      cellRenderer: "actionSwitchRenderer",
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      width: 100,
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
    descriptionRenderer: function (props) {
      const value =
        props?.value && props?.value.length > 20
          ? `${props?.value.substring(0, 20)}...`
          : props.value;
      const des = value ? (
        <div dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        ""
      );
      return des;
    },
  };
  const handleExport = () => {
    const filteredData = subCatListResp.filter((row) => {
      if (empStatus === "") return true; // All
      return row.status === empStatus;
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
      // const createdDate = new Date(row.createdon);
      // const formattedDate = `${String(createdDate.getDate()).padStart(2, '0')}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${createdDate.getFullYear()}`;

      // const modifiedDate = new Date(row.modifiedon);
      // var formattedModifiedDate  = "";
      // if(row?.modifiedon)
      // {
      //    formattedModifiedDate = `${String(modifiedDate.getDate()).padStart(2, '0')}-${String(modifiedDate.getMonth() + 1).padStart(2, '0')}-${modifiedDate.getFullYear()}`;
      // }
      // else{
      //   formattedModifiedDate = '';
      // }

      const des = { __html: row.description };

      return [
        row.componentsubcategoryid,
        row.categoryname,
        row.parentcategoryname,
        // row.description,
        row.status === "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "Component Sub Category Id",
      "Component Sub Category",
      "Component Category",
      // "Description",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Component Sub Categories"
    );

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15); // YYYYMMDD_HHMMSS

    const filePrefix =
      empStatus === ""
        ? "ComponentSubCategories_All"
        : empStatus === "true"
        ? "ComponentSubCategories_Active"
        : "ComponentSubCategories_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  useEffect(() => {
    // dispatch(getListOfBank());
    dispatch(getComponentDetails("/banks"));
    return () => {};
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

  const [rowId, setRowId] = useState("");

  const handleEdit = (props) => {
    handleOneClick(false);
    setBackView(view);
    setView("Form");
    setRowId(props.componentsubcategoryid);
  };
  const [viewCatModal, setviewCatModal] = useState(false);
  const handleView = (props) => {
    if (props && props.componentsubcategoryid) {
      setView("catView");
      setRowId(props.componentsubcategoryid);
    }
  };
  let viewCatClose = (modal) => {
    setviewCatModal(false);
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
        const Id = data?.componentsubcategoryid;
        const payload = {
          status: data.status == "true" ? "false" : "true",
          componentsubcategoryid: Id,
        };
        dispatch(changeStatusSubCat(payload, Id));
      }
    });
  };

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setBackView(thisView);
    setView(thisView);
    if (empStatus == "") {
      setRowData(subCatListResp);
      setGridData(subCatListResp);
    } else if (empStatus == "true") {
      const filteredData =
        subCatListResp.length > 0 &&
        subCatListResp.filter((data) => data?.status?.toString() == "true");
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (empStatus == "false") {
      const filteredData =
        subCatListResp.length > 0 &&
        subCatListResp.filter((data) => data?.status?.toString() == "false");
      setRowData(filteredData);
      setGridData(filteredData);
    }
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
  return (
    <>
      <Seo title="Component Sub Category" />
      <ToastContainer />
      <Row className="row-sm">
        {(view === "list" || view === "card") && (
          <Col md={12}>
            <Card className="custom-card overflow-hidden">
              {(view === "list" || view === "card") && (
                <Card.Body className="p-3">
                  <Col md={12}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5>{t("component_sub_categories.title")}</h5>
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
                          className="mg-r-10"
                          color="success"
                          value={empStatus}
                          size="small"
                          exclusive
                          onChange={(e) => setEmpStatus(e.target.value)}
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
                        &nbsp;
                        <Button
                          type="button"
                          variant="outline-info"
                          onClick={handleExport}
                        >
                          <i className="fa fa-file-excel-o"></i> Export
                        </Button>
                        &nbsp;
                        <Button
                          type="button"
                          variant="outline-primary"
                          onClick={() => {
                            setView("Form");
                            setRowId("");
                            handleOneClick(false);
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
                <Card.Body className="p-3">
                  <Col md={12}>
                    <div
                          className="ag-theme-alpine mt-2"
                       style={{
                          height: `${gridHeight}px`, //  dynamic, grows with page size
                          width: "100%",
                          overflow: "visible",        // no internal scrollbar
                        }}
                    >
                      <AgGridReact
                        id="subcat_grid"
                        headerHeight={35}
                        rowHeight={40}
                        gridOptions={gridOptions}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        paginationPageSize={20}
                        pagination={true}
                        onGridReady={onGridReady}
                        components={frameworkComponents}
                        defaultColDef={defaultColDef}
                        onPaginationChanged={onPaginationChanged} //  track page size changes
                      />
                    </div>
                  </Col>
                </Card.Body>
              )}
            </Card>
          </Col>
        )}

        <Col md={12}>
          {view === "card" && (
            <>
              {gridData && gridData.length > 0 ? (
                <Row className="row-sm">
                  {gridData.map((item, index) => (
                    <Col key={index} md={12 / columnsPerRow} className="p-0">
                      <Card className="card custom-card our-team">
                        <Card.Body>
                          <div className="picture avatar-lg online text-center">
                            <div className="pointer">
                              <img
                              style={{
                                  width: "100px",
                                  height: "100px",
                                }}
                                alt="avatar"
                                src={
                                  `${process.env.API_URL_FILEMANAGER}${item?.categoryimage}` ||
                                  dummy_network.src
                                }
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = dummy_network.src;
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-center mt-3">
                            <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                              <a
                              >
                                {item.categoryname}
                              </a>
                            </h5>
                            <p className="pro-user-desc text-muted mb-1 mt-1">
                              {item.parentcategoryname}
                            </p>
                          </div>
                          <div className="contact-success mb-0 text-center">
                            &nbsp;
                            <div
                              className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                              onClick={() => {
                                setView("catView");
                                setRowId(item.componentsubcategoryid);
                              }}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    {t(
                                      "component_sub_categories.tooltip_label.view_category"
                                    )}
                                  </Tooltip>
                                }
                              >
                                <i className="fe fe-eye"></i>
                              </OverlayTrigger>
                            </div>
                            &nbsp;
                            <div
                              className="btn btn-sm ripple bg-info-transparent text-info rounded-circle"
                              onClick={() => {
                                handleOneClick(false);
                                setView("Form");
                                setRowId(item.componentsubcategoryid);
                              }}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    {t(
                                      "component_sub_categories.tooltip_label.edit_category"
                                    )}
                                  </Tooltip>
                                }
                              >
                                <i className="fe fe-edit"></i>
                              </OverlayTrigger>
                            </div>
                            &nbsp;
                            <div className="btn btn-sm ripple me-1 mg-t-5">
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    {t(
                                      "component_sub_categories.tooltip_label.change_status"
                                    )}
                                  </Tooltip>
                                }
                              >
                                <label className="custom-switch mg-t-50">
                                  <input
                                    type="checkbox"
                                    name="custom-switch-checkbox1"
                                    className="custom-switch-input"
                                    checked={item.status === "true"}
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
                  ))}
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
          )}

          {view === "Form" && (
            <ComponentSubCategoriesForm
              setView={setView}
              rowId={rowId}
              backView={backview}
              oneClick={oneClick}
              handleOneClick={handleOneClick}
            />
          )}

          {view === "catView" && (
            <ComponentSubCategoriesView
              data={rowData}
              setView={setView}
              rowId={rowId}
              backView={backview}
            />
          )}
        </Col>
      </Row>
    </>
  );
};
ComponentSubCategories.layout = "Contentlayout";
export default ComponentSubCategories;
