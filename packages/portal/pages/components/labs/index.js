import { useState, useEffect, useMemo ,useRef,useCallback } from "react";
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
import { AgGridReact } from "ag-grid-react";
import { useRouter } from "next/router";
import {
  getLabsList,
  clearLabDetails,
  clearEditLabDetails,
  deleteLab,
  cleardeleteLab,
  changeStatusLab,
  clearchangeStatusLab,
  clearHasError,
} from "../../../shared/redux/slices/labs/labs";
import Seo from "../../../shared/layout-components/seo/seo";
import "../../../shared/utils/i18n";
import LabsAdd from "../../../shared/data/admin/modals/labsModal";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import ToggleButton from "../../../shared/data/masterButtons/toggleButton";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar } from "@fullcalendar/core";
import ActionButtonRenderer from "../../../shared/data/masterButtons/action-button";
import { useTranslation } from "react-i18next";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const Labs = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { push } = useRouter();
  const [compStatus, setCompStatus] = useState("true");
  const [view, setView] = useState("card");
  const [usertype, setUsertype] = useState(" "); // or "Admin",
  const [rowData, setRowData] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [formModal, setformModal] = useState(false);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    componentcategoryid: 0,
    componenttype: "",
    educationcode: "",
    categoryname: "",
    status: true,
    subcategoryname: "",
    componentidentification: "",
    image_url: "",
    componentname: "",
    ComponentIdentificationVMName: "",
  });
  const [oneClick, setOneClick] = useState(false);
  const [backview, setBackView] = useState("card");
  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const [filterSlot, setfilterSlot] = useState([]);
  const [allowedUsersModal, setAllowedUsersModal] = useState(false);
  const [allowedUsersData, setAllowedUsersData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalEvent, setModalEvent] = useState(null);
  const viewType = router.query.view || "card";

   const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  useEffect(() => {
    if (viewType == "") {
      setView("list");
    } else {
      setView(viewType);
    }
  }, [viewType]);

  const {
    hasGetLabsListSucc,
    addLabData,
    editLabData,
    errorData,
    deleteLabsResp,
    statusChangeLabResp,
    getUserDataFromLocal,
  } = useSelector((state) => {
    return {
      hasGetLabsListSucc:
        state &&
        state.Labs &&
        state.Labs.getLabsListDataresp &&
        state.Labs.getLabsListDataresp.data,
      addLabData: state && state.Labs && state.Labs.addLabResp,
      editLabData: state && state.Labs && state.Labs.editLabResp,
      errorData: state && state.Labs && state.Labs.error,
      deleteLabsResp:
        state &&
        state.Labs &&
        state.Labs.deleteLabResp &&
        state.Labs.deleteLabResp,
      statusChangeLabResp:
        state && state.Labs && state.Labs.statusChangeLabResp,
      getUserDataFromLocal:
        state && state.localData && state.localData.getLocalData,
    };
  });
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "Sr No.",
      maxWidth: 50,
      cellRenderer: "srNoRender",
      floatingFilter: true,
    },
    {
      headerName: "Booking Name",
      field: "bookingname",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Date Time",
      field: "datetime",
      filter: true,
      minWidth: 130,
      floatingFilter: true,
    },
    {
      headerName: "Duration",
      field: "duration",
      minWidth: 100,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Access Level",
      field: "accesslevel",
      minWidth: 100,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Person In Charge",
      field: "personincharge_name",
      minWidth: 100,
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Reserved Seats",
      field: "reservedseats",
      filter: true,
      floatingFilter: true,
    },
    {
      headerName: "Allowed Users",
      field: "allowedusers",
      pinned: "right",
      minWidth: 100,
      maxWidth: 100,
      width: 100,
      cellRendererFramework: (params) => (
        <button
          className="btn btn-sm btn-outline-dark"
          onClick={() => handleAllowedUsersClick(params.data)}
        >
          <i className="fe fe-users"></i>
        </button>
      ),
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      pinned: "right",
      minWidth: 110,
      cellRenderer: "actionButtonRenderer",
    },
  ];
  useEffect(() => {
    if (addLabData?.statusCode == 200) {
      setformModal(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addLabData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getLabsList());
      dispatch(clearLabDetails());
    }
  }, [addLabData]);

  useEffect(() => {
    if (editLabData?.statusCode) {
      setformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {editLabData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getLabsList());
      dispatch(clearEditLabDetails());
    }
  }, [editLabData]);

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  useEffect(() => {
    dispatch(getLabsList());
  }, []);

  useEffect(() => {
    if (hasGetLabsListSucc) {
      const mapped = hasGetLabsListSucc.map((item) => ({
        title: item.bookingname || "",
        start: item.datetime,
        extendedProps: {
          bookingname: item.bookingname,
          datetime: item.datetime,
          reservedseats: item.reservedseats,
          personincharge_name: item.personincharge_name,
          duration: item.duration,
          accesslevel: item.accesslevel,
          allowed_user_details: item.allowed_user_details,
        },
        backgroundColor: item.backgroundColor || undefined,
      }));
      setfilterSlot(mapped);
    }
  }, [hasGetLabsListSucc]);

  useEffect(() => {
    if (hasGetLabsListSucc && hasGetLabsListSucc != undefined) {
      if (compStatus == "") {
        setGridData(hasGetLabsListSucc);
        setRowData(hasGetLabsListSucc);
      } else if (compStatus == "true") {
        const filteredData =
          hasGetLabsListSucc.length > 0 &&
          hasGetLabsListSucc.filter(
            (data) => data?.status?.toString() == "true",
          );
        setGridData(filteredData);
        setRowData(filteredData);
      } else if (compStatus == "false") {
        const filteredData =
          hasGetLabsListSucc.length > 0 &&
          hasGetLabsListSucc.filter(
            (data) => data?.status?.toString() == "false",
          );
        setGridData(filteredData);
        setRowData(filteredData);
      }
    }
  }, [hasGetLabsListSucc, compStatus]);

  useEffect(() => {
    if (errorData?.statusCode === 400) {
      if (errorData.errors?.length > 0) {
        errorData.errors.forEach((msg) => {
          toast.error(msg, {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: true,
            theme: "colored",
          });
        });
      } else {
        toast.error(errorData?.message || "Something went wrong", {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        });
      }

      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  const handleChangeView = (thisView) => {
    setQuickFilter("");
    setView(thisView);
    setBackView(thisView);
    if (compStatus == "") {
      setRowData(hasGetLabsListSucc);
      setGridData(hasGetLabsListSucc);
    } else if (compStatus == "true") {
      const filteredData =
        hasGetLabsListSucc?.length > 0 &&
        hasGetLabsListSucc.filter((data) => data?.status?.toString() == "true");
      setRowData(filteredData);
      setGridData(filteredData);
    } else if (compStatus == "false") {
      const filteredData =
        hasGetLabsListSucc.length > 0 &&
        hasGetLabsListSucc.filter(
          (data) => data?.status?.toString() == "false",
        );
      setRowData(filteredData);
      setGridData(filteredData);
    }
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
        title: "Edit Lab Session",
        lab_id: props.lab_id,
        bookingname: props.bookingname,
        datetime: new Date(props.datetime),
        duration: props.duration,
        accesslevel: props.accesslevel,
        personincharge: props.personincharge,
        reservedseats: props.reservedseats,
        allowedusers: props.allowed_user_details || [],
      });

      setformModal(true);
    }
  };

  const handleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues(undefined);
    setformModal(flag);
  };

  useEffect(() => {
    if (deleteLabsResp?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {deleteLabsResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getLabsList());
      dispatch(cleardeleteLab());
    }
  }, [deleteLabsResp]);

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
          lab_id: item?.lab_id,
        };
        dispatch(deleteLab(payload));
      }
    });
  };

  const handleDelete = (props, flag) => {
    if (flag == true) {
      const payload = {
        lab_id: props?.lab_id,
      };
      dispatch(deleteLab(payload));
    }
  };

  useEffect(() => {
    if (statusChangeLabResp?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {statusChangeLabResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );

      dispatch(getLabsList());
      dispatch(clearchangeStatusLab());
    }
  }, [statusChangeLabResp]);

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
        const Id = data?.lab_id;
        const payload = {
          status: data.status === "true" ? "false" : "true",
          lab_id: data.lab_id,
        };
        dispatch(changeStatusLab(payload, data.lab_id));
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
          handleEditView={() => handleView(props.data)}
          handleShowEditView={true}
          handleEdit={handleEdit}
          propsVal={props}
          handleDelete={handleDelete}
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

  useEffect(() => {
    if (showModal) {
      const pop = document.querySelector(".fc-more-popover");
      if (pop) {
        pop.remove();
      }
    }
  }, [showModal]);

  const handleEventClick = (clickInfo) => {
    clickInfo.jsEvent.preventDefault();
    clickInfo.jsEvent.stopPropagation();

    const {
      bookingname,
      personincharge_name,
      reservedseats,
      datetime,
      duration,
      accesslevel,
      allowed_user_details,
    } = clickInfo.event.extendedProps;

    setTimeout(() => {
      setModalEvent({
        bookingname,
        personincharge_name,
        reservedseats,
        datetime,
        duration,
        accesslevel,
        allowed_user_details,
      });
      setShowModal(true);
    }, 50);
  };

  const handleClose = () => {
    setAllowedUsersModal(false);
    setShowModal(false);
    setModalEvent(null);
  };

  const handleView = (item) => {
    setModalEvent({
      bookingname: item.bookingname || "",
      datetime: item.datetime || "",
      duration: item.duration || "",
      accesslevel: item.accesslevel || "",
      personincharge_name: item.personincharge_name || "",
      reservedseats: item.reservedseats || "",
      allowedusers: item.allowedusers || "",
    });
    setShowModal(true);
  };

  const handleAllowedUsersClick = (rowData) => {
    let usersArray = [];

    if (rowData.allowed_user_details) {
      try {
        usersArray = JSON.parse(rowData.allowed_user_details);
      } catch (err) {
        console.error("Allowed users JSON parse error:", err);
      }
    }
    setAllowedUsersData(usersArray);
    setAllowedUsersModal(true);
  };

  const handleCloseAllowedUsersModal = () => {
    setAllowedUsersModal(false);
    setAllowedUsersData(null);
  };

  useEffect(() => {
    if (getUserDataFromLocal && getUserDataFromLocal.usertype) {
      setUsertype(getUserDataFromLocal.usertype);
      if (getUserDataFromLocal.usertype.toLowerCase() === "instructor") {
        setView("Calender");
      } else {
        if (viewType == "") {
          setView("list");
        } else {
          setView(viewType);
        }
      }
    }
  }, [getUserDataFromLocal, viewType]);

  return (
    <>
      <Seo title="Labs" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            {(view === "list" || view === "card" || view === "Calender") && (
              <Card.Body className="p-3">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>Labs</h5>

                    <div className="d-flex align-items-center">
                      {usertype == "Admin" && (
                        <>
                          <Button
                            type="button"
                            title="Card View"
                            variant="outline-success"
                            onClick={() => handleChangeView("card")}
                            className={
                              view === "card"
                                ? "mx-1 active text-white"
                                : "mx-1"
                            }
                          >
                            <i className="fe fe-grid"></i>
                          </Button>
                          <Button
                            type="button"
                            title="List View"
                            variant="outline-success"
                            onClick={() => handleChangeView("list")}
                            className={
                              view === "list" ? "active text-white" : ""
                            }
                          >
                            <i className="fe fe-list"></i>
                          </Button>
                          &nbsp;
                        </>
                      )}
                      <Button
                        type="button"
                        title="Calendar View"
                        variant="outline-success"
                        onClick={() => handleChangeView("Calender")}
                        className={
                          view === "Calender" ? "active text-white" : ""
                        }
                      >
                        <i className="fe fe-calendar"></i>
                      </Button>
                      &nbsp;
                      {usertype == "Admin" && (
                        <>
                          <Button
                            type="button"
                            variant="outline-primary"
                            onClick={() => handleFormModal(true)}
                          >
                            <i className="fa fa-plus"></i> Add
                          </Button>
                          &nbsp;
                        </>
                      )}
                    </div>
                  </div>
                </Col>
              </Card.Body>
            )}
            {view === "list" && (
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
                      components={frameworkComponents}
                      onGridReady={onGridReady}
                      paginationPageSize={20}
                      defaultColDef={defaultColDef}
                       onPaginationChanged={onPaginationChanged} //  track page size changes
                    ></AgGridReact>
                  </div>
                ) : (
                  ""
                )}
              </Col>
            )}
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
                        <Card className="card custom-card our-team component-status-card">
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
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                  }}
                                  src={
                                    `${process.env.API_URL_FILEMANAGER}${item?.componentimage}` ||
                                    dummy_network.src
                                  }
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = dummy_network.src;
                                  }}
                                />
                              </div>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id={`tooltip-${item.lab_id}`}>
                                    {item.bookingname}
                                  </Tooltip>
                                }
                              >
                                <h6 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                  <span
                                    className="d-inline-block text-truncate w-100"
                                    style={{ maxWidth: "100%" }}
                                  >
                                    {item.bookingname.length > 20
                                      ? `${item.bookingname.substring(
                                          0,
                                          17,
                                        )}...`
                                      : item.bookingname}
                                  </span>
                                </h6>
                              </OverlayTrigger>

                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id="tooltip-vmid-name pointer">
                                    person in charge: {item.personincharge_name}
                                  </Tooltip>
                                }
                              >
                                <h6 className="pro-user-desc mb-1 mt-1 pointer">
                                  {item.personincharge_name}
                                </h6>
                              </OverlayTrigger>
                            </div>
                            <div className="contact-info mb-0 text-center">
                              <div className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle">
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{item.datetime}</Tooltip>}
                                >
                                  <i className="fe fe-calendar"></i>
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
                              <div
                                className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle align-items-center justify-content-center"
                                style={{
                                  width: "29px",
                                  height: "28px",
                                  padding: 0,
                                }}
                                onClick={() => {
                                  handleDeletecard(item);
                                }}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Delete</Tooltip>}
                                >
                                  <i className="fe fe-trash"></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                onClick={() => handleView(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>View</Tooltip>}
                                >
                                  <i className="fe fe-eye "></i>
                                </OverlayTrigger>
                              </div>
                              &nbsp;
                              <div
                                className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle"
                                onClick={() => handleAllowedUsersClick(item)}
                              >
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>Allowed Users</Tooltip>}
                                >
                                  <i className="fe fe-users"></i>
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
                          className=" text-center"
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
                                  <h5 className="mt-4">No Data Found</h5>
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

        <Col md={12} id="calendar-wrap">
          {view === "Calender" && (
            <>
              <div className="card custom-card our-team component-status-card p-3">
                <div id="calendar">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                    }}
                    initialView="dayGridMonth"
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    moreLinkClick={(info) => {
                      return false;
                    }}
                    events={filterSlot}
                    eventTimeFormat={{
                      hour: "2-digit",
                      minute: "2-digit",
                      meridiem: true,
                    }}
                    eventContent={(eventInfo) => {
                      const storedTheme =
                        localStorage.getItem("theme_preference");
                      const isDarkMode = storedTheme === "dark";
                      const { bookingname, datetime, reservedseats } =
                        eventInfo.event.extendedProps;

                      let timeStr = "";
                      if (datetime) {
                        const dt = new Date(datetime);
                        let hours = dt.getHours();
                        const minutes = dt
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");
                        const ampm = hours >= 12 ? "PM" : "AM";
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        timeStr = `${hours}:${minutes} ${ampm}`;
                      }

                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                          }}
                          className={`pd-2 font-weight-normal ${
                            isDarkMode ? "text-white" : "text-black"
                          }`}
                        >
                          <div
                            style={{
                              backgroundColor: eventInfo.event.backgroundColor,
                              borderRadius: "50%",
                            }}
                            className="mg-r-5 wd-8 ht-8"
                          ></div>

                          {timeStr && <div className="me-2">{timeStr}</div>}
                          {eventInfo.event?.title &&
                          eventInfo.event.title.length > 10 &&
                          eventInfo.view.type != "timeGridDay" ? (
                            <OverlayTrigger
                              trigger="click"
                              placement="auto"
                              rootClose
                              className="component-status-card"
                              overlay={
                                <div className="component-status-card p-2">
                                  <Tooltip id={`tooltip-${eventInfo.event.id}`}>
                                    {eventInfo.datetime} {eventInfo.event.title}
                                  </Tooltip>
                                </div>
                              }
                              container={document.body}
                            >
                              <strong className="font-weight-bold">
                                {eventInfo.event.title?.slice(0, 13)}

                                <span>…</span>
                              </strong>
                            </OverlayTrigger>
                          ) : (
                            <strong className="font-weight-bold">
                              {eventInfo.event.title}
                            </strong>
                          )}
                        </div>
                      );
                    }}
                    eventClick={handleEventClick}
                    height="650px"
                  />
                </div>
              </div>

              <Modal
                show={showModal}
                onHide={handleClose}
                centered
                dialogClassName="modal-dialog-centered modal-lg"
              >
                <Modal.Header closeButton className="modal-header-custom">
                  <Modal.Title className="fw-bold">
                    <i className="fe fe-info-circle me-2 text-danger"></i>
                    Booking Details
                  </Modal.Title>
                </Modal.Header>

                <Modal.Body className="bg-light">
                  {modalEvent ? (
                    <div>
                      <div className="row g-0">
                        <div className="col-md-6">
                          <div className="custom-card">
                            <div className="d-flex align-items-center ">
                              <div className="d-flex align-items-center">
                                <i className="fe fe-user text-secondary me-2"></i>
                                <span className="label-text">
                                  Booking Name :
                                </span>
                              </div>
                              <div className="value-text ms-2">
                                {modalEvent.bookingname}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="custom-card">
                            <div className="d-flex align-items-center ">
                              <div className="d-flex align-items-center">
                                <i className="fe fe-calendar  text-secondary me-2"></i>
                                <span className="label-text">
                                  Date & Time :
                                </span>
                              </div>
                              <div className="value-text ms-2">
                                {modalEvent.datetime}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="custom-card">
                            <div className="d-flex align-items-center ">
                              <div className="d-flex align-items-center">
                                <i className="fe fe-clock text-secondary me-2"></i>
                                <span className="label-text">
                                  Duration (hrs) :
                                </span>
                              </div>
                              <div className="value-text ms-2">
                                {modalEvent.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="custom-card">
                            <div className="d-flex align-items-center ">
                              {/* LEFT SIDE (ICON + LABEL) */}
                              <div className="d-flex align-items-center">
                                <i className="fe fe-shield  text-secondary me-2"></i>
                                <span className="label-text">
                                  Access Level :
                                </span>
                              </div>
                              <div className="value-text ms-2">
                                {modalEvent.accesslevel}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="custom-card m-0">
                            <div className="d-flex align-items-center ">
                              <div className="d-flex align-items-center">
                                <i className="fe fe-user-check  text-secondary me-2"></i>
                                <span className="label-text">
                                  Person In Charge :
                                </span>
                              </div>
                              <div className="value-text ms-2">
                                {modalEvent.personincharge_name}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="custom-card m-0">
                            <div className="d-flex align-items-center ">
                              <div className="d-flex align-items-center">
                                <i className="fe fe-users text-secondary me-2"></i>
                                <span className="label-text">
                                  Reserved Seats :
                                </span>
                              </div>
                              <div className="value-text ms-2">
                                {modalEvent.reservedseats}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted my-4">
                      No data available
                    </p>
                  )}
                </Modal.Body>

                <Modal.Footer className="bg-light d-flex justify-content-between">
                  <div
                    className="btn btn-sm ripple ms-2 "
                    onClick={() => handleAllowedUsersClick(modalEvent)}
                  >
                    <Button placement="bottom">
                      <i className="fe fe-users"></i> Allowed Users
                    </Button>
                  </div>

                  <Button variant="secondary " onClick={handleClose}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}
        </Col>
      </Row>

      <Modal
        show={allowedUsersModal}
        onHide={handleCloseAllowedUsersModal}
        centered
        size="md"
      >
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>Allowed Users</Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="bg-light"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {allowedUsersData && allowedUsersData.length > 0 ? (
            <ul className="list-group">
              {allowedUsersData.map((user, index) => (
                <li
                  key={index}
                  className="d-flex align-items-center custom-card"
                >
                  <i className="fe fe-user me-2 text-secondary"></i> {user.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted">
              <i className="fe fe-info-circle me-2"></i>No allowed users found.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={handleCloseAllowedUsersModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {formModal && (
        <LabsAdd
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
Labs.layout = "Contentlayout";
export default Labs;
