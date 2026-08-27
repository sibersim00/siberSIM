import React, { useState, Fragment, useEffect } from "react";
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
import { useFormik } from "formik";
import * as Yup from "yup";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { emojiRegex } from "../../utils/regex";
import {
  saveSubCategories,
  updateSubCategories,
} from "../../redux/slices/masters/ScenarioSubCategries";
import dummy_network from "../../../public/assets/img/dummy.jpg";

import { getScenarioSubCategoriesList } from "../../redux/slices/common/masters";
import {
  regex,
  error,
} from "../../data/common/vaidationMessage/formValidationMsg";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
const FileUploader = dynamic(
  () => import("../../data/common/fileuploads/fileuploader"),
  { ssr: false }
);
import { FilePath } from "../../data/common/fileuploads/filepath";

const FormScenarioSubCategory = (props) => {
  const { openFlag, handleFormModal, rowValues, oneClick, handleOneClick } =
    props;
  const dispatch = useDispatch();
  const category_path = FilePath.scenario_sub_categories;
  const ismulti = false;
  const [modalTitle, setModalTitle] = useState("Add");
  const [catDropDownData, setCatDropDownData] = useState([]);
  const { t } = useTranslation();
      const [isDark, setIsDark] = useState(false);
    
      useEffect(() => {
      const theme = localStorage.getItem("theme_preference") || "light";
      setIsDark(theme === "dark");
    }, []);
//  const theme = localStorage.getItem("theme_preference") || "light";
//   const isDark = theme === "dark";
  const { saveSubCategoriesData, errorData, hasgetCatListSucc } = useSelector(
    (state) => ({
      saveSubCategoriesData: state?.scenariosubcategories?.saveSubCategories,
      errorData: state?.scenariosubcategories?.error,
      hasgetCatListSucc:
        state?.commonMaster?.getScenarioSubCategoriesListData?.data,
    })
  );
  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };

  const schema = Yup.object().shape({
    categoryname: Yup.string()
      .required(error?.required)
      .test("no-emoji", "Emojis are not allowed", noEmojiTest)
      .max(50, "Scenario Sub Category should not exceed 50 characters")
      .matches(regex?.alphaHyphenSpacesRegex, error?.onlyAlphaHyphenSpace)
      .test(
        "no-leading-trailing-spaces",
        "No leading or trailing spaces allowed",
        (value) => {
          return !/^\s|\s$/.test(value);
        }
      ),
  });
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
  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      categoryname: rowValues?.categoryname || "",
      categoryimage: rowValues?.categoryimage || "",
      parentscenariocategoryid:
        catDropDownData.find(
          (obj) => obj?.value === rowValues?.parentscenariocategoryid
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
      parentscenariocategoryid: Yup.object()
        .nullable()
        .required(error?.required),

      categoryimage: Yup.string()
        .required(error?.required),
    }),
    onSubmit: async (data) => {
      const payload = {
        scenariocategoryid: rowValues?.scenariocategoryid,
        categoryname: data.categoryname,
        categoryimage:
          data.categoryimage !== undefined
            ? data.categoryimage
            : rowValues?.categoryimage,
        parentscenariocategoryid: data.parentscenariocategoryid?.value,
      };
      handleOneClick(true);
      try {
        if (rowValues?.scenariocategoryid) {
          await dispatch(updateSubCategories(payload));
        } else {
          await dispatch(saveSubCategories(payload));
        }
      } finally {
        handleOneClick(false);
      }
    },
  });

  useEffect(() => {
    if (rowValues) {
      setModalTitle(rowValues.title || "Update");
    }
  }, [rowValues]);

  const viewDemoShow = (modal) => {
    if (modal === false) {
      handleFormModal(false);
      formValidation.resetForm();
    }
  };

  useEffect(() => {
    if (saveSubCategoriesData?.statusCode) {
      formValidation.resetForm();
    }
  }, [saveSubCategoriesData]);

  useEffect(() => {
    dispatch(getScenarioSubCategoriesList());
  }, []);

  useEffect(() => {
    if (hasgetCatListSucc && hasgetCatListSucc.length > 0) {
      const temp = hasgetCatListSucc.map((cat) => ({
        label: cat.scenariocategory,
        value: cat.scenariocategoryid,
      }));
      setCatDropDownData(temp);
    }
  }, [hasgetCatListSucc]);

  const handleUpload = (name = "", files = "", flag = "") => {
    formValidation.setFieldValue("flag", flag);
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
            <Modal.Title>{modalTitle} Scenario Sub Category</Modal.Title>
            <i
              className="fas fa-close fs-18"
              style={{ cursor: "pointer" }}
              onClick={() => viewDemoShow(false)}
            ></i>
          </Modal.Header>
          <Modal.Body>
            {errorData?.length > 0 && (
              <div className="alert alert-danger mb-3">
                {errorData.map((err, index) => (
                  <div key={index}>{err}</div>
                ))}
              </div>
            )}
            <Row>
              <Form.Group
                as={Col}
                md="12"
                controlId="1_2"
                className="mb-3 h-62 input-container select"
              >
                <Form.Label>
                  Scenario Category <span className="text-danger">*</span>
                </Form.Label>
                <Select
                  name="parentscenariocategoryid"
                  value={formValidation.values.parentscenariocategoryid || null}
                  options={catDropDownData}
                  onChange={(selectedOption) => {
                    formValidation.setFieldValue(
                      "parentscenariocategoryid",
                      selectedOption
                    );
                  }}
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary25: "var(--primary-bg-color)",
                      primary: "var(--primary-bg-color)",
                    },
                  })}
                  styles={getSelectStyles(
                                                      "scenariocategoryids"
                                                    )}
                  getOptionLabel={(x) => x.label}
                  getOptionValue={(x) => x.value}
                  placeholder="Select Scenario Category"
                  isSearchable={true}
                  menuPlacement="auto"
                  menuPosition="fixed"
                  maxMenuHeight={200}
                />
                {formValidation.errors.parentscenariocategoryid &&
                  formValidation.touched.parentscenariocategoryid && (
                    <div className="invalid-tooltiped">
                      {formValidation.errors.parentscenariocategoryid}
                    </div>
                  )}
              </Form.Group>

              <Form.Group
                as={Col}
                md="12"
                controlId="validationFormikCategoryname"
                className="mb-3"
              >
                <Form.Label>
                  Scenario Sub Category<span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  autoComplete="off"
                  name="categoryname"
                  value={formValidation.values.categoryname}
                  onChange={formValidation.handleChange}
                  placeholder="Enter Scenario Sub Category"
                  isValid={
                    formValidation.touched.categoryname &&
                    !formValidation.errors.categoryname
                  }
                  isInvalid={
                    formValidation.touched.categoryname &&
                    formValidation.errors.categoryname
                  }
                />
                <Form.Control.Feedback type="invalid">
                  {formValidation.errors.categoryname}
                </Form.Control.Feedback>
              </Form.Group>


              <Form.Group controlId="imageUpload" className="d-flex flex-column">
                <div className="position-relative">
                  <Form.Label>
                    {t("Sub Category Image")}<span className="text-danger">*</span>
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
                                 color: isDark ? "#f1a139ff" : "#212122ff",
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
                  {formValidation.touched.categoryimage && formValidation.errors.categoryimage}
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
  );
};

export default FormScenarioSubCategory;
