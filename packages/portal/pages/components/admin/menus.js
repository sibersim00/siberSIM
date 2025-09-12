import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button } from "react-bootstrap";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../../shared/layout-components/seo/seo";
import FormMenus from "../../../shared/data/admin/modals/menus";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  getListOfMenus,
  clearaddMenusData,
  cleareditMenusData,
  editStatusMenusData,
  cleareditStatusMenusData,
  clearHasError,
  getById,
  getParentList
} from "../../../shared/redux/slices/admin/Menus";
import * as XLSX from "xlsx";

import { getComponentDetails } from "../../../shared/redux/slices/localstorage/LocalStorage";

const Menues = () => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [subtitle, setSubTitle] = useState('');
  const [compStatus, setCompStatus] = useState("true");
  const [quickFilter, setQuickFilter] = useState("");
  const [rowData, setRowData] = useState([]);
  const [formModal, setformModal] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [oneClick, setOneClick] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    menuid: 0,
    menuname: "",
    displaymenuname: "",
    parentmenuname: "",
    icon: "",
    path: "",
    source: "",
    type: "",
    orderno: "",
    isactive: true,
    parentmenuid: 0,
  });


  const {
    listMenusData,
    addMenusData,
    editMenusData,
    editStatusMenusResData,
    componentData,
    errorData,
  } = useSelector((state) => {
    return {
      listMenusData:
        state &&
        state.menus &&
        state.menus.getMenusData &&
        state.menus.getMenusData.data,

      addMenusData: state && state.menus && state.menus.addMenusData,
      editMenusData: state && state.menus && state.menus.editMenusData,
      editStatusMenusResData:
        state && state.menus && state.menus.editStatusMenusData,
      componentData:
        state && state.localData && state.localData.componentData, 
      errorData: state && state.menus && state.menus.error,
    };
  });
  useEffect(() => {
    dispatch(getListOfMenus());
    dispatch(getParentList())
    dispatch(getComponentDetails("/menus"))
    return () => {};
  }, []);
  useEffect(() => {
    if(componentData){
      setTitle(componentData?.title ? componentData.title : "");
      setSubTitle(componentData?.subtitle ? componentData.subtitle : componentData?.title ? componentData.title : "");
    }
  }, [componentData]);

  const columnDefs = [
    {
      headerName: `${subtitle} Name`,
      field: "menuname",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
    },
    {
      headerName: `Display ${subtitle} Name`,
      field: "displaymenuname",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
    },
    {
      headerName: `Parent ${subtitle}`,
      field: "parentmenuname",
      filter: true,
      floatingFilter: true,
      minWidth: 160,
    },
    {
      headerName: `${subtitle} Type`,
      field: "menutype",
      filter: true,
      floatingFilter: true,
      minWidth: 110,
    },
    {
      headerName: "Display Route",
      field: "source",
      filter: true,
      floatingFilter: true,
      minWidth: 120,
    },
    {
      headerName: "Icon",
      field: "icon",
      filter: true,
      floatingFilter: true,
      minWidth: 90,
      cellRenderer:"showIcon"
    },
    {
      headerName: "Order No.",
      field: "orderno",
      filter: true,
      floatingFilter: true,
      minWidth: 140,
    },
    {
      headerName: "Status",
      field: "isactive",
      cellRenderer: "actionSwitchRenderer",
      width: 100,
      pinned : "right"
    },
    {
      headerName: "Action",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      width: 80,
      pinned : "right"
    },
  ];
  //Function to Download Excel file
  const handleExport = () => {
    const exportData = listMenusData.map((row) => [
      row.menuid,
      row.menuname,
      row.displaymenuname,
      row.icon,
      row.source,
      row.menutype,
      row.parentmenuname,
      row.orderno,
      row.status,
    ]);

    const header = [
      `Id`,
      `${subtitle} Name`,
      `Display ${subtitle} Name`,
      `Icon`,
      `Display Route`,
      `${subtitle} Type`,
      `Parent ${subtitle}`,
      `Order No.`,
      `Status`,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
    XLSX.writeFile(workbook, `${title.trim()}_data.xlsx`);
  };

  useEffect(() => {
    if (listMenusData) {
      if (compStatus === "") {
        setRowData(listMenusData);
      } else if (compStatus == "true") {
        const filteredData = listMenusData && listMenusData.length > 0 && listMenusData.filter(
          (data) => data?.status?.toString() == "true"
        );
        setRowData(filteredData);
      } else if (compStatus == "false") {
        const filteredData = listMenusData && listMenusData.length > 0 && listMenusData.filter(
          (data) => data?.status?.toString() == "false"
        );
        setRowData(filteredData);
      }
    }
  }, [listMenusData, compStatus]);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  useEffect(() => {
    if (editStatusMenusResData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusMenusResData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfMenus());
      dispatch(cleareditStatusMenusData());
    }
  }, [editStatusMenusResData]);

  useEffect(() => {
    if (editMenusData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editMenusData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfMenus());
      dispatch(cleareditMenusData());
    }
  }, [editMenusData]);

  const handleOneClick = (flag) => {
    setOneClick(flag);
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
      setOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    if (addMenusData?.statusCode) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addMenusData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfMenus());
      dispatch(clearaddMenusData());
    }
  }, [addMenusData]);

  const frameworkComponents = {
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
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

    showIcon: function (props) {
      return (
        <><i className={props?.data?.icon}/></>
      );
    },

  };

  const handleFormModal = (flag) => {
    setRowValues({
      title: "Add",
      menuid: 0,
      menuname: "",
      displaymenuname:"",
      parentmenuname: "",
      icon: "",
      path: "",
      source: "",
      type: "",
      orderno: "",
      isactive: true,
      parentmenuid: '',
    });
    handleOneClick(false);
    setformModal(flag);
  };

  const handleEdit = (props) => {
    handleOneClick(false);
    if (props && props.menuname) {
      dispatch(getById(props.menuid));
      setRowValues({
        title: "Edit",
        menuid: props.menuid,
        menuname: props.menuname,
        displaymenuname: props?.displaymenuname,
        singularmenuname: props?.singularmenuname,
        parentmenuname: props.parentmenuname,
        icon: props.icon,
        path: props.menupath,
        source: props.source,
        type: props.menutype,
        isactive: JSON.parse(props.status),
        parentmenuid: props.parentmenuid,
        orderno: props.orderno,
      });
      setformModal(true);
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
          status : data?.status == "true" ? "false":"true",
        };
        const Id = data?.menuid;
        dispatch(editStatusMenusData(payload, Id));
      }
    });
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
    };
  }, []);

  return (
    <>
      <Seo title={title} />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <Col md={12} className="mg-b-10">
                <div className="d-flex justify-content-between">
                  <h5>{title}</h5>
                  <div className="row">
                    <div className="col-md-4">
                      <ToggleButtonGroup
                        className="mg-r-10"
                        color="success"
                        value={compStatus}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          setCompStatus(e.target.value),
                            dispatch(
                              getListOfMenus({ status: e.target.value })
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
                    </div>
                    <div className="col-md-4">
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
                    </div>
                    <div className="col-md-4">
                      <input
                        className="form-control bd bd-2"
                        value={quickFilter}
                        placeholder="Search..."
                        type="text"
                        onChange={(e) => onFilterChanged(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12}>
                <div
                  className="ag-theme-alpine"
                  style={{ height: "38em", width: "100%" }}
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
                    frameworkComponents={frameworkComponents}
                    defaultColDef={defaultColDef}
                  ></AgGridReact>
                </div>
              </Col>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {formModal && (
        <FormMenus
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
          subtitle={subtitle}
        />
      )}
    </>
  );
};

Menues.layout = "Contentlayout";
export default Menues;
