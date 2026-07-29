import React, { useEffect, useState } from "react";
import Head from "next/head";
import {
  Button,
  Col,
  Form,
  Row,
  Container,
  Card,
  OverlayTrigger,
  Tooltip,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import favicon from "../../public/assets/img/brand/favicon.png";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import "../../shared/utils/i18n"; // Initialize i18next
import logo from "../../public/assets/img/brand/logo.png";
import { useRouter } from "next/router";
import {
  SignupInstructor,
  clearDispatchFromSignup,
  clearHasError,
  getCompanyList,
} from "../../shared/redux/slices/authentication/Auth";
import { Formik } from "formik";
import * as yup from "yup";
import {
  phoneRegExp,
  emailRegExp,
  passwordRegExp,
  usernamemessage,
  passwordmessage,
} from "../../shared/utils/regex";
import { d_mmm_y } from"../../shared/data/helperFunctions/dateCustom";
const emojiRegex =
  /[\u{1F600}-\u{1F64F}]|[\u{2702}-\u{27B0}]|[\u{1F680}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F1E6}-\u{1F1FF}]/u;

// Define the validation schema using yup
const noEmojiTest = (value) => {
  if (typeof value !== "string") return true;
  return !emojiRegex.test(value);
};
const schema = yup.object().shape({
 username: yup
           .string()
           .required("Required")
           .matches(
             /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/,  // Ensures at least one letter, and the rest can be alphanumeric
              "Invalid Username. Please check info"
           )
           .max(30, "Username should not exceed 30 characters")
         .min(5, "Username should be minimum 5 characters")
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
    .matches(phoneRegExp, "Invalid - only numbers")
    .min(8, "Mobile number must be at least 8 digits")
    .max(10, "Mobile number must not exceed 10 digits"),

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
    .matches(/^[A-Za-z0-9 ]+$/, "No special characters allowed") // ✅ Only letters, numbers, spaces
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
  password: yup
    .string()
    .required("Invalid Password. Please check info")
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password should not exceed 20 characters")
    .matches(passwordRegExp, "Please follow the password rules"),
});

