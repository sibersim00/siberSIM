import React, { useState, Fragment, useEffect } from "react";
import { useFormik } from "formik";
import {
  Modal,
  Button,
  Row,
  Col,
  Form,
  OverlayTrigger,
  Tooltip,
  Spinner,
} from "react-bootstrap";
import * as Yup from "yup";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { emojiRegex } from "../../utils/regex";
import {
  saveSubCategories,
  updateCategories,
} from "../../redux/slices/masters/ScenarioCategories";
import {
  regex,
  error,
} from "../../data/common/vaidationMessage/formValidationMsg";
import { useDispatch, useSelector } from "react-redux";
import dummy_network from "../../../public/assets/img/dummy.jpg";

const FileUploader = dynamic(
  () => import("../../data/common/fileuploads/fileuploader"),
  { ssr: false }
);
import { FilePath } from "../../data/common/fileuploads/filepath";
import { toast } from "react-toastify";

const FormScenarioCategory = (props) => {
  const { openFlag, handleFormModal, rowValues, oneClick, handleOneClick } =
    props;
  const dispatch = useDispatch();
  const [catDropDownData, setCatDropDownData] = useState([]);
  const category_path = FilePath.scenario_categories;
  const ismulti = false;
  const [modalTitle, setModalTitle] = useState("Add");
  const { t } = useTranslation();

  const { saveSubCategoriesData, errorData } = useSelector((state) => ({
    saveSubCategoriesData: state?.scenariocategories?.saveSubCategories,
    errorData: state?.scenariocategories?.error,
  }));

  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };

  const schema = Yup.object().shape({
    categoryname: Yup.string()
      .required("required")
      .max(50, "Scenario Category should not exceed 50 characters")
      .matches(regex?.alphaHyphenSpacesRegex, error?.onlyAlphaHyphenSpace)
      .test(
        "no-leading-trailing-spaces",
        "No leading or trailing spaces allowed",
        (value) => !/^\s|\s$/.test(value)
      ),
  });

  useEffect(() => {
    if (saveSubCategoriesData?.statusCode) {
      // dispatch(saveSubCategories());
      formValidation.resetForm();
    }
  }, [saveSubCategoriesData]);

  useEffect(() => {
    if (rowValues) {
      setModalTitle(rowValues.title || "Update");
    }
  }, [rowValues]);
  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      categoryname: rowValues?.categoryname || "",
      categoryimage: rowValues?.categoryimage || "",
      categorytype: rowValues?.categorytype || "Public", // ✅ default Public
      scenariocategoryid:
        catDropDownData.find(
          (obj) => obj?.scenariocategoryid === rowValues?.scenariocategoryid
        ) || "",
    },
    validationSchema: Yup.object().shape({
      categoryname: Yup.string()
        .required(error?.required)
        .test("no-emoji", "Emojis are not allowed", noEmojiTest)
        .test(
          "no-leading-trailing-spaces",
          "No leading or trailing spaces allowed",
          (value) => !/^\s|\s$/.test(value || "")
        ),
      categoryimage: Yup.string().required(error?.required),
    }),

    onSubmit: (data) => {
      const payload = {
        ...(rowValues?.scenariocategoryid && {
          scenariocategoryid: rowValues?.scenariocategoryid,
        }),
        categoryname: data.categoryname,
        categoryimage:
          data.categoryimage !== undefined
            ? data.categoryimage
            : rowValues?.categoryimage,
        categorytype: data.categorytype || "Public", // ✅ send categorytype
      };

      handleOneClick(true);
      if (rowValues?.scenariocategoryid) {
        dispatch(updateCategories(payload));
      } else {
        dispatch(saveSubCategories(payload));
      }
    },
  });

  const handleUpload = (name = "", files = "", flag = "") => {
    formValidation.setFieldValue("flag", flag); // Set remove or update
    if (ismulti) {
      let selectedFiles = [];
      files.filter((f) => {
        selectedFiles.push(f.file);
      });
      let filesStr = selectedFiles.join(",");
      formValidation.setFieldValue(name, filesStr ? filesStr : "");
      setUploadedFile(files && files.length > 0 && filesStr ? filesStr : "");
    } else {
      formValidation.setFieldValue(name, files[0]?.file ? files[0]?.file : "");
      setUploadedFile(
        files && files.length > 0 && files[0]?.file ? files[0]?.file : ""
      );
    }
  };

  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static">
        <Form noValidate onSubmit={formValidation.handleSubmit}>
          <Modal.Header>
            <Modal.Title>{modalTitle} Scenario Category</Modal.Title>
            <i
              className="fas fa-close fs-18"
              style={{ cursor: "pointer" }}
              onClick={() => {
                formValidation.resetForm();
                setModalTitle("Add");
                handleFormModal(false);
              }}
            ></i>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Form.Group
                as={Col}
                md="12"
                controlId="validationFormik102"
                className="mb-3"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <Form.Label className="mb-0">
                    Scenario Category <span className="text-danger">*</span>
                  </Form.Label>

                  {/* ✅ Private Checkbox added */}
                  <div className="form-check form-check-inline mb-0 d-flex align-items-center">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="privateCheckbox"
                      style={{ marginTop: 0 }}
                      checked={formValidation.values.categorytype === "Private"}
                      onChange={(e) =>
                        formValidation.setFieldValue(
                          "categorytype",
                          e.target.checked ? "Private" : "Public"
                        )
                      }
                    />
                    <label
                      className="form-check-label ms-1 mb-0"
                      htmlFor="privateCheckbox"
                    >
                      Private
                    </label>
                  </div>
                </div>

                <Form.Control
                  type="text"
                  autoComplete="off"
                  name="categoryname"
                  value={formValidation.values.categoryname}
                  onChange={formValidation.handleChange}
                  placeholder="Enter Scenario Category"
                  isValid={
                    formValidation.touched.categoryname &&
                    !formValidation.errors.categoryname
                  }
                  isInvalid={
                    formValidation.touched.categoryname &&
                    !!formValidation.errors.categoryname
                  }
                />
                <Form.Control.Feedback type="invalid">
                  {formValidation.errors.categoryname}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                controlId="imageUpload"
                className="d-flex flex-column"
              >
                <div className="position-relative">
                  <Form.Label>
                    {t("Category Image")} <span className="text-danger">*</span>
                    {rowValues?.id !== 0 && (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id={`tooltip-${rowValues.id}`}>
                            Removing the file will permanently delete it from
                            storage and update the record.
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
                    ismulti={ismulti}
                    name="categoryimage"
                    acceptedFileTypes={["image/png", "image/jpeg"]}
                    handleUpload={handleUpload}
                    fetchfiles={
                      ismulti
                        ? (formValidation.values.categoryimage || "").split(",")
                        : [formValidation.values.categoryimage]
                    }
                  />
                </div>

                <Form.Control.Feedback type="invalid" className="d-block">
                  {formValidation.touched.categoryimage &&
                    formValidation.errors.categoryimage}
                </Form.Control.Feedback>

                {formValidation.values.categoryimage && (
                  <div className="picture avatar-lg online text-center mt-2">
                    <div className="pointer overflow-hidden">
                      <img
                        alt="Scenario Category Preview"
                        src={`${process.env.API_URL_FILEMANAGER}${formValidation.values.categoryimage}`}
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = dummy_network.src;
                        }}
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
            ) : (
              <Button variant="primary" type="submit">
                {modalTitle === "Add" ? "Submit" : "Update"}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                formValidation.resetForm();
                handleFormModal(false);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Fragment>
  );
};

export default FormScenarioCategory;
