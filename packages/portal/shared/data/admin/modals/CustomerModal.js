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
  phoneRegExp,
  emailRegExp,
  emojiRegex,
} from "../../../utils/regex.js";
import { addCustomerDetails, editCustomerDetails } from "../../../redux/slices/customers/customer.js";

const customerAdd = (props) => {
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
 firstname: yup
    .string()
    .required("Required")
    .max(30, "First name should not exceed 30 characters")
    .matches(
      /^[A-Za-z.]+(?: [A-Za-z.]+)*$/,
      "Invalid — only alphabets, periods, and single spaces allowed"
    )
    .test(
      "no-leading-trailing-spaces",
      "No leading or trailing spaces allowed",
      (value) => !/^\s|\s$/.test(value)
    ),

  lastname: yup
    .string()
    .max(30, "Last name should not exceed 30 characters")
    .matches(
      /^[A-Za-z.]+(?: [A-Za-z.]+)*$/,
      "Invalid — only alphabets, periods, and single spaces allowed"
    )
    .test(
      "no-leading-trailing-spaces",
      "No leading or trailing spaces allowed",
      (value) => !/^\s|\s$/.test(value)
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
  });
  const initialValues = {
    firstname: rowValues?.firstname || "",
    lastname: rowValues?.lastname || "",
    customer_id: rowValues?.id ?? 0,
    mobile: rowValues?.mobile || "",
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
    const trimmedData = {
      ...data,

      firstname: data.firstname.trim(),
      lastname: data.lastname.trim(),
      email: data.email.trim(),
  
    };

    const payload = {
      customer_id: rowValues?.id,
      firstname: trimmedData.firstname,
      lastname: trimmedData.lastname,
      email: trimmedData.email,
      mobile:
        trimmedData && trimmedData.mobile ? String(trimmedData?.mobile) : "",
      status: isChecked ? "Active" : "Inactive",
    };

    if (rowValues?.id === 0 || rowValues?.id === undefined) {
      handleOneClick(true);
      dispatch(addCustomerDetails(payload));
    } else {
      handleOneClick(true);
      dispatch(editCustomerDetails(payload));
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
                  <Modal.Title>{modalTitle} Customer </Modal.Title>
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
export default customerAdd;