const Signup = () => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const { t } = useTranslation();
  let navigate = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");

  const { hasSignupSuccess, errorData } = useSelector((state) => ({
    hasSignupSuccess:
      state && state.authData && state.authData.SignupSuccessData,
    errorData: state && state.authData && state.authData.error,
  }));
 const getCompanySettingsData = useSelector((state) => state?.authData?.getCompanyListData);

   useEffect(() => {
          dispatch(getCompanyList());
    }, [dispatch]);

  useEffect(() => {
       if (getCompanySettingsData?.statusCode === 200 && getCompanySettingsData?.redirect == true) {
           navigate.replace("/503");
       }else if(getCompanySettingsData?.statusCode === 200 && getCompanySettingsData?.redirect == false){
         let licenseStatus = getCompanySettingsData?.data?.licenseStatus;
         if(!licenseStatus.isStart){
           let startDate = d_mmm_y(licenseStatus.start_date)
           navigate.replace(`/503?startDate=${startDate}`);
         }
       }
   }, [getCompanySettingsData]);

  useEffect(() => {
    if (errorData?.statusCode) {
      errorData.errors && errorData.errors.length > 0
        ? errorData.errors.map((data) => {
            toast.error(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0">
                {data}
              </p>,
              {
                position: toast.POSITION.TOP_RIGHT,
                hideProgressBar: true,
                theme: "colored",
              }
            );
          })
        : toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {errorData?.message}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );

      dispatch(clearHasError());
      setIsLoading(false);
    }
  }, [errorData]);

  useEffect(() => {
    if (hasSignupSuccess?.statusCode === 200) {
      toast.success(hasSignupSuccess?.message, {
        position: toast.POSITION.TOP_RIGHT,
        hideProgressBar: false,
        theme: "colored",
      });
      dispatch(clearDispatchFromSignup());
      setTimeout(() => {
        push("/");
      }, 2000);
    }
  }, [hasSignupSuccess]);

  const handleSignup = (values) => {
    const payload = {
      username: values.username,
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email,
      mobile: values.mobile,
      organization: values.organization,
      address: values.address,
      password: values.password,
    };
    dispatch(SignupInstructor(payload));
    setIsLoading(true);
  };

  return (
    <div>
      <Head>
        <title>{t("login.meta_title")}</title>
        <meta name="description" content="Instructor" />
        <link rel="icon" href={favicon.src} />
      </Head>
      <ToastContainer />
      <div className="page main-signin-wrapper">
        <Row className="signpages">
          <Col md={12} className="p-0 ">
            <Col className="row-sm p-0">
              <Col lg={12} xl={12} sm={12} className="login_form">
                <Container fluid>
                  <Row className="row-sm">
                    <Card.Body>
                      <Formik
                        initialValues={{
                          firstname: "",
                          lastname: "",
                          email: "",
                          mobile: "",
                          username: "",
                          password: "",
                          organization: "",
                          address: "",
                        }}
                        validationSchema={schema}
                        onSubmit={handleSignup}
                      >
                        {({
                          values,
                          handleChange,
                          handleSubmit,
                          errors,
                          touched,
                        }) => (
                          <Form onSubmit={handleSubmit} className="mb-2">
                            <h2 className="text-center">
                              Register to Become an SIMManager
                            </h2>
                            <p className="mb-4 text-muted tx-13 ms-0 text-center">
                              Kindly fill in all required fields with accurate
                              information.
                            </p>

                            <Row>
                              <Form.Group
                                as={Col}
                                md="6"
                                controlid="validationFormik102"
                                className="mb-3"
                              >
                                <Form.Label>
                                  First Name{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="firstname"
                                  autoComplete="off"
                                  value={values.firstname}
                                  onChange={handleChange}
                                  placeholder="Enter First Name"
                                  isValid={
                                    touched.firstname && !errors.firstname
                                  }
                                  isInvalid={
                                    touched.firstname && errors.firstname
                                  }
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
                                  Last Name{" "}
                                  <span className="text-danger"></span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="lastname"
                                  autoComplete="off"
                                  value={values.lastname}
                                  onChange={handleChange}
                                  placeholder="Enter Last Name"
                                  isValid={touched.lastname && !errors.lastname}
                                  isInvalid={
                                    touched.lastname && errors.lastname
                                  }
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
                                  User Name{" "}
                                  <span className="text-danger">*</span>
                                  <span className="pull-right">
                                                                      <OverlayTrigger
                                                                        placement="bottom"
                                                                        overlay={
                                                                          <Tooltip>{usernamemessage}</Tooltip>
                                                                        }
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
                                  name="username"
                                  autoComplete="off"
                                  value={values.username}
                                  onChange={handleChange}
                                  placeholder="Enter User Name"
                                  isValid={touched.username && !errors.username}
                                  isInvalid={
                                    touched.username && errors.username
                                  }
                                />
                                <Form.Control.Feedback type="invalid">
                                  {errors.username}
                                </Form.Control.Feedback>
                              </Form.Group>
                              <Form.Group
                                as={Col}
                                md="6"
                                controlid="validationFormik102"
                                className="mb-3"
                              >
                                <Form.Label>
                                  Password{" "}
                                  <span className="text-danger">*</span>
                                  <span className="pull-right">
                                    <OverlayTrigger
                                      placement="bottom"
                                      overlay={
                                        <Tooltip>{passwordmessage}</Tooltip>
                                      }
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
                                  type={
                                    showpassIcon == "fe fe-eye"
                                      ? "text"
                                      : "password"
                                  }
                                  name="password"
                                  autoComplete="off"
                                  placeholder="Enter Password"
                                  value={values.password}
                                  onChange={handleChange}
                                  style={{ paddingRight: "2rem" }}
                                  isValid={touched.password && !errors.password}
                                  isInvalid={
                                    touched.password && errors.password
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
                                    right: "35px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <i className={`fe ${showpassIcon}`}></i>
                                </button>
                                <Form.Control.Feedback type="invalid">
                                  {errors.password}
                                </Form.Control.Feedback>
                              </Form.Group>
                              <Form.Group
                                as={Col}
                                md="6"
                                controlid="validationFormik102"
                                className="mb-3"
                              >
                                <Form.Label>
                                  Organization{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="organization"
                                  autoComplete="off"
                                  value={values.organization}
                                  onChange={handleChange}
                                  placeholder="Enter Organization"
                                  isValid={
                                    touched.organization && !errors.organization
                                  }
                                  isInvalid={
                                    touched.organization && errors.organization
                                  }
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
         

                            {!isLoading ? (
                              <Button
                                // onClick={Login}
                                // variant="primary"
                                variant="mute"
                                className="btn-block ht-45 rounded-50 background-black text-white"
                                type="submit"
                              >
                                {t("login.forms.button.sign_up")}
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                className="btn-block ht-45 rounded-50 background-black text-white"
                                disabled
                              >
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                />{" "}
                                <span className="">
                                  {t("Signing Up...")}
                                </span>
                              </Button>
                            )}
                         </Form>
                        )}
                      </Formik>
                      <div className="card-footer border-top-0 ps-0 mt-3 text-start ">
                        <p>
                          {t("login.labels.Already_have_Account")}
                          <Link href={`/`} style={{ color: "#044668ff" }}> {t("login.labels.signin")}</Link>
                        </p>
                      </div>
                    </Card.Body>
                  </Row>
                </Container>
              </Col>
            </Col>
          </Col>
        </Row>
      </div>
    </div>
  );
};

Signup.layout = "Authenticationlayout";

export default Signup;
