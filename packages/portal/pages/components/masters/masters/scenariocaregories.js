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
} from "react-bootstrap";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as XLSX from "xlsx";
import FormScenarioCategory from "../../../../shared/data/mastersModal/scenarioCategoryForm";
import {
  clearHasError,
  getScenarioList,
  clearimportScenarioCategoryModal,
  clearUpdateCategories,
  changeStatusCat,
  clearCatChangeStatus,
  deleteComponentCat,
  clearVerifyScenarioCategoryModel,
  clearDeleteCat,
  clearSaveSubCategories,
} from "../../../../shared/redux/slices/masters/ScenarioCategories";
import Seo from "../../../../shared/layout-components/seo/seo";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../../shared/data/masterButtons/toggleButton";
import ImportScenarioCategoryList from "../../../../shared/data/mastersModal/importScenarioCategorylist";
import { useTranslation } from "react-i18next";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../../public/assets/img/dummy.jpg";

const ScenarioCategory = () => {
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
  });
  const [oneClick, setOneClick] = useState(false);
  const {
    listCatData,
    addCatData,
    editCatData,
    editStatusCatResData,
    errorData,
    deleteComponentCatResp,
    saveSubCategoriesData,
    ImportScenarioCategoryListData,
  } = useSelector((state) => {
    return {
      listCatData:
        state &&
        state.scenariocategories &&
        state.scenariocategories.getScenarioListData &&
        state.scenariocategories.getScenarioListData.data,

      addCatData:
        state &&
        state.scenariocategories &&
        state.scenariocategories.saveCategories,

      editCatData:
        state &&
        state.scenariocategories &&
        state.scenariocategories.updateCategories,

      editStatusCatResData:
        state &&
        state.scenariocategories &&
        state.scenariocategories.statusChangeCat,

      deleteComponentCatResp:
        state && state.scenariocategories && state.scenariocategories.deleteCat,

      saveSubCategoriesData: state?.scenariocategories?.saveSubCategories,
      ImportScenarioCategoryListData:
        state?.scenariocategories?.importScenarioCategory,

      errorData:
        state && state.scenariocategories && state.scenariocategories.error,
    };
  });
  console.log("listCatDatalistCatData", listCatData);

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
      headerName: "Scenario Category Name",
      field: "categoryname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Category Type",
      field: "categorytype",
      filter: true,
      cellRenderer: "statusRenderer",

      width: 120,
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
        row.scenariocategoryid,
        row.categoryname,
        row.status === "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "Scenario Category Id",
      "Scenario Category",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scenario Categories");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15); // YYYYMMDD_HHMMSS
    const filePrefix =
      compStatus === ""
        ? "ScenarioCategories_All"
        : compStatus === "true"
        ? "ScenarioCategories_Active"
        : "ScenarioCategories_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 20,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    let val = data.toLowerCase();
    if (compStatus == "") {
      const temp =
        listCatData &&
        listCatData.filter((d) => {
          return d.categoryname.toLowerCase().indexOf(val) !== -1 || !val;
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
          return d.categoryname.toLowerCase().indexOf(val) !== -1 || !val;
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
          return d.categoryname.toLowerCase().indexOf(val) !== -1 || !val;
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
    dispatch(getScenarioList());
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
      dispatch(getScenarioList());
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
      dispatch(getScenarioList());
      dispatch(clearUpdateCategories());
    }
  }, [editCatData]);

  useEffect(() => {
    if (ImportScenarioCategoryListData?.statusCode) {
      dispatch(clearVerifyScenarioCategoryModel());
      dispatch(clearimportScenarioCategoryModal());
      setOpenImportModal(false);
      dispatch(getScenarioList());
    }
  }, [ImportScenarioCategoryListData]);

  useEffect(() => {
    if (ImportScenarioCategoryListData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {ImportScenarioCategoryListData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getScenarioList());
      dispatch(clearimportScenarioCategoryModal());
    }
  }, [ImportScenarioCategoryListData]);

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
      dispatch(getScenarioList());
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
      dispatch(getScenarioList());
      dispatch(clearCatChangeStatus());
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
      dispatch(getScenarioList());
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
    if (props && props.scenariocategoryid) {
      setRowValues({
        title: "Update",
        categoryname: props.categoryname,
        categoryimage: props.categoryimage,
        categorytype: props.categorytype,
        parentscenariocategoryid: props.parentscenariocategoryid,
        status: props.status,
        scenariocategoryid: props.scenariocategoryid,
      });
      setformModal(true);
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
        dispatch(deleteComponentCat(payload));
      }
    });
  };

  const handleDelete = (props, flag) => {
    if (flag === true) {
      const payload = {
        scenariocategoryid: props?.scenariocategoryid,
      };

      dispatch(deleteComponentCat(payload));
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
        const payload = {
          scenariocategoryid: data.scenariocategoryid,
          status: data.status == "false" ? "true" : "false",
        };
        const Id = data?.scenariocategoryid;
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
          handleDelete={handleDelete}
          handleShowEdit={true}
          propsVal={props}
        />
      );
    },
    statusRenderer: (params) => {
      const status = params.value || "";
      let badgeClass = "badge bg-secondary";
      if (status === "Public") badgeClass = "badge bg-success";
      else if (status === "Private") badgeClass = "badge bg-danger";
      return (
        <span
          className={badgeClass}
          style={{
            padding: "0.4em 0.75em",
            fontSize: "0.9em",
            fontWeight: "500",
            borderRadius: "0.5em",
          }}
        >
          {status}
        </span>
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

  const handleImportModal = () => {
    dispatch(clearVerifyScenarioCategoryModel());
    setOpenImportModal(!openImportModal);
  };
  return (
    <>
      <Seo title="Scenario Categories" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center ">
                  <h5>Scenario Categories</h5>
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
                        dispatch(getScenarioList({ status: e.target.value }));
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
                    style={{ height: "40em", width: "100%" }}
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
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
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
                                  {item.categoryname &&
                                  item.categoryname.length > 20
                                    ? `${item.categoryname.substring(0, 20)}...`
                                    : item.categoryname}{" "}
                                </a>
                              </h5>
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
                                className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle mx-1"
                                onClick={() => handleDeletecard(item)}
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
                              <span
                                className={`badge rounded-pill ${
                                  item.categorytype === "Public"
                                    ? "bg-success"
                                    : "bg-secondary text-dark"
                                }`}
                                style={{
                                  fontSize: "0.8rem",
                                  padding: "0.3em 0.6em",
                                }}
                              >
                                {item.categorytype}
                              </span>
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
                        <Row className="text-center" style={{ height: "70vh" }}>
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

        <ImportScenarioCategoryList
          openImportModal={openImportModal}
          handleImportModal={handleImportModal}
          showListImort={showListImort}
          setShowListImport={setShowListImport}
        />
      </Row>
      <FormScenarioCategory
        openFlag={formModal}
        handleFormModal={handleFormModal}
        rowValues={rowValues}
        oneClick={oneClick}
        handleOneClick={handleOneClick}
      />
    </>
  );
};

ScenarioCategory.layout = "Contentlayout";
export default ScenarioCategory;
