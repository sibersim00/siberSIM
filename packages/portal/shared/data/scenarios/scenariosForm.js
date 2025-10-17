import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Tab,
  Nav,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  getScenarioSubCategoriesList,
  getScenarioSubCategorybyId,
  clearScenarioSubCategorybyId,
  getInstructorList,
} from "../../redux/slices/common/masters";
import Seo from "../../../shared/layout-components/seo/seo";
import { useRouter, push } from "next/router";
import {
  getScenarioList,
  saveScenarios,
  clearSaveScenarios,
  updateScenarios,
  clearUpdateScenarios,
  getSingleScenarios,
  clearSingleScenarios,
  clearHasError,
} from "../../redux/slices/scenario/scenarioManage";
import Select from "react-select";
import dynamic from "next/dynamic";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";
import CreateScenario from "../../../pages/components/scenarios/createscenario";
import DiagramComponents from "../../../pages/components/scenarios/view/diagramcomponents";
import { getLocalStorageData } from "../../../shared/redux/slices/localstorage/LocalStorage";
import dummy_network from "../../../public/assets/img/dummy.jpg";

const FileUploader = dynamic(
  () => {
    return import("../common/fileuploads/fileuploader");
  },
  { ssr: false }
);
const EditorComponent = dynamic(
  () => {
    return import("../common/ckEditor");
  },
  { ssr: false }
);
import { FilePath } from "../common/fileuploads/filepath";
import {
  regex,
  error,
} from "../../../shared/data/common/vaidationMessage/formValidationMsg";

