import React, { useState, useEffect, useMemo } from "react";
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
import Router, { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import InstructorModal from "../../../shared/data/admin/modals/InstructorModal";
import {
  getListOfinstructor,
  clearHasError,
  clearaddInstructorData,
  cleareditInstructorData,
  editStatusInstructorData,
  cleareditStatusInstructorData,
  confirmationInstructorData,
  clearconfirmationInstructorData,
  changePassword,
  clearChangePasswor,
} from "../../../shared/redux/slices/instructor/instructor";
import { verifyInstructorData } from "../../../shared/redux/slices/authentication/Auth";

import * as XLSX from "xlsx";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_profile from "../../../public/assets/img/dummy_profile.png";

const Instructors = () => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const [openImportModal, setOpenImportModal] = useState(false);
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setformModal] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    orgcode: "",
    orgname: "",
    status: true,
    empcode_prefix: "",
  });
  const [oneClick, setOneClick] = useState(false);
  const {
    hasGetinstructorSucc,
    addInstructorData,
    editInstructorData,
    editStatusUserResData,
    confirmationRedData,
    errorData,
    haschangePasswordSucc,
  } = useSelector((state) => {
    return {
      hasGetinstructorSucc:
        state &&
        state.InstructorData &&
        state.InstructorData.listinstructorData &&
        state.InstructorData.listinstructorData.data,

      addInstructorData:
        state && state.InstructorData && state.InstructorData.addInstructorData,
      editInstructorData:
        state &&
        state.InstructorData &&
        state.InstructorData.editInstructorData,
      editStatusUserResData:
        state &&
        state.InstructorData &&
        state.InstructorData.editStatusInstructorData,
      confirmationRedData:
        state &&
        state.InstructorData &&
        state.InstructorData.confirmationInstructorData,
      errorData: state && state.InstructorData && state.InstructorData.error,
      haschangePasswordSucc:
        state &&
        state.InstructorData &&
        state.InstructorData.changePasswordSucc,
    };
  });
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      minWidth: 80,
      cellRenderer: "srNoRfender",
      floatingFilter: true,
    },
    {
      headerName: "User Name",
      field: "loginid",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "First Name",
      field: "firstname",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Last Name",
      field: "lastname",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Email",
      field: "email",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Mobile",
      field: "mobile",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Organization",
      field: "organization",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Address",
      field: "address",
      filter: true,
      minWidth: 180,
      floatingFilter: true,
    },
    {
      headerName: "Status",
      field: "status",
      minWidth: 80,
      pinned: "right",
      cellRenderer: "actionSwitchRenderer",
    },
    {
      headerName: "Action",
      field: "",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      minWidth: 90,
      pinned: "right",
    },
  ];

  const handleExport = () => {
    // const exportData = hasGetinstructorSucc.map((row) => [
    // Filter data based on compStatus ("" = all, "true" = active, "false" = inactive)
    const filteredData = hasGetinstructorSucc.filter((row) => {
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
        row.instructor_id,
        row.loginid,
        row.firstname,
        row.lastname,
        row.email,
        row.mobile,
        row.loginid,
        row.organization,
        row.address,
        row.status == "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "SIMManager Id",
      "User Name",
      "First Name",
      "Last Name",
      "Email",
      "Mobile",
      "Username",
      "Organization",
      "Address",
      "Status",
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SIMManager");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const filePrefix =
      compStatus === ""
        ? "Instructor_All"
        : compStatus === "true"
        ? "Instructor_Active"
        : "Instructor_Inactive";

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
  const val = data.toLowerCase();

  let filteredList = hasGetinstructorSucc ?? [];

  // Apply status filter based on compStatus
  if (compStatus === "true") {
    filteredList = filteredList.filter((d) => d?.status?.toString() === "true");
  } else if (compStatus === "false") {
    filteredList = filteredList.filter((d) => d?.status?.toString() === "false");
  }

  const temp = filteredList.filter((d) => {
    const fullName = `${(d.firstname ?? "")} ${(d.lastname ?? "")}`.toLowerCase();

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
    if (hasGetinstructorSucc) {
      if (compStatus === "") {
        setRowData(hasGetinstructorSucc);
        setGridData(hasGetinstructorSucc);
      } else if (compStatus === "true") {
        const filteredData = hasGetinstructorSucc.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = hasGetinstructorSucc.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
        setGridData(filteredData);
      }
    }
  }, [hasGetinstructorSucc, compStatus]);

  useEffect(() => {
    if (hasGetinstructorSucc && hasGetinstructorSucc != undefined) {
      if (compStatus === "") {
        setRowData(hasGetinstructorSucc);
      } else if (compStatus === "true") {
        const filteredData = hasGetinstructorSucc.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = hasGetinstructorSucc.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
      }
    }
  }, [hasGetinstructorSucc, compStatus]);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    if (compStatus == "") {
      setRowData(hasGetinstructorSucc);
      setGridData(hasGetinstructorSucc);
    } else if (compStatus == "true") {
      const filteredData =
        hasGetinstructorSucc.length > 0 &&
        hasGetinstructorSucc.filter(
          (data) => data?.status?.toString() == "true"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        hasGetinstructorSucc.length > 0 &&
        hasGetinstructorSucc.filter(
          (data) => data?.status?.toString() == "false"
        );
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };

  useEffect(() => {
    if (hasGetinstructorSucc && hasGetinstructorSucc != undefined) {
      if (compStatus === "") {
        setRowData(hasGetinstructorSucc);
      } else if (compStatus === "true") {
        const filteredData = hasGetinstructorSucc.filter(
          (data) => data.status.toString() === "true"
        );
        setRowData(filteredData);
      } else if (compStatus === "false") {
        const filteredData = hasGetinstructorSucc.filter(
          (data) => data.status.toString() === "false"
        );
        setRowData(filteredData);
      }
    }
  }, [hasGetinstructorSucc, compStatus]);

  useEffect(() => {
    setOpenImportModal(false);
  }, []);

  useEffect(() => {
    dispatch(getListOfinstructor());
    return () => {};
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
    if (addInstructorData?.statusCode == 200) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addInstructorData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfinstructor());
      dispatch(clearaddInstructorData());
    }
  }, [addInstructorData]);

  useEffect(() => {
    if (editInstructorData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editInstructorData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfinstructor());
      dispatch(cleareditInstructorData());
    }
  }, [editInstructorData]);

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
      dispatch(getListOfinstructor());
      dispatch(cleareditStatusInstructorData());
    }
  }, [editStatusUserResData]);

  useEffect(() => {
    if (confirmationRedData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {confirmationRedData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfinstructor());
      dispatch(clearconfirmationInstructorData());
    }
  }, [confirmationRedData]);

  useEffect(() => {
    if (haschangePasswordSucc?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {haschangePasswordSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getListOfinstructor());
      dispatch(clearChangePasswor());
    }
  }, [haschangePasswordSucc]);

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
        id: props.instructor_id,
        loginid: props.loginid,
        firstname: props.firstname,
        lastname: props.lastname,
        email: props.email,
        mobile: props.mobile,
        organization: props.organization,
        address: props.address,
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
        const Id = data?.instructor_id;
        const payload = {
          instructor_id: data?.instructor_id,
          status: data?.status == "true" ? "false" : "true",
        };
        dispatch(editStatusInstructorData(payload, Id));
      }
    });
  };

  const verifyAccount = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to send the verification email?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Yes, send it!",
      allowOutsideClick: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const instructor_useruuid = data?.instructor_uuid;
        window.open(`/instructor-verification/${instructor_useruuid}`, '_blank');

        dispatch(verifyInstructorData({ instructor_useruuid }));
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
        const instructorId = data?.instructor_id;
        if (instructorId) {
          const payload = {
            instructor_id: instructorId,
          };
          dispatch(changePassword(payload));
        }
      }
    });
  };

  const handleReturnView = (props) => {
    push(`/instructors_view/${props?.instructor_uuid}`);
  };

  const frameworkComponents = {
    srNoRfender: function (props) {
      return props.node.rowIndex + 1;
    },
    actionButtonRenderer: function (props) {
      return (
        <>
          <ActionButtonRenderer
            handleEditView={handleReturnView}
            handleEdit={handleEdit}
            handleShowEdit={true} // Always show Edit button
            resetPswd={resetPswd}
            handleShowResetPswd={props?.data?.isverified == "Yes"}
            verifyAccount={verifyAccount}
            handleShowVerifyAccount={props?.data?.isverified == "No"}
            propsVal={props}
          />
        </>
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
      <Seo title="SIMManager" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4>SIMManager</h4>
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
                        dispatch(
                          getListOfinstructor({ status: e.target.value })
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
                    {/* <Button
                      type="button"
                      variant="outline-warning"
                      onClick={() => {
                        setShowListImport(true);
                        handleImportModal();
                      }}
                    >
                      <i className="fa fa-file-excel-o"></i> Import
                    </Button> */}
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
                    const isValidMobile =
                      item?.mobile &&
                      String(item.mobile).trim() !== "" &&
                      String(item.mobile).trim() !== "0" &&
                      String(item.mobile).trim().toLowerCase() !== "null";

                    const mobileDisplay = isValidMobile ? item.mobile : "NA";
                    return (
                      <Col key={index} md={12 / columnsPerRow} className="p-0">
                        <Card className="card custom-card our-team">
                          <Card.Body>
                            <div className="picture avatar-lg online text-center">
                              <div className="rounded-circle">
                                <img alt="avatar" src={dummy_profile.src} />
                              </div>
                            </div>
                            <div className="text-center mt-3">
                              <h5 className="pro-user-username text-dark mt-2 mb-0">
                                {item.firstname} {item.lastname}
                              </h5>
                              <p className="pro-user-desc text-success mb-1 mt-1">
                                {item.loginid}
                              </p>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              {/* Phone Button */}
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

                              <div className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle mx-1">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip>{item.organization}</Tooltip>
                                  }
                                >
                                  <i className="fa fa-university fa-x"></i>
                                </OverlayTrigger>
                              </div>

                              <div className="btn btn-sm ripple bg-success-transparent text-success rounded-circle mx-1">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{item.address}</Tooltip>}
                                >
                                  <i className="fa fa-map-marker fa-x"></i>
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

                              <div className="d-flex justify-content-center align-items-center mt-2 flex-wrap">
                                {/* Verify Account Button */}
                                {item?.isverified === "No" && (
                                  <div
                                    className="btn btn-sm ripple bg-dark-transparent text-dark rounded-circle mx-1"
                                    onClick={() => verifyAccount(item)}
                                  >
                                    <OverlayTrigger
                                      placement="bottom"
                                      overlay={
                                        <Tooltip>Send Verification</Tooltip>
                                      }
                                    >
                                      <i className="fa fa-check"></i>
                                    </OverlayTrigger>
                                  </div>
                                )}

                                {/* Reset Password Button */}
                                {item?.isverified === "Yes" && (
                                  <div
                                    className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle mx-1"
                                    onClick={() => resetPswd(item)}
                                  >
                                    <OverlayTrigger
                                      placement="bottom"
                                      overlay={
                                        <Tooltip>Reset Password</Tooltip>
                                      }
                                    >
                                      <i className="fa fa-refresh"></i>
                                    </OverlayTrigger>
                                  </div>
                                )}

                                <div className="btn btn-sm ripple mx-1">
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
                                        onChange={() =>
                                          handleStatusSwitch(item)
                                        }
                                      />
                                      <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                    </label>
                                  </OverlayTrigger>
                                </div>

                                <div
                                  className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                  onClick={() =>
                                    push(
                                      `/instructors_view/${item?.instructor_uuid}`
                                    )
                                  }
                                >
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={<Tooltip>View</Tooltip>}
                                  >
                                    <i className="fe fe-eye"></i>
                                  </OverlayTrigger>
                                </div>
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
                                // backgroundColor: "#f6f7fb",
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
        <InstructorModal
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
        />
      )}
    </>
  );
};

Instructors.layout = "Contentlayout";
export default Instructors;
