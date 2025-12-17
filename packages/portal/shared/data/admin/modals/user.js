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
  addUserDetails,
  editUserDetails,
} from "../../../redux/slices/admin/Users";

import {
  phoneRegExp,
  emailRegExp,
  passwordRegExp,
  usernamemessage,
  passwordmessage,
  emojiRegex,
} from "../../../utils/regex.js";
const userAdd = (props) => {
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
      .required("Required ")
      .matches(
        /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/, // Ensures at least one letter, and the rest can be alphanumeric
        "Invalid Username. Please check info"
      )
      .max(30, "Username should not exceed 30 characters") // Set username max length to 30
      .min(5, "Username should be minimum 5 characters")
      .test(
        "no-leading-trailing-spaces",
        "No leading or trailing spaces allowed",
        (value) => {
          // This regex checks for leading or trailing spaces
          return !/^\s|\s$/.test(value);
        }
      ),

    password: yup
      .string()
     
      .when([], {
        is: () => rowValues?.id === undefined || 0, // Use the external variable in the condition
        then: () =>
          yup
            .string()
            .required("Invalid Password. Please check info")
            .min(8, "Password must be at least 8 characters")
            .max(20, "Password should not exceed 20 characters")
            .matches(passwordRegExp, "Please follow the password rules"), // If isAdmin is true
        otherwise: () => yup.string(), // Default for others
      }),
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
    mobile: yup
      .string()
      // .required("Required")
      .matches(phoneRegExp, "Invalid - minimum 8 digits requiredr")
      .min(8, "Invalid - minimum 8 digits required")
      .max(10, "Invalid - maximum 10 digits required"),
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
  });

  const initialValues = {
    loginid: rowValues?.loginid || "",
    password: rowValues?.password || "",
    firstname: rowValues?.firstname || "",
    lastname: rowValues?.lastname || "",
    id: rowValues?.userid,
    mobile: rowValues && rowValues.mobile ? String(rowValues?.mobile) : "",
    email: rowValues?.email || "",
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
    if (rowValues?.id == 0 || rowValues?.id == undefined) {
      handleOneClick(true);
      const payload = {
        userid: rowValues?.id,
        loginid: data.loginid,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        mobile: data.mobile,
        status: "true",
      };
      dispatch(addUserDetails(payload));
    } else {
      handleOneClick(true);
      const Id = rowValues?.id;
      const payload = {
        userid: rowValues?.id,
        loginid: data.loginid,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        mobile: data.mobile,
        status: "true",
        id: Id,
      };
      dispatch(editUserDetails(payload, Id));
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
                  <Modal.Title>{modalTitle} SIMMaster User </Modal.Title>
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
                        Last Name <span className="text-danger"> </span>
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
                        Mobile <span className="text-danger"> </span>
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
                        User Name<span className="text-danger">*</span>
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
                    {(rowValues?.id === 0 || rowValues?.id === undefined) && (
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
                          //  styles={getSelectStyles("password")}
                          type={
                            showpassIcon == "fe fe-eye" ? "text" : "password"
                          }
                          name="password"
                          autoComplete="off"
                          placeholder="Password"
                          value={values.password}
                          onChange={handleChange}
                          style={{ paddingRight: "2rem" }}
                          isValid={touched.password && !errors.password}
                          isInvalid={touched.password && errors.password}
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
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    )}
                    {/* <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-0"
                    >
                      <div className="form-group ">
                        <Form.Label>Status</Form.Label>
                        <label className="custom-switch">
                          <input
                            type="checkbox"
                            name="custom-switch-checkbox1"
                            className="custom-switch-input"
                            // defaultChecked
                            checked={isChecked}
                            onChange={handleToggle}
                          />
                          <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                        </label>
                      </div>
                    </Form.Group> */}
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

export default userAdd;
