import React, { Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import { addLicenseDetails } from "../../../redux/slices/customers/customer.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomerLicenseAdd = (props) => {
  const {
    openFlag,
    handleFormModal,
    rowValues,
    oneClick,
    handleOneClick,
    licenseData,
  } = props;

  const dispatch = useDispatch();

  useEffect(() => {
    if (openFlag) {
      handleOneClick(false);
    }
  }, [openFlag]);

const y_m_d = (date) => {
  const d = new Date(date);
  return (
    d.getFullYear() +
    "-" +
    ("0" + (d.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + d.getDate()).slice(-2)
  );
};

  const schema = yup.object().shape({
    sim_user_count: yup.number().required("Required"),
    start_date: yup.date().required("Required"),
    expiry_date: yup.date().required("Required"),
    domain_url: yup.string().required("Required"),
  });

  const initialValues = {
    sim_user_count: "",
    start_date:
      licenseData && licenseData.length > 0
        ? (() => {
            const maxDate = new Date(
              Math.max(
                ...licenseData
                  .filter((r) => r.expiry_date)
                  .map((r) => new Date(r.expiry_date))
              )
            );
            maxDate.setDate(maxDate.getDate() + 1); // add +1 day
            return maxDate;
          })()
        : new Date(),
    expiry_date: "",
    domain_url: "",
  };

  const handleSubmit = (data) => {
    const payload = {
      customer_id: rowValues?.customer_id,
      sim_user_count: Number(data.sim_user_count),
      start_date: data.start_date ? y_m_d(data.start_date) : null,
      expiry_date: data.expiry_date ? y_m_d(data.expiry_date) : null,
      domain_url: data.domain_url.trim(),
    };
    handleOneClick(true);
    dispatch(addLicenseDetails(payload));
  };

  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static" size="lg">
        <Formik
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({
            handleSubmit,
            handleChange,
            values,
            touched,
            errors,
            setFieldValue,
            setFieldTouched,
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Header closeButton onClick={() => handleFormModal(false)}>
                <Modal.Title>Add Customer License</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <Row>
                  {/* START DATE */}
                  <Form.Group as={Col} md="6" className="mb-4">
                    <Form.Label>
                      Start Date <span className="text-danger">*</span>
                    </Form.Label>

                    <DatePicker
                      selected={
                        values.start_date ? new Date(values.start_date) : null
                      }
                      onChange={(date) => {
                        setFieldValue("start_date", date);
                        setFieldValue("expiry_date", ""); // reset end date on change
                      }}
                      className={`form-control ${
                        touched.start_date && errors.start_date
                          ? "is-invalid"
                          : ""
                      }`}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select start date"
                      onKeyDown={(e) => e.preventDefault()}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />

                    {touched.start_date && errors.start_date && (
                      <div className="invalid-feedback d-block">
                        {errors.start_date}
                      </div>
                    )}

                    {touched.start_date && errors.start_date && (
                      <div className="invalid-feedback d-block">
                        {errors.start_date}
                      </div>
                    )}
                  </Form.Group>

                  {/* END DATE */}
                  <Form.Group as={Col} md="6" className="mb-4">
                    <Form.Label>
                      End Date <span className="text-danger">*</span>
                    </Form.Label>
                    <DatePicker
                      selected={
                        values.expiry_date ? new Date(values.expiry_date) : null
                      }
                      onChange={(date) => {
                        setFieldValue("expiry_date", date);
                      }}
                      onKeyDown={(e) => e.preventDefault()}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className={`form-control ${
                        touched.expiry_date && errors.expiry_date
                          ? "is-invalid"
                          : ""
                      }`}
                      placeholderText="Select end date"
                      dateFormat="dd-MM-yyyy"
                      minDate={
                        values.start_date ? new Date(values.start_date) : null
                      }
                    />

                    {touched.expiry_date && errors.expiry_date && (
                      <div className="invalid-feedback d-block">
                        {errors.expiry_date}
                      </div>
                    )}

                  </Form.Group>

                  {/* Domain URL */}
                  <Form.Group as={Col} md="6" className="mb-5">
                    <Form.Label>
                      Domain URL <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="domain_url"
                      placeholder="Enter Domain URL"
                      value={values.domain_url}
                      onChange={handleChange}
                      isInvalid={touched.domain_url && errors.domain_url}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.domain_url}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Counts */}
                  <Form.Group as={Col} md="6" className="mb-5">
                    <Form.Label>
                      User Scenario Limit <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="sim_user_count"
                      placeholder="Enter User Scenario Limit"
                      value={values.sim_user_count}
                      onChange={handleChange}
                      isInvalid={
                        touched.sim_user_count && errors.sim_user_count
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.sim_user_count}
                    </Form.Control.Feedback>
                  </Form.Group>

                </Row>
              </Modal.Body>

              <Modal.Footer>
                {oneClick ? (
                  <Button disabled>
                    <Spinner animation="grow" size="sm" /> Loading...
                  </Button>
                ) : (
                  <Button type="submit" variant="primary">
                    Save
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => handleFormModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Fragment>
  );
};

export default CustomerLicenseAdd;
