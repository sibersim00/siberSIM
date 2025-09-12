import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import { addRoleDetails } from "../../../redux/slices/admin/Roles";

const FormRole = (props) => {
  const { openFlag, handleFormModal, rowValues, oneClick, handleOneClick } = props;
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState('Add');
  const [isChecked, setIsChecked] = useState(false);

  const handleToggle = () => { setIsChecked(!isChecked); };

  const schema = yup.object().shape({
    rolename: yup.string().required("Required"),
    displayname: yup.string().required("Required"),
  });

  const initialValues = {
    rolename: rowValues?.rolename ? rowValues?.rolename : "",
    description: rowValues?.description ? rowValues?.description : "",
    displayname: rowValues?.displayname ? rowValues?.displayname : "",
    default_role: rowValues?.default_role ? rowValues?.default_role : "",
  };


  useEffect(() => {
    if (rowValues) {
      setIsChecked(rowValues.isactive);
      setModalTitle(rowValues.title);
    }
  }, [rowValues]);

  const viewDemoShow = (modal) => { if (modal === false) { handleFormModal(false); } };

  const handleSubmit = (data) => {
    const payload = {
      roleid: rowValues?.roleid,
      rolename: data.rolename,
      description: data.description,
      displayname: data.displayname,
      status: isChecked ? 'true' : "false",
    };
    dispatch(addRoleDetails(rowValues?.roleid, payload));
    handleOneClick(true);

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
                <Modal.Header closeButton onClick={() => { viewDemoShow(false); }} >
                  <Modal.Title>{modalTitle} Role</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Row>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>Role Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="rolename"
                        autoComplete="off"
                        value={values.rolename}
                        onChange={handleChange}
                        placeholder="Enter Role Name"
                        isValid={
                          touched.rolename && !errors.rolename
                        }
                        isInvalid={
                          touched.rolename && errors.rolename
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.rolename}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>Display Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="displayname"
                        autoComplete="off"
                        value={values.displayname}
                        onChange={handleChange}
                        placeholder="Enter Display Name"
                        isValid={
                          touched.displayname && !errors.displayname
                        }
                        isInvalid={
                          touched.displayname && errors.displayname
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.displayname}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>Role Description</Form.Label>
                      <Form.Control
                        type="text"
                        as="textarea"
                        rows={3}
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        placeholder="Enter Role Description"
                      />
                    </Form.Group>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    ></Form.Group>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-0"
                    >
                      {/* Show Status toggle only if default_role is NOT Yes */}
                      {rowValues?.default_role !== "Yes" && (
                        <div className="form-group">
                          <Form.Label>Status</Form.Label>
                          <label className="custom-switch">
                            <input
                              type="checkbox"
                              name="custom-switch-checkbox1"
                              className="custom-switch-input"
                              checked={isChecked}
                              onChange={handleToggle}
                            />
                            <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                          </label>
                        </div>
                      )}
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

export default FormRole;
