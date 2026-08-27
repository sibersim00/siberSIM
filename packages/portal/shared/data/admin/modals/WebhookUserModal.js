import React, { useState } from "react";
import { Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";

const schema = yup.object({
  firstname: yup
    .string()
    .trim()
    .min(2)
    .max(30, "First name must be 30 characters or less")
    .required("Required"),
  lastname: yup
    .string()
    .trim()
    .max(30, "Last name must be 30 characters or less"),
  email: yup.string().trim().email("Enter a valid email").required("Required"),
  mobile: yup
    .string()
    .trim()
    .matches(/^\+?[0-9]{7,15}$/, {
      message: "Enter 7 to 15 digits",
      excludeEmptyString: true,
    }),
  loginid: yup
    .string()
    .trim()
    .min(5)
    .max(100)
    .matches(
      /^[A-Za-z0-9._-]+$/,
      "Letters, numbers, dots, underscores and hyphens only",
    )
    .required("Required"),
  organization: yup.string().trim().max(255),
  status: yup.string().oneOf(["Active", "Inactive"]).required(),
  password: yup.string().when("isNew", {
    is: true,
    then: (value) =>
      value
        .min(8)
        .max(72)
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
          "Use upper/lowercase, number and special character",
        )
        .required("Required"),
    otherwise: (value) => value.notRequired(),
  }),
});

export default function WebhookUserModal({
  show,
  user,
  loading,
  onClose,
  onSubmit,
}) {
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");
  const isNew = !user?.webhook_user_id;
  const initialValues = {
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    loginid: user?.loginid || "",
    organization: user?.organization || "",
    status:
      user?.status_label || (user?.status === "false" ? "Inactive" : "Active"),
    password: "",
    isNew,
  };
  return (
    <Modal show={show} onHide={onClose} backdrop="static" size="lg">
      <Formik
        initialValues={initialValues}
        validationSchema={schema}
        enableReinitialize
        onSubmit={(values) => onSubmit(values)}
      >
        {(formik) => (
          <Form noValidate onSubmit={formik.handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>{isNew ? "Add" : "Edit"} Webhook User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Form.Group as={Col} md="6" controlid="validationFormikFirstname" className="mb-3">
                  <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="firstname"
                    autoComplete="off"
                    maxLength={30}
                    placeholder="Enter First Name"
                    value={formik.values.firstname}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.firstname && !!formik.errors.firstname}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.firstname}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group as={Col} md="6" controlid="validationFormikLastname" className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    autoComplete="off"
                    maxLength={30}
                    placeholder="Enter Last Name"
                    value={formik.values.lastname}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.lastname && !!formik.errors.lastname}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.lastname}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group as={Col} md="6" controlid="validationFormikEmail" className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="email"
                    autoComplete="off"
                    placeholder="Enter Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.email && !!formik.errors.email}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group as={Col} md="6" controlid="validationFormikMobile" className="mb-3">
                  <Form.Label>Mobile</Form.Label>
                  <Form.Control
                    type="text"
                    name="mobile"
                    autoComplete="off"
                    placeholder="Enter Mobile"
                    value={formik.values.mobile}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.mobile && !!formik.errors.mobile}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.mobile}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group as={Col} md="6" controlid="validationFormikUsername" className="mb-3">
                  <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="loginid"
                    autoComplete="off"
                    placeholder="Enter Username"
                    value={formik.values.loginid}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.loginid && !!formik.errors.loginid}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.loginid}</Form.Control.Feedback>
                </Form.Group>
                {isNew && (
                  <Form.Group as={Col} md="6" className="mb-3">
                    <Form.Label>
                      Password <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type={showpassIcon === "fe fe-eye" ? "text" : "password"}
                      name="password"
                      autoComplete="off"
                      placeholder="Enter Password"
                      value={formik.values.password}
                      style={{ paddingRight: "2rem" }}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      isInvalid={
                        formik.touched.password && !!formik.errors.password
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPassicon(
                          showpassIcon === "fe fe-eye"
                            ? "fe fe-eye-off"
                            : "fe fe-eye",
                        )
                      }
                      className="input-group-text-pass"
                      style={{ top: "35px", right: "37px", cursor: "pointer" }}
                    >
                      <i className={`fe ${showpassIcon}`}></i>
                    </button>
                    <Form.Control.Feedback type="invalid">
                      {formik.errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner size="sm" className="me-1" />}
                {isNew ? "Submit" : "Update"}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
