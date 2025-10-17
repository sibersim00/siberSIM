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
import { Formik } from "formik";
import * as yup from "yup";
import {
  addinstructorDetails,
  editInstructorDetails,
} from "../../../redux/slices/instructor/instructor";
import {
  phoneRegExp,
  emailRegExp,
  passwordRegExp,
  passwordmessage,
  usernamemessage,
  emojiRegex,
} from "../../../utils/regex.js";

const instructorAdd = (props) => {
  const { openFlag, handleFormModal, rowValues, oneClick, handleOneClick } =
    props;
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const [isChecked, setIsChecked] = useState(false);
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");

  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };
  const schema = yup.object().shape({
    loginid: yup
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
    mobile: yup
      .string()
      .matches(phoneRegExp, "Invalid - minimum 8 digits required")
      .min(8, "Mobile number must be at least 8 digits")
      .max(13, "Mobile number must not exceed 13 digits"),

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

    organization: yup
      .string()
      .required("Required")
      .min(3, "Organization name should be at least 3 characters")
      .matches(/^[A-Za-z0-9 ]+$/, "No special characters allowed") // Only letters, numbers, spaces
      .test(
        "no-leading-trailing-spaces",
        "No leading or trailing spaces allowed",
        (value) => !/^\s|\s$/.test(value || "")
      )
      .test("no-emoji", "Emojis are not allowed", noEmojiTest),

    address: yup
      .string()
      .required("Required")
      .test(
        "no-leading-trailing-spaces",
        "No leading or trailing spaces allowed",
        (value) => !/^\s|\s$/.test(value)
      )
      .test("no-emoji", "Emojis are not allowed", noEmojiTest),
    password: yup.string().when("instructor_id", (instructor_id, schema) => {
      return instructor_id[0] === 0
        ? schema
          .required("Invalid Password. Please check info")
          .min(8, "Password must be at least 8 characters")
          .matches(
            passwordRegExp,
            "Password must contain only letters, numbers, and special characters"
          )
        : schema;
    }),
  });
  const initialValues = {
    loginid: rowValues?.loginid || "",
    firstname: rowValues?.firstname || "",
    lastname: rowValues?.lastname || "",
    instructor_id: rowValues?.id ?? 0,
    mobile: rowValues?.mobile || "",
    email: rowValues?.email || "",
    organization: rowValues?.organization || "",
    address: rowValues?.address || "",
    password: rowValues?.password || "",
  };
  useEffect(() => {
    if (rowValues) {
      setIsChecked(rowValues.isactive);
      setModalTitle(rowValues.title);
    }
  }, [rowValues]);

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handleFormModal(false);
    }
  };
  const handleSubmit = (data) => {
    const trimmedData = {
      ...data,
      loginid: data.loginid.trim(),
      firstname: data.firstname.trim(),
      lastname: data.lastname.trim(),
      email: data.email.trim(),
      organization: data.organization.trim(),
      address: data.address.trim(),
      password: data.password.trim(),
    };

    const payload = {
      instructor_id: rowValues?.id,
      loginid: trimmedData.loginid,
      firstname: trimmedData.firstname,
      lastname: trimmedData.lastname,
      email: trimmedData.email,
      mobile:
        trimmedData && trimmedData.mobile ? String(trimmedData?.mobile) : "",
      organization: trimmedData.organization,
      address: trimmedData.address,
      password: trimmedData.password,
      status: isChecked ? "Active" : "Inactive",
    };

    if (rowValues?.id === 0 || rowValues?.id === undefined) {
      handleOneClick(true);
      dispatch(addinstructorDetails(payload));
    } else {
      handleOneClick(true);
      dispatch(editInstructorDetails(payload));
    }
  };
  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static" size="lg">
          <Formik
            validationSchema={schema}
            onSubmit={(e) => handleSubmit(e)}
            initialValues={initialValues}
          >
            {({ handleSubmit, handleChange, values, touched, errors }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Modal.Header
                  closeButton
                  onClick={() => {
                    viewDemoShow(false);
                  }}
                >
                  <Modal.Title>{modalTitle} SIMManager </Modal.Title>
                </Modal.Header>
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
                        type="text"
                        name="firstname"
                        autoComplete="off"
                        value={values.firstname}
                        onChange={handleChange}
                        placeholder="Enter First Name"
                        isValid={touched.firstname && !errors.firstname}
                        isInvalid={touched.firstname && errors.firstname}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstname}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="6"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Last Name <span className="text-danger"></span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="lastname"
                        autoComplete="off"
                        value={values.lastname}
                        onChange={handleChange}
                        placeholder="Enter Last Name"
                        isValid={touched.lastname && !errors.lastname}
                        isInvalid={touched.lastname && errors.lastname}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastname}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="6"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Email <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="email"
                        autoComplete="off"
                        value={values.email}
                        onChange={handleChange}
                        placeholder="Enter Email"
                        isValid={touched.email && !errors.email}
                        isInvalid={touched.email && errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="6"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Mobile <span className="text-danger"></span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="mobile"
                        autoComplete="off"
                        value={values.mobile}
                        onChange={handleChange}
                        placeholder="Enter Mobile"
                        isValid={touched.mobile && !errors.mobile}
                        isInvalid={touched.mobile && errors.mobile}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.mobile}
                      </Form.Control.Feedback>
                    </Form.Group>
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
                        type="text"
                        name="loginid"
                        autoComplete="off"
                        value={values.loginid}
                        onChange={handleChange}
                        placeholder="Enter User Name"
                        isValid={touched.loginid && !errors.loginid}
                        isInvalid={touched.loginid && errors.loginid}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.loginid}
                      </Form.Control.Feedback>
                    </Form.Group>
                    {modalTitle === "Add" && (
                      <Form.Group
                        as={Col}
                        md="6"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        {modalTitle === "Add" && (
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
                        )}
                        {modalTitle === "Add" && (
                          <Form.Control
                            type={
                              showpassIcon == "fe fe-eye" ? "text" : "password"
                            }
                            name="password"
                            autoComplete="off"
                            placeholder="Enter Password"
                            value={values.password}
                            onChange={handleChange}
                            style={{ paddingRight: "2rem" }}
                            isValid={touched.password && !errors.password}
                            isInvalid={touched.password && errors.password}
                          />
                        )}
                        {modalTitle === "Add" && (
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
                              right: "37px", // Move it slightly to the left
                              cursor: "pointer",
                            }}
                          >
                            <i className={`fe ${showpassIcon}`}></i>
                          </button>
                        )}
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    )}
                    <Form.Group
                      as={Col}
                      md="6"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Organization <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="organization"
                        autoComplete="off"
                        value={values.organization}
                        onChange={handleChange}
                        placeholder="Enter Organization"
                        isValid={touched.organization && !errors.organization}
                        isInvalid={touched.organization && errors.organization}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.organization}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="6"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        name="address"
                        autoComplete="off"
                        value={values.address}
                        onChange={handleChange}
                        placeholder="Enter Address"
                        isValid={touched.address && !errors.address}
                        isInvalid={touched.address && errors.address}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.address}
                      </Form.Control.Feedback>
                    </Form.Group>
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
            )}
          </Formik>
        </Modal>
      </Fragment>
    </>
  );
};
export default instructorAdd;
