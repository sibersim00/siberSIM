import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button, Row, Col, Form,Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import { addOragDetails, editOragDetails } from "../../../redux/slices/admin/Organization";

const Organisation = (props) => {
  const { openFlag, handleFormModal, rowValues,oneClick,handleOneClick } = props;
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState("Add");
  const [isChecked, setIsChecked] = useState(false);

  const handleToggle = () => {
    setIsChecked(!isChecked);
  };

  const schema = yup.object().shape({
    orgcode: yup.string().matches(/^[A-Za-z]+$/, "Please enter only alphabets").required("Required"),
    orgname: yup.string().required("Required"),
    id: yup.string()   
  });

  const initialValues = {
    orgcode: rowValues?.orgcode || "",
    orgname: rowValues?.orgname || "",
    prefix : rowValues?.empcode_prefix || "",
    id : rowValues?.id
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
    const payload = {
        orgid : rowValues?.id, 
        orgcode: data.orgcode,
        orgname: data.orgname,
        status: isChecked ? 'true' : 'false',
    };
    const Id = rowValues?.id;
    if (rowValues?.id == 0) {
      handleOneClick(true);
      dispatch(addOragDetails(payload, Id));
    } else {
      handleOneClick(true);
      dispatch(editOragDetails(payload, Id));
    }
  };

  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static">
          <Formik
            validationSchema={schema}
            onSubmit={(e) => handleSubmit(e)}
            initialValues={initialValues}
          >
            {({
              handleSubmit,
              handleChange,
              values,
              touched,
              errors,
            }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Modal.Header
                  closeButton
                  onClick={() => {
                    viewDemoShow(false);
                  }}
                >
                  <Modal.Title>{modalTitle} Organization</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Row>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Organization Code <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="orgcode"
                        autoComplete="off"
                        value={values.orgcode}
                        onChange={handleChange}
                        placeholder="Enter Organization Code"
                        isValid={touched.orgcode && !errors.orgcode}
                        isInvalid={touched.orgcode && errors.orgcode}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.orgcode}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>
                        Organization Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="orgname"
                        autoComplete="off"
                        value={values.orgname}
                        onChange={handleChange}
                        placeholder="Enter Organization Name"
                        isValid={touched.orgname && !errors.orgname}
                        isInvalid={touched.orgname && errors.orgname}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.orgname}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group
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
                  ) 
                  : (
                  <Button variant="primary" type="submit">
                  {modalTitle === "Add" ? "Submit" : "Update"}
                  </Button>)}
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

export default Organisation;
