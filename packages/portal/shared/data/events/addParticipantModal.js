import React, { useState, Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import * as yup from "yup";
import Select from "react-select";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import "../../../shared/utils/i18n.js";
import {
  addparticipant,
  addeventlearner,
  updateeventlearner,
} from "../../../shared/redux/slices/event/eventsManage.js";
import { getStudentList } from "../../../shared/redux/slices/common/masters.js";
import {
  phoneRegExp,
  emailRegExp,
  passwordRegExp,
  passwordmessage,
  usernamemessage,
  emojiRegex,
} from "../../utils/regex.js";
import { toast } from "react-toastify";
const AddParticipantModal = (props) => {
  const {
    openFlag,
    handleFormModal,
    rowValues,
    oneClick,
    handleOneClick,
    selectedEventId,
  } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const [isChecked, setIsChecked] = useState(false);
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");
  const [mode, setMode] = useState("existing");
  const [studentDropdown, setStudentDropdown] = useState([]);
  const {
    hasGetStudentListSucc,
    hasaddparticipants,
    hasaddLearnerEvent,
    hasupdateLearnerEvent,
    errorData,
  } = useSelector((state) => {
    return {
      errorData:
        state &&
        state.eventsManage &&
        state.eventsManage.error &&
        state.eventsManage.error,
      hasGetStudentListSucc:
        state &&
        state.commonMaster &&
        state.commonMaster.getStudentListData.data,
      hasaddparticipants:
        state && state.eventsManage && state.eventsManage.getaddparticipants,
      hasaddLearnerEvent:
        state && state.eventsManage && state.eventsManage.getaddLearnerEvent,
      hasupdateLearnerEvent:
        state && state.eventsManage && state.eventsManage.getupdateparticipants,
    };
  });

  useEffect(() => {
    if (
      rowValues &&
      !Array.isArray(rowValues) &&
      Object.keys(rowValues).length > 0
    ) {
      setIsChecked(rowValues.isactive);
      setModalTitle("Update");
      setMode("new");
    } else {
      setModalTitle("Add");
      setMode("existing");
    }
  }, [rowValues]);

  useEffect(() => {
    const payload = {
      eventid: selectedEventId,
    };
    dispatch(getStudentList(payload));
  }, []);

  const viewDemoShow = (modal) => {

    if (modal === false) {
      handleFormModal(false);
    }
  };

  useEffect(() => {
    if (hasaddparticipants?.statusCode == 200) {
      handleFormModal(false);
      handleOneClick(false);
    }
  }, [hasaddparticipants]);
  useEffect(() => {
    if (hasupdateLearnerEvent?.statusCode == 200) {
      handleFormModal(false);
      handleOneClick(false);
    }
  }, [hasupdateLearnerEvent]);


  useEffect(() => {
    if (hasGetStudentListSucc?.length > 0) {
      const dropdownData = hasGetStudentListSucc.map((item) => ({
        eventid: selectedEventId,
        learner_id: item.learner_id,
        Student_name: item.Student_name,
      }));

      setStudentDropdown(dropdownData);
      8;
    }
  }, [hasGetStudentListSucc]);

  const getSelectStyles = (fieldName) => {
      const error =
        !formValidation.values[fieldName] &&
        formValidation.errors[fieldName] &&
        formValidation.touched[fieldName];
  
      return {
        ...customStyles,
        control: (styles, state) => ({
          ...styles,
          borderColor: error ? "#EB5757" : styles.borderColor, // red border on error
          boxShadow: error ? "0 0 0 0.001rem #EB5757" : styles.boxShadow,
          backgroundColor: "var(--dark-bg-color)", // dark background
        }),
        singleValue: (provided) => ({
          ...provided,
          color: "var(--light-text-color)", // selected value text
        }),
        input: (provided) => ({
          ...provided,
          color: "var(--light-text-color)", // text while typing
        }),
      };
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
      team_name: rowValues?.team_name || "",
      team_description: rowValues?.team_description || "",
      learner_id: [],
      eventlearnerid: rowValues?.eventlearnerid,
    },

    validationSchema: yup.lazy(() => {
      if (mode === "existing") {
        return yup.object().shape({
          firstname: yup.string().notRequired(),
          lastname: yup.string().notRequired(),
          email: yup.string().notRequired(),
          mobile: yup.string().notRequired(),
          password: yup.string().notRequired(),
          username: yup.string().notRequired(),
          learner_id: yup
            .array()
            .of(
              yup.object().shape({
                learner_id: yup.string().required("SIMUser is required"),
              })
            )
            .min(1, "Required"),
          team_name: yup
            .string()
            .required("Required")
            .matches(
              /^(?=.*[a-zA-Z])[a-zA-Z0-9 ]+$/,
              "Invalid - only alphanumeric characters and spaces are allowed"
            )
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
            ),

          team_description: yup
            .string()
            .required("Required")
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
            ),
        });
      } else {
        return yup.object().shape({
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
              (value) => !/^\s|\s$/.test(value)
            ),
          lastname: yup
            .string()
            .max(30, "Last name should not exceed 30 characters")
            .matches(
              "^[A-Za-z.]+(?:[ ][A-Za-z.]+)*$",
              "Invalid - only alphabetical - no spaces are allowed"
            )
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
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
            .matches(phoneRegExp, "Invalid - minimum 8 digits required")
            .min(8, "Invalid - minimum 8 digits required")
            .max(10, "Invalid - maximum 10 digits required"),
          username: yup
            .string()
            .required("Required")
            .matches(
              /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/,
              "Invalid Username. Please check info"
            )
            .max(30, "Username should not exceed 30 characters")
            .min(5, "Username should be minimum 5 characters")
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
            ),

          password: yup.string().when([], {
            is: () => modalTitle === "Add",
            then: (schema) =>
              schema
                .required("Required")
                .min(8, "Password must be at least 8 characters")
                .max(20, "Password should not exceed 20 characters")
                .matches(passwordRegExp, "Invalid Password. Please check info")
                .test(
                  "no-leading-trailing-spaces",
                  "No leading or trailing spaces allowed",
                  (value) => !/^\s|\s$/.test(value)
                ),
            otherwise: (schema) =>
              schema
                .notRequired()
                .min(8, "Password must be at least 8 characters")
                .max(20, "Password should not exceed 20 characters")
                .matches(passwordRegExp, "Invalid Password. Please check info")
                .test(
                  "no-leading-trailing-spaces",
                  "No leading or trailing spaces allowed",
                  (value) => (value ? !/^\s|\s$/.test(value) : true)
                ),
          }),

          team_name: yup
            .string()
            .required("Required")
            .matches(
              /^(?=.*[a-zA-Z])[a-zA-Z0-9 ]+$/,
              "Invalid - only alphanumeric characters and spaces are allowed"
            )
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value)
            ),
          team_description: yup
            .string()
            .required("Required")
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => {
                return !/^\s|\s$/.test(value);
              }
            ),

          learner_id: yup.array().notRequired(),
        });
      }
    }),

    onSubmit: (data) => {
     
      handleOneClick(true); // disable submit

      try {
        let payload;

        if (mode === "existing") {
          payload = {
            learner_id: data.learner_id[0]?.learner_id,
            eventid: selectedEventId,
            team_name: data.team_name,
            team_description: data.team_description,
            eventlearnerid: data.eventlearnerid,
          };

          if (modalTitle === "Add") {
            dispatch(addeventlearner(payload));
          } else if (modalTitle === "Update") {
            dispatch(updateeventlearner(payload));
          }

          //Don't close modal here
          handleFormModal(false);
          handleOneClick(false);
          return;
        } else {
          if (modalTitle === "Add") {
            payload = {
              firstname: data.firstname,
              lastname: data.lastname,
              email: data.email,
              mobile: data.mobile,
              password: data.password,
              username: data.username,
              team_name: data.team_name,
              team_description: data.team_description,
              eventid: selectedEventId,
              eventlearnerid: data.eventlearnerid,
            };
            dispatch(addparticipant(payload));
          } else if (modalTitle === "Update") {
            payload = {
              learner_id: rowValues?.learner_id,
              firstname: data.firstname,
              lastname: data.lastname,
              email: data.email,
              mobile: data.mobile,
              username: data.username,
              team_name: data.team_name,
              team_description: data.team_description,
              eventlearnerid: data.eventlearnerid,
              eventid: selectedEventId,
            };
            dispatch(updateeventlearner(payload));
          }
        }
      } catch (error) {
        console.error("Error submitting the form:", error);
        handleOneClick(false);
      }
    },
  });

  useEffect(() => {
    if (modalTitle === "Add") {
      if (mode === "existing") {
        formValidation.resetForm({
          values: {
            firstname: "",
            lastname: "",
            email: "",
            mobile: "",
            password: "",
            username: "",
            team_name: "",
            team_description: "",
            learner_id: [],
            eventlearnerid: rowValues?.eventlearnerid,
          },
        });
      } else if (mode === "new") {
        formValidation.resetForm({
          values: {
            firstname: "",
            lastname: "",
            email: "",
            mobile: "",
            password: "",
            username: "",
            team_name: "",
            team_description: "",
            learner_id: [],
            eventlearnerid: rowValues?.eventlearnerid,
          },
        });
      }
    }
  }, [mode]);

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
            <Modal.Title>
              {modalTitle === "Update"
                ? "Update Participant"
                : `${modalTitle} Participant`}
            </Modal.Title>
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
                {modalTitle !== "Update" && (
                  <Row className="mb-3">
                    <Col>
                      <Form.Check
                        inline
                        type="radio"
                        label="Existing SIMUser"
                        id="existing"
                        checked={mode === "existing"}
                        onChange={() => setMode("existing")}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        label="Add Participant"
                        id="new"
                        checked={mode === "new"}
                        onChange={() => setMode("new")}
                      />
                    </Col>
                  </Row>
                )}

                {mode === "existing" && modalTitle !== "Update" && (
                  <>
                    <Form.Group as={Col} md="12" className="mb-3">
                      <Form.Label>
                        SIMUser <span className="text-danger">*</span>
                      </Form.Label>
                      <Select
                        theme={(theme) => ({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary25: "var(--primary-bg-color)",
                            primary: "var(--primary-bg-color)",
                          },
                        })}
                        name="learner_id"
                        styles={getSelectStyles("learner_id")}
                        value={formValidation.values.learner_id[0] || null}
                        options={studentDropdown}
                        getOptionLabel={(x) => x.Student_name}
                        getOptionValue={(x) => x.learner_id}
                        placeholder="Select SIMUser"
                        onChange={(e) => {
                          formValidation.setFieldValue("learner_id", [e]);
                        }}
                        menuPosition="fixed"
                      />
                      <div
                        className="text-danger mt-1"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {formValidation.touched.learner_id &&
                          formValidation.errors.learner_id}
                      </div>
                    </Form.Group>

                    <Form.Group as={Col} md="12" className="mb-3">
                      <Form.Label>
                        Team Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="team_name"
                        autoComplete="off"
                        placeholder="Enter Team Name"
                        value={formValidation.values.team_name}
                        onChange={formValidation.handleChange}
                        isInvalid={
                          formValidation.touched.team_name &&
                          formValidation.errors.team_name
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formValidation.errors.team_name}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group as={Col} md="12" className="mb-3">
                      <Form.Label>
                        Team Description <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="team_description"
                        autoComplete="off"
                        placeholder="Enter Team Description"
                        value={formValidation.values.team_description}
                        onChange={formValidation.handleChange}
                        isInvalid={
                          formValidation.touched.team_description &&
                          formValidation.errors.team_description
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formValidation.errors.team_description}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </>
                )}

                {(mode === "new" || modalTitle === "Update") && (
                  <>
                    <Form.Group as={Col} md="6" className="mb-3">
                      <Form.Label>
                        First Name <span className="text-danger">*</span>
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
                        type="email"
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
                      <Form.Label>Mobile Number</Form.Label>
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
                        minLength={8}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formValidation.errors.mobile}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {modalTitle === "Add" && mode === "new" && (
                      <>
                        <Form.Group as={Col} md="6" className="mb-3">
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
                            name="username"
                            autoComplete="off"
                            placeholder="Enter SIMUser Name"
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
                          className="mb-3 position-relative"
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
                                  data-bs-placement="top"
                                  data-bs-original-title="Password"
                                ></i>
                              </OverlayTrigger>
                            </span>
                          </Form.Label>

                          <Form.Control
                            type={
                              showpassIcon === "fe fe-eye" ? "text" : "password"
                            }
                            name="password"
                            autoComplete="off"
                            placeholder="Enter Password"
                            value={formValidation.values.password}
                            onChange={formValidation.handleChange}
                            isInvalid={
                              formValidation.touched.password &&
                              formValidation.errors.password
                            }
                            style={{ paddingRight: "2rem" }}
                          />

                          {/* Password Eye Icon */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextIcon =
                                showpassIcon === "fe fe-eye"
                                  ? "fe fe-eye-off"
                                  : "fe fe-eye";
                              setPassicon(nextIcon);
                            }}
                            className="input-group-text-pass"
                            style={{
                              position: "absolute",
                              top: "38px",
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
                    )}

                    <Form.Group as={Col} md="12" className="mb-3">
                      <Form.Label>
                        Team Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="team_name"
                        autoComplete="off"
                        placeholder="Enter Team Name"
                        value={formValidation.values.team_name}
                        onChange={formValidation.handleChange}
                        isInvalid={
                          formValidation.touched.team_name &&
                          formValidation.errors.team_name
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formValidation.errors.team_name}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group as={Col} md="12" className="mb-3">
                      <Form.Label>
                        Team Description <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="team_description"
                        autoComplete="off"
                        placeholder="Enter Team Description"
                        value={formValidation.values.team_description}
                        onChange={formValidation.handleChange}
                        isInvalid={
                          formValidation.touched.team_description &&
                          formValidation.errors.team_description
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formValidation.errors.team_description}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </>
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
              <Button variant="secondary" onClick={() => viewDemoShow(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Fragment>
    </>
  );
};

export default AddParticipantModal;
