import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button, Row, Col, Form, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import { saveCategories, updateCategories } from "../../redux/slices/component/categories";
import { error, regex } from '../common/vaidationMessage/formValidationMsg'
import "../../utils/i18n";
import { useTranslation } from "react-i18next";
import { emojiRegex } from "../../utils/regex";
import dynamic from "next/dynamic";

const FileUploader = dynamic(() => import("../../data/common/fileuploads/fileuploader"), { ssr: false });
import { FilePath } from "../../data/common/fileuploads/filepath";
import dummy_network from "../../../public/assets/img/dummy.jpg";


const FormComponentCategory = (props) => {
  const { openFlag, handleFormModal, rowValues, oneClick, handleOneClick } = props;
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState('Add');
  const [isChecked, setIsChecked] = useState(false);
  const category_path = FilePath.component_categories;
  const ismulti = false;

  const { t, i18n } = useTranslation();
  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };

  const schema = yup.object().shape({
    parentcategoryname: yup.string().trim().required(error?.required).matches(regex?.alphaHyphenSpacesRegex, error?.onlyAlphaHyphenSpace).min(3, "Component Category must be at least 3 characters").max(30, "Component Category should not exceed 30 characters"),
    description: yup
      .string()
      .test("no-emoji", "Emojis are not allowed", noEmojiTest),
    categoryimage: yup
      .string()
      .required("Required")


  });

  const initialValues = {
    parentcategoryname: rowValues?.parentcategoryname,
    description: rowValues?.description,
    categoryimage: rowValues?.categoryimage || '',
  };
  useEffect(() => {
    if (rowValues) {
      setIsChecked(rowValues.isactive);
      setModalTitle(rowValues.title);
    }
  }, [rowValues]);

  const viewDemoShow = (modal) => { if (modal === false) { handleFormModal(false); } };


  const handleSubmit = (data) => {


    const Id = rowValues?.componentcategoryid;

    if (rowValues?.componentcategoryid == 0) {
      const payload = {
        name: data.parentcategoryname,
        description: data.description ? data.description.trim() : '',
        categoryimage: data.categoryimage !== undefined ? data.categoryimage : rowValues?.categoryimage,

      };
      dispatch(saveCategories(payload));
      handleOneClick(true)
    } else {
      const payload = {
        componentcategoryid: Id,
        name: data.parentcategoryname,
        description: data.description ? data.description.trim() : '',
        categoryimage: data.categoryimage,

      };
      dispatch(updateCategories(payload, Id));
      handleOneClick(true)
    }
  };
  const handleUpload = (setFieldValue) => (name = "", files = [], flag = "") => {
    setFieldValue("flag", flag); // If you need this

    const singleFile = files[0]?.file || "";
    setFieldValue(name, singleFile);
    setUploadedFile(singleFile);
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
              setFieldValue
            }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Modal.Header>
                  <Modal.Title>{modalTitle} Component Category</Modal.Title>
                  <i
                    className="fas fa-close fs-18"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      viewDemoShow(false);
                    }}
                  ></i>
                </Modal.Header>
                <Modal.Body>
                  <Row>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label> Component Category <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        autoComplete="off"
                        name="parentcategoryname"
                        value={values.parentcategoryname}
                        onChange={handleChange}
                        placeholder="Enter Component Category"
                        isValid={
                          touched.parentcategoryname && !errors.parentcategoryname
                        }
                        isInvalid={
                          touched.parentcategoryname && errors.parentcategoryname
                        }
                        maxLength={40}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.parentcategoryname}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label>Description <span className="text-danger"> </span></Form.Label>
                      <Form.Control
                        type="text"
                        autoComplete="off"
                        as="textarea"
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        placeholder="Enter Description"
                        maxLength={510}
                        isValid={
                          touched.description && !errors.description
                        }
                        isInvalid={
                          touched.description && errors.description
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.description}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="categoryimage" className="d-flex flex-column mb-3">
                      <div className="position-relative">
                        <Form.Label>
                          {t("Category Image")} <span className="text-danger">*</span>
                          {rowValues?.id !== 0 && (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id={`tooltip-${rowValues.id}`}>
                                  Removing the file will permanently delete it from storage and update the record.
                                </Tooltip>
                              }
                            >
                              <i
                                className="fe fe-alert-circle"
                                style={{
                                  position: "absolute",
                                  top: "2px",
                                  right: "5px",
                                  cursor: "pointer",
                                  color: "#212122ff",
                                }}
                              ></i>
                            </OverlayTrigger>
                          )}
                        </Form.Label>

                        <FileUploader
                          folderpath={category_path}
                          ismulti={false}
                          name="categoryimage"
                          acceptedFileTypes={["image/png", "image/jpeg"]}
                          handleUpload={(name, files, flag) => {
                            setFieldValue("flag", flag); // Optional, if you need flag tracking
                            const file = files[0]?.file || "";
                            setFieldValue(name, file);
                            setUploadedFile(file);
                          }}
                          fetchfiles={values.categoryimage ? [values.categoryimage] : []}
                        />
                      </div>

                      {/* Validation Error */}
                      {touched.categoryimage && errors.categoryimage && (
                        <div className="invalid-feedback d-block">{errors.categoryimage}</div>
                      )}

                      {/* Preview */}
                      {values.categoryimage && (
                        <div className="picture avatar-lg online text-center mt-2">
                          <div className="pointer overflow-hidden">
                            <img
                              alt="Category Preview"
                              src={`${process.env.API_URL_FILEMANAGER}${values.categoryimage}`}
                              style={{
                                objectFit: "cover",
                                width: "100%",
                                height: "100%",
                              }}
                              onError={(e) => { e.target.onerror = null; e.target.src = dummy_network.src }}

                            />
                          </div>
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
                    :
                    <Button variant="primary" type="submit">
                      {t("common.submit")}
                    </Button>}
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

export default FormComponentCategory;
