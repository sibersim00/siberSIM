import React, { useState, Fragment, useRef, useEffect } from "react";
import {
  Col,
  Offcanvas,
  Row,
  Card,
  Alert,
  Form,
  Button,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import {
  getSenderList,
  sendTestEmail,
  ClearSendTestEmail,
  clearHasError,
} from "../../../redux/slices/mailconfig/mailOverview";
import "../../../utils/i18n";
import { useTranslation } from "react-i18next";
import { Formik } from "formik";
import * as yup from "yup";

const ViewOffCanvas = (props) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const formikRef = useRef();
  const { opencanvas, handleCanvas, opencanvasdata, selectedAdmin } = props;
  const [senderList, setSenderList] = useState([]);
  const [oneClick, setOneClick] = useState(false);

  const { senderListData, mailtestResponse, errorData } = useSelector(
    (state) => {
      return {
        senderListData:
          state &&
          state.mailOverViewResp &&
          state.mailOverViewResp.senderListResp,

        mailtestResponse:
          state &&
          state.mailOverViewResp &&
          state.mailOverViewResp.testMailResp,

        errorData:
          state && state.mailOverViewResp && state.mailOverViewResp.error,
      };
    }
  );
  useEffect(() => {
    if (errorData?.statusCode) {
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);
  useEffect(() => {
    if (opencanvas) {
      dispatch(getSenderList());
    }
  }, [opencanvas]);

  useEffect(() => {
    if (senderListData && senderListData != undefined) {
      setSenderList(senderListData?.data);
    }
  }, [senderListData]);

  useEffect(() => {
    if (mailtestResponse?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {mailtestResponse?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      handleOneClick(false);
      dispatch(ClearSendTestEmail());
    }
  }, [mailtestResponse]);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderWidth: 1,
      borderRadius: 3,
      boxShadow: state.isFocused ? 0 : 0,
      borderColor: state.isFocused ? base.borderColor : "#e8e8f7",
      "&:hover": {
        borderColor: state.isFocused ? base.borderColor : "#e8e8f7",
      },
    }),
  };

  const styles = {
    container: {
      maxWidth: "100%",
      margin: "auto",
      height : "190px",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #ddd",
      padding: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px", 
    },
    container1: {
      maxWidth: "100%",
      margin: "auto",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #ddd",
      padding: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px", 
    },

    body: {
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#333",
    },
  };

  const schema = yup.object().shape({
    personalEmailId: yup.string().email("Invalid").required("Required").trim(),
    senderName: yup.object().required("Required"),
  });
  const initialValues = {
    personalEmailId: "",
    senderName: "",
  };

  const handleSubmit = (data) => {
    const payload = {
      template_id: opencanvasdata?.id,
      email_id: data?.personalEmailId,
      mailuser_id: data?.senderName && data?.senderName?.mailuser_id,
    };
    dispatch(sendTestEmail(payload));
    handleOneClick(true);
  };

  const handleCancel = (resetForm) => {
    resetForm();
  };

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  return (
    <>
      <Offcanvas
        show={opencanvas}
        onHide={handleCanvas}
        placement="end"
        className="wd-75p"
      >
        <Offcanvas.Header closeButton className="">
          <Alert
            variant="info"
            className="py-1 me-2 mb-0 wd-100p tabheadercolor"
            role="alert"
          >
            <strong className="text-black alert-link fs-16">
              {selectedAdmin?.type} &nbsp; &#124; &nbsp;
              {selectedAdmin?.displayname} &nbsp; &#124; &nbsp;{" "}
              {opencanvasdata?.template_name}
            </strong>
          </Alert>
        </Offcanvas.Header>
        <hr className="m-0 mb-2" />
        <Offcanvas.Body className="pt-0">
          <Row className="row-sm">
            <Col md={6}>
              <Card style={styles.container} className="">
                 <div className="">
                  <div className="fs-14 d-flex">
                    <p className="wd-15p text-black alert-link"> {t("mail_config.configure_template.forms.label.subject")} : </p>{" "}
                    <p>{opencanvasdata?.subject}</p>
                  </div>
                  <div className="fs-14 d-flex ">
                    <p className="wd-15p text-black alert-link"> {t("mail_config.configure_template.forms.label.to")} : </p>{" "}
                    <p>{opencanvasdata?.to_email_ids}</p>
                  </div>
                  {opencanvasdata?.cc_email_ids ?
                  <div className="fs-14 d-flex ">
                    <p className="wd-15p text-black alert-link"> {t("mail_config.configure_template.forms.label.cc")} : </p>{" "}
                    <p>{opencanvasdata?.cc_email_ids}</p>
                  </div> : ""}
                  {opencanvasdata?.bcc_email_ids ?
                  <div className="fs-14 d-flex">
                    <p className="wd-15p text-black alert-link"> {t("mail_config.configure_template.forms.label.bcc")} : </p>{" "}
                    <p>{opencanvasdata?.bcc_email_ids}</p>
                  </div> : ""}
                </div>
              </Card>
            </Col>
            <Col md={6}>
              <Card style={styles.container} className="">
                <Formik
                  validationSchema={schema}
                  onSubmit={(e) => handleSubmit(e)}
                  initialValues={initialValues}
                  innerRef={formikRef}
                >
                  {({
                    handleSubmit,
                    handleChange,
                    setFieldValue,
                    resetForm,
                    values,
                    touched,
                    errors,
                  }) => (
                    <Form noValidate onSubmit={handleSubmit}>
                    
                      <Form.Group
                        className={`${
                          (errors.personalEmailId && touched.personalEmailId ) ? "" : "form-group"
                        }`}
                      >
                        <div className="row align-items-center">
                          <Form.Label className="col-3">
                          {t("mail_config.overview.forms.label.email_id")} <span className="text-danger">*</span>
                          </Form.Label>
                          <div className="col-9">
                            <Form.Control
                              type="text"
                              name="personalEmailId"
                              autoComplete="off"
                              value={values.personalEmailId}
                              onChange={handleChange}
                              placeholder={t("mail_config.overview.forms.placeholder.email_id")} 
                              isValid={
                                touched.personalEmailId &&
                                !errors.personalEmailId
                              }
                              isInvalid={
                                touched.personalEmailId &&
                                errors.personalEmailId
                              }
                            />

                            <Form.Control.Feedback type="invalid">
                              {errors.personalEmailId}
                            </Form.Control.Feedback>
                            {/* {!(errors.personalEmailId && touched.personalEmailId) && <span></span> } */}
                          </div>
                        </div>
                      </Form.Group>
                      <Form.Group
                        className={`${errors.senderName && touched.senderName ? "" : "form-group"}`}
                      >
                        <div className="row align-items-center">
                          <Form.Label className="col-3">
                          {t("mail_config.overview.forms.label.sender_name")} <span className="text-danger">*</span>
                          </Form.Label>
                          <div className="col-9">
                            <Select
                              styles={selectStyles}
                              theme={(theme) => ({
                                ...theme,
                                colors: {
                                  ...theme.colors,
                                  primary25: "var(--primary-bg-color)",
                                  primary: "var(--primary-bg-color)",
                                },
                              })}
                              placeholder={t("mail_config.overview.forms.placeholder.sender_name")}
                              name="senderName"
                              value={values.senderName}
                              onChange={(e) => {
                                setFieldValue("senderName", e);
                              }}
                              options={senderList}
                              getOptionLabel={(x) => x.sender_name}
                              getOptionValue={(x) => x.mailuser_id}
                              isValid={touched.senderName && !errors.senderName}
                              isInvalid={
                                touched.senderName && errors.senderName
                              }
                              className={
                                touched.senderName && errors.senderName
                                  ? "red-field is-invalid"
                                  : ""
                              }
                            />
                            {errors.senderName && touched.senderName && (
                              <div className="invalid-tooltiped">
                                {errors.senderName}
                              </div>
                            )}
                            {/* {!(errors.senderName && touched.senderName) && <span></span> } */}
                          </div>
                        </div>
                      </Form.Group>

                      <div className="btn-list ms-auto text-right pointer">

                      {oneClick ? (
                          <Button variant="primary" disabled>
                            <Spinner
                              as="span"
                              animation="grow"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                             {t("common.loading")} 
                          </Button>
                        ) : (
                          <Button type="submit">{t("common.test_mail")} </Button>
                        )} &nbsp; &nbsp;
                      {oneClick ? (
                          <Button variant="secondary" disabled>
                            <Spinner
                              as="span"
                              animation="grow"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                            {t("common.loading")} 
                          </Button>
                        ) : (
                        <Button
                          variant="secondary"
                          onClick={() => handleCancel(resetForm)}
                        >
                          {t("common.reset")} 
                        </Button>)}
                        {" "}
                       
                        
                      </div>
                    </Form>
                  )}
                </Formik>
              </Card>
            </Col>
          </Row>
          <Row className="row-sm mg-t-20">
            <Col md={12}>
              <Card style={styles.container1}>
                <div className="fs-16">
                  <p
                    dangerouslySetInnerHTML={{ __html: opencanvasdata?.body }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default ViewOffCanvas;
