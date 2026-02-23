import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import Seo from "../../../../shared/layout-components/seo/seo";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import {
  updateEvent,
  clearupdateEvent,
  geteventList,
  clearaddparticipant,
  clearsaveEvent,
  clearaddeventlearner,
  clearupdateeventlearner,
  clearHasError,
} from "../../../../shared/redux/slices/event/eventsManage";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import { AgGridReact } from "ag-grid-react";
import ActionButtonRenderer from "../../../../shared/data/masterButtons/action-button";
import AddParticipantModal from "../../../../shared/data/events/addParticipantModal";
import ListParticipantModal from "../../../../shared/data/events/listParticipantModal";
import AddEventModal from "../../../../shared/data/events/AddeventModal";
const ManageEvents = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    hasGeteventsListSucc,
    hasaddparticipants,
    hasaddLearnerEvent,
    hasupdateLearnerEvent,
    hassuccsaveEvent,
    hasUpdateeventsSucc,
    errorData,
  } = useSelector((state) => ({
    hasGeteventsListSucc: state?.eventsManage?.geteventsListData?.data,
    hasaddparticipants: state?.eventsManage?.getaddparticipants,
    hasaddLearnerEvent:
      state && state.eventsManage && state.eventsManage.getaddLearnerEvent,
    hasupdateLearnerEvent:
      state && state.eventsManage && state.eventsManage.getupdateparticipants,
    hassuccsaveEvent: state?.eventsManage?.succsaveEvent,
    hasUpdateeventsSucc: state?.eventsManage?.updateEvent,
    errorData: state?.eventsManage?.error,
  }));


  const [view, setView] = useState("card");
  const [quickFilter, setQuickFilter] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [formModal, setformModal] = useState(false);
  const [listformModal, setlistformModal] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [oneClick, setOneClick] = useState(false);
  const [addformModal, addsetformModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [rowValues, setRowValues] = useState({
    title: "Add",
    eventid: 0,
    learner_id: 0,
    firstname: "",
    lastname: "",
    email: "",
    mobile: "",
    username: "",
    team_name: "",
    team_description: "",
    eventlearnerid: "",
    eventname: "",
    eventstarttime: "",
    eventendtime: "",
    eventdescription: "",
    scenariotitle: "",
  });
  useEffect(() => {
    dispatch(geteventList());
  }, []);
  useEffect(() => {
    if (hasGeteventsListSucc) {
      setFilteredData(hasGeteventsListSucc);
    }
  }, [hasGeteventsListSucc]);
  useEffect(() => {
    if (hasaddparticipants?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Participant added successfully
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(geteventList());
      dispatch(clearaddparticipant());
    }
  }, [hasaddparticipants]);
  useEffect(() => {
    if (hasaddLearnerEvent?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Participant added successfully
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(geteventList());
      dispatch(clearaddeventlearner());
    }
  }, [hasaddLearnerEvent]);
  useEffect(() => {
    if (hassuccsaveEvent?.statusCode) {
      addsetformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hassuccsaveEvent?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(geteventList());
      dispatch(clearsaveEvent());
    }
  }, [hassuccsaveEvent]);
  useEffect(() => {
    if (hasUpdateeventsSucc?.statusCode) {
      addsetformModal(false);
      setRowValues([]);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {hasUpdateeventsSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(geteventList());
      dispatch(clearupdateEvent());
    }
  }, [hasUpdateeventsSucc]);
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
  const handleEdit = (props) => {
    handleOneClick(false);
    if (props && props.eventdescription) {
      setRowValues({
        title: "Update",
        eventid: props.eventid,
        eventname: props.eventname,
        eventstarttime: props.eventstarttime,
        eventendtime: props.eventendtime,
        eventdescription: props.eventdescription,
        scenariotitle: props.scenariotitle,
        scenarioid: props.scenarioid,
      });
      addsetformModal(true);
    }
  };
  useEffect(() => {
    if (hasupdateLearnerEvent?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Participants update successfully
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(geteventList());
      dispatch(clearupdateeventlearner());
    }
  }, [hasupdateLearnerEvent]);
  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "",
      cellRenderer: "srNoRender",
      floatingFilter: false,
      filter: false,
      headerClass: "ag-header-cell",
      minWidth: 80,
      sortable: false,
    },
    {
      headerName: "Event Name",
      field: "eventname",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Event Description",
      field: "eventdescription",
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 180,
      flex: 2,
      cellStyle: { whiteSpace: "normal", wordWrap: "break-word" },
    },
    {
      headerName: "Event Start Date & Time",
      field: "eventstarttime",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      },
    },
    {
      headerName: "Event End Date & Time",
      field: "eventendtime",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      },
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Action",
      field: "status",
      sortable: false,
      cellRenderer: "actionButtonRenderer",
      pinned: "right",
      maxWidth: 150,
    },
  ];
  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };
  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      suppressMovable: true,
      flex: 1,
      resizable: true,
    }),
    []
  );
  const handleChangeView = (thisView) => {
    setView(thisView);
  };
  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase().trim();

    if (val) {
      const filtered = hasGeteventsListSucc.filter((item) => {
        const titleMatch = item.eventname?.toLowerCase().includes(val);
        const status = item.status?.toLowerCase().includes(val);
        const eventdescription = item.eventdescription
          ?.toLowerCase()
          .includes(val);

        // Format dates to "dd MMM yyyy" like "04 Jul 2025"
        const startDateFormatted = item.eventstarttime
          ? new Date(item.eventstarttime)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              .toLowerCase()
          : "";

        const endDateFormatted = item.eventendtime
          ? new Date(item.eventendtime)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              .toLowerCase()
          : "";

        const eventstartMatch = startDateFormatted.includes(val);
        const eventendMatch = endDateFormatted.includes(val);

        return (
          titleMatch ||
          status ||
          eventdescription ||
          eventstartMatch ||
          eventendMatch
        );
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(hasGeteventsListSucc);
    }
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
  const handleOneClick = (flag) => {
    setOneClick(flag);
  };
  const handlelistModal = (eventDataOrFlag) => {
    handleOneClick(false);
    if (typeof eventDataOrFlag === "object") {
      // When called from the card's + button
      setSelectedEventId(eventDataOrFlag.eventid);
      setRowValues([]);
      setlistformModal(true);
    } else {
      setlistformModal(eventDataOrFlag);
    }
  };
  const handleFormModal = (eventDataOrFlag) => {
    handleOneClick(false);
    if (typeof eventDataOrFlag === "object") {
      setSelectedEventId(eventDataOrFlag.eventid);
      setRowValues([]);
      setformModal(true);
    } else {
      setformModal(eventDataOrFlag);
    }
  };
  const handleEventDashboard = (event) => {
    if (event?.eventuuid) {
      router.push(`/event-dashboard?eventuuid=${event.eventuuid}`);
    }
  };
const frameworkComponents = {
  srNoRender: (props) => props.node.rowIndex + 1,
  actionButtonRenderer: (props) => {
    const canShowParticipantBtns =
      new Date(props.data.eventendtime) > new Date() &&
      props.data.status?.toLowerCase() === "pending";

    return (
      <ActionButtonRenderer
        addparticipants={handleFormModal}
        handleaddparticipants={canShowParticipantBtns}
        listparticipants={handlelistModal}
        handlelistparticipants={canShowParticipantBtns}
        handleEdit={handleEdit}
        handleShowEdit={true}
        propsVal={props}
      />
    );
  },
};

  const handleCallBack = (data) => {
    setRowValues(data);
    setformModal(true);
  };
  const addhandleFormModal = (flag) => {
    handleOneClick(false);
    setRowValues(undefined);
    addsetformModal(flag);
  };
  return (
    <>
      <Seo title="Manage Events" />
      <ToastContainer />
      <Col md={12}>
        <Card className="custom-card overflow-hidden">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5>Manage Events</h5>
              <div className="d-flex align-items-center">
                {view === "card" && (
                  <>
                    <button
                      onClick={zoomIn}
                      className="btn bd bd-success text-success mx-1"
                      title="Zoom In"
                    >
                      <i className="fas fa-search-plus"></i>
                    </button>
                    <button
                      onClick={zoomOut}
                      className="btn bd bd-success text-success"
                      title="Zoom Out"
                    >
                      <i className="fas fa-search-minus"></i>
                    </button>
                    &nbsp;
                  </>
                )}
                <Button
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
                  title="List View"
                  variant="outline-success"
                  onClick={() => handleChangeView("list")}
                  className={view === "list" ? "active text-white" : ""}
                >
                  <i className="fe fe-list"></i>
                </Button>
                &nbsp;
                <Button
                  variant="primary"
                  className="ms-2"
                  onClick={addhandleFormModal}
                  title="Add New Event"
                >
                  <i className="fe fe-plus"></i> Add
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
            {/* List View */}
            {view === "list" && (
              <Card.Body>
                <Col md={12}>
                  <div
                    className="ag-theme-alpine mt-2"
                    style={{ height: "40em", width: "100%" }}
                  >
                    <AgGridReact
                      id="cat_grid"
                      className="ag-theme-alpine"
                      headerHeight={35}
                      rowHeight={40}
                      gridOptions={gridOptions}
                      rowData={filteredData}
                      columnDefs={columnDefs}
                      pagination={true}
                      paginationPageSize={10}
                      onGridReady={onGridReady}
                      components={frameworkComponents}
                      defaultColDef={defaultColDef}
                    />
                  </div>
                </Col>
              </Card.Body>
            )}
          </Card.Body>
        </Card>
      </Col>
      {/* Card View */}
      {view === "card" && (
        <Col md={12}>
          {filteredData && filteredData.length > 0 ? (
            <Row className="row-sm">
              {filteredData.map((item, index) => (
                <Col key={index} md={columnsPerRow} className="p-2">
                 
                  <Card
                    className={`h-100 event-status-card rounded-4 position-relative ${
                      item.status === "Completed"
                        ? "card-completed"
                        : item.status === "Pending"
                        ? "card-pending"
                        : item.status === "Running"
                        ? "card-running"
                        : "card-default"
                    }`}
                  >
                    <Card.Body className="pt-0 d-flex flex-column justify-content-between h-100">
                      <div className="text-center mb-3 mt-3">
                        <OverlayTrigger
                          placement="bottom"
                          overlay={<Tooltip>{item.eventname}</Tooltip>}
                        >
                          <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                            {item.eventname?.length > 30
                              ? `${item.eventname.substring(0, 27)}...`
                              : item.eventname}
                          </h5>
                        </OverlayTrigger>
                        <OverlayTrigger
                          placement="bottom"
                          overlay={<Tooltip>{item.eventdescription}</Tooltip>}
                        >
                          <p className="text-muted small mt-1 mb-0 pointer">
                            {item.eventdescription?.length > 50
                              ? `${item.eventdescription.substring(0, 47)}...`
                              : item.eventdescription}
                          </p>
                        </OverlayTrigger>
                      </div>
                      <div className="text-center text-muted mb-2 small">
                        <i className="fe fe-clock me-1 text-primary"></i>
                        {new Date(item.eventstarttime).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                      <div className="text-center text-muted mb-2 small">
                        <i className="fe fe-clock me-1 text-danger"></i>
                        {item.eventendtime
                          ? new Date(item.eventendtime).toLocaleString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )
                          : "-"}
                      </div>
                      <div className="d-flex justify-content-center gap-1">
                        {new Date(item.eventendtime) > new Date() && item.status?.toLowerCase() === "pending" &&  (
                          <>
                            <div
                              className="btn btn-sm ripple bg-primary-transparent text-primary rounded-circle"
                              onClick={() => handleFormModal(item)}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>Add participants</Tooltip>}
                              >
                                <i className="fe fe-plus"></i>
                              </OverlayTrigger>
                            </div>

                            <div
                              className="btn btn-sm ripple bg-warning-transparent text-warning rounded-circle"
                              onClick={() => handlelistModal(item)}
                            >
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>View Participants List</Tooltip>
                                }
                              >
                                <i className="fa fa-list"></i>
                              </OverlayTrigger>
                            </div>
                          </>
                        )}

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

                        <div
                          className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-circle"
                          onClick={() => handleEventDashboard(item)}
                        >
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Event Dashboard</Tooltip>}
                          >
                            <i className="fe fe-grid"></i>
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
                          style={{ border: "none" }}
                        >
                          <Card.Body>
                            <div className="text-center mt-5">
                              <img
                                src={crossEvalicon.src}
                                alt="No data"
                                className="wd-150 mt-5"
                              />
                              <h5 className="mt-4">No data found.</h5>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>{" "}
                  </Card.Body>{" "}
                </Card>
              </Col>
            </Row>
          )}
        </Col>
      )}
      {formModal && (
        <AddParticipantModal
          openFlag={formModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
          selectedEventId={selectedEventId}
        />
      )}
      {addformModal && (
        <AddEventModal
          openFlag={addformModal}
          addhandleFormModal={addhandleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
        />
      )}
      {listformModal && (
        <ListParticipantModal
          openFlag={listformModal}
          handlelistModal={handlelistModal}
          handleFormModal={handleFormModal}
          rowValues={rowValues}
          oneClick={oneClick}
          handleOneClick={handleOneClick}
          selectedEventId={selectedEventId}
          handleCallBack={handleCallBack}
        />
      )}
    </>
  );
};
ManageEvents.layout = "Contentlayout";
export default ManageEvents;
