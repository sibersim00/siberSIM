import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import { saveFaq, updatefaq } from "../../redux/slices/masters/Faqs";
import { error, regex } from "../common/vaidationMessage/formValidationMsg";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";
import { emojiRegex } from "../../utils/regex";
import Select from "react-select";

const FormFaqs = (props) => {
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
    question: yup
      .string()
      .trim()
      .required(error.required)
      .test("no-emoji", "Emojis are not allowed", noEmojiTest),

    answer: yup
      .string()
      .trim()
      .required(error.required)
      .test("no-emoji", "Emojis are not allowed", noEmojiTest),

    order_by: yup
      .number()
      .typeError("Order must be a number")
      .required(error.required)
      .min(1, "Order must be at least 1"),

    type: yup
      .string()
      .required(error.required)
      .oneOf(["User", "Instructor", "Admin"], "Type must be SIMUser, SIMManager, or Admin"),
  });


  const initialValues = {
    question: rowValues?.question || "",
    answer: rowValues?.answer || "",
    order_by: rowValues?.order_by || "",
    type: rowValues?.type || "User",
  };

  const getSelectStyles = (fieldName, formik) => {
    const error =
      !formik.values[fieldName] &&
      formik.errors[fieldName] &&
      formik.touched[fieldName];

    return error
      ? {
        ...customStyles,
        control: (styles) => ({
          ...styles,
          borderColor: "#EB5757",
          boxShadow: "0 0 0 0.001rem #EB5757",
        }),
      }
      : customStyles;
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
      question: data.question?.trim(),
      answer: data.answer?.trim(),
      order_by: data.order_by,
      type: data.type,
    };

    if (rowValues?.faq_id) {
      // Editing
      payload.faq_id = rowValues.faq_id;
      dispatch(updatefaq(payload));
    } else {
      // New
      dispatch(saveFaq(payload));
    }

    handleOneClick(true);
  };

  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static" size="lg" >
        <Formik
          validationSchema={schema}
          onSubmit={handleSubmit}
          initialValues={initialValues}
        >
          {({ handleSubmit, handleChange, values, touched, errors, setFieldValue, setFieldTouched }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Title>{modalTitle} FAQs</Modal.Title>
                <i
                  className="fas fa-close fs-18"
                  style={{ cursor: "pointer" }}
                  onClick={() => viewDemoShow(false)}
                />
              </Modal.Header>

              <Modal.Body>
                <Row>
                  {/* Question */}
                  <Form.Group as={Col} md="12" className="mb-3">
                    <Form.Label>
                      Title <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="question"
                      value={values.question}
                      onChange={handleChange}
                      isValid={touched.question && !errors.question}
                      isInvalid={touched.question && errors.question}
                      placeholder="Enter title"
                      maxLength={150}
                      autoComplete="off"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.question}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Answer */}
                  <Form.Group as={Col} md="12" className="mb-3">
                    <Form.Label>
                      Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      name="answer"
                      value={values.answer}
                      onChange={handleChange}
                      isValid={touched.answer && !errors.answer}
                      isInvalid={touched.answer && errors.answer}
                      placeholder="Enter description"
                      maxLength={500}
                      style={{ height: '150px' }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.answer}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Order By */}
                  <Form.Group as={Col} md="6" className="mb-3">
                    <Form.Label>
                      Order <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="order_by"
                      value={values.order_by}
                      onChange={handleChange}
                      isValid={touched.order_by && !errors.order_by}
                      isInvalid={touched.order_by && errors.order_by}
                      placeholder="Enter order"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.order_by}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Type */}
                  <Form.Group as={Col} md="6" className="mb-3">
                    <Form.Label>
                      Type <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      name="type"
                      options={[
                        { label: "User", value: "User" },
                        { label: "Instructor", value: "Instructor" },
                        { label: "Admin", value: "Admin" },
                      ]}
                      value={values.type ? { label: values.type, value: values.type } : null}
                      onChange={(option) => setFieldValue("type", option?.value)}
                      onBlur={() => setFieldTouched("type", true)}
                      // styles={getSelectStyles("type", { values, errors, touched })}
                      // theme={(theme) => ({
                      //   ...theme,
                      //   colors: {
                      //     ...theme.colors,
                      //     primary25: "var(--primary-bg-color)",
                      //     primary: "var(--primary-bg-color)",
                      //   },
                      // })}
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary25: "var(--primary-bg-color)",
                          primary: "var(--primary-bg-color)",
                        },
                      })}
                      placeholder="Select Type"
                      menuPosition="fixed"
                    />
                    {touched.type && errors.type && (
                      <div className="text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                        {errors.type}
                      </div>
                    )}
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

export default FormFaqs;
