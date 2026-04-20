import React, { useState, useEffect, useMemo,useRef,useCallback } from "react";
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
import FormScenarioSubCategory from "../../../../shared/data/mastersModal/scenarioSubCategoryForm";
import {
  clearHasError,
  getScenarioSubCatList,
  clearimportScenarioSubCategoryModal,
  clearUpdateSubCategories,
  changeStatusSubCat,
  clearSubCatChangeStatus,
  deleteComponentSubCat,
  clearVerifyScenarioSubCategoryModel,
  clearDeleteSubCat,
  clearSaveSubCategories,
} from "../../../../shared/redux/slices/masters/ScenarioSubCategries";
import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../../shared/data/masterButtons/toggleButton";
import ImportScenarioSubCategoryList from "../../../../shared/data/mastersModal/importScenarioSubCategorylist";
import { useTranslation } from "react-i18next";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../../public/assets/img/dummy.jpg";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const ScenarioSubCategory = () => {
  const dispatch = useDispatch();
  const [compStatus, setCompStatus] = useState("true");
  const [openImportModal, setOpenImportModal] = useState(false);
  const [showListImort, setShowListImport] = useState(true);
  const [gridData, setGridData] = useState([]);
  const [view, setView] = useState("card");
  const { t } = useTranslation();
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setformModal] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    scenariocategoryid: 0,
    categoryname: "",
    status: true,
    categoryimage:""
  });
  const [oneClick, setOneClick] = useState(false);
      const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  const {
    listCatData,
    addCatData,
    editCatData,
    editStatusCatResData,
    errorData,
    deleteComponentCatResp,
    saveSubCategoriesData,
    ImportScenarioSubCategoryListData,
  } = useSelector((state) => {
    return {
      listCatData:
        state &&
        state.scenariosubcategories &&
        state.scenariosubcategories.getSubScenarioListData &&
        state.scenariosubcategories.getSubScenarioListData.data,

      addCatData:
        state &&
        state.scenariosubcategories &&
        state.scenariosubcategories.saveCategories,

      editCatData:
        state &&
        state.scenariosubcategories &&
        state.scenariosubcategories.updateSubCategories,

      editStatusCatResData:
        state &&
        state.scenariosubcategories &&
        state.scenariosubcategories.statusChangeSubCat,

      deleteComponentCatResp:
        state &&
        state.scenariosubcategories &&
        state.scenariosubcategories.deleteSubCat,

      saveSubCategoriesData: state?.scenariosubcategories?.saveSubCategories,
      ImportScenarioSubCategoryListData:
        state?.scenariosubcategories?.importScenarioSubCategory,

      errorData:
        state &&
        state.scenariosubcategories &&
        state.scenariosubcategories.error,
    };
  });

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
      headerName: "Scenario Category",
      field: "categoryname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Scenario Sub Category",
      field: "subcategoryname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Status",
      field: "status",
      cellRenderer: "actionSwitchRenderer",
      pinned: "right",
      width: 80,
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      pinned: "right",
      width: 100,
    },
  ];

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };
  //Function to Download Excel file

  const handleExport = () => {
    // Filter data based on compStatus ("" = all, "true" = active, "false" = inactive)
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
        row.scenariocategoryid,
        row.categoryname,
        row.subcategoryname,
        row.status === "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "Scenario Sub Category Id",
      "Scenario Category",
      "Scenario Sub Category",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scenario Sub Category");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const filePrefix =
      compStatus === ""
        ? "ScenarioSubCategory_All"
        : compStatus === "true"
        ? "ScenarioSubCategory_Active"
        : "ScenarioSubCategory_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  // const handleExport = () => {
  //   const exportData = listCatData.map((row) => [
  //     row.scenariocategoryid,
  //     row.categoryname,
  //     row.subcategoryname,
  //     row.status === "true" ? "Active" : "Inactive",
  //     row.createdon,
  //     row.modifiedon,
  //   ]);

  // const header = [
  //   "Scenario Sub Category Id",
  //   "Scenario Category",
  //   "Scenario Sub Category",
  //   "Status",
  //   "Created on",
  //   "Modified on",
  // ];

  //   const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
  //   const formattedMenuName = 'Scenario Sub Categories';
  //   const timestamp = new Date().toISOString().replace(/[-T:\.]/g, '').slice(0, 15);// YYYYMMDD_HHMMSS
  //    XLSX.writeFile(workbook,`${formattedMenuName.replace(/\s+/g, '_')}_${timestamp}.xlsx`);
  // };
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

    const matchFilter = (d) => {
      return (
        (d.categoryname && d.categoryname.toLowerCase().includes(val)) ||
        (d.subcategoryname && d.subcategoryname.toLowerCase().includes(val)) ||
        !val
      );
    };

    if (compStatus === "") {
      const temp = listCatData?.filter(matchFilter);
      setGridData(temp);
      setRowData(temp);
    } else if (compStatus === "true") {
      const filteredData = listCatData?.filter(
        (data) => data?.status?.toString() === "true"
      );
      const temp = filteredData?.filter(matchFilter);
      setGridData(temp);
      setRowData(temp);
    } else if (compStatus === "false") {
      const filteredData = listCatData?.filter(
        (data) => data?.status?.toString() === "false"
      );
      const temp = filteredData?.filter(matchFilter);
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
    dispatch(getScenarioSubCatList());
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
      dispatch(getScenarioSubCatList());
      dispatch(clearSaveSubCategories());

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
      dispatch(getScenarioSubCatList());
      dispatch(clearUpdateSubCategories());
    }
  }, [editCatData]);

  useEffect(() => {
    if (ImportScenarioSubCategoryListData?.statusCode) {
      dispatch(clearVerifyScenarioSubCategoryModel());
      dispatch(clearimportScenarioSubCategoryModal());
      setOpenImportModal(false);
      dispatch(getScenarioSubCatList());
    }
  }, [ImportScenarioSubCategoryListData]);

  useEffect(() => {
    if (ImportScenarioSubCategoryListData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {ImportScenarioSubCategoryListData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioSubCatList());
      dispatch(clearimportScenarioSubCategoryModal());
    }
  }, [ImportScenarioSubCategoryListData]);

  useEffect(() => {
    if (saveSubCategoriesData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveSubCategoriesData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioSubCatList());
      handleFormModal(false);
      dispatch(clearSaveSubCategories());
    }
  }, [saveSubCategoriesData]);

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
      dispatch(getScenarioSubCatList());
      dispatch(clearSubCatChangeStatus());
    }
  }, [editStatusCatResData]);

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
      dispatch(getScenarioSubCatList());
      dispatch(clearDeleteSubCat());
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
    console.log("propspropspropspropsprops",props)
    handleOneClick(false);
    if (props && props.scenariocategoryid) {
      setRowValues({
        title: "Update",
        categoryname: props.subcategoryname,
        parentscenariocategoryid: props.parentscenariocategoryid,
        status: props.status,
        scenariocategoryid: props.scenariocategoryid,
        categoryimage:props.categoryimage
      });
      setformModal(true);
    }
  };

  const handleDelete = (props, flag) => {
    if (flag === true) {
      const payload = {
        scenariocategoryid: props?.scenariocategoryid,
      };

      dispatch(deleteComponentSubCat(payload));
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
          scenariocategoryid: item?.scenariocategoryid,
        };
        dispatch(deleteComponentSubCat(payload));
      }
    });
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
        const payload = {
          scenariocategoryid: data.scenariocategoryid,
          status: data.status == "false" ? "true" : "false",
        };
        const Id = data?.scenariocategoryid;
        dispatch(changeStatusSubCat(payload, Id));
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
    categoryimageRender: function (props) {
      const { data } = props;
      const imageUrl = data?.categoryimage
        ? `${process.env.API_URL_FILEMANAGER}${data.categoryimage}`
        : dummy_network;

      console.log("Image URL:", imageUrl);
    },
  };

  const handleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues({
      title: "Add",
      scenariocategoryid: 0,
      categoryname: "",
      status: true,
    });
    setformModal(flag);
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
    dispatch(clearVerifyScenarioSubCategoryModel());
    setOpenImportModal(!openImportModal);
  };
  return (
    <>
      <Seo title="Scenario Sub Categories" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center ">
                  <h5>Scenario Sub Categories</h5>
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
                        setCompStatus(e.target.value);
                        dispatch(
                          getScenarioSubCatList({ status: e.target.value })
                        );
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
                      id="staff_grid"
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
                                className=" mx-auto d-flex justify-content-center align-items-center "
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
                                  {item.subcategoryname &&
                                  item.subcategoryname.lengt > 20
                                    ? `${item.subcategoryname.substring(
                                        0,
                                        20
                                      )}...`
                                    : item.subcategoryname}{" "}
                                </a>
                              </h5>
                              <p className="pro-user-desc text-muted mb-1 mt-1">
                                {item.categoryname &&
                                item.categoryname.length > 20
                                  ? `${item.categoryname.substring(0, 20)}...`
                                  : item.categoryname}
                              </p>
                            </div>
                            <div className="contact-info mb-0 text-center">
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
                                  <i className="fe fe-trash-2"></i>
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

        <ImportScenarioSubCategoryList
          openImportModal={openImportModal}
          handleImportModal={handleImportModal}
          showListImort={showListImort}
          setShowListImport={setShowListImport}
        />
      </Row>
      <FormScenarioSubCategory
        openFlag={formModal}
        handleFormModal={handleFormModal}
        rowValues={rowValues}
        oneClick={oneClick}
        handleOneClick={handleOneClick}
      />
    </>
  );
};

ScenarioSubCategory.layout = "Contentlayout";
export default ScenarioSubCategory;
