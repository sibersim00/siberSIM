import React, { Fragment, useEffect, useState, useRef } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Form,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as yup from "yup";
import Select from "react-select";
import DatePicker from "react-datepicker";

import {
  getScenarioList,
  saveEvent,
  updateEvent,
} from "../../redux/slices/event/eventsManage";

const EventModal = (props) => {
  const { openFlag, addhandleFormModal, rowValues, oneClick, handleOneClick } =
    props;
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const [selectedDate, setSelectedDate] = useState(null);
  const datePickerRef = useRef(null);

  const {
    hasGetScenarioListSuccess,
    getScenarioListsucc,
    hasSaveeventsSucc,
    hasUpdateeventsSucc,
  } = useSelector((state) => ({
    hasGetScenarioListSuccess: state?.eventsManage?.getScenarioListsucc?.data,
    hasSaveeventsSucc: state?.eventsManage?.succsaveEvent,
    hasUpdateeventsSucc: state?.eventsManage?.updateEvent,
  }));

  console.log(
    "hasGetScenarioListSuccesshasGetScenarioListSuccess",
    hasSaveeventsSucc
  );
  const [scenarioDropdown, setscenarioDropdown] = useState([]);

  useEffect(() => {
    dispatch(getScenarioList());
  }, []);

  useEffect(() => {
    if (rowValues) {
      setModalTitle("Update");
      formValidation.setValues({
        eventid: rowValues.eventid || "",
        eventname: rowValues.eventname || "",
        eventstarttime: rowValues.eventstarttime || "",
        eventendtime: rowValues.eventendtime || "",
        eventdescription: rowValues.eventdescription || "",
        scenarioid: rowValues.scenarioid
          ? [
              {
                scenarioid: rowValues.scenarioid,
                scenariotitle: rowValues.scenariotitle,
              },
            ]
          : [],
        status: rowValues.status || "",
      });
    }
  }, [rowValues]);

  useEffect(() => {
    if (hasGetScenarioListSuccess?.length > 0) {
      const dropdownData = hasGetScenarioListSuccess.map((item) => ({
        scenarioid: item.scenarioid,
        scenariotitle: item.scenariotitle, //  use correct field
      }));

      setscenarioDropdown(dropdownData);
    }
  }, [hasGetScenarioListSuccess]);

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
      !formValidation.values[fieldName]?.length &&
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

  const validationSchema = yup.object().shape({
    scenarioid: yup
      .array()
      .min(1, "At least one Scenario is required")
      .required("Scenario is required"),

    eventname: yup
      .string()
      .required("Event Name is required")
      .max(50, "Event Name should not exceed 50 characters")
      .matches(
        /^[A-Za-z0-9\s\-_.]+$/,
        "Invalid - only alphanumeric, emojis are not allowed"
      )
      .test(
        "no-leading-trailing-spaces",
        "No leading or trailing spaces allowed",
        (value) => !/^\s|\s$/.test(value)
      ),

    eventendtime: yup
      .date()
      .required("Event End Time is required")
      .min(
        yup.ref("eventstarttime"),
        "Event End Time must be later than Event Start Time"
      )
      .typeError("End time must be a valid datetime"),

    eventstarttime: yup
      .date()
      .required("Event Start Time is required")
      .typeError("Start time must be a valid datetime"),

    eventdescription: yup
      .string()
      .required("Event Description is required")
      .max(300, "Description should not exceed 300 characters")
      .test(
        "no-leading-trailing-spaces",
        "No leading or trailing spaces allowed",
        (value) => !/^\s|\s$/.test(value)
      )
      .test("no-emoji", "Emojis are not allowed", (value) => {
        return !/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/.test(
          value || ""
        );
      }),
  });
  console.log("rowValues++++++++++++++", rowValues);

  function formatDateToISTString(dateObj) {
    if (!dateObj) return null;

    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in ms
    const istDate = new Date(dateObj.getTime() + istOffset);

    const pad = (n) => (n < 10 ? "0" + n : n);
    const year = istDate.getUTCFullYear();
    const month = pad(istDate.getUTCMonth() + 1);
    const date = pad(istDate.getUTCDate());
    const hours = pad(istDate.getUTCHours());
    const minutes = pad(istDate.getUTCMinutes());
    const seconds = pad(istDate.getUTCSeconds());

    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
  }

  const formValidation = useFormik({
    initialValues: {
      eventid: rowValues?.eventid || "",
      eventname: rowValues?.eventname || "",
      eventstarttime:
        rowValues?.eventstarttime &&
        !isNaN(Date.parse(rowValues.eventstarttime))
          ? new Date(rowValues.eventstarttime)
          : null,
      eventendtime:
        rowValues?.eventendtime && !isNaN(Date.parse(rowValues.eventendtime))
          ? new Date(rowValues.eventendtime)
          : null,
      eventdescription: rowValues?.eventdescription || "",
      scenarioid: rowValues?.scenarioid
        ? [
            {
              scenarioid: rowValues.scenarioid,
              scenariotitle: rowValues.scenariotitle,
            },
          ]
        : [],
    },
    validationSchema,
    onSubmit: (values) => {
      console.log("valuesvalues", values);

      const payload = {
        eventid: values.eventid || null,
        eventname: values.eventname,
        eventstarttime: formatDateToISTString(values.eventstarttime),
        eventendtime: formatDateToISTString(values.eventendtime),
        eventdescription: values.eventdescription,
        scenarioid: values.scenarioid?.[0]?.scenarioid || null,
      };

      handleOneClick(true);

      if (values?.eventid) {
        dispatch(updateEvent(payload));
      } else {
        dispatch(saveEvent(payload));
      }
    },
  });
  console.log("formValidationformValidation", formValidation);
  // Update the form values when rowValues changes
  useEffect(() => {
    if (rowValues) {
      setModalTitle("Update");
      formValidation.setValues({
        eventid: rowValues.eventid || "",
        eventname: rowValues.eventname || "",
        eventstarttime:
          rowValues.eventstarttime &&
          !isNaN(Date.parse(rowValues.eventstarttime))
            ? new Date(rowValues.eventstarttime)
            : null,
        eventendtime:
          rowValues.eventendtime && !isNaN(Date.parse(rowValues.eventendtime))
            ? new Date(rowValues.eventendtime)
            : null,
        eventdescription: rowValues.eventdescription || "",
        scenarioid: rowValues.scenarioid
          ? [
              {
                scenarioid: rowValues.scenarioid,
                scenariotitle: rowValues.scenariotitle,
              },
            ]
          : [],
        status: rowValues.status || "",
      });
    }
  }, [rowValues]);
  const startDate = formValidation.values.eventstarttime
    ? new Date(formValidation.values.eventstarttime)
    : null;

  const endDate = formValidation.values.eventendtime
    ? new Date(formValidation.values.eventendtime)
    : null;


  const minEndDate = startDate || new Date(0);



  const selectedEndDate = endDate || minEndDate;

  const isSameDay =
    startDate &&
    selectedEndDate &&
    startDate.toDateString() === selectedEndDate.toDateString();

  const minTime = isSameDay
    ? startDate
    : new Date(selectedEndDate.setHours(0, 0, 0, 0));

  const maxTime = new Date(selectedEndDate);
  maxTime.setHours(23, 59, 59, 999);

  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static" size="lg">
        <Modal.Header closeButton onClick={() => addhandleFormModal(false)}>
          <Modal.Title>{modalTitle} Event</Modal.Title>
        </Modal.Header>
        <Form noValidate onSubmit={formValidation.handleSubmit}>
          <Modal.Body>
            <Row>
              {/* Event Name */}
              <Form.Group as={Col} md="12" className="mb-3">
                <Form.Label>
                  Event Name<span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="eventname"
                  autoComplete="off"
                  placeholder="Enter Event Name"
                  value={formValidation.values.eventname}
                  onChange={formValidation.handleChange}
                  isInvalid={
                    formValidation.touched.eventname &&
                    formValidation.errors.eventname
                  }
                />
                <Form.Control.Feedback type="invalid">
                  {formValidation.errors.eventname}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                as={Col}
                md={6}
                controlId="event_time"
                className="mb-3 dbpicker"
              >
                <Form.Label>
                  Event Start Date & Time <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <DatePicker
                    selected={formValidation.values.eventstarttime}
                    onChange={(date) => {
                      setSelectedDate(date);
                      formValidation.setFieldValue("eventstarttime", date);
                    }}
                    showTimeSelect
                    dateFormat="dd MM yyyy HH:mm:ss"
                    placeholderText="Select Event Date & Time"
                    minDate={new Date()} //  restricts date to today and future
                    minTime={
                      formValidation.values.eventstarttime &&
                      new Date(
                        formValidation.values.eventstarttime
                      ).toDateString() === new Date().toDateString()
                        ? new Date()
                        : new Date(0, 0, 0, 0, 0)
                    } // only restrict time if selected date is today
                    maxTime={new Date(0, 0, 0, 23, 59)}
                    name="eventstarttime"
                    autoComplete="off"
                    customInput={
                      <div style={{ position: "relative", width: "100%" }}>
                        <input
                          className={
                            formValidation.errors.eventstarttime &&
                            formValidation.touched.eventstarttime &&
                            !formValidation.values.eventstarttime
                              ? "red-field is-invalid form-control"
                              : "form-control"
                          }
                          value={
                            formValidation.values.eventstarttime
                              ? new Date(
                                  formValidation.values.eventstarttime
                                ).toLocaleString(undefined, {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: false, // key option for 24-hour format
                                })
                              : ""
                          }
                          placeholder="Select Event Date & Time" //manually set placeholder
                          readOnly
                        />

                        <div
                          className="ic d-inline pd-10 ht-38"
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            // Trigger calendar open by clicking the hidden input inside custom input
                            e.currentTarget.parentElement
                              .querySelector("input")
                              .click();
                          }}
                        >
                          <i className="fe fe-calendar"></i>
                        </div>
                      </div>
                    }
                  />
                </InputGroup>

                {formValidation.errors.eventstarttime &&
                  formValidation.touched.eventstarttime &&
                  !formValidation.values.eventstarttime && (
                    <div className="invalid-tooltiped">
                      {formValidation.errors.eventstarttime}
                    </div>
                  )}
              </Form.Group>

              <Form.Group
                as={Col}
                md={6}
                controlId="event_time"
                className="mb-3 dbpicker"
              >
                <Form.Label>
                  Event End Date & Time <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <DatePicker
                    selected={formValidation.values.eventendtime}
                    onChange={(date) => {
                      setSelectedDate(date);
                      formValidation.setFieldValue("eventendtime", date);
                    }}
                    showTimeSelect
                    dateFormat="dd MM yyyy HH:mm:ss"
                    placeholderText="Select Event Date & Time"
                    minDate={minEndDate}
                    minTime={minTime}
                    maxTime={maxTime}
                    name="eventendtime"
                    autoComplete="off"
                    customInput={
                      <div style={{ position: "relative", width: "100%" }}>
                        <input
                          className={
                            formValidation.errors.eventendtime &&
                            formValidation.touched.eventendtime &&
                            !formValidation.values.eventendtime
                              ? "red-field is-invalid form-control"
                              : "form-control"
                          }
                          value={
                            formValidation.values.eventendtime
                              ? new Date(
                                  formValidation.values.eventendtime
                                ).toLocaleString(undefined, {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: false, // key option for 24-hour format
                                })
                              : ""
                          }
                          placeholder="Select Event Date & Time" // Set manually
                          readOnly
                        />

                        <div
                          className="ic d-inline pd-10 ht-38"
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            // Find the hidden input and click it to open calendar
                            e.currentTarget.parentElement
                              .querySelector("input")
                              .click();
                          }}
                        >
                          <i className="fe fe-calendar"></i>
                        </div>
                      </div>
                    }
                  />
                </InputGroup>

                {formValidation.errors.eventendtime &&
                  formValidation.touched.eventendtime &&
                  !formValidation.values.eventendtime && (
                    <div className="invalid-tooltiped">
                      {formValidation.errors.eventendtime}
                    </div>
                  )}
              </Form.Group>

              {/* Scenario Dropdown */}
              <Form.Group as={Col} md="12" className="mb-3">
                <Form.Label>
                  Scenario<span className="text-danger">*</span>
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
                  name="scenarioid"
                  styles={getSelectStyles("scenarioid")}
                  value={formValidation.values.scenarioid[0] || null}
                  options={scenarioDropdown}
                  getOptionLabel={(x) => x.scenariotitle}
                  getOptionValue={(x) => x.scenarioid}
                  placeholder="Select Scenario"
                  onChange={(e) => {
                    formValidation.setFieldValue("scenarioid", [e]);
                  }}
                  menuPosition="fixed"
                />
                <div
                  className="text-danger mt-1"
                  style={{ fontSize: "0.875rem" }}
                >
                  {formValidation.touched.scenarioid &&
                    formValidation.errors.scenarioid}
                </div>
              </Form.Group>

              {/* Event Description */}
              <Form.Group as={Col} md="12" className="mb-3">
                <Form.Label>
                  Event Description<span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="eventdescription"
                  autoComplete="off"
                  placeholder="Enter Event Description"
                  value={formValidation.values.eventdescription}
                  onChange={formValidation.handleChange}
                  isInvalid={
                    formValidation.touched.eventdescription &&
                    formValidation.errors.eventdescription
                  }
                />
                <Form.Control.Feedback type="invalid">
                  {formValidation.errors.eventdescription}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            {oneClick ? (
              <Button variant="primary" disabled>
                <Spinner animation="grow" size="sm" /> Loading...
              </Button>
            ) : (
              <Button variant="primary" type="submit">
                {modalTitle === "Add" ? "Submit" : "Update"}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => addhandleFormModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Fragment>
  );
};

export default EventModal;