const ScenarioForm = (props) => {
  const [tabIndex, setTabIndex] = useState("tab1");
  const dispatch = useDispatch();
  const [catDropDownData, setCatDropDownData] = useState([]);
  const [subCatDropDownData, setSubCatDropDownData] = useState([]);
  const [instDropDownData, setInstDropDownData] = useState([]);
  const router = useRouter();
  const [heading, setHeading] = useState("Add");
  const [rowValues, setRowValues] = useState({});
  const { setView, rowId, oneClick, handleOneClick } = props;
  const [isChecked, setIsChecked] = useState(true);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [initialHtml, setInitialHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();
  //   const banner_path = FilePath.componenet_subcategories;
  const category_path = FilePath.scenario_instruction;
  const scenario_path = FilePath.scenario_image;
  const ismulti = false;
  const [uploadedFile, setUploadedFile] = useState({});

  const {
    saveScenariosData,
    updateScenariosData,
    errorData,
    hasgetCatListSucc,
    hasubCatByIdRes,
    hasgetInstructorListSucc,
    hasGetScenarioListSucc,
    hasGetSingleScenariosSucc,
    getUserDataFromLocal,
  } = useSelector((state) => {
    return {
      hasGetScenarioListSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.hasGetScenarioListSucc,
      saveScenariosData:
        state && state.scenarioManage && state.scenarioManage.saveScenarios,
      updateScenariosData:
        state && state.scenarioManage && state.scenarioManage.updateScenarios,
      errorData:
        state &&
        state.scenarioManage &&
        state.scenarioManage.error &&
        state.scenarioManage.error,
      hasgetInstructorListSucc:
        state &&
        state.commonMaster &&
        state.commonMaster.getInstructorListData &&
        state.commonMaster.getInstructorListData.data,
      hasgetCatListSucc:
        state &&
        state.commonMaster &&
        state.commonMaster.getScenarioSubCategoriesListData &&
        state.commonMaster.getScenarioSubCategoriesListData.data,
      hasubCatByIdRes:
        state &&
        state.commonMaster &&
        state.commonMaster.getScenarioSubCategorybyId &&
        state.commonMaster.getScenarioSubCategorybyId.data,
      hasGetSingleScenariosSucc:
        state &&
        state.scenarioManage &&
        state.scenarioManage.singleScenarios &&
        state.scenarioManage.singleScenarios.data,
      getUserDataFromLocal:
        state && state.localData && state.localData.getLocalData,
    };
  });

  const level = [
    { id: "1", name: "Easy" },
    { id: "2", name: "Medium" },
    { id: "3", name: "Hard" },
  ];
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

  useEffect(() => {
    if (rowId && rowId !== "") {
      setHeading("Update");
      dispatch(getSingleScenarios(rowId));
    }
  }, [rowId]);
  useEffect(() => {
    dispatch(getInstructorList());
    dispatch(clearSingleScenarios());
    setRowValues({});
  }, []);

  useEffect(() => {
    if (rowValues) {
      if (rowValues.scenariocategoryid) {
        handelGetSubCat(rowValues.scenariocategoryid);
      }
    }
  }, [rowValues]);
  useEffect(() => {
    dispatch(getScenarioSubCategoriesList());
    dispatch(clearSingleScenarios());
  }, []);
  useEffect(() => {
    if (rowValues) {
      setScenarioId(rowValues?.scenarioid);
      setIsChecked(rowValues?.status);
      setInitialHtml(rowValues?.scenariodescription);
    }
  }, [rowValues]);

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

  useEffect(() => {
    if (hasGetSingleScenariosSucc && hasGetSingleScenariosSucc !== "") {
      setRowValues(hasGetSingleScenariosSucc);
    }
  }, [hasGetSingleScenariosSucc]);

  useEffect(() => {
    if (hasubCatByIdRes && hasubCatByIdRes.length > 0) {
      let temp = hasubCatByIdRes.map((cat) => ({
        scenariocategory: cat?.scenariocategory || "",
        scenariosubcategoryid: cat?.scenariocategoryid,
      }));
      setSubCatDropDownData(temp);
      const selectedsubcategory = temp.find(
        (obj) => obj?.scenariosubcategoryid === rowValues?.scenariosubcategoryid
      );
      // formValidation.setFieldValue("scenariosubcategoryid", selectedsubcategory);
    }
  }, [hasubCatByIdRes]);

  useEffect(() => {
    if (hasgetCatListSucc && hasgetCatListSucc.length > 0) {
      let temp = hasgetCatListSucc.map((cat) => ({
        scenariocategory: cat?.scenariocategory || "",
        scenariocategoryid: cat?.scenariocategoryid,
      }));
      setCatDropDownData(temp);
      const selectedcategory = temp.find(
        (obj) => obj?.scenariocategoryid === rowValues?.scenariocategoryid
      );

      formValidation.setFieldValue("scenariocategoryid", selectedcategory);
    }
  }, [hasgetCatListSucc]);

  useEffect(() => {
    if (errorData?.statusCode) {
      errorData.errors && errorData.errors.length > 0
        ? errorData.errors.map((data) => {
            toast.error(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0">
                {data}
              </p>,
              {
                position: toast.POSITION.TOP_RIGHT,
                hideProgressBar: true,
                theme: "colored",
              }
            );
          })
        : toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {errorData?.message}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );

      dispatch(clearHasError());
      setIsLoading(false);
    }
  }, [errorData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"));
    }
  }, []);

  const [userType, setUserType] = useState("");
  const [userId, setUserId] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  console.log("usertype", getUserDataFromLocal.usertype);

  useEffect(() => {
    if (
      getUserDataFromLocal &&
      getUserDataFromLocal.usertype &&
      getUserDataFromLocal.userid
    ) {
      setUserType(getUserDataFromLocal.usertype);
      setUserId(getUserDataFromLocal.userid);
    }
  }, [getUserDataFromLocal]);

  //----- instrutot dropdown selected in instructor panel
  useEffect(() => {
    if (hasgetInstructorListSucc && hasgetInstructorListSucc.length > 0) {
      const temp = hasgetInstructorListSucc.map((cat) => ({
        name: cat?.name || "",
        instructor_id: cat?.instructor_id,
      }));
      setInstDropDownData(temp);
      // Get user data from localStorage
      let selectedInstructor;
      if (userType === "Instructor" && userId) {
        selectedInstructor = temp.find(
          (obj) => obj?.instructor_id?.toString() === userId.toString()
        );
      } else {
        // fallback to selected row value
        selectedInstructor = temp.find(
          (obj) => obj?.instructor_id === rowValues?.instructor_id
        );
      }

      formValidation.setFieldValue("instructor_id", selectedInstructor);
    }
  }, [hasgetInstructorListSucc]);

  useEffect(() => {
    if (saveScenariosData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveScenariosData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      setScenarioId(saveScenariosData?.scenarioid);
      dispatch(clearSaveScenarios());
      setTabIndex("tab2");
    }
  }, [saveScenariosData]);

  useEffect(() => {
    if (updateScenariosData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {updateScenariosData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      dispatch(getScenarioList());
      dispatch(clearUpdateScenarios());
      dispatch(clearSingleScenarios());
      dispatch(clearSaveScenarios());
      dispatch(clearScenarioSubCategorybyId());
      setTabIndex("tab2");
      setRowValues({});
    }
  }, [updateScenariosData]);

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      scenarioidentification: rowValues?.scenarioidentification || "",

      scenariosubcategoryid:
        subCatDropDownData.find(
          (obj) =>
            obj?.scenariosubcategoryid === rowValues?.scenariosubcategoryid
        ) || null,
      scenariotitle: rowValues?.scenariotitle || "",
      description: rowValues?.scenariodescription || "",
      scenariolevel:
        level.find((obj) => obj?.name === rowValues?.scenariolevel) || null,
      instructor_id:
        instDropDownData.find(
          (obj) => obj?.instructor_id === rowValues?.instructor_id
        ) || null,
      status: rowValues?.status || "",
      image_url: rowValues?.instruction_file || "",
      duration: rowValues?.duration || "",
      scenariocategoryids:
        catDropDownData.find(
          (obj) => obj?.scenariocategoryid === rowValues?.scenariocategoryid
        ) || "",
      scenarioimage: rowValues?.scenarioimage || "",
    },
    validationSchema: Yup.object().shape({
      scenarioidentification: Yup.string()
        .required("Required")
        .matches(
          /^[a-zA-Z0-9 _:-]+$/,
          "Invalid - only letters, numbers, spaces, hyphens (-), underscores (_), and colons (:) are allowed"
        )
        .min(3, "Minimum 3 characters required")
        .max(30, "Identification should not exceed 30 characters")
        .test(
          "no-leading-trailing-spaces",
          "No leading or trailing spaces allowed",
          (value) => {
            return value ? !/^\s|\s$/.test(value) : true;
          }
        ),

      scenariotitle: Yup.string()
        .required("Required")
        .test(
          "no-leading-trailing-spaces",
          "No leading or trailing spaces allowed",
          (value) => value === value?.trim()
        ),
      description: Yup.string().test("non-empty", error?.required, (value) => {
        return value && value.trim() !== "";
      }),
      scenariolevel: Yup.object()
        .nullable()
        .required("Required")
        .test(
          "non-empty-object",
          "Scenario Level must be selected",
          (value) => value && Object.keys(value).length > 0
        ),
      // scenariocategoryid: Yup.object().required('required'),
      scenariocategoryids: Yup.object().required("Required"),
      scenariosubcategoryid: Yup.object()
        .nullable()
        .required("Required")
        .test(
          "non-empty-object",
          "Scenario Subcategory must be selected",
          (value) => value && Object.keys(value).length > 0
        ),
      duration: Yup.string()
        .required("Required")
        .matches(/^\d+$/, "Duration must be in minutes")
        .test(
          "is-valid-minute",
          "Duration must be between 1 and 1440 minutes",
          (value) => {
            const minutes = parseInt(value, 10);
            return minutes >= 1 && minutes <= 1440;
          }
        ),
      image_url: Yup.string()
        .required("Required")
        .test("is-pdf", "Only PDF files are allowed", (value) => {
          if (!value) return false;
          const files = value.split(",");
          return files.every((file) => file.toLowerCase().endsWith(".pdf"));
        }),
      scenarioimage: Yup.string().required(error?.required),
    }),

    onSubmit: (data, action) => {
      const payload = {
        ...(rowValues?.scenarioid && { scenarioid: rowValues?.scenarioid }),
        identification: data?.scenarioidentification,
        title: data?.scenariotitle,
        description: initialHtml ? initialHtml : "",
        scenariocategoryid: data?.scenariocategoryids?.scenariocategoryid,
        scenariosubcategoryid:
          data?.scenariosubcategoryid?.scenariosubcategoryid,
        level: data?.scenariolevel?.name,
        diagram: data?.diagram || " ",
        status: "true",
        instructor_id: data?.instructor_id?.instructor_id || null,
        instruction_file: data?.image_url,
        duration: data?.duration,
        scenariostatus: "Draft",
        scenarioimage:
          data.scenarioimage !== undefined
            ? data.scenarioimage
            : rowValues?.scenarioimage,
      };
      handleOneClick(true);

      if (rowValues?.scenarioid) {
        dispatch(updateScenarios(payload));
      } else {
        dispatch(saveScenarios(payload));
      }

      action.setSubmitting(false);
    },
  });

  const handelGetSubCat = (catId) => {
    setSubCatDropDownData([]);
    const payload = {
      scenariocategoryid: catId,
    };
    dispatch(getScenarioSubCategorybyId(payload));
  };

  return (
    <>
      <Seo title="Scenario" />
      {/* <ToastContainer /> */}
      <Row className="row-sm">
        <Col md={12}>
          <Row className="mg-b-10 text-wrap">
            <div className="panel panel-primary tabs-style-2">
              <div className="tab-menu-heading">
                <div className="tabs-menu">
                  <Tab.Container
                    id="left-tabs-example"
                    activeKey={tabIndex}
                    onSelect={(key) => {
                      setTabIndex(key);
                    }}
                  >
                    <Row id="tabs-style-2" className="pd-l-15 pd-r-15">
                      <Nav className="d-flex justify-content-between align-items-center panel-body tabs-menu-body pills bd-b pb-0 bg-white">
                        <div className="d-flex align-items-center w-100 justify-content-between">
                          <div className="d-flex align-items-center">
                            <Nav.Item className="flex-fill text-center">
                              <Nav.Link
                                eventKey="tab1"
                                onClick={() => setTabIndex("tab1")}
                              >
                                {t("program.tab_name.basic_information")}
                              </Nav.Link>
                            </Nav.Item>
                            <Nav.Item className="flex-fill text-center">
                              <Nav.Link
                                eventKey="tab2"
                                onClick={() => {
                                  if (
                                    scenarioId !== undefined &&
                                    scenarioId !== ""
                                  ) {
                                    setTabIndex("tab2");
                                  }
                                }}
                                disabled={
                                  scenarioId === undefined || scenarioId === ""
                                }
                              >
                                {t("Scenario Diagram")}
                              </Nav.Link>
                            </Nav.Item>
                            <Nav.Item className="flex-fill text-center">
                              <Nav.Link
                                eventKey="tab3"
                                onClick={() => {
                                  if (
                                    scenarioId !== undefined &&
                                    scenarioId !== ""
                                  ) {
                                    setTabIndex("tab3");
                                  }
                                }}
                                disabled={
                                  scenarioId === undefined || scenarioId === ""
                                }
                              >
                                {t("VM Configuration")}
                              </Nav.Link>
                            </Nav.Item>
                          </div>
                          <div className="ms-auto">
                            <Button
                              className="btn-sm"
                              variant="outline-secondary"
                              type="button"
                              onClick={() => {
                                dispatch(clearUpdateScenarios());
                                dispatch(clearSingleScenarios());
                                dispatch(clearSaveScenarios());
                                dispatch(clearScenarioSubCategorybyId());
                                setRowValues({});
                                formValidation.resetForm();
                                setView("Card");
                                setScenarioId("");
                              }}
                            >
                              <i className="fe fe-arrow-left"></i>
                              {t("")}
                            </Button>
                          </div>
                        </div>
                      </Nav>
                    </Row>

                    <Tab.Content className="p-0">
                      {tabIndex === "tab1" && (
                        <Tab.Pane eventKey="tab1" className="p-0">
                          <Row className="row-sm mg-t-10">
                            <Col md={12}>
                              <Form
                                noValidate
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  formValidation.handleSubmit();
                                  return true;
                                }}
                              >
                                <Card className="custom-card">
                                  <Card.Body>
                                    <Row className="row-sm">
                                      <Col md={12}>
                                        <Card className="custom-card">
                                          <Row>
                                            <Col md={12}>
                                              <Row>
                                                <Form.Group
                                                  as={Col}
                                                  md="4"
                                                  controlid="validationFormik102"
                                                  className="mb-3"
                                                >
                                                  <Form.Label>
                                                    Identification No
                                                    <span className="text-danger">
                                                      *
                                                    </span>
                                                  </Form.Label>
                                                  <Form.Control
                                                    type="text"
                                                    name="scenarioidentification"
                                                    maxLength={30}
                                                    autoComplete="off"
                                                    placeholder="Enter Identification No"
                                                    value={
                                                      formValidation.values
                                                        .scenarioidentification
                                                    }
                                                    onChange={
                                                      formValidation.handleChange
                                                    }
                                                    isInvalid={
                                                      formValidation.touched
                                                        .scenarioidentification &&
                                                      formValidation.errors
                                                        .scenarioidentification
                                                    }
                                                  />
                                                  <Form.Control.Feedback type="invalid">
                                                    {
                                                      formValidation.errors
                                                        .scenarioidentification
                                                    }
                                                  </Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group
                                                  as={Col}
                                                  md="8"
                                                  controlid="validationFormik102"
                                                  className="mb-3"
                                                >
                                                  <Form.Label>
                                                    Title
                                                    <span className="text-danger">
                                                      *
                                                    </span>
                                                  </Form.Label>
                                                  <Form.Control
                                                    type="text"
                                                    name="scenariotitle"
                                                    autoComplete="off"
                                                    placeholder="Enter Title"
                                                    value={
                                                      formValidation.values
                                                        .scenariotitle
                                                    }
                                                    onChange={
                                                      formValidation.handleChange
                                                    }
                                                    isInvalid={
                                                      formValidation.touched
                                                        .scenariotitle &&
                                                      formValidation.errors
                                                        .scenariotitle
                                                    }
                                                  />
                                                  <Form.Control.Feedback type="invalid">
                                                    {
                                                      formValidation.errors
                                                        .scenariotitle
                                                    }
                                                  </Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group
                                                  as={Col}
                                                  md="4"
                                                  controlId="1_2"
                                                  className="mb-3 h-62 input-container select"
                                                >
                                                  <Form.Label>
                                                    {t("Level")}{" "}
                                                    <span className="text-danger">
                                                      *
                                                    </span>
                                                  </Form.Label>
                                                  <Select
                                                    theme={(theme) => ({
                                                      ...theme,
                                                      colors: {
                                                        ...theme.colors,
                                                        primary25:
                                                          "var(--primary-bg-color)",
                                                        primary:
                                                          "var(--primary-bg-color)",
                                                      },
                                                    })}
                                                    name="scenariolevel"
                                                    styles={getSelectStyles(
                                                      "scenariolevel"
                                                    )}
                                                    value={
                                                      formValidation.values
                                                        .scenariolevel
                                                    }
                                                    options={level}
                                                    getOptionLabel={(x) =>
                                                      x.name
                                                    }
                                                    getOptionValue={(x) => x.id}
                                                    placeholder="Select Level"
                                                    onChange={(e) => {
                                                      formValidation.setFieldValue(
                                                        "scenariolevel",
                                                        e
                                                      );
                                                    }}
                                                    isInvalid={
                                                      formValidation.touched
                                                        .scenariolevel &&
                                                      formValidation.errors
                                                        .scenariolevel
                                                    }
                                                  />

                                                  {formValidation.errors
                                                    .scenariolevel &&
                                                    formValidation.touched
                                                      .scenariolevel && (
                                                      <div className="invalid-tooltiped">
                                                        {
                                                          formValidation.errors
                                                            .scenariolevel
                                                        }
                                                      </div>
                                                    )}
                                                </Form.Group>
                                                <Form.Group
                                                  as={Col}
                                                  md="4"
                                                  controlId="1_2"
                                                  className="mb-3 h-62 input-container select"
                                                >
                                                  <Form.Label>
                                                    {t("Scenario Category")}{" "}
                                                    <span className="text-danger">
                                                      *
                                                    </span>
                                                  </Form.Label>
                                                  <Select
                                                    theme={(theme) => ({
                                                      ...theme,
                                                      colors: {
                                                        ...theme.colors,
                                                        primary25:
                                                          "var(--primary-bg-color)",
                                                        primary:
                                                          "var(--primary-bg-color)",
                                                      },
                                                    })}
                                                    name="scenariocategoryids"
                                                    styles={getSelectStyles(
                                                      "scenariocategoryids"
                                                    )}
                                                    value={
                                                      formValidation.values
                                                        .scenariocategoryids
                                                    }
                                                    options={catDropDownData}
                                                    getOptionLabel={(x) =>
                                                      x.scenariocategory
                                                    }
                                                    getOptionValue={(x) =>
                                                      x.scenariocategoryid
                                                    } //  FIXED
                                                    placeholder="Select Category"
                                                    onChange={(e) => {
                                                      formValidation.setFieldValue(
                                                        "scenariocategoryids",
                                                        e
                                                      );
                                                      formValidation.setFieldValue(
                                                        "scenariosubcategoryid",
                                                        null
                                                      );
                                                      handelGetSubCat(
                                                        e.scenariocategoryid
                                                      );
                                                    }}
                                                    isInvalid={
                                                      formValidation.touched
                                                        .scenariocategoryids &&
                                                      formValidation.errors
                                                        .scenariocategoryids
                                                    }
                                                  />

                                                  {formValidation.errors
                                                    .scenariocategoryids &&
                                                    formValidation.touched
                                                      .scenariocategoryids && (
                                                      <div className="invalid-tooltiped">
                                                        {
                                                          formValidation.errors
                                                            .scenariocategoryids
                                                        }
                                                      </div>
                                                    )}
                                                </Form.Group>

                                                <Form.Group
                                                  as={Col}
                                                  md="4"
                                                  controlId="1_2"
                                                  className="mb-3 h-62 input-container select"
                                                >
                                                  <Form.Label>
                                                    {t("Scenario Sub Category")}{" "}
                                                    <span className="text-danger">
                                                      *
                                                    </span>
                                                  </Form.Label>
                                                  <Select
                                                    theme={(theme) => ({
                                                      ...theme,
                                                      colors: {
                                                        ...theme.colors,
                                                        primary25:
                                                          "var(--primary-bg-color)",
                                                        primary:
                                                          "var(--primary-bg-color)",
                                                      },
                                                    })}
                                                    name="scenariosubcategoryid"
                                                    styles={getSelectStyles(
                                                      "scenariosubcategoryid"
                                                    )}
                                                    value={
                                                      formValidation.values
                                                        .scenariosubcategoryid ||
                                                      null
                                                    }
                                                    options={
                                                      subCatDropDownData || []
                                                    }
                                                    getOptionLabel={(x) =>
                                                      x.scenariocategory
                                                    }
                                                    getOptionValue={(x) =>
                                                      x.scenariosubcategoryid
                                                    }
                                                    placeholder="Select Sub Category"
                                                    onChange={(e) => {
                                                      formValidation.setFieldValue(
                                                        "scenariosubcategoryid",
                                                        e
                                                      );
                                                    }}
                                                  />
                                                  {formValidation.errors
                                                    .scenariosubcategoryid &&
                                                    formValidation.touched
                                                      .scenariosubcategoryid && (
                                                      <div className="invalid-tooltiped">
                                                        {
                                                          formValidation.errors
                                                            .scenariosubcategoryid
                                                        }
                                                      </div>
                                                    )}
                                                </Form.Group>

                                                <Form.Group
                                                  as={Col}
                                                  md="4"
                                                  controlId="1_2"
                                                  className="mb-3 h-62 input-container select"
                                                >
                                                  <Form.Label>
                                                    SIMManager
                                                  </Form.Label>
                                                  <Select
                                                    theme={(theme) => ({
                                                      ...theme,
                                                      colors: {
                                                        ...theme.colors,
                                                        primary25:
                                                          "var(--primary-bg-color)",
                                                        primary:
                                                          "var(--primary-bg-color)",
                                                      },
                                                    })}
                                                    name="instructor_id"
                                                    styles={getSelectStyles(
                                                      "instructor_id"
                                                    )}
                                                    value={
                                                      formValidation.values
                                                        .instructor_id
                                                    }
                                                    options={instDropDownData}
                                                    getOptionLabel={(x) =>
                                                      x.name
                                                    }
                                                    getOptionValue={(x) =>
                                                      x.instructor_id
                                                    }
                                                    placeholder="Select SIMManager"
                                                    onChange={(e) => {
                                                      formValidation.setFieldValue(
                                                        "instructor_id",
                                                        e
                                                      );
                                                    }}
                                                    isDisabled={
                                                      userType === "Instructor"
                                                    }
                                                  />
                                                </Form.Group>
                                                <Form.Group
                                                  as={Col}
                                                  md="4"
                                                  controlid="validationFormik102"
                                                  className="mb-3"
                                                >
                                                  <Form.Label>
                                                    Duration
                                                    <span className="text-danger">
                                                      *
                                                    </span>{" "}
                                                    <small>(In Minutes)</small>
                                                  </Form.Label>
                                                  <Form.Control
                                                    type="number"
                                                    name="duration"
                                                    placeholder="Enter Duration"
                                                    autoComplete="off"
                                                    value={
                                                      formValidation.values
                                                        .duration
                                                    }
                                                    onChange={
                                                      formValidation.handleChange
                                                    }
                                                    isInvalid={
                                                      formValidation.touched
                                                        .duration &&
                                                      formValidation.errors
                                                        .duration
                                                    }
                                                  />
                                                  <Form.Control.Feedback type="invalid">
                                                    {
                                                      formValidation.errors
                                                        .duration
                                                    }
                                                  </Form.Control.Feedback>
                                                </Form.Group>

                                                <Col md={4}>
                                                  <Form.Group
                                                    as={Col}
                                                    md="12"
                                                    controlid="validationFormik102"
                                                    className="mb-3 position-relative"
                                                  >
                                                    <div className="position-relative">
                                                      <Form.Label>
                                                        {t("Instruction File")}
                                                        <span className="text-danger">
                                                          *
                                                        </span>
                                                      </Form.Label>

                                                      {rowValues?.id !== 0 && (
                                                        <OverlayTrigger
                                                          placement="top"
                                                          overlay={
                                                            <Tooltip
                                                              id={`tooltip-${rowValues.id}`}
                                                            >
                                                              Removing the file
                                                              will permanently
                                                              delete it from
                                                              storage and update
                                                              the record.
                                                            </Tooltip>
                                                          }
                                                        >
                                                          <i
                                                            className="fe fe-alert-circle text-warning position-absolute"
                                                            style={{
                                                              top: "5px",
                                                              right: "5px",
                                                              cursor: "pointer",
                                                            }}
                                                          ></i>
                                                        </OverlayTrigger>
                                                      )}

                                                      <FileUploader
                                                        folderpath={
                                                          category_path
                                                        }
                                                        ismulti={ismulti}
                                                        name="image_url"
                                                        acceptedFileTypes={[
                                                          "application/pdf",
                                                        ]}
                                                        handleUpload={
                                                          handleUpload
                                                        }
                                                        fetchfiles={
                                                          ismulti
                                                            ? formValidation.values.image_url.split(
                                                                ","
                                                              )
                                                            : [
                                                                formValidation
                                                                  .values
                                                                  .image_url,
                                                              ]
                                                        }
                                                      />

                                                      {formValidation.errors
                                                        .image_url &&
                                                        formValidation.touched
                                                          .image_url && (
                                                          <div className="invalid-tooltiped">
                                                            {
                                                              formValidation
                                                                .errors
                                                                .image_url
                                                            }
                                                          </div>
                                                        )}
                                                    </div>
                                                  </Form.Group>
                                                </Col>

                                                <Col md={4}>
                                                  <Form.Group
                                                    controlId="imageUpload"
                                                    className="d-flex flex-column"
                                                  >
                                                    <div className="position-relative">
                                                      <Form.Label>
                                                        {t("Scenario Image")}
                                                        <span className="text-danger">
                                                          *
                                                        </span>
                                                        {rowValues?.id !==
                                                          0 && (
                                                          <OverlayTrigger
                                                            placement="top"
                                                            overlay={
                                                              <Tooltip
                                                                id={`tooltip-${rowValues.id}`}
                                                              >
                                                                Removing the
                                                                file will
                                                                permanently
                                                                delete it from
                                                                storage and
                                                                update the
                                                                record.
                                                              </Tooltip>
                                                            }
                                                          >
                                                            <i
                                                              className="fe fe-alert-circle text-warning"
                                                              style={{
                                                                position:
                                                                  "absolute",
                                                                top: "2px",
                                                                right: "5px",
                                                                cursor:
                                                                  "pointer",
                                                                color:
                                                                  "#212122ff",
                                                              }}
                                                            ></i>
                                                          </OverlayTrigger>
                                                        )}
                                                      </Form.Label>

                                                      <FileUploader
                                                        folderpath={
                                                          scenario_path
                                                        }
                                                        ismulti={ismulti}
                                                        name="scenarioimage"
                                                        acceptedFileTypes={[
                                                          "image/png",
                                                          "image/jpeg",
                                                        ]}
                                                        handleUpload={
                                                          handleUpload
                                                        }
                                                        fetchfiles={
                                                          ismulti
                                                            ? (
                                                                formValidation
                                                                  .values
                                                                  .scenarioimage ||
                                                                ""
                                                              ).split(",")
                                                            : [
                                                                formValidation
                                                                  .values
                                                                  .scenarioimage,
                                                              ]
                                                        }
                                                      />
                                                    </div>

                                                    <Form.Control.Feedback
                                                      type="invalid"
                                                      className="d-block"
                                                    >
                                                      {formValidation.touched
                                                        .scenarioimage &&
                                                        formValidation.errors
                                                          .scenarioimage}
                                                    </Form.Control.Feedback>

                                                    {formValidation.values
                                                      .scenarioimage && (
                                                      <div className="picture avatar-lg online text-center mt-2 mb-3">
                                                        <div className="pointer overflow-hidden">
                                                          <img
                                                            alt="Scenario Category Preview"
                                                            src={`${process.env.API_URL_FILEMANAGER}${formValidation.values.scenarioimage}`}
                                                            onError={(e) => {
                                                              e.target.onerror =
                                                                null || "";
                                                              e.target.src =
                                                                dummy_network.src;
                                                            }}
                                                            style={{
                                                              objectFit:
                                                                "cover",
                                                              width: "100%",
                                                              height: "100%",
                                                            }}
                                                          />
                                                        </div>
                                                      </div>
                                                    )}
                                                  </Form.Group>
                                                </Col>

                                                <Form.Group
                                                  as={Col}
                                                  md="12"
                                                  controlid="validationFormik102"
                                                  className="mb-5 mt-4"
                                                >
                                                  <Form.Label>
                                                    {t(
                                                      "component_sub_categories.forms.label.description"
                                                    )}
                                                    <span className="text-danger">
                                                      *
                                                    </span>
                                                  </Form.Label>
                                                  <EditorComponent
                                                    name="description"
                                                    onChange={(data) => {
                                                      setInitialHtml(data);
                                                      formValidation.setFieldValue(
                                                        "description",
                                                        data
                                                      );
                                                    }}
                                                    editorLoaded={editorLoaded}
                                                    data={initialHtml}
                                                    setEditorLoaded={
                                                      setEditorLoaded
                                                    }
                                                    style={{
                                                      minHeight: "600px",
                                                      height: "600px",
                                                    }} //
                                                  />
                                                  {formValidation.errors
                                                    .description &&
                                                    formValidation.touched
                                                      .description && (
                                                      <div className="invalid-tooltiped">
                                                        {
                                                          formValidation.errors
                                                            .description
                                                        }
                                                      </div>
                                                    )}
                                                </Form.Group>
                                              </Row>
                                            </Col>
                                          </Row>
                                          <Row>
                                            <Col className="d-flex justify-content-end">
                                              <Button type="submit">
                                                {t("Save & Next")}
                                              </Button>
                                            </Col>
                                          </Row>
                                        </Card>
                                      </Col>
                                    </Row>
                                  </Card.Body>
                                </Card>
                              </Form>
                            </Col>
                          </Row>
                        </Tab.Pane>
                      )}
                      {console.log(scenarioId, "tabIndex", tabIndex)}

                      {tabIndex === "tab2" &&
                        scenarioId !== undefined &&
                        scenarioId !== "" && (
                          <Tab.Pane eventKey="tab2" className="p-0">
                            <CreateScenario
                              scenarioId={scenarioId}
                              setScenarioId={setScenarioId}
                              setTabIndex={setTabIndex}
                              setView={setView}
                              setRowValues={setRowValues}
                            />
                          </Tab.Pane>
                        )}
                      {tabIndex === "tab3" &&
                        scenarioId !== undefined &&
                        scenarioId !== "" && (
                          <Tab.Pane eventKey="tab3" className="p-0">
                            <DiagramComponents
                              scenarioId={scenarioId}
                              setScenarioId={setScenarioId}
                              setTabIndex={setTabIndex}
                              setView={setView}
                              setRowValues={setRowValues}
                            />
                          </Tab.Pane>
                        )}
                    </Tab.Content>
                  </Tab.Container>
                </div>
              </div>
            </div>
          </Row>
        </Col>
      </Row>
    </>
  );
};
ScenarioForm.layout = "Contentlayout";
export default ScenarioForm;
