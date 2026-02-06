import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../../shared/layout-components/seo/seo";
import {
  Container,
  Row,
  Col,
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Select from "react-select";
import { useRouter } from "next/router";
import {
  getDashboardListData,
  getEventList,
  fetchTeamsForEvent,
} from "../../../../shared/redux/slices/EventDashboard/eventdashboardManage";
import dummy_profile from "../../../../public/assets/img/dummy_profile.png";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
import EventChatBox from "./eventchatbox";

const EventDashboard = () => {
  const customStyles = () => {
    return {
      control: (styles) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)",
        borderColor: "#ced4da",
        minHeight: "38px",
      }),
      multiValue: (styles) => ({
        ...styles,
        backgroundColor: "var(--primary-bg-color)",
      }),
      multiValueLabel: (styles) => ({
        ...styles,
        color: "#fff",
      }),
      multiValueRemove: (styles) => ({
        ...styles,
        color: "#fff",
        ":hover": {
          backgroundColor: "#EB5757",
          color: "white",
        },
      }),
      input: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      singleValue: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      placeholder: (styles) => ({
        ...styles,
        color: "#aaa",
      }),
    };
  };
  const dispatch = useDispatch();
  const router = useRouter();
  const { eventuuid: urlEventuuid } = router.query;

  const [selectedEventId, setSelectedEventId] = useState(urlEventuuid || "");
  const [showChat, setShowChat] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const { getEventListDataSucc, teams } = useSelector((state) => ({
    getEventListDataSucc: state.eventDashboardData.getEventListData,
    teams: state.eventDashboardData.teams,
  }));

  useEffect(() => {
    dispatch(getEventList());
  }, [dispatch]);

  useEffect(() => {
    if (selectedEventId) {
      dispatch(fetchTeamsForEvent(selectedEventId));
    }
  }, [selectedEventId]);

  const eventListOptions =
    getEventListDataSucc?.eventList?.map((e) => ({
      value: e.eventuuid,
      label: e.eventname,
    })) || [];

  useEffect(() => {
    if (urlEventuuid && urlEventuuid !== selectedEventId) {
      setSelectedEventId(urlEventuuid);
    }
  }, [urlEventuuid]);

  useEffect(() => {
    if (selectedEventId && selectedEventId !== router.query.eventuuid) {
      router.replace(
        { pathname: "/event-dashboard", query: { eventuuid: selectedEventId } },
        undefined,
        { shallow: true }
      );
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (eventListOptions.length > 0 && !selectedEventId) {
      setSelectedEventId(eventListOptions[0].value);
    }
  }, [eventListOptions]);

  function formatTime(timestamp) {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function hexToRgba(color, alpha = 0.2) {
    const hexMap = {
      "#0d6efd": "#0d6efd",
      "text-info": "#0dcaf0",
      "text-success": "#198754",
      "text-danger": "#dc3545",
      "text-warning": "#ffc107",
    };
    let hex = color.startsWith("#") ? color : hexMap[color] || color;
    if (hex.length === 4) {
      hex =
        "#" +
        hex
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("");
    }
    const m = hex.match(/^#?([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})$/);
    if (!m) return color;
    const [, r, g, b] = m;
    return `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(
      b,
      16
    )},${alpha})`;
  }

  const sortedTeams = (teams || [])
    .filter(
      (team) =>
        team.eventuuid === selectedEventId && team.team_status === "Completed"
    )
    .sort((a, b) => {
      const timeA =
        a.team_timer
          ?.split(":")
          .reduce((acc, t) => acc * 60 + parseInt(t), 0) || 0;
      const timeB =
        b.team_timer
          ?.split(":")
          .reduce((acc, t) => acc * 60 + parseInt(t), 0) || 0;
      return timeA - timeB;
    });

  const otherTeams = (teams || []).filter(
    (team) =>
      team.eventuuid === selectedEventId && team.team_status !== "Completed"
  );

  const finalSortedTeams = [...sortedTeams, ...otherTeams];

  return (
    <Container fluid>
      <Seo title="Event Dashboard" />

      {/* Dropdown */}
      <Row className="g-4 mb-2">
        <Col md={12}>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Event Dashboard</h4>
            <div style={{ minWidth: "240px" }}>
              <Select
                placeholder="Select Event"
                options={eventListOptions}
                value={
                  eventListOptions.find((e) => e.value === selectedEventId) ||
                  null
                }
                onChange={(opt) => setSelectedEventId(opt?.value || "")}
                styles={customStyles()}
                theme={(th) => ({
                  ...th,
                  colors: {
                    ...th.colors,
                    primary25: "var(--primary-bg-color)",
                    primary: "var(--primary-bg-color)",
                  },
                })}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* Team Cards */}
      <Row className="g-4 mb-2 mt-1">
        {finalSortedTeams.length === 0 && selectedEventId ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "60vh", flexDirection: "column" }}
          >
            <img
              src={crossEvalicon.src}
              alt="No data"
              className="wd-150 mt-5"
            />
            <h5 className="mt-4">No data found.</h5>
          </div>
        ) : (
          finalSortedTeams.map((team, idx) => {
            let statusColor = "#0d6efd";
            if (team.team_status === "Start") statusColor = "#0dcaf0";
            else if (team.team_status === "Completed") statusColor = "#198754";
            else if (team.team_status === "Failed") statusColor = "#dc3545";
            else if (team.team_status === "Pending") statusColor = "#ffc107";

            const normalShadow = `0 4px 12px ${hexToRgba(statusColor, 0.2)}`;
            const hoverShadow = `0 10px 20px ${hexToRgba(statusColor, 0.3)}`;

            return (
              <Col md={3} key={idx}>
                <Card
                  className={`h-100 team-status-card ${
                    team.team_status === "Completed"
                      ? "card-completed"
                      : team.team_status === "Pending"
                      ? "card-pending"
                      : team.team_status === "Start"
                      ? "card-start"
                      : team.team_status === "Failed"
                      ? "card-failed"
                      : ""
                  }`}
                  style={{ boxShadow: normalShadow }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.boxShadow = hoverShadow)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.boxShadow = normalShadow)
                  }
                >
                  <Card.Body className="p-3 d-flex flex-column justify-content-between align-items-center">
                    <div className="text-center mb-3">
                      <img
                        alt="avatar"
                        className="rounded-circle"
                        style={{
                          width: "90px",
                          height: "90px",
                          objectFit: "cover",
                        }}
                        src={
                          team.learner_profile
                            ? `${process.env.API_URL_FILEMANAGER}${team.learner_profile}`
                            : dummy_profile.src
                        }
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = dummy_profile.src;
                        }}
                      />
                      <h5 className="text-dark fs-5 mb-1 mt-2">
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>{team.team_name}</Tooltip>}
                        >
                          <span className="d-inline-block text-truncate w-100">
                            {team.team_name?.length > 30
                              ? `${team.team_name.substring(0, 27)}...`
                              : team.team_name}
                          </span>
                        </OverlayTrigger>
                      </h5>

                      <div className="d-flex justify-content-center align-items-center gap-3 my-2">
                        {team.team_startedon && (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                Start Time – {formatTime(team.team_startedon)}
                              </Tooltip>
                            }
                          >
                            <div className="btn btn-sm ripple bg-success-transparent text-success rounded-circle me-1">
                              <i className="fe fe-clock text-success"></i>
                            </div>
                          </OverlayTrigger>
                        )}
                        {team.team_completedon && (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                End Time – {formatTime(team.team_completedon)}
                              </Tooltip>
                            }
                          >
                            <div className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle me-1">
                              <i className="fe fe-clock text-danger"></i>
                            </div>
                          </OverlayTrigger>
                        )}
                        <OverlayTrigger
                          placement="bottom"
                          overlay={<Tooltip>{team.Mobile}</Tooltip>}
                        >
                          <div className="btn btn-sm ripple bg-primary-transparent text-primary rounded-circle me-1">
                            <i className="fe fe-phone-call"></i>
                          </div>
                        </OverlayTrigger>
                        <OverlayTrigger
                          placement="bottom"
                          overlay={<Tooltip>{team.Email}</Tooltip>}
                        >
                          <div className="btn btn-sm ripple bg-danger-transparent text-danger rounded-circle me-1">
                            <i className="fe fe-mail"></i>
                          </div>
                        </OverlayTrigger>
                      </div>

                      <div
                        className="btn btn-sm ripple bg-success-transparent text-success rounded-circle position-relative"
                        onClick={() => {
                          setSelectedSession(team);
                          setShowChat(true);
                        }}
                        style={{ overflow: "visible" }}
                      >
                        <OverlayTrigger
                          placement="bottom"
                          overlay={<Tooltip>Chat</Tooltip>}
                        >
                          <span className="d-inline-block position-relative">
                            <i className="fas fa-comments fs-6"></i>
                            {team.unseen_message_count > 0 && (
                              <span
                                className="position-absolute top-0 start-100 translate-middle-y bg-danger badge rounded-pill text-white px-1 py-0 small"
                                style={{
                                  transform: "translate(30%, -40%)",
                                  zIndex: 1,
                                }}
                              >
                                {team.unseen_message_count > 99
                                  ? "99+"
                                  : team.unseen_message_count}
                                <span className="visually-hidden">
                                  unread messages
                                </span>
                              </span>
                            )}
                          </span>
                        </OverlayTrigger>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      {/* Chat Box */}
      {showChat && (
        <EventChatBox
          showChat={showChat}
          setShowChat={setShowChat}
          eventTitle={selectedSession?.eventname}
          rowData={selectedSession}
        />
      )}
    </Container>
  );
};
EventDashboard.layout = "Contentlayout";
export default EventDashboard;
