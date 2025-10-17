import React, { useState, useEffect, useMemo } from "react";
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
import UserModal from "../../../shared/data/admin/modals/user";
import ImportAdUser from './import-user';
import {
  getListOfUser,
  clearHasError,
  clearaddUserData,
  cleareditUserData,
  editStatusUserData,
  cleareditStatusUserData,
} from "../../../shared/redux/slices/admin/Users";
import * as XLSX from "xlsx";

const Organization = () => {
  const dispatch = useDispatch();
  const [compStatus, setCompStatus] = useState("true");
  const [quickFilter, setQuickFilter] = useState("");
  const [rowData, setRowData] = useState([]);
  const [formModal, setformModal] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    orgcode: "",
    orgname: "",
    isactive: true,
    empcode_prefix: "",
  });
  const [oneClick, setOneClick] = useState(false);
  
  const {
    listUserData,
    addUserData,
    editUserData,
    editStatusUserResData,
    errorData,
  } = useSelector((state) => {
    return {
      listUserData:
        state &&
        state.user &&
        state.user.getUserData &&
        state.user.getUserData.data,

      addUserData:
        state && state.user && state.user.addUserData,

      editUserData:
        state && state.user && state.user.editUserData,

      editStatusUserResData:
        state && state.user && state.user.editStatusUserData,

      errorData: state && state.user && state.user.error,
    };
  });

  const columnDefs = [
    {
      headerName: "User Name",
      field: "loginid",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Name",
      field: "name",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Email",
      field: "email",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Mobile",
      field: "mobile",
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
      width: 80,
    },
  ];
const [impUser, setimpUser] = useState(false);
let importAdUsers = (modal) => {
  setimpUser(true);

  console.log("impUser",modal);
  //  [eslint]
  dispatch(clearHasError())
    switch (modal) {            
      case "users":
        setimpUser(true);
        break;            
    }
  };

  //Function to Download Excel file
  const handleExport = () => {
    const exportData = listUserData.map((row) => [
      row.firstname,
      row.lastname,
      row.email,
      row.mobile,
      row.status== "true" ? 'Active' : 'Inactive', 
    ]);

    const header = [ 
      "First Name",
      "Last Name",
      "Email",
      "Mobile", 
      "Status",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
    XLSX.writeFile(workbook, "User_data.xlsx");
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterChanged = (data) => {
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };

  useEffect(() => {
    if (listUserData && listUserData != undefined) {
      if (compStatus === "") {
        setRowData(listUserData);
      } else if (compStatus === "true") {
        const filteredData = listUserData.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = listUserData.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
      }
    }
  }, [listUserData, compStatus]);
 

  useEffect(() => {
    dispatch(getListOfUser());
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
    if (addUserData?.statusCode) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addUserData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfUser());
      dispatch(clearaddUserData());
    }
  }, [addUserData]);

  useEffect(() => {
    if (editUserData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editUserData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfUser());
      dispatch(cleareditUserData());
    }
  }, [editUserData]);

  useEffect(() => {
    if (editStatusUserResData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editStatusUserResData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfUser());
      dispatch(cleareditStatusUserData());
    }
  }, [editStatusUserResData]);

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
    if (props) {
      setRowValues({
        title: "Edit",
        id: props.userid,
        loginid:props.loginid,
        firstname: props.firstname,
        lastname: props.lastname,
        email: props.email,
        mobile: props.mobile,
        isactive: JSON.parse(props.status)
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
        const Id = data?.userid;
        dispatch(editStatusUserData(payload, Id));
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
      <Seo title="SIMUser" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <Col md={12} className="mg-b-10">
                <div className="d-flex justify-content-between">
                  <h5>SIMUser</h5>
                  <div className="row">
                    <div className="col-md-3">
                      <ToggleButtonGroup
                        className="mg-r-10"
                        color="success"
                        value={compStatus}
                        size="small"
                        exclusive
                        onChange={(e) => {
                          setCompStatus(e.target.value),
                            dispatch(
                              getListOfUser({ isactive: e.target.value })
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
                    <div className="col-md-5">
                      <Button
                        type="button"
                        variant="outline-primary"
                        onClick={() => handleFormModal(true)}
                      >
                        <i className="fa fa-plus"></i> Add
                      </Button>
                      &nbsp;&nbsp;
                      <Button
                        type="button"
                        variant="outline-info"
                        onClick={() => handleExport()}
                      >
                        <i className="fa fa-file-excel-o"></i> Export
                      </Button>
                      &nbsp;&nbsp;
                      <Button
                      className='ms-1'
                      type="button"
                      variant="outline-info" 
                      onClick={() => importAdUsers("users")}                
                      >
                      <i className='fa fa-file-excel-o'></i> Import
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
        <UserModal
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
        />
      )}
        <ImportAdUser
          impUser={impUser} 
          setimpUser={setimpUser}
          questionData={'questionData'}
        />
    </>
  );
};

Organization.layout = "Contentlayout";
export default Organization;