import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Modal,
  Button,
  Row,
  Col,
  Form,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
// import { Formik } from "formik";
import * as yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import "../../../../shared/utils/i18n";
import { registerNormaluser } from "../../../redux/slices/normalusers/normalUserManage";
import {
  phoneRegExp,
  emailRegExp,
  passwordRegExp,
  usernamemessage,
  passwordmessage,
  emojiRegex,
} from "../../../utils/regex.js";
const NormalUserForm = (props) => {
  const { openFlag, handleFormModal, rowValues, oneClick, handleOneClick } =
    props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const [isChecked, setIsChecked] = useState(false);
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");

  useEffect(() => {
    if (rowValues) {
      setIsChecked(rowValues.isactive);
      setModalTitle("Update");
    }
  }, [rowValues]);

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handleFormModal(false);
    }
  };


  const customStyles = {
    control: (styles, { isFocused, isDisabled }) => ({
      ...styles,
      borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
      boxShadow: isDisabled
        ? null
        : isFocused
        ? "0 0 0 0.001rem #00d683"
        : null,
      "&:hover": {
        borderColor: isDisabled
          ? "#e8e8f7"
          : isFocused
          ? "#00d683"
          : styles.borderColor,
      },
    }),
  };
  const getSelectStyles = (fieldName) => {
    const error =
      !formValidation.values[fieldName] &&
      formValidation.errors[fieldName] &&
      formValidation.touched[fieldName];
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
  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };
  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstname: rowValues?.firstname || "",
      lastname: rowValues?.lastname || "",
      email: rowValues?.email || "",
      mobile: rowValues?.mobile || "",
      password: rowValues?.password || "",
      username: rowValues?.username || "",
    },

    validationSchema: yup.object().shape({
          firstname: yup
            .string()
            .required("Required")
            .max(30, "First name should not exceed 30 characters")
            .matches(
              "^[A-Za-z.]+(?:[ ][A-Za-z.]+)*$",
              "Invalid - only alphabetical - no spaces are allowed"
            )
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => {
                return !/^\s|\s$/.test(value);
              }
            ),
      lastname: yup
                .string()
                .max(30, "First name should not exceed 30 characters")
                .matches(
                  "^[A-Za-z.]+(?:[ ][A-Za-z.]+)*$",
                  "Invalid - only alphabetical - no spaces are allowed"
                )
                .test(
                  "no-leading-trailing-spaces",
                  "No leading or trailing spaces allowed",
                  (value) => {
                    return !/^\s|\s$/.test(value);
                  }
                ),
      email: yup
        .string()
        .required("Required")
        .matches(
          emailRegExp,
          "Invalid - invalid email format - no spaces are allowed"
        )
        .test(
          "no-leading-trailing-spaces",
          "No leading or trailing spaces allowed",
          (value) => !/^\s|\s$/.test(value)
        )
        .test("no-emoji", "Emojis are not allowed", noEmojiTest),
      mobile: yup
        .string()
        // .required("Required")
        .matches(phoneRegExp, "Invalid - minimum 8 digits required")
        .min(8, "Invalid - minimum 8 digits required")
        .max(10, "Invalid - maximum 10 digits required"),
      username: yup
          .string()
          .required("Required")
          .matches(
            /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/,  // Ensures at least one letter, and the rest can be alphanumeric
            "Invalid Username. Please check info"
           
          )
          .max(30, "Username should not exceed 30 characters")
          .min(5, "Username should be minimum 5 characters") // Set username max length to 30
          .test(
            "no-leading-trailing-spaces",
            "No leading or trailing spaces allowed",
            (value) => {
              // This regex checks for leading or trailing spaces
              return !/^\s|\s$/.test(value);
            }
          ),
      password: yup.string().when([], {
        is: () => rowValues === undefined, // Use the external variable in the condition
        then: () =>
          yup
            .string()
            .required("Invalid Password. Please check info")
            .min(8, "Password must be at least 8 characters")
            .max(20, "Password should not exceed 20 characters")
            .matches(passwordRegExp, "Please follow the password rules"),
        otherwise: () => yup.string(), // Default for others
      }),
    }),

    onSubmit: async (data) => {
      try {
        let payload;

        if (rowValues === undefined) {
          // Condition when rowValuesis empty
          payload = {
            firstname: data?.firstname,
            lastname: data?.lastname,
            email: data?.email,
            mobile: data?.mobile,
            password: data?.password,
            username: data?.username,
          };
        } else {
          // Condition when rowValuesis not empty
          payload = {
            learner_uuid: rowValues?.learner_uuid,
            firstname: data?.firstname,
            lastname: data?.lastname,
            email: data?.email,
            mobile: data?.mobile,
          };
        }
        handleOneClick(true);
        await dispatch(registerNormaluser(payload));
      } catch (error) {
        console.error("Error submitting the form:", error);
      } finally {
        handleOneClick(false);
      }
    },
  });
  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static" size="lg">
          <Modal.Header
            closeButton
            onClick={() => {
              viewDemoShow(false);
            }}
          >
            <Modal.Title>{modalTitle} SIMUser </Modal.Title>
          </Modal.Header>
          <Form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              formValidation.handleSubmit();
              return false;
            }}
          >
            <Modal.Body>
              <Row>
                <Form.Group
                  as={Col}
                  md="6"
                  controlid="validationFormik102"
                  className="mb-3"
                >
                  <Form.Label>
                    First Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    styles={getSelectStyles("firstname")}
                    type="text"
                    name="firstname"
                    autoComplete="off"
                    placeholder="Enter First Name"
                    value={formValidation.values.firstname}
                    onChange={formValidation.handleChange}
                    isInvalid={
                      formValidation.touched.firstname &&
                      formValidation.errors.firstname
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    {formValidation.errors.firstname}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group
                  as={Col}
                  md="6"
                  controlid="validationFormik102"
                  className="mb-3"
                >
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    styles={getSelectStyles("lastname")}
                    type="text"
                    name="lastname"
                    autoComplete="off"
                    placeholder="Enter Last Name"
                    value={formValidation.values.lastname}
                    onChange={formValidation.handleChange}
                    isInvalid={
                      formValidation.touched.lastname &&
                      formValidation.errors.lastname
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                                          {formValidation.errors.lastname}
                                        </Form.Control.Feedback>
                </Form.Group>

                <Form.Group
                  as={Col}
                  md="6"
                  controlid="validationFormik102"
                  className="mb-3"
                >
                  <Form.Label>
                    Email<span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    styles={getSelectStyles("email")}
                    type="text"
                    name="email"
                    autoComplete="off"
                    placeholder="Enter Email"
                    value={formValidation.values.email}
                    onChange={formValidation.handleChange}
                    isInvalid={
                      formValidation.touched.email &&
                      formValidation.errors.email
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    {formValidation.errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group
                  as={Col}
                  md="6"
                  controlid="validationFormik102"
                  className="mb-3"
                >
                  <Form.Label>{t("learner.columns.mobile_no")}</Form.Label>
                  <Form.Control
                    styles={getSelectStyles("mobile")}
                    type="text"
                    name="mobile"
                    autoComplete="off"
                    maxLength={10}
                    minLength={8}
                    placeholder="Enter Mobile"
                    value={formValidation.values.mobile}
                    onChange={formValidation.handleChange}
                    isInvalid={
                      formValidation.touched.mobile &&
                      formValidation.errors.mobile
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    {formValidation.errors.mobile}
                  </Form.Control.Feedback>
                </Form.Group>

                {rowValues == undefined ? (
                  <>
                    <Form.Group
                      as={Col}
                      md="6"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        User Name <span className="text-danger">*</span>
                        <span className="pull-right">
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>{usernamemessage}</Tooltip>}
                          >
                            <i
                              className="fa fa-info-circle"
                              data-bs-toggle="tooltip"
                              title=""
                              data-bs-placement="top"
                              data-bs-original-title="Password"
                            ></i>
                          </OverlayTrigger>
                        </span>
                      </Form.Label>
                      <Form.Control
                        styles={getSelectStyles("username")}
                        type="text"
                        name="username"
                        autoComplete="off"
                        placeholder="Enter User Name"
                        value={formValidation.values.username}
                        onChange={formValidation.handleChange}
                        isInvalid={
                          formValidation.touched.username &&
                          formValidation.errors.username
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formValidation.errors.username}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="6"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Password <span className="text-danger">*</span>
                        <span className="pull-right">
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>{passwordmessage}</Tooltip>}
                          >
                            <i
                              className="fa fa-info-circle"
                              data-bs-toggle="tooltip"
                              title=""
                              data-bs-placement="top"
                              data-bs-original-title="Password"
                            ></i>
                          </OverlayTrigger>
                        </span>
                      </Form.Label>
                      <Form.Control
                        styles={getSelectStyles("password")}
                        type={showpassIcon == "fe fe-eye" ? "text" : "password"}
                        name="password"
                        autoComplete="off"
                        placeholder="Enter Password"
                        value={formValidation.values.password}
                        style={{ paddingRight: "2rem" }}
                        onChange={formValidation.handleChange}
                        isInvalid={
                          formValidation.touched.password &&
                          formValidation.errors.password
                        }
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          let ic =
                            showpassIcon == "fe fe-eye"
                              ? "fe fe-eye-off"
                              : "fe fe-eye";
                          setPassicon(ic);
                        }}
                        className="input-group-text-pass"
                        style={{
                          top: "35px",
                          right: "37px",
                          cursor: "pointer",
                        }}
                      >
                        <i className={`fe ${showpassIcon}`}></i>
                      </button>
                      <Form.Control.Feedback type="invalid">
                        {formValidation.errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </>
                ) : (
                  ""
                )}
              </Row>
            </Modal.Body>
            <Modal.Footer>
          {oneClick ? (
          <Button variant="primary" disabled>
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              Loading...
            </Button>
          ) : (
                <Button variant="primary" type="submit">
                  {modalTitle === "Add" ? "Submit" : "Update"}
                </Button>
              )}
            <Button
              variant="secondary"
              onClick={() => {
                viewDemoShow(false);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
          </Form>
        </Modal>
      </Fragment>
    </>
  );
};

export default NormalUserForm;
