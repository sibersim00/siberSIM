import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Form,
  FormGroup,
  Button,
  Nav,
  Tab,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import { useFormik } from "formik";
import * as yup from "yup";
import { Formik } from "formik";
import {
  getListOfUser,
  changePassword,
  clearHasError,
  clearChangePasswor,
  getProfile,
  changeProfile,
  clearChangeProfile,
  saveUserImage,
  clearSaveUserImage,
} from "../../../shared/redux/slices/admin/Users";
import Seo from "../../../shared/layout-components/seo/seo";
import { useTranslation } from "react-i18next";
import "../../../shared/utils/i18n";

import {
  getLocalStorageData,
  setLocalStorageData,
} from "../../../shared/redux/slices/localstorage/LocalStorage";
import {
  phoneRegExp,
  emailRegExp,
  passwordRegExp,
  passwordmessage,
} from "../../../shared/utils/regex";
const ProfilePhotoUplaoder = dynamic(
  () => {
    return import(
      "../../../shared/data/common/fileuploads/profilephotouploader"
    );
  },
  { ssr: false }
);
import dynamic from "next/dynamic";
import { FilePath } from "../../../shared/data/common/fileuploads/filepath";

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "50px",
  },
  imageWrapper: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #ccc",
    cursor: "pointer",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
};


