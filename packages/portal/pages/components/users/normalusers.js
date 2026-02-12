import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Router, { useRouter } from "next/router";
import dummy_profile from "../../../public/assets/img/dummy_profile.png";
import "../../../shared/utils/i18n";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import CustomToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import NormalUserModal from "../../../shared/data/admin/modals/normal-user";
import MapInstructorModal from "../../../shared/data/admin/modals/map-instructors";
import ImportAdUser from "./import-adminusers";
import "../../../shared/utils/i18n";
import { getInitials, stringToColor } from "../../../shared/utils/regex";

import { useTranslation } from "react-i18next";
import { getLocalStorageData } from "../../../shared/redux/slices/localstorage/LocalStorage";
import {
  getNormalusersManageList,
  saveNormalusersChangeStatus,
  clearSaveNormalusersChangeStatus,
  cleardeleteNormalUser,
  clearHasError,
  cleareditUserData,
  clearRegisterNormaluser,
  clearSaveMappedInstructor,
  changePassword,
  clearChangePasswor,
  clearconfirmationlearnerData,
  deleteNormalUser,
  clearMappedInstructorById,
} from "../../../shared/redux/slices/normalusers/normalUserManage";
import { verifylearnerData } from "../../../shared/redux/slices/authentication/Auth";

import * as XLSX from "xlsx";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";

