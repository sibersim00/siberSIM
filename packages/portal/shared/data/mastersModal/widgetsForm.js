import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Modal,
  Button,
  Row,
  Col,
  Form,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import { savewidget, updatewidget } from "../../redux/slices/masters/widgets";
import { error, regex } from "../common/vaidationMessage/formValidationMsg";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";
import { emojiRegex } from "../../utils/regex";


const FormWidgets = (props) => {
  const { openFlag, handleFormModal, rowValues, oneClick, handleOneClick } =
    props;
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const { t } = useTranslation();

  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };


  const schema = yup.object().shape({
    widget_name: yup
      .string()
      .trim()
      .required("Widget name is required")
      .min(3, "Widget name must be at least 3 characters")
      .max(150, "Widget name must not exceed 150 characters")
      .matches(
        /^[a-zA-Z0-9\s.,'\"?!()-]+$/,
        "Widget name contains invalid characters"
      ),

    widget_url: yup
      .string()
      .trim()
      .required("Widget Url is required")
      .min(3, "Widget Url must be at least 3 characters")
      .max(500, "Widget Url must not exceed 500 characters")
      .test("no-emoji", "Emojis are not allowed", noEmojiTest),

    order: yup
      .number()
      .typeError("Order must be a number")
      .required("Order is required")
      .min(1, "Order must be at least 1"),
  });
  const initialValues = {
    widget_name: rowValues?.widget_name || "",
    widget_url: rowValues?.widget_url || "",
    order: rowValues?.order || "",
  };

  // Custom select styles (can be reused)
  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      fontSize: "0.875rem",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  useEffect(() => {
    if (rowValues) {
      setModalTitle(rowValues.title || "Edit");
    }
  }, [rowValues]);

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handleFormModal(false);
    }
  };

  const handleSubmit = (data) => {
    const payload = {
      widget_name: data.widget_name?.trim(),
      widget_url: data.widget_url?.trim(),
      order: data.order,
    };
    if (rowValues?.webbrowserwidgetid) {
      payload.webbrowserwidgetid = rowValues.webbrowserwidgetid;
      dispatch(updatewidget(payload));
    } else {
      dispatch(savewidget(payload));
    }

    handleOneClick(true);
  };

  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static" size="lg">
        <Formik
          validationSchema={schema}
          onSubmit={handleSubmit}
          initialValues={initialValues}
        >
          {({
            handleSubmit,
            handleChange,
            values,
            touched,
            errors,
            setFieldValue,
            setFieldTouched,
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Title>{modalTitle} Widgets</Modal.Title>
                <i
                  className="fas fa-close fs-18"
                  style={{ cursor: "pointer" }}
                  onClick={() => viewDemoShow(false)}
                />
              </Modal.Header>

              <Modal.Body>
                <Row>
                  {/* widget_name */}
                  <Form.Group as={Col} md="6" className="mb-3">
                    <Form.Label>
                      Widget Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="widget_name"
                      value={values.widget_name}
                      onChange={handleChange}
                      isValid={touched.widget_name && !errors.widget_name}
                      isInvalid={touched.widget_name && errors.widget_name}
                      placeholder="Enter title"
                      maxLength={150}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.widget_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group as={Col} md="6" className="mb-3">
                    <Form.Label>
                      Order <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="order"
                      value={values.order}
                      onChange={handleChange}
                      isValid={touched.order && !errors.order}
                      isInvalid={touched.order && errors.order}
                      placeholder="Enter order"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.order}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group as={Col} md="12" className="mb-3">
                    <Form.Label>
                      Widget URL <span className="text-danger">*</span>
                    </Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        name="widget_url"
                        value={values.widget_url}
                        onChange={handleChange}
                        isValid={touched.widget_url && !errors.widget_url}
                        isInvalid={touched.widget_url && !!errors.widget_url}
                        placeholder="Enter Widget URL"
                      />
                      <Button
                        variant="outline-warning"
                        style={{ marginLeft: "8px" }}
                        onClick={() => {
                          const url = values.widget_url?.startsWith("http")
                            ? values.widget_url
                            : `https://${values.widget_url}`;
                          window.open(url, "_blank");
                        }}
                        disabled={!values.widget_url}
                      >
                        <i className="fa fa-external-link" />
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        {errors.widget_url}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                </Row>
              </Modal.Body>

              <Modal.Footer>
                {oneClick ? (
                  <Button variant="primary" disabled>
                    <Spinner animation="grow" size="sm" /> Loading...
                  </Button>
                ) : (
                  <Button variant="primary" type="submit">
                    {t("common.submit")}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => viewDemoShow(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Fragment>
  );
};

export default FormWidgets;
