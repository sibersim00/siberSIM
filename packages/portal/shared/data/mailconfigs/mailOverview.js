import React, { useState, useEffect } from "react";
import { Row, Col, Card, OverlayTrigger, Tooltip, Nav } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import {
  getEmailConfigsForOverview,
  getActivityList,
  getActivityActionWorkFlow,
  saveWorkFlow,
  ClearSaveWorkFlow,
  clearHasError,
} from "../../redux/slices/mailconfig/mailOverview";
import ViewOffCanvas from "./offcanvas/workflowOffcanvas";
import MailOverViewModal from "./offcanvas/mailOverviewModal";
import { getTemplateDataByTemplateId } from "../../redux/slices/mailconfig/configureTemplate";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

const MailOverview = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const [indexId, setIndexId] = useState(0);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [openFlag, setopenFlag] = useState(false);
  const [opencanvas, setOpenCanvas] = useState(false);
  const [opencanvasdata, setOpenCanvasdata] = useState("");
  const [filteredActivityList, setfilteredActivityList] = useState([]);
  const [propsWorkflow, setPropsWorkflow] = useState("");
  const [viewData, setViewData] = useState("");
  const [oneClick, setOneClick] = useState(false);
  const [emailconfigsRespData, setEmailconfigsRespData] = useState([]);

  const {
    emailconfigsResp,
    activityListResp,
    WorkFlowData,
    saveWorkFlowResp,
    templateDataByWorkFlow,
    errorData,
  } = useSelector((state) => {
    return {
      emailconfigsResp:
        state &&
        state.mailOverViewResp &&
        state.mailOverViewResp.emailconfigsData &&
        state.mailOverViewResp.emailconfigsData.data,

      activityListResp:
        state &&
        state.mailOverViewResp &&
        state.mailOverViewResp.activityData &&
        state.mailOverViewResp.activityData.data,

      WorkFlowData:
        state &&
        state.mailOverViewResp &&
        state.mailOverViewResp.workFlowResp &&
        state.mailOverViewResp.workFlowResp.data,

      saveWorkFlowResp:
        state &&
        state.mailOverViewResp &&
        state.mailOverViewResp.saveWorkFlowData,

      templateDataByWorkFlow:
        state &&
        state.mailconfigSlice &&
        state.mailconfigSlice.singletemplateData &&
        state.mailconfigSlice.singletemplateData.data,

      errorData:
        state && state.mailOverViewResp && state.mailOverViewResp.error,
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
      handleOneClick(false);
      dispatch(clearHasError());
      setopenFlag(false);
    }
  }, [errorData]);

  useEffect(() => {
    if (emailconfigsResp && emailconfigsResp != undefined) {
      if (emailconfigsResp && emailconfigsResp.length > 0) {
        const data = emailconfigsResp.map((str, index) => ({
          ...str,
          isExpandable: false,
        }));
        setEmailconfigsRespData(data);
      } else {
        setEmailconfigsRespData([]);
      }
    }
  }, [emailconfigsResp]);

  useEffect(() => {
    dispatch(getEmailConfigsForOverview());
    dispatch(getActivityList());
  }, []);

  useEffect(() => {
    if (
      activityListResp &&
      activityListResp != undefined &&
      activityListResp.length > 0
    ) {
      setSelectedAdmin(activityListResp[0]);
    }
  }, [activityListResp]);

  useEffect(() => {
    if (activityListResp && activityListResp != undefined) {
      setfilteredActivityList(activityListResp);
    }
  }, [activityListResp]);

  const onFilterChanged = (e) => {
    const inputValue = e.target.value;
    if (inputValue) {
      let filteredList = filteredActivityList;
      filteredList = filteredActivityList.filter((tablename) => {
        const employeeName = tablename?.type
          ? tablename?.type.toLowerCase()
          : "";
        return employeeName.includes(inputValue.toLowerCase());
      });
      setfilteredActivityList(filteredList);
      setSelectedAdmin(filteredList[0]);
    } else {
      setfilteredActivityList(activityListResp);
      if (
        activityListResp &&
        activityListResp != undefined &&
        activityListResp.length > 0
      ) {
        setSelectedAdmin(activityListResp[indexId]);
      }
    }
  };

  useEffect(() => {
    if (selectedAdmin) {
      dispatch(getActivityActionWorkFlow(selectedAdmin?.action_id));
    }
  }, [selectedAdmin]);

  const handleStatusSwitch = (props, data) => {
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_status"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const Payload = {
          id: props?.workflow_id,
          template_id: props?.template_id,
          mailuser_id: props?.mailuser_id,
          action_id: data?.action_id,
          status: props?.status == "Inactive" ? "Active" : "Inactive",
        };

        dispatch(saveWorkFlow(Payload));
      }
    });
  };

  const handleAddWorkFlow = (data) => {
    setopenFlag(true);
    setPropsWorkflow(data);
  };
  const handleFormModal = () => {
    setopenFlag(false);
  };

  useEffect(() => {
    if (saveWorkFlowResp?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveWorkFlowResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      handleOneClick(false);
      dispatch(ClearSaveWorkFlow());
      dispatch(getActivityActionWorkFlow(selectedAdmin?.action_id));
      setopenFlag(false);
    }
  }, [saveWorkFlowResp]);

  const handleEditView = (data, item) => {
    setOpenCanvas(true);
    dispatch(getTemplateDataByTemplateId(data?.template_id));
    setViewData(item);
  };

  useEffect(() => {
    if (templateDataByWorkFlow && templateDataByWorkFlow != undefined) {
      setOpenCanvasdata(templateDataByWorkFlow);
    }
  }, [templateDataByWorkFlow]);

  const handleCanvas = () => {
    setOpenCanvas(false);
  };

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  const handleExpandClick = (data, index) => {
    const dataForToggle =
      emailconfigsRespData &&
      emailconfigsRespData.map((item) => {
        if (item.service == data.service) {
          item.isExpandable = !item.isExpandable;
        }
        return { ...item };
      });
    setEmailconfigsRespData(dataForToggle);
  };

  return (
    <div className="mg-t-10">
      <Row className="row-sm">
        {emailconfigsRespData &&
        emailconfigsRespData != undefined &&
        emailconfigsRespData.length > 0
          ? emailconfigsRespData.map((item, index) => (
              <Col md={3} className="pd-r-0" key={index}>
                <Card className="custom-card">
                  <div className="d-flex">
                    <div className="pd-15">
                      <img src={item?.service_icon} className="wd-30 ht-30" />
                      &nbsp; {item?.service}
                    </div>
                    <ExpandMore
                      expand={item?.isExpandable}
                      onClick={() => handleExpandClick(item, index)}
                      aria-expanded={item?.isExpandable}
                      aria-label="show more"
                    >
                      <ExpandMoreIcon />
                    </ExpandMore>
                  </div>
                  <Collapse in={item?.isExpandable} timeout="auto">
                    <div className="pd-t-5 pd-l-20 pd-r-20 pd-b-20">
                      <PerfectScrollbar
                        style={{ height: "11em" }}
                        options={{ suppressScrollX: true }}
                      >
                        {item &&
                        item.form_payloads &&
                        item.form_payloads.length > 0
                          ? item.form_payloads.map((data, index) => (
                              <div className="d-flex bd-b" key={index}>
                                <div className="media align-items-center pos-relative pd-b-5 pd-t-5">
                                  <div className="media-body">
                                    {item.form_values[data.id]}
                                    <p className="tx-11 mg-b-0 tx-gray-500">
                                      {data?.label}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          : ""}
                      </PerfectScrollbar>
                    </div>
                  </Collapse>
                </Card>
              </Col>
            ))
          : ""}
      </Row>

      <Row className="row-sm">
        <Col md={3} className="">
          <Card className="custom-card">
            <div className="">
              {/* <div className="p-3 mg-t-5 border-bottom">
                <h5 className="mg-b-0">Activity Lists</h5>
              </div> */}

              <div className="p-3 mg-t-5 border-bottom">
                <input
                  className="form-control bd bd-2"
                  type="text"
                  placeholder={t("mail_config.overview.title")}
                  onChange={onFilterChanged}
                />
                <span
                  className="pos-absolute tx-16 r-25"
                  style={{ top: "1.7em", zIndex: "3", opacity: "0.5" }}
                >
                  <i className="ion-search"></i>
                </span>
              </div>
              <Card.Body className="card-body tab-list-items pd-0">
                <PerfectScrollbar
                  style={{ height: "71vh" }}
                  options={{ suppressScrollX: true }}
                >
                  <div className="main-content-left main-content-left-mail">
                    <div className="main-mail-menu">
                      <Nav
                        className=" main-nav-column mg-b-20"
                        defaultActiveKey={`${indexId}`}
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
                                    {policy.type}
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
          {selectedAdmin && (
            <Row className="row-sm">
              {WorkFlowData &&
              WorkFlowData != undefined &&
              WorkFlowData.length > 0
                ? WorkFlowData.map((data, index) => (
                    <Col md={6} className="" key={index}>
                      <Card className="custom-card">
                        <Card.Header className="pd-b-10">
                          <div className="d-flex justify-content-between align-items-center fs-16">
                            <div>{data?.displayname}</div>

                            <OverlayTrigger
                              placement="bottom"
                              overlay={
                                <Tooltip>
                                  {t(
                                    "mail_config.overview.tooltip.add_workflow"
                                  )}
                                </Tooltip>
                              }
                            >
                              <span
                                className="pull-right tx-16 text-secondary pointer"
                                onClick={() => {
                                  handleAddWorkFlow(data);
                                }}
                              >
                                <i className="bg-primary-light p-1 rounded-50 fe fe-plus"></i>
                              </span>
                            </OverlayTrigger>
                          </div>
                        </Card.Header>
                        <Card.Body className="overflow-auto pd-t-10">
                          {data && data.workflow && data.workflow.length > 0 ? (
                            <PerfectScrollbar
                              style={{ height: "28.5vh" }}
                              options={{ suppressScrollX: true }}
                            >
                              {data && data.workflow && data.workflow.length > 0
                                ? data.workflow.map((item, i) => (
                                    <div
                                      className="d-flex justify-content-between align-items-center bd-b pd-t-5 pd-b-5"
                                      key={i}
                                    >
                                      <div className="media-body">
                                        {item?.sender_name}
                                        <p className="tx-11 mg-b-0 tx-gray-500">
                                          (
                                          {t(
                                            "mail_config.overview.forms.label.sender_name"
                                          )}
                                          )
                                        </p>
                                      </div>

                                      <div className="media-body">
                                        {item?.template_name}
                                        <p className="tx-11 mg-b-0 tx-gray-500">
                                          (
                                          {t(
                                            "mail_config.overview.forms.label.template_name"
                                          )}
                                          )
                                        </p>
                                      </div>

                                      <span className="pull-right text-info d-flex justify-content-end align-items-center">
                                        <>
                                          <>
                                            <label className="custom-switch pointer">
                                              <input
                                                type="checkbox"
                                                name="custom-switch-checkbox1"
                                                disabled={
                                                  data.workflow.length == 1
                                                }
                                                className="custom-switch-input"
                                                checked={
                                                  item?.status == "Active"
                                                    ? true
                                                    : false
                                                }
                                                onChange={(e) =>
                                                  handleStatusSwitch(item, data)
                                                }
                                              />
                                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                            </label>
                                          </>{" "}
                                          &nbsp; &#124; &nbsp;
                                          <>
                                            <OverlayTrigger
                                              placement="bottom"
                                              overlay={
                                                <Tooltip>
                                                  {t("common.view")}
                                                </Tooltip>
                                              }
                                            >
                                              <i
                                                className="fe fe-eye pointer fs-20 text-info"
                                                onClick={() =>
                                                  handleEditView(item, data)
                                                }
                                              ></i>
                                            </OverlayTrigger>
                                          </>
                                        </>
                                      </span>
                                    </div>
                                  ))
                                : ""}
                            </PerfectScrollbar>
                          ) : (
                            <Row
                              className="text-center"
                              style={{ height: "28.5vh" }}
                            >
                              <Col md={12} className="mx-auto">
                                <Card
                                  style={{
                                    border: "none",
                                  }}
                                >
                                  <Card.Body>
                                    <div className="text-center">
                                      <OverlayTrigger
                                        placement="bottom"
                                        overlay={
                                          <Tooltip>
                                            {t(
                                              "mail_config.overview.tooltip.add_workflow"
                                            )}
                                          </Tooltip>
                                        }
                                      >
                                        <img
                                          src={crossEvalicon.src}
                                          alt="user-img"
                                          className="wd-100 ht-100 pointer"
                                          onClick={() => {
                                            handleAddWorkFlow(data);
                                          }}
                                        />
                                      </OverlayTrigger>
                                      <h5 className="mt-4">
                                        {t(
                                          "mail_config.overview.tooltip.workflows_not_found"
                                        )}
                                      </h5>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                : ""}
            </Row>
          )}
        </Col>
      </Row>
      {openFlag && (
        <MailOverViewModal
          openFlag={openFlag}
          handleFormModal={handleFormModal}
          propsWorkflow={propsWorkflow}
          handleOneClick={handleOneClick}
          oneClick={oneClick}
        />
      )}
      {opencanvas && (
        <ViewOffCanvas
          opencanvas={opencanvas}
          handleCanvas={handleCanvas}
          opencanvasdata={opencanvasdata}
          selectedAdmin={viewData}
        />
      )}
    </div>
  );
};

export default MailOverview;