const Normaluser = () => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const { t } = useTranslation();
  const [openImportModal, setOpenImportModal] = useState(false);
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setformModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [gridData, setGridData] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [mapInstructors, setMapInstructors] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [imgError, setImgError] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    componentcategoryid: 0,
    educationcode: "",
    parentcategoryname: "",
    status: true,
    description: "",
  });
  const [oneClick, setOneClick] = useState(false);
  const {
    listUserData,
    addUserData,
    editUserData,
    editStatusUserResData,
    errorData,
    deleteNormalUserRes,
    saveMappedInstructorRes,
    haschangePasswordSucc,
    getUserDataFromLocal,
    hasconfirmationlearnerData,
  } = useSelector((state) => {
    return {
      listUserData:
        state &&
        state.normalUSerData &&
        state.normalUSerData.getNormalusersData &&
        state.normalUSerData.getNormalusersData.data,
      addUserData:
        state &&
        state.normalUSerData &&
        state.normalUSerData.registerNormaluserResp,

      editUserData:
        state &&
        state.normalUSerData &&
        state.normalUSerData.updateNormaluserResp,
      editStatusUserResData:
        state &&
        state.normalUSerData &&
        state.normalUSerData.statusChangeNormaluser,
      deleteNormalUserRes:
        state &&
        state.normalUSerData &&
        state.normalUSerData.deleteNormalUser &&
        state.normalUSerData.deleteNormalUser,
      saveMappedInstructorRes:
        state &&
        state.normalUSerData &&
        state.normalUSerData.saveMappedInstructorRes,
      haschangePasswordSucc:
        state &&
        state.normalUSerData &&
        state.normalUSerData.changePasswordSucc,
      hasconfirmationlearnerData:
        state &&
        state.normalUSerData &&
        state.normalUSerData.confirmationlearnerData,
      getUserDataFromLocal:
        state && state.localData && state.localData.getLocalData,
      errorData: state && state.normalUSerData && state.normalUSerData.error,
    };
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"));
    }
  }, []);
  const [userType, setUserType] = useState("");
  useEffect(() => {
    if (getUserDataFromLocal && getUserDataFromLocal.usertype) {
      setUserType(getUserDataFromLocal.usertype);
    }
  }, [getUserDataFromLocal]);
  useEffect(() => {
    if (deleteNormalUserRes?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {deleteNormalUserRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getNormalusersManageList());
      dispatch(cleardeleteNormalUser());
    }
  }, [deleteNormalUserRes]);

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      maxWidth: 80,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.username"),
      field: "username",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.first_name"),
      field: "firstname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.last_name"),
      field: "lastname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.email_id"),
      field: "email",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.mobile_no"),
      field: "mobile",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: t("learner.columns.status"),
      field: "status",
      cellRenderer: "actionSwitchRenderer",
      width: 100,
      pinned: "right",
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

  const [impUser, setimpUser] = useState(false);
  const handleExport = () => {
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
        row.learner_id,
        row.firstname,
        row.lastname,
        row.email,
        row.mobile,
        row.username,
        row.status == "true" ? "Active" : "Inactive",
        createdDateOnly,
        createdTime,
        modifiedDateOnly,
        modifiedTime,
      ];
    });

    const header = [
      "Normal SIMUser Id",
      t("learner.columns.first_name"),
      t("learner.columns.last_name"),
      t("learner.columns.email_id"),
      t("learner.columns.mobile_no"),
      t("learner.columns.username"),
      t("learner.columns.status"),
      "Created Date",
      "Created Time",
      "Modified Date",
      "Modified Time",
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...exportData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SIMUser");

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.]/g, "")
      .slice(0, 15);
    const filePrefix =
      compStatus === ""
        ? "SIMUser All"
        : compStatus === "true"
          ? "User_Active"
          : "User_Inactive";

    XLSX.writeFile(workbook, `${filePrefix}_${timestamp}.xlsx`);
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
  };
  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase();

    let filteredList = listUserData ?? [];

    if (compStatus === "true") {
      filteredList = filteredList.filter(
        (d) => d?.status?.toString() === "true",
      );
    } else if (compStatus === "false") {
      filteredList = filteredList.filter(
        (d) => d?.status?.toString() === "false",
      );
    }

    const temp = filteredList.filter((d) => {
      const fullName = `${d.firstname ?? ""} ${d.lastname ?? ""}`.toLowerCase();
      const firstName = d.firstname?.toLowerCase() ?? "";
      const lastName = d.lastname?.toLowerCase() ?? "";

      const email = d.email?.toLowerCase() ?? "";
      const mobile = d.mobile?.toString().toLowerCase() ?? "";
      const username = d.username?.toLowerCase() ?? "";

      return (
        fullName.includes(val) || // match combined full name
        (typeof d.username === "string" &&
          d.username.toLowerCase().includes(val)) ||
        (typeof d.firstname === "string" &&
          d.firstname.toLowerCase().includes(val)) ||
        (typeof d.lastname === "string" &&
          d.lastname.toLowerCase().includes(val)) ||
        (typeof d.email === "string" && d.email.toLowerCase().includes(val)) ||
        (typeof d.address === "string" &&
          d.address.toLowerCase().includes(val)) ||
        (typeof d.organization === "string" &&
          d.organization.toLowerCase().includes(val)) ||
        ((typeof d.mobile === "number" || typeof d.mobile === "string") &&
          String(d.mobile).toLowerCase().includes(val)) ||
        !val
      );
    });

    setGridData(temp);
    setRowData(temp);
  };
  useEffect(() => {
    dispatch(getNormalusersManageList());
    return () => { };
  }, []);

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
        listUserData.length > 0
          ? listUserData.filter((data) => data?.status?.toString() === "true")
          : [];

      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        listUserData.length > 0
          ? listUserData.filter((data) => data?.status?.toString() === "false")
          : [];
      setRowData(filteredData);
      setGridData(filteredData);
    }
  };

  useEffect(() => {
    setOpenImportModal(false);
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
            },
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
          },
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
        },
      );
      dispatch(getNormalusersManageList());
      dispatch(clearRegisterNormaluser());
    }
  }, [addUserData]);
  useEffect(() => {
    if (saveMappedInstructorRes?.statusCode) {
      setMapInstructors(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveMappedInstructorRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getNormalusersManageList());
      dispatch(clearSaveMappedInstructor());
    }
  }, [saveMappedInstructorRes]);

  useEffect(() => {
    if (haschangePasswordSucc?.statusCode == 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {haschangePasswordSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getNormalusersManageList());
      dispatch(clearChangePasswor());
    }
  }, [haschangePasswordSucc]);

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
        },
      );
      dispatch(getNormalusersManageList());
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
        },
      );
      dispatch(getNormalusersManageList());
      dispatch(clearSaveNormalusersChangeStatus());
    }
  }, [editStatusUserResData]);
  useEffect(() => {
    if (hasconfirmationlearnerData?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasconfirmationlearnerData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getNormalusersManageList());
      dispatch(clearconfirmationlearnerData());
    }
  }, [hasconfirmationlearnerData]);

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
      setRowValues(props);
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
          learner_uuid: item?.learner_uuid,
        };
        dispatch(deleteNormalUser(payload));
      }
    });
  };
  const handleDelete = (props, flag) => {
    if (flag == true) {
      const payload = {
        learner_uuid: props?.learner_uuid,
      };
      dispatch(deleteNormalUser(payload));
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
          status: data?.status == "true" ? "false" : "true",
          learner_uuid: data?.learner_uuid,
        };
        const Id = data?.userid;
        dispatch(saveNormalusersChangeStatus(payload, Id));
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
        const learner_uuid = data?.learner_uuid;
        const baseurl = process.env.LEARNER_BASE_PATH;
        window.open(`${baseurl}/users-verification/${learner_uuid}`, "_blank");
        dispatch(verifylearnerData({ learner_uuid }));
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
        const learner_id = data?.learner_id;
        if (learner_id) {
          const payload = {
            learner_id: learner_id,
          };
          dispatch(changePassword(payload));
        }
      }
    });
  };
  const handleMapInstructorModal = (data) => {
    dispatch(clearMappedInstructorById());
    handleOneClick(false);
    if (data.learner_id) {
      setRowValues(data);
      setMapInstructors(true);
    }
  };
  const handleReturnView = (props) => {
    push(`/normalusers_view/${props?.learner_uuid}`);
  };
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
    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleEdit={handleEdit}
          handleShowEdit={true}
          resetPswd={resetPswd}
          handleShowResetPswd={props?.data?.isverified == "Yes"}
          verifyAccount={verifyAccount}
          handleShowVerifyAccount={props?.data?.isverified == "No"}
          mapInstructor={handleMapInstructorModal}
          handleShowMapInstructort={userType == "Admin" ? true : false}
          handleDelete={handleDelete}
          propsVal={props}
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
  useEffect(() => {
    if (!listUserData) return;
    let filtered = listUserData;
    if (compStatus === "true") {
      filtered = listUserData.filter((d) => d.status?.toString() === "true");
    } else if (compStatus === "false") {
      filtered = listUserData.filter((d) => d.status?.toString() === "false");
    }

    setRowData(filtered);
    setGridData(filtered.slice(0, 50));
    setVisibleCount(50);
  }, [listUserData, compStatus]);

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    if (!rowData?.length) return;
    if (visibleCount >= rowData.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => {
        const next = Math.min(prev + 50, rowData.length);
        setGridData(rowData.slice(0, next));
        return next;
      });
      setIsLoadingMore(false);
    }, 100);
  };

  const observerRef = useCallback(
    (node) => {
      if (!node) return;
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      });
      observer.observe(node);
      return () => observer.disconnect();
    },
    [handleLoadMore],
  );


  return (
    <>
      <Seo title="SIMUser" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body className="p-3">
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center">
                  <h4> SIMUser</h4>
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
                          getNormalusersManageList({ status: e.target.value }),
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
                    &nbsp;&nbsp; &nbsp;
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
                <>
                  <Row className="row-sm">
                    {gridData.map((item, index) => {
                      const isValidMobile =
                        item?.mobile &&
                        String(item.mobile).trim() !== "" &&
                        String(item.mobile).trim() !== "0" &&
                        String(item.mobile).trim().toLowerCase() !== "null";

                      const mobileDisplay = isValidMobile ? item.mobile : "NA";

                      return (
                        <Col
                          key={index}
                          md={12 / columnsPerRow}
                          className="p-0"
                        >
                          <Card className="card custom-card our-team">
                            <Card.Body>
                              {/* <div className="picture avatar-lg online text-center">
                                <div
                                  className="rounded-circle pointer"
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    overflow: "hidden",
                                    display: "inline-block",
                                  }}
                                >
                                  <img
                                    alt="avatar"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = dummy_profile.src;
                                    }}
                                    src={
                                      item?.profile
                                        ? `${process.env.API_URL_FILEMANAGER}${item?.profile}`
                                        : dummy_profile.src
                                    }
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover", // keeps aspect ratio and fills circle
                                    }}
                                  />
                                </div>
                              </div> */}
                              <div className="picture avatar-lg online text-center">
                                <div
                                  className="rounded-circle pointer"
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    overflow: "hidden",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                      !item?.profile || imgError
                                        ? stringToColor(item?.name || item?.username || "User")
                                        : "transparent",
                                    color: "#2b2b2b",
                                    fontWeight: 600,
                                    fontSize: "28px",
                                    userSelect: "none",
                                  }}
                                >
                                  {item?.profile && !imgError ? (
                                    <img
                                      alt="avatar"
                                      src={`${process.env.API_URL_FILEMANAGER}${item?.profile}`}
                                      onError={() => setImgError(true)}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    getInitials(
                                      `${item?.firstname || ""} ${item?.lastname || ""}`.trim() || "User"
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="text-center mt-3">
                                <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                  <a>
                                    {item.firstname} {item.lastname}
                                  </a>
                                </h5>
                                <p className="pro-user-desc text-success mb-1 mt-1">
                                  {item.username}
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

                                {/* Email Button */}
                                <div className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle mx-1">
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={<Tooltip>{item.email}</Tooltip>}
                                  >
                                    <i className="fe fe-mail"></i>
                                  </OverlayTrigger>
                                </div>

                                {/* Edit Button */}
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
                                {userType !== "Instructor" && (
                                  <div
                                    className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle mx-1"
                                    onClick={() =>
                                      handleMapInstructorModal(item)
                                    }
                                  >
                                    <OverlayTrigger
                                      placement="bottom"
                                      overlay={
                                        <Tooltip>Map Instructor</Tooltip>
                                      }
                                    >
                                      <i className="fa fa-map-o"></i>
                                    </OverlayTrigger>
                                  </div>
                                )}

                                {/* Status Toggle */}
                                <div>
                                  <div
                                    className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                    onClick={() =>
                                      push(
                                        `/normalusers_view/${item?.learner_uuid}`,
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
                                  <div className="btn btn-sm ripple ">
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
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                  {visibleCount < rowData.length && (
                    <div
                      ref={observerRef}
                      className="d-flex justify-content-center my-4"
                      style={{ height: "40px" }}
                    >
                      {isLoadingMore && (
                        <div className="vertical-bounce-loader">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )}
                    </div>
                  )}
                </>
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
        <NormalUserModal
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
        />
      )}

      {mapInstructors && (
        <MapInstructorModal
          openFlag={mapInstructors}
          setMapInstructors={setMapInstructors}
          rowValues={rowValues}
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

Normaluser.layout = "Contentlayout";
export default Normaluser;
