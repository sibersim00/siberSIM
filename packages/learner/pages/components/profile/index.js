import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Form, Button, Nav, Tab } from "react-bootstrap";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import { Formik } from "formik";
import * as yup from "yup";
import {
  getProfile,
  changePassword,
  clearChangePasswor,
  clearSaveProfileData,
  clearHasError,
  saveProfileData,
  saveUserImage,
  clearSaveUserImage,
} from "../../../shared/redux/slices/profile/profile";
import {
  getLocalStorageData,
  setLocalStorageData,
} from "../../../shared/redux/slices/localstorage/Localstorage";
import Seo from "../../../shared/layout-components/seo/seo";
import {
  emailRegExp,
  passwordRegExp,
  passwordmessage,
} from "../../../shared/utils/regex";
import dynamic from "next/dynamic";
const ProfilePhotoUplaoder = dynamic(
  () => {
    return import(
      "../../../shared/data/common/fileuploads/profilephotouploader"
    );
  },
  { ssr: false }
);
import { FilePath } from "../../../shared/data/common/fileuploads/filepath";

const Profile = () => {
  let navigate = useRouter();
  const dispatch = useDispatch();
  const formikRef = useRef(null);
  const [tabIndex, setTabIndex] = useState("tab1");
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");
  const [showpassIcon2, setPassicon2] = useState("fe fe-eye-off");
  const [showpassIcon3, setPassicon3] = useState("fe fe-eye-off");
  const profile_path = FilePath.profile;
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
    oldPassword: "",
  });
  const changePasswordSucc = useSelector(
    (state) => state?.profiledata?.changePasswordSucc
  );
  const getProfileSucc = useSelector(
    (state) => state?.profiledata?.getProfileSucc?.data
  );
  const saveProfileResp = useSelector(
    (state) => state?.profiledata?.saveProfileResp
  );
  const saveUserImageRes = useSelector(
    (state) => state?.profiledata?.saveUserImageRes
  );
  const errorData = useSelector((state) => state?.profiledata?.error);
  useEffect(() => {
    dispatch(getProfile());
  }, []);

  useEffect(() => {
    if (saveProfileResp?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveProfileResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearSaveProfileData());
      dispatch(getProfile());
    }
  }, [saveProfileResp]);

  useEffect(() => {
    if (saveUserImageRes && saveUserImageRes.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveUserImageRes?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearSaveUserImage());
      dispatch(getProfile());
    }
  }, [saveUserImageRes]);

  useEffect(() => {
    if (getProfileSucc) {
      dispatch(setLocalStorageData("userLearner", getProfileSucc));
      dispatch(getLocalStorageData("userLearner"));
    }
  }, [getProfileSucc]);

  useEffect(() => {
    if (errorData?.statusCode) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {errorData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearHasError());
    }
  }, [errorData]);

  useEffect(() => {
    if (changePasswordSucc?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {changePasswordSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearChangePasswor());
      signOut();
    }
  }, [changePasswordSucc]);

  const signOut = () => {
    localStorage.removeItem("userLearner");
    localStorage.removeItem("accessTokenLearner");
    localStorage.removeItem("menusLearner");
    localStorage.clear();
    dispatch({ type: "LOGOUT" });
    navigate.replace("/", "", { shallow: true });
  };

  const handleUpload = (name = "", files = "", flag = "") => {
    const allFilePaths = files.map((f) => f.file);
    if (allFilePaths[0]) {
      const payload = {
        profile: allFilePaths[0],
      };
      dispatch(saveUserImage(payload));
    } else {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          Oops! Something went wrong. Please try again later.
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
    }
  };

  const handleChangePassword = (values) => {
    const payload = {
      oldPassword: values.oldPassword,
      password: values.password,
    };
    dispatch(changePassword(payload));
    setPasswordData({
      password: "",
      confirmPassword: "",
      oldPassword: "",
    });
  };

  const passwordSchema = yup.object().shape({
    oldPassword: yup
      .string()
      .required("Please enter the old password")
      .min(8, "Password must be at least 8 characters")
      .matches(passwordRegExp, "The old password is incorrect. "),
    password: yup
      .string()
      .required("Please enter the password")
      .min(8, "Password must be at least 8 characters")
      .matches(passwordRegExp, "Invalid Password. Please check note"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Please enter the confirm password"),
  });

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstname: getProfileSucc?.firstname || "",
      lastname: getProfileSucc?.lastname || "",
      email: getProfileSucc?.email || "",
      mobile: getProfileSucc?.mobile || "",
      profile_url: getProfileSucc?.profile || "",
    },
    validationSchema: yup.object().shape({
      firstname: yup
        .string()
        .required("Required")
        .max(15, "First name should not exceed 15 characters")
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
        .max(15, "Last name should not exceed 15 characters")
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
        .required("Email is required")
        .matches(emailRegExp, "Invalid email format - no spaces are allowed")
        .test(
          "no-leading-trailing-spaces",
          "No leading or trailing spaces allowed",
          (value) => {
            return !/^\s|\s$/.test(value);
          }
        )
        .test("no-emoji", "Email should not contain emojis", (value) => {
          if (!value) return true;
          const emojiRegex =
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2011-\u26FF])/g;
          return !emojiRegex.test(value);
        }),
      mobile: yup
        .string()
        .matches(/^[+]?[0-9]*$/, "Invalid - only numbers")
        .min(8, "Mobile number must be at least 8 digits")
        .max(13, "Mobile number must not exceed 13 digits"),
    }),
    onSubmit: (data) => {
      const payload = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        mobile: data.mobile.toString(),
      };
      dispatch(saveProfileData(payload));
    },
  });

  return (
    <div>
      <Seo title="Profile" />
      <ToastContainer />
      <Tab.Container
        id="center-tabs-example"
        className="bg-gray-100"
        defaultActiveKey="first"
      >
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <Tab.Container id="left-tabs-example" activeKey={tabIndex}>
                <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                  <Nav className="d-flex justify-content-between align-items-center panel-body tabs-menu-body pills bd-b pb-0 bg-white">
                    <div className="d-flex align-items-center">
                      <Nav.Item>
                        <Nav.Link
                          eventKey="tab1"
                          onClick={() => setTabIndex("tab1")}
                        >
                          Update Profile
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          eventKey="tab6"
                          onClick={() => setTabIndex("tab6")}
                        >
                          Change Password
                        </Nav.Link>
                      </Nav.Item>
                    </div>
                    <div className="ms-2 text-end">
                      <Button
                        variant="outline-secondary"
                        onClick={() => navigate.push("/dashboard")}
                      >
                        <i className="fe fe-arrow-left"></i>
                      </Button>
                    </div>
                  </Nav>
                </Row>

                <Tab.Content className="mt-4">
                  {tabIndex === "tab1" && (
                    <Tab.Pane eventKey="tab1" className="p-0">
                      <Row>
                        <Col md={8} className="mg-b-10">
                          <Form
                            noValidate
                            onSubmit={formValidation.handleSubmit}
                          >
                            <Row>
                              <Form.Group as={Col} md="6" className="mb-3">
                                <Form.Label>
                                  First Name{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
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

                              <Form.Group as={Col} md="6" className="mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
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

                              <Form.Group as={Col} md="6" className="mb-3">
                                <Form.Label>
                                  Email <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
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

                              <Form.Group as={Col} md="6" className="mb-3">
                                <Form.Label>Mobile</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="mobile"
                                  autoComplete="off"
                                  placeholder="Enter Mobile"
                                  value={formValidation.values.mobile}
                                  onChange={formValidation.handleChange}
                                  isInvalid={
                                    formValidation.touched.mobile &&
                                    formValidation.errors.mobile
                                  }
                                  maxLength={10}
                                />
                                <Form.Control.Feedback type="invalid">
                                  {formValidation.errors.mobile}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Row>

                            <Button variant="primary" type="submit">
                              Update
                            </Button>
                          </Form>
                        </Col>
                        <Col md={4}>
                          <ProfilePhotoUplaoder
                            ismulti={false}
                            folderpath={profile_path}
                            name="profile_url"
                            acceptedFileTypes={["image/png", "image/jpeg"]}
                            handleUpload={handleUpload}
                            fetchfiles={[formValidation.values.profile_url]}
                          />
                          <small className="text-warning text-center d-block mt-1">
                            Only PNG, JPG and JPEG images are allowed.
                          </small>
                        </Col>
                      </Row>
                    </Tab.Pane>
                  )}

                  {tabIndex === "tab6" && (
                    <Tab.Pane eventKey="tab6" className="p-0">
                      <div className="mt-0 text-secondary mb-3">
                        <span>Note: </span>
                        <br></br>
                        <span>1. {passwordmessage}</span>
                        <br></br>
                        <span>
                          2. Once the password is changed, the session will
                          expire, and the user will be logged out automatically.
                        </span>{" "}
                      </div>
                      <br></br>
                      <Col md={12}>
                        <Formik
                          innerRef={formikRef}
                          validationSchema={passwordSchema}
                          initialValues={passwordData}
                          onSubmit={handleChangePassword}
                        >
                          {({
                            handleSubmit,
                            handleChange,
                            values,
                            touched,
                            errors,
                          }) => (
                            <Form
                              className="form-horizontal"
                              onSubmit={handleSubmit}
                            >
                              <Form.Group className="form-group">
                                <Row>
                                  <Col md={3}>
                                    <Form.Label>
                                      Old Password
                                      <span className="text-danger"> *</span>
                                    </Form.Label>
                                  </Col>
                                  <Col md={9}>
                                    <Form.Control
                                      type={
                                        showpassIcon === "fe fe-eye-off"
                                          ? "password"
                                          : "text"
                                      }
                                      name="oldPassword"
                                      autoComplete="off"
                                      value={values.oldPassword}
                                      onChange={handleChange}
                                      placeholder="Enter Old Password"
                                      isInvalid={
                                        touched.oldPassword &&
                                        errors.oldPassword
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPassicon(
                                          showpassIcon === "fe fe-eye-off"
                                            ? "fe fe-eye"
                                            : "fe fe-eye-off"
                                        )
                                      }
                                      className="input-group-text-pass"
                                    >
                                      <i className={`fe ${showpassIcon}`}></i>
                                    </button>
                                    <Form.Control.Feedback type="invalid">
                                      {errors.oldPassword}
                                    </Form.Control.Feedback>
                                  </Col>
                                </Row>
                              </Form.Group>

                              <Form.Group className="form-group">
                                <Row>
                                  <Col md={3}>
                                    <Form.Label>
                                      New Password
                                      <span className="text-danger"> *</span>
                                    </Form.Label>
                                  </Col>
                                  <Col md={9}>
                                    <Form.Control
                                      type={
                                        showpassIcon2 === "fe fe-eye-off"
                                          ? "password"
                                          : "text"
                                      }
                                      name="password"
                                      autoComplete="off"
                                      value={values.password}
                                      onChange={handleChange}
                                      placeholder="Enter New Password"
                                      isInvalid={
                                        touched.password && errors.password
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPassicon2(
                                          showpassIcon2 === "fe fe-eye-off"
                                            ? "fe fe-eye"
                                            : "fe fe-eye-off"
                                        )
                                      }
                                      className="input-group-text-pass"
                                    >
                                      <i className={`fe ${showpassIcon2}`}></i>
                                    </button>
                                    <Form.Control.Feedback type="invalid">
                                      {errors.password}
                                    </Form.Control.Feedback>
                                  </Col>
                                </Row>
                              </Form.Group>

                              <Form.Group className="form-group">
                                <Row>
                                  <Col md={3}>
                                    <Form.Label>
                                      Confirm Password
                                      <span className="text-danger"> *</span>
                                    </Form.Label>
                                  </Col>
                                  <Col md={9}>
                                    <Form.Control
                                      type={
                                        showpassIcon3 === "fe fe-eye-off"
                                          ? "password"
                                          : "text"
                                      }
                                      name="confirmPassword"
                                      autoComplete="off"
                                      value={values.confirmPassword}
                                      onChange={handleChange}
                                      placeholder="Confirm New Password"
                                      isInvalid={
                                        touched.confirmPassword &&
                                        errors.confirmPassword
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPassicon3(
                                          showpassIcon3 === "fe fe-eye-off"
                                            ? "fe fe-eye"
                                            : "fe fe-eye-off"
                                        )
                                      }
                                      className="input-group-text-pass"
                                    >
                                      <i className={`fe ${showpassIcon3}`}></i>
                                    </button>
                                    <Form.Control.Feedback type="invalid">
                                      {errors.confirmPassword}
                                    </Form.Control.Feedback>
                                  </Col>
                                </Row>
                              </Form.Group>

                              <Form.Group>
                                <Row>
                                  <Col md={3}>
                                    <Button variant="primary" type="submit">
                                      Change Password
                                    </Button>
                                  </Col>
                                </Row>
                              </Form.Group>
                            </Form>
                          )}
                        </Formik>
                      </Col>
                    </Tab.Pane>
                  )}
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Tab.Container>
    </div>
  );
};

Profile.layout = "Contentlayout";
export default Profile;
