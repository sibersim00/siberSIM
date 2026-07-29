import React, { useState, useEffect, useMemo,useRef,useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import UserModal from "../../../shared/data/admin/modals/user";
import ImportAdUser from "./import-adminusers";
import {
  getListOfUser,
  clearHasError,
  clearaddUserData,
  cleareditUserData,
  editStatusUserData,
  cleareditStatusUserData,
  resetPassword,
  clearresetPassword,
} from "../../../shared/redux/slices/admin/Users";
import * as XLSX from "xlsx";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_profile from "../../../public/assets/img/dummy_profile.png";

const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const Adminuser = () => {
  const dispatch = useDispatch();
  const [openImportModal, setOpenImportModal] = useState(false);
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setformModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);``
  const [rowValues, setRowValues] = useState({
    title: "Add",
    orgcode: "",
    orgname: "",
    isactive: true,
    empcode_prefix: "",
  });

      const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  const [oneClick, setOneClick] = useState(false);
  const {
    listUserData,
    isLoading,
    addUserData,
    editUserData,
    editStatusUserResData,
    errorData,
    hasresetPasswordSucc,
  } = useSelector((state) => {
    return {
      listUserData:
        state &&
        state.user &&
        state.user.getUserData &&
        state.user.getUserData.data,
      isLoading:
        state && state.user && state.user.isLoading,

      addUserData: state && state.user && state.user.addUserData,

      editUserData: state && state.user && state.user.editUserData,

      editStatusUserResData:
        state && state.user && state.user.editStatusUserData,

      haschangePasswordSucc:
        state && state.user && state.user.changePasswordSucc,
      hasresetPasswordSucc: state && state.user && state.user.resetPasswordSucc,

      errorData: state && state.user && state.user.error,
    };
  });
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      maxWidth: 80,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
    {
      headerName: "User Name",
      field: "loginid",
      filter: true,
      floatingFilter: true,
      
    },
    {
      headerName: "First Name",
      field: "firstname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Last Name",
      field: "lastname",
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
      pinned: "right",
      width: 100,
    },
    {
      headerName: "Action",
      field: "",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      minWidth: 80,
      pinned: "right",
    },
  ];

  const [impUser, setimpUser] = useState(false);

  const handleExport = () => {
    // const exportData = listUserData.map((row) => [
    const filteredData = listUserData.filter((row) => {
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
        row.userid,
        row.loginid,
        row.firstname,
        row.lastname,
        row.email,
        row.mobile,
        row.status == "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "SIMMaster User Id",
      "User Name",
      "First Name",
      "Last Name",
      "Email",
      "Mobile",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AdminUSer");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const filePrefix =
      compStatus === ""
        ? "AdminUser_All"
        : compStatus === "true"
          ? "AdminUser_Active"
          : "AdminUser_Inactive";

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
    const totalRows = params.api.getDisplayedRowCount(); 

    // Use whichever is smaller — actual rows vs page size
    const effectiveRows = Math.min(newPageSize, totalRows);
    setPageSize(effectiveRows);
  }
}, []);

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    let filteredList = listUserData ?? [];

    if (compStatus === "true") {
      filteredList = filteredList.filter((d) => d?.status?.toString() === "true");
    } else if (compStatus === "false") {
      filteredList = filteredList.filter((d) => d?.status?.toString() === "false");
    }



    const temp = filteredList.filter((d) => {
      const fullName = `${(d.firstname ?? "")} ${(d.lastname ?? "")}`.toLowerCase();
      const firstName = d.firstname?.toLowerCase() ?? "";
      const lastName = d.lastname?.toLowerCase() ?? "";

      const email = d.email?.toLowerCase() ?? "";
      const mobile = d.mobile?.toString().toLowerCase() ?? "";
      const loginid = d.loginid?.toLowerCase() ?? "";

      return (
        fullName.includes(val) || // match combined full name
        (typeof d.loginid === "string" && d.loginid.toLowerCase().includes(val)) ||
        (typeof d.firstname === "string" && d.firstname.toLowerCase().includes(val)) ||
        (typeof d.lastname === "string" && d.lastname.toLowerCase().includes(val)) ||
        (typeof d.email === "string" && d.email.toLowerCase().includes(val)) ||
        (typeof d.address === "string" && d.address.toLowerCase().includes(val)) ||
        (typeof d.organization === "string" && d.organization.toLowerCase().includes(val)) ||
        ((typeof d.mobile === "number" || typeof d.mobile === "string") &&
          String(d.mobile).toLowerCase().includes(val)) ||
        !val
      );
    });

    setGridData(temp);
    setRowData(temp);
  };

  useEffect(() => {
    if (hasresetPasswordSucc?.statusCode == 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasresetPasswordSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfUser());
      dispatch(clearresetPassword());
    }
  }, [hasresetPasswordSucc]);

  useEffect(() => {
    if (listUserData) {
      if (compStatus === "") {
        setRowData(listUserData);
        setGridData(listUserData);
      } else if (compStatus === "true") {
        const filteredData = listUserData.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = listUserData.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      }
    }
  }, [listUserData, compStatus]);

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
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    if (compStatus == "") {
      setRowData(listUserData);
      setGridData(listUserData);
    } else if (compStatus == "true") {
      const filteredData =
        listUserData.length > 0 &&
        listUserData.filter((data) => data?.status?.toString() == "true");
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        listUserData.length > 0 &&
        listUserData.filter((data) => data?.status?.toString() == "false");
      setRowData(filteredData);
      setGridData(filteredData);
    }
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
    setOpenImportModal(false);
  }, []);

  useEffect(() => {
    dispatch(getListOfUser());
    return () => { };
  }, []);



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
    if (editUserData?.statusCode == 200) {
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
      resizable: true, 
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
        loginid: props.loginid,
        firstname: props.firstname,
        lastname: props.lastname,
        email: props.email,
        mobile: props.mobile,
        isactive: JSON.parse(props.status),
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
        const Id = data?.userid;
        const payload = {
          status: data?.status == "true" ? "false" : "true",
          userid: data?.userid,
          loginId: data?.loginid,
        };
        dispatch(editStatusUserData(payload));
      }
    });
  };

  const resetPswd = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to reset the password?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, change it!",
      allowOutsideClick: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const userid = data?.userid;
        if (userid) {
          const payload = {
            userid: userid,
          };

          dispatch(resetPassword(payload));
        }
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
          resetPswd={resetPswd}
          handleShowResetPswd={true}
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
    setRowValues(undefined);
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
  return (
    <>
      <Seo title="SIMMaster" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4>SIMMaster</h4>
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
                        dispatch(getListOfUser({ status: e.target.value }));
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
                      className="ag-theme-alpine"
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
              {isLoading ? (
                <Row>
                  <Col sm={12}>
                    <Card className="custom-card">
                      <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
                        <div className="text-center">
                          <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                          <h5 className="mt-3 mb-0">Loading...</h5>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              ) : gridData && gridData.length > 0 ? (
                <Row className="row-sm">
                  {gridData.map((item, index) => {
                    const isValidMobile =
                      item?.mobile &&
                      String(item.mobile).trim() !== "" &&
                      String(item.mobile).trim() !== "0" &&
                      String(item.mobile).trim().toLowerCase() !== "null";

                    const mobileDisplay = isValidMobile ? item.mobile : "NA";

                    return (
                      <Col key={index} md={12 / columnsPerRow} className="p-0">
                        <Card className="card custom-card our-team" style={{ minHeight: "300px", height: "300px" }}>
                          <Card.Body className="d-flex flex-column">
                            <div className="picture avatar-lg online text-center">
                              <div
                                className="rounded-circle pointer"
                                style={{
                                  width: "100px",        // fixed width
                                  height: "100px",       // fixed height
                                  overflow: "hidden",    // crop the overflow
                                  display: "inline-block"
                                }}
                              >
                                <img
                                  alt="avatar"
                                    onError={(e) => { e.target.onerror = null; e.target.src = dummy_profile.src }}
                                  src={
                                    item?.profile
                                      ? `${process.env.API_URL_FILEMANAGER}${item?.profile}`
                                      : dummy_profile.src
                                  }
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"    // keeps aspect ratio and fills circle
                                  }}
                                />
                              </div>
                            </div>
                            <div className="text-center mt-3 mb-2">
                              <h5 className="pro-user-username text-dark mt-2 mb-0">
                                {item.firstname} {item.lastname}
                              </h5>
                              <p className="pro-user-desc text-success mb-1 mt-1">
                                {item.loginid}
                              </p>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              <div className="btn btn-sm ripple bg-primary-transparent text-primary rounded-circle mx-1">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{mobileDisplay}</Tooltip>}
                                >
                                  <i className="fe fe-phone-call"></i>
                                </OverlayTrigger>
                              </div>

                              <div className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle mx-1">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{item.email}</Tooltip>}
                                >
                                  <i className="fe fe-mail"></i>
                                </OverlayTrigger>
                              </div>
                              <div
                                className="btn btn-sm ripple bg-info-transparent text-info rounded-circle mx-1"
                                onClick={() => handleEdit(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Update</Tooltip>}
                                >
                                  <i className="fe fe-edit"></i>
                                </OverlayTrigger>
                              </div>
                              <div
                                className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle mx-1"
                                onClick={() => resetPswd(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Reset Password</Tooltip>}
                                >
                                  <i className="fa fa-refresh"></i>
                                </OverlayTrigger>
                              </div>
                              {/* Status Toggle */}
                              <div className="btn btn-sm ripple mx-2">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Change Status</Tooltip>}
                                >
                                  <label className="custom-switch mb-0">
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
                                    onClick={() => handleFormModal(true)}
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
        questionData={"questionData"}
      />
    </>
  );
};

Adminuser.layout = "Contentlayout";
export default Adminuser;


