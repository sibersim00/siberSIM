import React, { useEffect, useState } from "react";
import * as yup from "yup";
import { Row, Col, Button, Form } from "react-bootstrap";
import { useFormik } from "formik";
import { Modal } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  registerLearner,
  clearRegisterLearner,
  getLearnersManageList,
} from "../../../shared/redux/slices/learner/learnerManage";
import "../../../shared/utils/i18n";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";

function AddLearner({ addLear, setAddLear, learnerData }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const router = useRouter();
  const [showpassIcon, setPassicon] = useState("fe fe-eye");
  const [questionSubmitButton, setQuestionSubmitButton] = useState("Submit");
  const [leaenerSubmitTitle, seLearnerSubmitTitle] = useState(" Add");
  const { errorData, registerLearnerResp } = useSelector((state) => {
    return {
      errorData:
        state && state.examData && state.examData.error && state.examData.error,
      registerLearnerResp:
        state && state.learnerData && state.learnerData.registerLearnerResp,
    };
  });

  useEffect(() => {
    if (learnerData !== "") {
      seLearnerSubmitTitle("Update");
    }
  }, [learnerData]);

  useEffect(() => {
    if (registerLearnerResp?.statusCode == 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {registerLearnerResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearRegisterLearner());
      setAddLear(false);
      dispatch(getLearnersManageList());
      seLearnerSubmitTitle("Add");
      formValidation.resetForm();
    }
  }, [registerLearnerResp]);

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

  let viewDemoClose = (modal) => {
    switch (modal) {
      case "addLear":
        setAddLear(false);
        seLearnerSubmitTitle("Add");
        break;
    }
  };

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      exam_id: "",
      firstname: learnerData?.firstname || "",
      lastname: learnerData?.lastname || "",
      email: learnerData?.email || "",
      mobile: learnerData?.mobile || "",
      password: learnerData?.password || "",
      username: learnerData?.username || "",
    },

    validationSchema: yup.object().shape({
      firstname: yup.string().required("Required"),
      lastname: yup.string().required("Required"),
      email: yup
        .string()
        .required("Required")
        .email(t("learner.registration.validation_msg.valid_email")),
      mobile: yup
        .string()
        .required("Required")
        .matches(
          /^(?:\(?([0-9]{2,3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{3,4})$/,
          t("learner.registration.validation_msg.valid_number")
        ),
      username: yup.string().required("Required"),
      password: yup
        .string()
       
        .when([], {
          is: () => learnerData === "", // Use the external variable in the condition
          then: () =>
            yup.string().required("Password must be at least 8 characters"), // If isAdmin is true
          otherwise: () => yup.string(), // Default for others
        }),
    
    }),

    onSubmit: (data, action) => {
      try {
        let payload;

        if (learnerData === "") {
          // Condition when learnerData is empty
          payload = {
            firstname: data?.firstname,
            lastname: data?.lastname,
            email: data?.email,
            mobile: data?.mobile,
            password: data?.password,
            username: data?.username,
          };
        } else {
          // Condition when learnerData is not empty
          payload = {
            learner_id: learnerData?.learner_id,
            firstname: data?.firstname,
            lastname: data?.lastname,
            email: data?.email,
            mobile: data?.mobile,
          };
        }
        dispatch(registerLearner(payload));
      } catch (error) {
        console.error("Error submitting the form:", error);
        // Handle the error, maybe show a message to the user
      }
    },
  });

  return (
    <Modal show={addLear} size="lg" backdrop="static">
      <Modal.Header
        closeButton
        onClick={() => {
          viewDemoClose("addLear");
        }}
      >
        <Modal.Title>{leaenerSubmitTitle} SIMUser</Modal.Title>
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
                placeholder="First Name"
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
              <Form.Label>
                Last Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                styles={getSelectStyles("lastname")}
                type="text"
                name="lastname"
                autoComplete="off"
                placeholder="Last Name"
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
                Email Adderss <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                styles={getSelectStyles("email")}
                type="text"
                name="email"
                autoComplete="off"
                placeholder="Email Adderss"
                value={formValidation.values.email}
                onChange={formValidation.handleChange}
                isInvalid={
                  formValidation.touched.email && formValidation.errors.email
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
              <Form.Label>
                {t("learner.columns.mobile_no")}{" "}
                <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                styles={getSelectStyles("mobile")}
                type="text"
                name="mobile"
                autoComplete="off"
                maxLength={10}
                minLength={8}
                placeholder={t("learner.columns.mobile_no")}
                value={formValidation.values.mobile}
                onChange={formValidation.handleChange}
                isInvalid={
                  formValidation.touched.mobile && formValidation.errors.mobile
                }
              />
              <Form.Control.Feedback type="invalid">
                {formValidation.errors.mobile}
              </Form.Control.Feedback>
            </Form.Group>

            {learnerData == "" ? (
              <>
                <Form.Group
                  as={Col}
                  md="6"
                  controlid="validationFormik102"
                  className="mb-3"
                >
                  <Form.Label>
                    Username <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    styles={getSelectStyles("username")}
                    type="text"
                    name="username"
                    autoComplete="off"
                    placeholder="Username"
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
                  </Form.Label>
                  <Form.Control
                    styles={getSelectStyles("password")}
                    type={showpassIcon == "fe fe-eye" ? "password" : "text"}
                    name="password"
                    autoComplete="off"
                    placeholder="Password"
                    value={formValidation.values.password}
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
                    style={{ top: "35px", right: "20px", cursor: "pointer" }}
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
          <Button variant="primary" type="submit">
            {questionSubmitButton}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              viewDemoClose("addLear");
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default AddLearner;
