import React, { useState, Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Button, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import Select from "react-select";
import { Formik } from "formik";
import * as yup from "yup";
import { getTemplateByactionId } from "../../../redux/slices/mailconfig/activitiesWorkflow";
import { error } from "../../common/vaidationMessage/formValidationMsg";
import "../../../utils/i18n";
import { useTranslation } from "react-i18next";
import {
  saveWorkFlow,
  getSenderList,
} from "../../../redux/slices/mailconfig/mailOverview";

const MailOverViewModal = (props) => {
  const { openFlag, handleFormModal, propsWorkflow, handleOneClick, oneClick } =
    props;
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [senderList, setSenderList] = useState([]);
  const [templateList, setTemplateList] = useState([]);

  const { senderListData, TemplateListResp } = useSelector((state) => {
    return {
      senderListData:
        state &&
        state.mailOverViewResp &&
        state.mailOverViewResp.senderListResp,

      TemplateListResp:
        state && state.activitydata && state.activitydata.templateData,
    };
  });

  useEffect(() => {
    if (propsWorkflow) {
      dispatch(getTemplateByactionId(propsWorkflow?.action_id));
      dispatch(getSenderList());
    }
  }, [propsWorkflow]);

  useEffect(() => {
    if (senderListData && senderListData != undefined) {
      setSenderList(senderListData?.data);
    }
  }, [senderListData]);

  useEffect(() => {
    if (TemplateListResp && TemplateListResp != undefined) {
      setTemplateList(TemplateListResp?.data);
    }
  }, [TemplateListResp]);

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

  const schema = yup.object().shape({
    senderName: yup.object().required(error?.required),
    template_name: yup.object().required(error?.required),
  });
  const initialValues = {
    enableReinitialize: true,
    senderName: "",
    template_name: "",
    isactive: false,
  };

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handleFormModal(false);
    }
  };

  const handleSubmit = (data) => {
    const Payload = {
      id: 0,
      template_id: data?.template_name?.id,
      mailuser_id: data?.senderName?.mailuser_id,
      action_id: propsWorkflow?.action_id,
      status: data?.isactive == true ? "Active" : "Inactive",
    };
    handleOneClick(true);
    dispatch(saveWorkFlow(Payload));
  };

  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static">
          <Formik
            validationSchema={schema}
            onSubmit={(e) => handleSubmit(e)}
            initialValues={initialValues}
          >
            {({
              handleSubmit,
              handleChange,
              setFieldValue,
              values,
              touched,
              errors,
            }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Modal.Header>
                  <Modal.Title>
                    {t("mail_config.overview.forms.title")}
                  </Modal.Title>
                  <i
                    className="fas fa-close fs-18"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      viewDemoShow(false);
                    }}
                  ></i>
                </Modal.Header>
                <Modal.Body>
                  {(senderList && senderList.length == 0) ||
                  (templateList && templateList.length == 0) ? (
                    <Row>
                      {senderList && senderList.length == 0 ? (
                        <Col md={12}>
                          <Alert variant="danger" className="py-1" role="alert">
                            {senderListData.message}
                          </Alert>
                        </Col>
                      ) : (
                        ""
                      )}
                      {templateList && templateList.length == 0 ? (
                        <Col md={12}>
                          <Alert variant="danger" className="py-1" role="alert">
                            {TemplateListResp.message}
                          </Alert>
                        </Col>
                      ) : (
                        ""
                      )}
                    </Row>
                  ) : (
                    <Row>
                      <Form.Group
                        as={Col}
                        md="12"
                        controlid="validationFormik102"
                        className="position-relative mb-3 form-group select2-md"
                      >
                        <Form.Label>
                          {t("mail_config.overview.forms.label.sender_name")}{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
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
                          placeholder={t(
                            "mail_config.overview.forms.placeholder.sender_name"
                          )}
                          name="senderName"
                          value={values.senderName}
                          onChange={(e) => {
                            setFieldValue("senderName", e);
                          }}
                          options={senderList}
                          getOptionLabel={(x) => x.sender_name}
                          getOptionValue={(x) => x.mailuser_id}
                          isValid={touched.senderName && !errors.senderName}
                          isInvalid={touched.senderName && errors.senderName}
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
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="12"
                        controlid="validationFormik102"
                        className="position-relative mb-3 form-group select2-md"
                      >
                        <Form.Label>
                          {t("mail_config.overview.forms.label.template_name")}{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
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
                          placeholder={t(
                            "mail_config.overview.forms.placeholder.template_name"
                          )}
                          name="template_name"
                          value={values.template_name}
                          onChange={(e) => {
                            setFieldValue("template_name", e);
                          }}
                          options={templateList}
                          getOptionLabel={(x) => x.template_name}
                          getOptionValue={(x) => x.id}
                          isValid={
                            touched.template_name && !errors.template_name
                          }
                          isInvalid={
                            touched.template_name && errors.template_name
                          }
                          className={
                            touched.template_name && errors.template_name
                              ? "red-field is-invalid"
                              : ""
                          }
                        />
                        {errors.template_name && touched.template_name && (
                          <div className="invalid-tooltiped">
                            {errors.template_name}
                          </div>
                        )}
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="12"
                        controlid="validationFormik102"
                        className="mb-0"
                      >
                        <div className="form-group ">
                          <Form.Label>
                            {t("mail_config.overview.forms.label.status")}
                          </Form.Label>
                          <label className="custom-switch">
                            <input
                              type="checkbox"
                              name="custom-switch-checkbox2"
                              className="custom-switch-input"
                              checked={values.isactive}
                              onChange={(e) => {
                                setFieldValue("isactive", e.target.checked);
                              }}
                            />
                            <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                          </label>
                        </div>
                      </Form.Group>
                    </Row>
                  )}
                </Modal.Body>

                <Modal.Footer>
                  {senderList &&
                  senderList.length > 0 &&
                  templateList &&
                  templateList.length > 0 ? (
                    <>
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
                        <Button type="submit">{t("common.submit")}</Button>
                      )}
                    </>
                  ) : (
                    ""
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      viewDemoShow(false);
                    }}
                  >
                    {t("common.close")}
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        </Modal>
      </Fragment>
    </>
  );
};

export default MailOverViewModal;