const Index = () => {
  const dispatch = useDispatch();
  const formikRef = useRef(null);
  const changePasswordSucc = useSelector(
    (state) => state?.user?.changePasswordSucc
  );
  const getProfileSucc = useSelector(
    (state) => state?.user?.getProfileSucc?.data
  );
  const changeProfileSucc = useSelector(
    (state) => state?.user?.changeProfileSucc
  );
  const SaveOfProfile = useSelector((state) => state?.user?.addProfileData);
  const SaveOfProfilepass = useSelector(
    (state) => state?.user?.changeProfilepass
  );
  const errorData = useSelector((state) => state?.user?.error);
  const setLocalData = useSelector((state) => state?.localData?.setLocalData);
  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData
  );
  const saveUserImageRes = useSelector(
    (state) => state?.user?.saveUserImageRes
  );

  const [tabIndex, setTabIndex] = useState("tab1");
  const { t } = useTranslation();
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");
  const [showpassIcon2, setPassicon2] = useState("fe fe-eye-off");
  const [showpassIcon3, setPassicon3] = useState("fe fe-eye-off");
  const [profileImage, setProfileImage] = useState(null); 
  const [uploadedFile, setUploadedFile] = useState({});
  const profile_path = FilePath.profile;
  const ismulti = false;
  console.log("profileImage", profileImage);
  useEffect(() => {
    dispatch(getProfile());
  }, []);

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

  let navigate = useRouter();
  const signOut = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const usertype = user?.usertype;

    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("menus");
    localStorage.clear();

    if (usertype == "Admin") {
      navigate.replace("/admin-login", "", { shallow: true });
    } else {
      navigate.replace("/", "", { shallow: true });
    }
  };

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

  useEffect(() => {
    if (changeProfileSucc?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {changeProfileSucc?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearChangeProfile());
      dispatch(getProfile()); 
    }
  }, [changeProfileSucc]);

  console.log("changeProfileSucc", changeProfileSucc);
  useEffect(() => {
    if (setLocalData) {
      dispatch(getLocalStorageData("user"));
    }
  }, [setLocalData]);

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
    oldPassword: "",
  });

  const schema = yup.object().shape({
    oldPassword: yup
      .string()
      .required("Please enter the old password")
      .min(8, "Password must be at least 8 characters")
      .matches(
        passwordRegExp,
        "The old password is incorrect. "
      ),
    password: yup
      .string()
      .required("Please enter the password")
      .min(8, "Password must be at least 8 characters")
      .matches(
        passwordRegExp,
        "Invalid Password. Please check note"
      ),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Please enter the confirm password"),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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

  useEffect(() => {
    if (SaveOfProfile?.statusCode) {
      dispatch(getListOfUser());
    }
  }, [SaveOfProfile]);

  useEffect(() => {
    if (SaveOfProfilepass?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {SaveOfProfilepass?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      setPasswordData({
        password: "",
        confirmPassword: "",
        oldPassword: "",
      });
    }
  }, [SaveOfProfilepass]);

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

  const userType = getProfileSucc?.usertype;

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstname: getProfileSucc?.firstname || "",
      lastname: getProfileSucc?.lastname || "",
      email: getProfileSucc?.email || "",
      mobile: getProfileSucc?.mobile || "",
      organization: getProfileSucc?.organization || "",
      address: getProfileSucc?.address || "",
      profile_url: getProfileSucc?.profile || "",
    },

    validationSchema: yup.object().shape({
      firstname: yup
        .string()
        .required("Required")
        .max(20, "First name should not exceed 20 characters")
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
        )
        .max(20, "Last name should not exceed 20 characters"),

      email: yup
        .string()
        .required("Required")
        .matches(
          emailRegExp,
          "Invalid email format - no spaces are allowed"
        )
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

      organization:
        userType === "Instructor"
          ? yup
              .string()
              .required("Required")
              .min(3, "Organization name should be at least 3 characters")
              .max(50, "Organization name must not exceed 50 characters")
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
              )
          : yup.string(),

      address:
        userType === "Instructor"
          ? yup
              .string()
              .required("Required")
              .min(5, "Address should be at least 5 characters")
              .max(200, "Address should not exceed 200 characters")
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
              })
          : yup.string(),
    }),

    onSubmit: (data) => {
      try {
        let payload1;

        payload1 = {
          firstname: data?.firstname,
          lastname: data?.lastname,
          email: data?.email,
          mobile: data?.mobile,
          organization:
            userType === "Instructor" ? data?.organization : undefined,
          address: userType === "Instructor" ? data?.address : undefined,
          profile: formValidation.values?.profile_url,
        };


        dispatch(changeProfile(payload1));
      } catch (error) {
        console.error("Error submitting the form:", error);
      }
    },
  });
  useEffect(() => {
    if (getProfileSucc) {
      dispatch(setLocalStorageData("user", getProfileSucc)); 
      dispatch(getLocalStorageData("user"));
    }
  }, [getProfileSucc]);

     const handleUpload = (name = '', files = '', flag = '') => {
          const allFilePaths = files.map((f) => f.file);
          if(allFilePaths[0]){
              const payload = {
                  profile:allFilePaths[0],
              };
              dispatch(saveUserImage(payload));
          }else{
              toast.error(
                  <p className="mx-2 tx-16 d-flex align-items-center mb-0">Oops! Something went wrong. Please try again later.</p>,
                  {
                      position: toast.POSITION.TOP_RIGHT,
                      hideProgressBar: true,
                      theme: "colored",
                  }
              );
          }
          
      };

  useEffect(() => {
    if (saveUserImageRes && saveUserImageRes.statusCode === 200) {
      setProfileImage(null);
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
  const [image, setImage] = useState(null);
  const fileInputRef = useRef();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);

    const formData = new FormData();
    formData.append("image", file);
    console.log("imageimage", file);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <Seo title="Profile" />
      <ToastContainer />
      <Tab.Container
        id="center-tabs-example"
        defaultActiveKey="first"
        className="bg-gray-100"
      >
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <Tab.Container id="left-tabs-example" activeKey={`${tabIndex}`}>
                <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                  <Nav className="d-flex justify-content-between align-items-center panel-body tabs-menu-body pills bd-b pb-0 bg-white">
                    <div className="d-flex align-items-center">
                      <Nav.Item>
                        <Nav.Link
                          eventKey="tab1"
                          onClick={(e) => {
                            setTabIndex("tab1");
                          }}
                        >
                          Update Profile
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          eventKey="tab6"
                          onClick={(e) => {
                            setTabIndex("tab6");
                          }}
                        >
                          Change Password
                        </Nav.Link>
                      </Nav.Item>
                    </div>
                    <div className="ms-2 text-end">
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => {
                          navigate.push("/dashboard");
                        }}
                      >
                        <i className="fe fe-arrow-left"></i>
                      </Button>
                    </div>
                  </Nav>
                </Row>

                <Tab.Content className="mt-4">
                  {tabIndex == "tab1" && (
                    <Tab.Pane eventKey="tab1" className="p-0">
                      <Col md={12} className="mg-b-10">
                        <Form
                          noValidate
                          onSubmit={(e) => {
                            e.preventDefault();
                            formValidation.handleSubmit();
                            return false;
                          }}
                        >
                          <Row>
                            <Col md={8}>
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
                                    Email Address{" "}
                                    <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="email"
                                    autoComplete="off"
                                    placeholder="Enter Email Address"
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

                                  {/* 🔹 Conditional Fields */}
                          {userType === "Instructor" && (
                            <>
                              
                                <Form.Group as={Col} md="6" className="mb-3">
                                  <Form.Label>
                                    Organization
                                    <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="organization"
                                    autoComplete="off"
                                    value={formValidation.values.organization}
                                    onChange={formValidation.handleChange}
                                    placeholder="Enter Organization"
                                    isValid={
                                      formValidation.touched.organization &&
                                      !formValidation.errors.organization
                                    }
                                    isInvalid={
                                      formValidation.touched.organization &&
                                      formValidation.errors.organization
                                    }
                                  />
                                  <Form.Control.Feedback type="invalid">
                                    {formValidation.errors.organization}
                                  </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group as={Col} md="6" className="mb-3">
                                  <Form.Label>
                                    Address{" "}
                                    <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    name="address"
                                    autoComplete="off"
                                    value={formValidation.values.address}
                                    onChange={formValidation.handleChange}
                                    placeholder="Enter Address"
                                    isValid={
                                      formValidation.touched.address &&
                                      !formValidation.errors.address
                                    }
                                    isInvalid={
                                      formValidation.touched.address &&
                                      formValidation.errors.address
                                    }
                                  />
                                  <Form.Control.Feedback type="invalid">
                                    {formValidation.errors.address}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              
                            </>
                          )}
                              </Row>
                            </Col>


                           

                            <Col md={4}>
                              {/* <div className="text-center mb-3">
                                                                <Form.Label className="d-block">Profile Photo</Form.Label>
                                                                <ProfileUploader
                                                                    folderpath={profile_path}
                                                                    ismulti={ismulti}
                                                                    name="image_url"
                                                                    acceptedFileTypes={['image/png', 'image/jpeg']}
                                                                    handleUpload={handleUpload}
                                                                    fetchfiles={ismulti ? (formValidation.values.image_url).split(',') : [formValidation.values.image_url]}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {formValidation.errors.image_url}
                                                                </Form.Control.Feedback>

                                                                {formValidation.values.image_url && (
                                                                    <div className="picture avatar-lg online text-center mt-3">
                                                                        <div className="rounded-circle pointer">
                                                                            <img
                                                                                alt="avatar"
                                                                                src={`${process.env.API_URL_FILEMANAGER}${formValidation.values.image_url}`}
                                                                                className="img-thumbnail"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div> */}
                              <ProfilePhotoUplaoder
                                ismulti={false}
                                folderpath={profile_path}
                                name="profile_url"
                                acceptedFileTypes={["image/jpeg"]}
                                handleUpload={handleUpload}
                                fetchfiles={[formValidation.values.profile_url]}
                                setProfileImage={(file) => {
                                  formValidation.setFieldValue(
                                    "profile_url",
                                    file
                                  );
                                  formValidation.setFieldTouched(
                                    "profile_url",
                                    true
                                  );
                                }}
                              />

                              <small className="text-warning text-center d-block mt-1">
                                Only PNG, JPG and JPEG  images are allowed.
                              </small>
                              {formValidation.touched.profile_url &&
                                formValidation.errors.profile_url && (
                                  <div className="invalid-feedback d-block text-center">
                                    {formValidation.errors.profile_url}
                                  </div>
                                )}
                            </Col>
                          </Row>

                         

                          {/* 🔹 Submit Button */}
                          <Button variant="primary" type="submit">
                            Update
                          </Button>
                        </Form>
                      </Col>
                    </Tab.Pane>
                  )}

                  {tabIndex == "tab6" && (
                    <Tab.Pane eventKey="tab6" className="p-0">
                      <div className="mt-0 mt-0 text-secondary">
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
                      <Col md={12} className="mg-b-10">
                        <Formik
                          innerRef={formikRef}
                          validationSchema={schema}
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
                              {/* Old Password */}
                              <FormGroup className="form-group">
                                <Row className="row-sm">
                                  <Col md={3}>
                                    <Form.Label>Old Password <span className="text-danger">*</span></Form.Label>
                                   
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
                                      isValid={
                                        touched.oldPassword &&
                                        !errors.oldPassword
                                      }
                                      isInvalid={
                                        touched.oldPassword &&
                                        errors.oldPassword
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const ic =
                                          showpassIcon === "fe fe-eye-off"
                                            ? "fe fe-eye"
                                            : "fe fe-eye-off";
                                        setPassicon(ic);
                                      }}
                                      className="input-group-text-pass"
                                    >
                                      <i className={`fe ${showpassIcon}`}></i>
                                    </button>
                                    <Form.Control.Feedback type="invalid">
                                      {errors.oldPassword}
                                    </Form.Control.Feedback>
                                  </Col>
                                </Row>
                              </FormGroup>

                              {/* New Password */}
                              <FormGroup className="form-group">
                                <Row className="row-sm">
                                  <Col md={3}>
                                    <Form.Label>New Password  <span className="text-danger">*</span></Form.Label>
                                   
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
                                      isValid={
                                        touched.password && !errors.password
                                      }
                                      isInvalid={
                                        touched.password && errors.password
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const ic =
                                          showpassIcon2 === "fe fe-eye-off"
                                            ? "fe fe-eye"
                                            : "fe fe-eye-off";
                                        setPassicon2(ic);
                                      }}
                                      className="input-group-text-pass"
                                    >
                                      <i className={`fe ${showpassIcon2}`}></i>
                                    </button>
                                    <Form.Control.Feedback type="invalid">
                                      {errors.password}
                                    </Form.Control.Feedback>
                                  </Col>
                                </Row>
                              </FormGroup>

                              {/* Confirm Password */}
                              <FormGroup className="form-group">
                                <Row className="row-sm">
                                  <Col md={3}>
                                    <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                                    
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
                                      isValid={
                                        touched.confirmPassword &&
                                        !errors.confirmPassword
                                      }
                                      isInvalid={
                                        touched.confirmPassword &&
                                        errors.confirmPassword
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const ic =
                                          showpassIcon3 === "fe fe-eye-off"
                                            ? "fe fe-eye"
                                            : "fe fe-eye-off";
                                        setPassicon3(ic);
                                      }}
                                      className="input-group-text-pass"
                                    >
                                      <i className={`fe ${showpassIcon3}`}></i>
                                    </button>
                                    <Form.Control.Feedback type="invalid">
                                      {errors.confirmPassword}
                                    </Form.Control.Feedback>
                                  </Col>
                                </Row>
                              </FormGroup>

                              {/* Submit Button */}
                              <FormGroup className="form-group">
                                <Row className="row-sm">
                                  <Col md={3}>
                                    <Button variant="primary" type="submit">
                                      Change Password
                                    </Button>
                                  </Col>
                                </Row>
                              </FormGroup>
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
Index.layout = "Contentlayout";
export default Index;
