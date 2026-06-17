import React, { useState, useEffect, useMemo, useRef,useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { Row, Col, Card, Button } from "react-bootstrap";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Organisation from "../../../shared/data/admin/modals/organisation";
import {
  getListOfOrag,
  clearHasError,
  clearaddOragData,
  cleareditOragData,
  editStatusOragData,
  cleareditStatusOragData,
} from "../../../shared/redux/slices/admin/Organization";
import * as XLSX from "xlsx";
import { getComponentDetails } from "../../../shared/redux/slices/localstorage/LocalStorage";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const Organization = () => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [subtitle, setSubTitle] = useState('');
  const [compStatus, setCompStatus] = useState("true");
  const [quickFilter, setQuickFilter] = useState("");
  const [rowData, setRowData] = useState([]);
  const [formModal, setformModal] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    orgid: 0,
    orgcode: "",
    orgname: "",
    isactive: true,
    empcode_prefix: "",
  });
  const [oneClick, setOneClick] = useState(false);
 const [pageSize, setPageSize] = useState(20);
    const gridRef = useRef(null);
     const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  const {
    listOragData,
    addOragData,
    editOragData,
    editStatusOragResData,
    componentData,
    errorData,
  } = useSelector((state) => {
    return {
      listOragData:
        state &&
        state.organization &&
        state.organization.getOragData &&
        state.organization.getOragData.data,

      addOragData:
        state && state.organization && state.organization.addOragData,

      editOragData:
        state && state.organization && state.organization.editOragData,

      editStatusOragResData:
        state && state.organization && state.organization.editStatusOragData,

      componentData:
        state && state.localData && state.localData.componentData,

      errorData: state && state.organization && state.organization.error,
    };
  });

  useEffect(() => {
    dispatch(getComponentDetails("/orgnization"))
    dispatch(getListOfOrag());
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
      headerName: "Organization Code",
      field: "orgcode",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Organization Name",
      field: "orgname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Status",
      field: "isactive",
      cellRenderer: "actionSwitchRenderer",
    },
    {
      headerName: "Action",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      width: 80
    }
  ];

  //Function to Download Excel file
  const handleExport = () => {
    const exportData = listOragData.map((row) => [
      row.orgid,
      row.orgcode,
      row.orgname,
      row.status,
    ]);

    const header = [
      "Id",
      "Organization Code",
      "Organization Name",
      "Status",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
    XLSX.writeFile(workbook, "Organization_data.xlsx");
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
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };

  useEffect(() => {
    if (listOragData && listOragData != undefined) {
      if (compStatus === "") {
        setRowData(listOragData);
      } else if (compStatus === "true") {
        const filteredData = listOragData.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = listOragData.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
      }
    }
  }, [listOragData, compStatus]);

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
    if (addOragData?.statusCode) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addOragData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfOrag());
      dispatch(clearaddOragData());
    }
  }, [addOragData]);

  useEffect(() => {
    if (editOragData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editOragData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfOrag());
      dispatch(cleareditOragData());
    }
  }, [editOragData]);

  useEffect(() => {
    if (editStatusOragResData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusOragResData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfOrag());
      dispatch(cleareditStatusOragData());
    }
  }, [editStatusOragResData]);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
    };
  }, []);

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  const handleEdit = (props) => {
    handleOneClick(false);
    if (props && props.orgid) {
      setRowValues({
        title: "Edit",
        id: props.orgid,
        orgname: props.orgname,
        orgcode: props.orgcode,
        isactive: JSON.parse(props.status),
        empcode_prefix: props?.empcode_prefix,
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
        const Id = data?.orgid;
        dispatch(editStatusOragData(payload, Id));
      }
    });
  };

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
  };

  const handleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues({
      title: "Add",
      id: 0,
      orgname: "",
      orgcode: "",
      isactive: true,
      empcode_prefix: "",
    });
    setformModal(flag);
  };

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
                              getListOfOrag({ isactive: e.target.value })
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
                    frameworkComponents={frameworkComponents}
                    defaultColDef={defaultColDef}
                    paginationPageSize={20}
                    onPaginationChanged={onPaginationChanged} //  track page size changes
                  ></AgGridReact>
                </div>
              </Col>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {formModal && (
        <Organisation
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
        />
      )}
      {/* <TreeView 
      openFlag={treeModal}
      handleFormModal={handleTreeModal}
      /> */}
    </>
  );
};

Organization.layout = "Contentlayout";
export default Organization;
