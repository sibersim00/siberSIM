import React, { useState, useEffect } from "react";
import { Row, Col, Card, Nav, Tab } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import ActionTemplates from "./mailTemplateList";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";
import {
  clearLocalStorageKey,
  CleargetLocalStorageData,
} from "../../redux/slices/localstorage/LocalStorage";
import {
  getActionsList,
  clearHasError,
} from "../../redux/slices/mailconfig/activitiesWorkflow";
import { getActivityList } from "../../redux/slices/mailconfig/mailOverview";

const customStyles = {
  control: (styles, { isFocused, isDisabled }) => ({
    ...styles,
    borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
    boxShadow: isDisabled ? null : isFocused ? "0 0 0 0.001rem #00d683" : null,
    "&:hover": {
      borderColor: isDisabled
        ? "#e8e8f7"
        : isFocused
        ? "#00d683"
        : styles.borderColor,
    },
  }),
};

const MailActivities = (props) => {
  const { setTabIndex } = props;
  const [indexId, setIndexId] = useState(0);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [filteredActivityList, setfilteredActivityList] = useState([]);
  const [eventActivities, setEventActivities] = useState("");
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const { actionsList, activityResp, getTemplateDataFromLocal, errorData } =
    useSelector((state) => {
      return {
        actionsList:
          state &&
          state.activitydata &&
          state.activitydata.actiondataResp &&
          state.activitydata.actiondataResp.data,

        getTemplateDataFromLocal:
          state && state.localData && state.localData.getLocalData,

        activityResp:
          state &&
          state.mailOverViewResp &&
          state.mailOverViewResp.activityData &&
          state.mailOverViewResp.activityData.data,

        errorData: state && state.activitydata && state.mailconfigSlice.error,
      };
    });

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

      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    dispatch(getActionsList());
    dispatch(getActivityList());
  }, []);

  const handleChangeActivity = (event) => {
    setEventActivities(event);
    dispatch(clearLocalStorageKey("tempateData"));
    dispatch(CleargetLocalStorageData());
  };

  useEffect(() => {
    if (
      !(getTemplateDataFromLocal &&
      getTemplateDataFromLocal.length != 0) &&
      (activityResp &&
      activityResp != undefined &&
      activityResp.length > 0)
    ) {
      setEventActivities(activityResp[0]);
    }
  }, [activityResp]);

  useEffect(() => {
    if (
      getTemplateDataFromLocal &&
      getTemplateDataFromLocal.length != 0 &&
      actionsList != undefined
    ) {
      const data = actionsList.filter(
        (obj) => obj.action_id == getTemplateDataFromLocal.action_id
      )[0];
      setSelectedAdmin(data);

      const activityset = activityResp.filter(
        (obj) => obj.type == data.type
      )[0];

      setEventActivities(activityset);
    }
  }, [getTemplateDataFromLocal, actionsList]);

  useEffect(() => {
    if (actionsList && actionsList !== undefined) {
      if (getTemplateDataFromLocal && getTemplateDataFromLocal.length != 0) {
        const filteredList = actionsList.filter((action) => {
          return action.type === eventActivities.type;
        });

        setfilteredActivityList(filteredList);
        const index = filteredList.findIndex(
          (obj) => obj.action_id === getTemplateDataFromLocal.action_id
        );
        setIndexId(index);
      } else {
        const filteredList = actionsList.filter((action) => {
          return action.type === eventActivities.type;
        });
        setfilteredActivityList(filteredList);
        setSelectedAdmin(filteredList[0]);
        setIndexId(0);
      }
    }
  }, [actionsList, eventActivities]);

  const onFilterChanged = (e) => {
    const inputValue = e.target.value;
    if (inputValue) {
      let filteredList = filteredActivityList;
      filteredList = filteredActivityList.filter((tablename) => {
        const employeeName = tablename?.displayname
          ? tablename?.displayname.toLowerCase()
          : "";
        return employeeName.includes(inputValue.toLowerCase());
      });
      setfilteredActivityList(filteredList);
      setSelectedAdmin(filteredList[0]);
    } else {
      const filteredList = actionsList.filter((action) => {
        return action.type === eventActivities.type;
      });
      setfilteredActivityList(filteredList);

      if (actionsList && actionsList != undefined && actionsList.length > 0) {
        setSelectedAdmin(actionsList[indexId]);
      }
    }
  };

  return (
    <>
      <ToastContainer />
      <Row className="row-sm mg-t-10">
        <Col md={3} className="">
          <Card className="custom-card">
            <div className="">
              <div className="p-3 mg-t-5 border-bottom">
                <Select
                  name="action"
                  theme={(theme) => ({
                    ...theme,
                    borderRadius: 3,
                    colors: {
                      ...theme.colors,
                      primary25: "var(--primary-bg-color)",
                      primary: "var(--primary-bg-color)",
                    },
                  })}
                  placeholder=""
                  value={eventActivities}
                  styles={customStyles}
                  options={activityResp}
                  getOptionLabel={(x) => x.type}
                  getOptionValue={(x) => x.action_id}
                  onChange={(e) => handleChangeActivity(e)}
                />
              </div>
              <div className="p-3 mg-t-5 border-bottom">
                <input
                  className="form-control bd bd-2"
                  type="text"
                  placeholder={t("mail_config.action_template.title")}
                  onChange={onFilterChanged}
                />
                <span
                  className="pos-absolute tx-16 r-25"
                  style={{ top: "6.5em", zIndex: "0", opacity: "0.5" }}
                >
                  <i className="ion-search"></i>
                </span>
              </div>
              <Card.Body className="card-body tab-list-items pd-0">
                <PerfectScrollbar style={{ height: "73vh" }}>
                  <div className="main-content-left main-content-left-mail">
                    <div className="main-mail-menu">
                      <Nav
                        className=" main-nav-column mg-b-20"
                        // defaultActiveKey={`${indexId}`}
                        activeKey={indexId}
                      >
                        {filteredActivityList &&
                        filteredActivityList != undefined &&
                        filteredActivityList.length > 0
                          ? filteredActivityList.map((policy, i) => {
                              return (
                                <Nav.Item
                                  key={i}
                                  className="mastermenu"
                                  onClick={() => {
                                    setIndexId(i);
                                    setSelectedAdmin(policy);
                                  }}
                                >
                                  <Nav.Link eventKey={i} className="masterlist">
                                    &nbsp;&nbsp;
                                    <i
                                      className={`${policy.iconname}`}
                                    ></i>{" "}
                                    {policy.displayname}
                                  </Nav.Link>
                                </Nav.Item>
                              );
                            })
                          : ""}
                      </Nav>
                    </div>
                  </div>
                </PerfectScrollbar>
              </Card.Body>
            </div>
          </Card>
        </Col>
        <Col md={9}>
          {selectedAdmin ? (
            <ActionTemplates
              selectedAdmin={selectedAdmin}
              setTabIndex={setTabIndex}
            />
          ) : (
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
                        <div className="text-center">
                          <h5 className="mt-4">No templates to display</h5>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
};

export default MailActivities;
