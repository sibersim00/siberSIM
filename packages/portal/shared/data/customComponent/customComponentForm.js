import React, { useRef,useState, useEffect } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Spinner,
  Table,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { getCategoriesList } from "../../redux/slices/common/masters";
import { useRouter } from "next/router";
import {
  saveComponent,
  clearSaveComponent,
  // clearUpdateComponent,
  clearUpdateCustomComponent,
  getComponentList,
  getSingleComponent,
  clearSingleComponent,
  getSubCategorybyId,
  getVMDetail,
  updateCustomComponent,
  clearHasError
} from "../../../shared/redux/slices/customcomponent/customcomponentManage";
import Select from "react-select";
import "../../utils/i18n";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { emojiRegex } from "../../utils/regex";
import dummy_network from "../../../public/assets/img/dummy.jpg";

const FileUploader = dynamic(
  () => {
    return import("../common/fileuploads/fileuploader");
  },
  { ssr: false }
);
import { FilePath } from "../common/fileuploads/filepath";

const CustomComponentForm = (props) => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const [catDropDownData, setCatDropDownData] = useState([]);
  const [subCatDropDownData, setSubCatDropDownData] = useState([]);
  const [fullVmList, setFullVmList] = useState([]);
  const [selectedVM, setSelectedVM] = useState({});
  const category_path = FilePath.component_image;
  const ismulti = false;
  const [heading, setHeading] = useState("Add");
  const [rowValues, setRowValues] = useState({});
  const [vmid_name, setVmidName] = useState('');
  const isUpdate = !!rowValues?.customcomponentid;
  const { setView, rowId, oneClick, handleOneClick, mode, backView } = props;
  const { t } = useTranslation();
  const Type = [
    { subcategoryType: "LXC", componenttype: "LXC" },
    { subcategoryType: "QEMU", componenttype: "QEMU" },
  ];

  const getSelectStyles = (fieldName) => {
    const error =
      !formValidation.values[fieldName] &&
      formValidation.errors[fieldName] &&
      formValidation.touched[fieldName];

    return {

      control: (styles) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)",
        borderColor: "#ced4da",
        minHeight: "38px",
      }),
      multiValue: (styles) => ({
        ...styles,
        backgroundColor: "var(--primary-bg-color)",
      }),
      multiValueLabel: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      multiValueRemove: (styles) => ({
        ...styles,
        color: "#fff",
        ":hover": {
          backgroundColor: "#EB5757",
          color: "white",
        },
      }),
      input: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      singleValue: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      placeholder: (styles) => ({
        ...styles,
        color: "#aaa",
      }),
    };
  };
  const noEmojiTest = (value) => {
    if (typeof value !== "string") return true;
    return !emojiRegex.test(value);
  };

  useEffect(() => {
    dispatch(getCategoriesList());
    dispatch(clearSingleComponent());
  }, []);
  useEffect(() => {
    if (rowId && rowId !== "") {
      setHeading("Update");
      dispatch(getSingleComponent(rowId));
    }
  }, [rowId]);
  const {
    saveComponentData,
    rejectComponentData,
    hasgetCatListSucc,
    getSingleComponentSucc,
    hasGetSubCatbyIdSucc,
    errorData,
    hasGetComponentListSucc,
    hasubCatByIdRes,

  } = useSelector((state) => {
    return {
      hasGetComponentListSucc:
        state &&
        state.customComponent &&
        state.customComponent.getComponentListData,
      hasGetSubCatbyIdSucc:
        state && state.customComponent && state.customComponent.getsubCatById,
      hasGetVMDetailSucc:
        state && state.customComponent && state.customComponent.vmDetail,
      saveComponentData:
        state && state.customComponent && state.customComponent.saveComponent,
      rejectComponentData:
        state && state.customComponent && state.customComponent.updateCustomComponent,
      errorData:
        state &&
        state.customComponent &&
        state.customComponent.error &&
        state.customComponent.error,
      hasubCatByIdRes:
        state &&
        state.componentMaster &&
        state.componentMaster.getsubCatById &&
        state.componentMaster.getsubCatById.data,
      hasgetCatListSucc:
        state &&
        state.commonMaster &&
        state.commonMaster.getMasterCatListData &&
        state.commonMaster.getMasterCatListData.data,
      getSingleComponentSucc:
        state &&
        state.customComponent &&
        state.customComponent.singleComponent &&
        state.customComponent.singleComponent.data,
    };
  });
 const { isSaving } = useSelector((state) => state.customComponent);

const prevIsSavingRef = useRef(isSaving);
  useEffect(() => {
    if (getSingleComponentSucc && getSingleComponentSucc !== "") {
      setRowValues(getSingleComponentSucc);
    }
  }, [getSingleComponentSucc]);

  useEffect(() => {
    if (hasGetSubCatbyIdSucc && hasGetSubCatbyIdSucc.length > 0) {
      setSubCatDropDownData(hasGetSubCatbyIdSucc);
      setFullVmList(hasGetSubCatbyIdSucc);
      const selectedsubcategory = hasGetSubCatbyIdSucc.find(
        (obj) => obj?.componentname === rowValues?.componentname
      );
    }
  }, [hasGetSubCatbyIdSucc]);

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
    if (hasgetCatListSucc && hasgetCatListSucc.length > 0) {
      let temp = hasgetCatListSucc.map((cat) => ({
        categoryname: cat?.componentcategory || "",
        componentcategoryid: cat?.componentcategoryid,
      }));
      setCatDropDownData(temp);
      const selectedcategory = temp.find(
        (obj) => obj?.componentcategoryid === rowValues?.componentcategoryid
      );
    }
  }, [hasgetCatListSucc]);

  useEffect(() => {
    if (saveComponentData?.statusCode === 200 ) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {saveComponentData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      setView(backView);
      dispatch(getComponentList());
      dispatch(clearSaveComponent());
    }
  }, [saveComponentData]);

  useEffect(() => {
    if (rejectComponentData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {rejectComponentData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );

      setView(backView);
      dispatch(getComponentList());
      dispatch(clearUpdateCustomComponent());
      dispatch(clearSingleComponent());
      setRowValues({});
    }
  }, [rejectComponentData]);

useEffect(() => {
  // run only when saving finished (true -> false)
  if (
    prevIsSavingRef.current === true &&
    isSaving === false  &&
    saveComponentData?.statusCode === 200
  ) {
    setView(backView);
    dispatch(getComponentList());
    dispatch(clearUpdateCustomComponent());
    dispatch(clearSingleComponent());
    setRowValues({});
  }
  prevIsSavingRef.current = isSaving;
}, [isSaving, saveComponentData]);


  useEffect(() => {
    if (rowValues?.vmid) {
      formValidation.setFieldValue("componentname", {
        componentname: rowValues?.vmid,
        subcategoryname: `${rowValues?.vmid} - ${rowValues?.vmid_name}`,
      });
      setVmidName(rowValues?.vmid_name);
    }
  }, [rowValues?.vmid]);
  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      componentcategoryid:
        catDropDownData.find(
          (obj) => obj?.componentcategoryid === rowValues?.componentcategoryid
        ) || "",
      componenttype: (() => {
        return (
          Type.find((obj) => obj?.componenttype === rowValues?.componenttype) ||
          ""
        );
      })(),

      componentname: rowValues?.vmid
        ? {
          componentname: rowValues?.vmid,
          subcategoryname: `${rowValues?.vmid} - ${rowValues?.vmid_name}`,
        }
        : "",
      componentidentification: rowValues?.vmid || "",
      ComponentIdentificationVMName: rowValues?.componentname || "",
      componentimage: rowValues?.componentimage || "",
      duration: rowValues?.duration || "0",
    },

    validationSchema: Yup.object().shape({
      componentidentification: Yup.string()
        // .required("Required")
        .matches(/^[A-Za-z0-9 ]+$/, "No special characters allowed")
        .min(3, "Component Identification must be at least 3 characters")
        .max(30, "Component Identification should not exceed 30 characters")
        .test(
          "no-leading-trailing-spaces",
          "No leading or trailing spaces allowed",
          (value) => !/^\s|\s$/.test(value || "")
        )
        .test("no-emoji", "Emojis are not allowed", noEmojiTest),
      duration: Yup.number()
        .typeError("Duration must be a number (in seconds)")
        .required("Duration is required")
        .max(300, "Duration cannot exceed 300 seconds (5 minutes)"),

      componentcategoryid: Yup.object()
        .nullable()
        .required("Required")
        .test("non-empty-object", "Required", (value) => {
          return value && Object.keys(value).length > 0;
        }),
      componentname: Yup.object()
        .nullable()
        .test("valid-subcat", "Required", (value) => {
          if (
            value === undefined ||
            value === null ||
            Object.keys(value).length === 0
          ) {
            return false; // fail validation
          }
          return !!value?.componentname;
        }),
      componenttype: Yup.object()
        .nullable()
        .required("Required")
        .test("non-empty-object", "Required", (value) => {
          return value && Object.keys(value).length > 0;
        }),
      checklist: Yup.array().of(
        Yup.object().shape({
          checklistname: Yup.string()
            .matches(/^[A-Za-z0-9 ]+$/, "No special characters allowed")
            .test(
              "no-leading-trailing-spaces",
              "No leading or trailing spaces allowed",
              (value) => !/^\s|\s$/.test(value || "")
            )
            .test("no-emoji", "Emojis are not allowed", noEmojiTest),
        })
      ),
    }),

    onSubmit: (data,) => {
      const payload = {
        ...(rowValues?.customcomponentid && { customcomponentid: rowValues?.customcomponentid }),
        componentcategoryid:
          formValidation.values.componentcategoryid?.componentcategoryid, // FIXED: matches `categoryid` in backend
        subcategoryTypeid: formValidation.values.componenttype?.componenttype, // FIXED
        vmid: rowValues?.clone_vmid,
        vmid_name: rowValues?.componentname,
        componentname: formValidation.values.ComponentIdentificationVMName,
        duration: formValidation.values.duration,

        componentimage:
          formValidation.values.componentimage !== undefined
            ? formValidation.values.componentimage
            : rowValues?.componentimage,
      };
      // handleOneClick(true);
      dispatch(saveComponent(payload));

    },
  });

  useEffect(() => { }, [formValidation.errors]);

  const handelGetSubCat = (typeObjOrId) => {
    const typeId =
      typeof typeObjOrId === "object" ? typeObjOrId.componenttype : typeObjOrId;
    setSubCatDropDownData([]);
    // Only clear the selected VM if NOT in update mode
    if (!isUpdate) {
      formValidation.setFieldValue("componentname", null);
    }
    const payload = {
      componenttype: typeId,
    };
    dispatch(getSubCategorybyId(payload)).then((res) => {
      if (res?.payload?.length) {
        const enrichedList = res.payload.map((item) => ({
          ...item,
          componenttype: typeId,
          componentname: item.vmid,
          subcategoryname: `${item.vmid} - ${item.name}`,
        }));
        setFullVmList(enrichedList);
        setSubCatDropDownData(enrichedList);
      }
    });
  };
  useEffect(() => {
    if (rowValues?.componenttype) {
      handelGetSubCat({
        componenttype: rowValues.componenttype,
      });
    }
  }, [rowValues]);


  const type =
    formValidation.values.componenttype?.componenttype?.toLowerCase();

  useEffect(() => {
    if (mode === "update") {
      setSelectedVM(rowValues);
    }
  }, [mode, rowValues]);

  const handleRejectClick = () => {
    if (!getSingleComponentSucc?.customcomponentuuid) return;

    const payload = {
      customcomponentuuid: getSingleComponentSucc.customcomponentuuid,
      status: "Reject",
    };

    dispatch(updateCustomComponent(payload));
  };

  return (
    <>
      <Row className="row-sm mg-t-10">
        <Col md={12}>
          <Form noValidate onSubmit={formValidation.handleSubmit}>
            <Card className="custom-card">
              <Card.Body>
                <div className="learnerTitle d-flex justify-content-between align-items-center">
                  <h5>
                    {heading} {t("Custom Component")}
                  </h5>
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => {
                      setView(backView);
                      push(`/customComponent?view=${backView || "list"}`);

                      formValidation.resetForm();
                      dispatch(clearSingleComponent());
                      dispatch(clearSaveComponent());
                      setRowValues({});
                    }}
                  >
                    <i className="fe fe-arrow-left"></i>
                    {/* {t("common.back")} */}
                  </Button>
                </div>
                <Row className="row-sm">
                  <Col md={12}>
                    <Card className="custom-card">
                      <Row>
                        <Col md={12}>
                          <Row>
                            <Form.Group
                              as={Col}
                              md="3"
                              controlId="1_1"
                              className="mb-3 h-62 input-container select"
                            >
                              <Form.Label>
                                {t("Type")}
                                <span className="text-danger">*</span>
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
                                name="componenttype"
                                styles={getSelectStyles("componenttype")}
                                value={
                                  Type.find(
                                    (option) =>
                                      option.componenttype ===
                                      formValidation.values.componenttype
                                        ?.componenttype
                                  ) || null
                                }
                                options={Type}
                                getOptionLabel={(x) => x.subcategoryType}
                                getOptionValue={(x) => x.componenttype}
                                placeholder="Select Component Type"
                                onChange={(e) => {
                                  formValidation.setFieldValue(
                                    "componenttype",
                                    e
                                  );
                                  formValidation.setFieldValue(
                                    "componentname",
                                    null
                                  );
                                  formValidation.setFieldValue(
                                    "componentidentification",
                                    ""
                                  );
                                  formValidation.setFieldValue(
                                    "ComponentIdentificationVMName",
                                    ""
                                  );
                                  setSelectedVM(null);
                                  handelGetSubCat(e);
                                }}
                                isDisabled={isUpdate}
                              />
                              {formValidation.errors.componenttype &&
                                formValidation.touched.componenttype && (
                                  <div className="invalid-tooltiped">
                                    {formValidation.errors.componenttype}
                                  </div>
                                )}
                            </Form.Group>

                            <Form.Group
                              as={Col}
                              md="5"
                              controlId="1_2"
                              className="mb-3 h-62 input-container select"
                            >
                              <Form.Label>
                                {t("Component")}{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              {isUpdate ? (
                                <Form.Control
                                  name="dummy"
                                  value={`${rowValues?.vmid} - ${rowValues?.vmid_name}`}
                                  disabled
                                />
                              ) : (
                                <Select
                                  theme={(theme) => ({
                                    ...theme,
                                    colors: {
                                      ...theme.colors,
                                      primary25: "var(--primary-bg-color)",
                                      primary: "var(--primary-bg-color)",
                                    },
                                  })}
                                  name="componentname"
                                  value={formValidation.values.componentname}
                                  styles={getSelectStyles("componentname")}
                                  options={subCatDropDownData}
                                  getOptionLabel={(x) => x.subcategoryname}
                                  getOptionValue={(x) => x.componentname}
                                  placeholder={
                                    formValidation.values.componenttype
                                      ? "Select Component"
                                      : "Please select Type first"
                                  }
                                  isDisabled={
                                    isUpdate ||
                                    !formValidation.values.componenttype
                                  }
                                  onChange={async (e) => {
                                    console.log(
                                      "eeeee", e
                                    )
                                    if (isUpdate) return;
                                    formValidation.setFieldValue(
                                      "componentname",
                                      e
                                    );
                                    formValidation.setFieldValue(
                                      "componentidentification",
                                      e.componentname
                                    );

                                    const namePart =
                                      e.subcategoryname?.split(" - ")[1] || "";
                                    formValidation.setFieldValue(
                                      "ComponentIdentificationVMName",
                                      namePart
                                    );
                                    setVmidName(namePart)

                                    const payload = {
                                      vmType:
                                        formValidation.values.componenttype?.subcategoryType?.toLowerCase(),
                                      vmid: e.componentname,
                                    };

                                    try {
                                      const response = await dispatch(
                                        getVMDetail(payload)
                                      );
                                      const vmData = response?.data || {};
                                      const config = vmData.data || {};

                                      const networkPorts = Object.entries(
                                        config
                                      )
                                        .filter(([key]) =>
                                          key.startsWith("net")
                                        )
                                        .map(
                                          ([key, value]) => `${key} - ${value}`
                                        );

                                      const vmDetail = {
                                        ...config,
                                        network_ports: networkPorts.join(", "),
                                        storage:
                                          config.sata0 ||
                                          config.scsi0 ||
                                          config.rootfs ||
                                          config.ide0 ||
                                          config.virtio0 ||
                                          config.nvme0 ||
                                          config.usb0 ||
                                          config.nvme0 ||
                                          "",
                                        cores: config.cores || "",
                                        memory: config.memory || "",
                                      };
                                      setSelectedVM(vmDetail);
                                      formValidation.setFieldValue(
                                        "cores",
                                        vmDetail.cores
                                      );
                                      formValidation.setFieldValue(
                                        "memory",
                                        vmDetail.memory
                                      );
                                      formValidation.setFieldValue(
                                        "storage",
                                        vmDetail.storage
                                      );
                                      formValidation.setFieldValue(
                                        "network_ports",
                                        vmDetail.network_ports
                                      );
                                      formValidation.setFieldValue(
                                        "proxmox_json",
                                        JSON.stringify(config)
                                      );
                                    } catch (err) {
                                      console.error(
                                        "Failed to fetch VM details:",
                                        err
                                      );
                                    }
                                  }}
                                />
                              )}
                              {formValidation.errors.componentname &&
                                formValidation.touched.componentname && (
                                  <div className="invalid-tooltiped">
                                    {formValidation.errors.componentname}
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
                                {t("manage_component.cat")}
                                <span className="text-danger"> * </span>
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
                                name="componentcategoryid"
                                styles={getSelectStyles("componentcategoryid")}
                                value={
                                  formValidation.values.componentcategoryid
                                }
                                options={catDropDownData}
                                getOptionLabel={(x) => x.categoryname}
                                getOptionValue={(x) => x.componentcategoryid}
                                placeholder="Select Component Category"
                                onChange={(e) => {
                                  formValidation.setFieldValue(
                                    "componentcategoryid",
                                    e
                                  );
                                  // handelGetSubCat(e.componentcategoryid);
                                }}
                              // isDisabled={isUpdate}
                              />
                              {formValidation.errors.componentcategoryid &&
                                formValidation.touched.componentcategoryid && (
                                  <div className="invalid-tooltiped">
                                    {formValidation.errors.componentcategoryid}
                                  </div>
                                )}
                            </Form.Group>

                            <Form.Group
                              as={Col}
                              md="3"
                              controlId="validationFormikVMID"
                              className="mb-3"
                            >
                              <Form.Label>
                                {t("Vmid")}{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="componentidentification"
                                placeholder={t("Vmid")}
                                value={
                                  formValidation.values.componentidentification
                                }
                                readOnly
                                isInvalid={
                                  formValidation.touched
                                    .componentidentification &&
                                  formValidation.errors.componentidentification
                                }
                              />
                              <Form.Control.Feedback type="invalid">
                                {formValidation.errors.componentidentification}
                              </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group
                              as={Col}
                              md="5"
                              controlId="validationFormikName"
                              className="mb-3"
                            >
                              <Form.Label>
                                {t("Name")}{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="ComponentIdentificationVMName"
                                placeholder={t("Name")}
                                value={
                                  formValidation.values
                                    .ComponentIdentificationVMName
                                }
                                onChange={formValidation.handleChange}
                                isInvalid={
                                  formValidation.touched
                                    .ComponentIdentificationVMName &&
                                  formValidation.errors
                                    .ComponentIdentificationVMName
                                }
                              />
                              <Form.Control.Feedback type="invalid">
                                {
                                  formValidation.errors
                                    .ComponentIdentificationVMName
                                }
                              </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group
                              as={Col}
                              md="4"
                              controlId="validationFormikName"
                              className="mb-3"
                            >
                              <Form.Label>
                                {t("Configuration Delay(Seconds)")}{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name="duration"
                                placeholder={t("Duration")}
                                value={formValidation.values.duration}
                                onChange={formValidation.handleChange}
                                isInvalid={
                                  formValidation.touched.duration &&
                                  formValidation.errors.duration
                                }
                              />
                              <Form.Control.Feedback type="invalid">
                                {formValidation.errors.duration}
                              </Form.Control.Feedback>
                            </Form.Group>

                            <Col md={3}>
                              <Form.Group
                                controlId="validationFormik102"
                                className="d-flex flex-column"
                              >
                                <div className="">
                                  <Form.Label>
                                    {t(
                                      "component_sub_categories.forms.label.image_url"
                                    )}
                                  </Form.Label>
                                  {rowValues?.id !== 0 && (
                                    <OverlayTrigger
                                      placement="top"
                                      overlay={
                                        <Tooltip id={`tooltip-${rowValues.id}`}>
                                          Removing the file will permanently
                                          delete it from storage and update the
                                          record.
                                        </Tooltip>
                                      }
                                    >
                                      <i
                                        className="fe fe-alert-circle text position-absolute"
                                        style={{
                                          top: "5px",
                                          right: "10px",
                                          cursor: "pointer",
                                        }}
                                      ></i>
                                    </OverlayTrigger>
                                  )}

                                  <FileUploader
                                    folderpath={category_path}
                                    ismulti={ismulti}
                                    name="componentimage"
                                    acceptedFileTypes={[
                                      "image/png",
                                      "image/jpeg",
                                    ]}
                                    handleUpload={handleUpload}
                                    fetchfiles={
                                      ismulti
                                        ? (formValidation.values.componentimage || "").split(",")
                                        : [formValidation.values.componentimage]
                                    }
                                  />
                                  <Form.Control.Feedback type="invalid">
                                    {formValidation.errors.componentimage}
                                  </Form.Control.Feedback>

                                  {formValidation.values.componentimage && (
                                    <div className="picture avatar-lg online text-center mt-2">
                                      <div className="pointer overflow-hidden">
                                        <img
                                          alt="Component Preview"
                                          src={`${process.env.API_URL_FILEMANAGER}${formValidation.values.componentimage}`}
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
                                </div>
                              </Form.Group>
                            </Col>
                            {(mode === "update" || mode === "add") && (
                              <Col md={9}>
                                <h6 className="mt-1">VM Details</h6>
                                <Table responsive bordered>
                                  <thead>
                                    <tr>
                                      <td>Property</td>
                                      <td>Value</td>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>Virtual Memory</td>
                                      <td>
                                        {selectedVM?.main_memory
                                          ? `${selectedVM.main_memory} M`
                                          : "N/A"}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Virtual CPU</td>
                                      <td>
                                        {selectedVM?.main_cores
                                          ? `${selectedVM.main_cores} Cores`
                                          : "N/A"}
                                      </td>
                                    </tr>

                                    <tr>
                                      <td>Network Ports</td>
                                      <td>
                                        {selectedVM?.main_network_ports
                                          ? selectedVM.main_network_ports
                                            .split(/(?=net\d+ -)/) // Split before each netX -
                                            .map((line, i) => {
                                              const match =
                                                line.match(
                                                  /^(net\d+)( - .*)$/
                                                );
                                              if (match) {
                                                const [, iface, details] =
                                                  match;
                                                return (
                                                  <div key={i}>
                                                    <strong>{iface}</strong>
                                                    {details}
                                                  </div>
                                                );
                                              } else {
                                                return (
                                                  <div key={i}>
                                                    {line.trim()}
                                                  </div>
                                                );
                                              }
                                            })
                                          : "N/A"}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Storage Size</td>
                                      <td>
                                        {selectedVM?.main_storage
                                          ? (() => {
                                            const match =
                                              selectedVM.main_storage.match(
                                                /size=(\d+)([MG])/i
                                              );
                                            return match
                                              ? `${match[1]
                                              }${match[2].toUpperCase()}B`
                                              : ` ${selectedVM.main_storage} GB`;
                                          })()
                                          : "N/A"}
                                      </td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </Col>
                            )}
                          </Row>

                          <Row></Row>
                        </Col>
                      </Row>
                      <Row>
                        <Col className="d-flex justify-content-end">
                          <div className="d-flex">
                            {isUpdate && (
                              <div className="d-flex me-2">
                                <Button variant="danger" type="button"
                                  onClick={handleRejectClick}
                                >
                                  {t("Reject")}
                                </Button>
                              </div>

                            )}
                            <div className="me-2">
                              {oneClick ? (
                                <Button disabled>
                                  <Spinner
                                    as="span"
                                    animation="grow"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                  />
                                  {t("common.loading")}
                                </Button>
                              ) : (

                                // <Button type="submit">
                                //   {isUpdate ? t("Approved") : t("common.submit")}
                                // // </Button>
                                // <Button type="submit" disabled={isLoading}>
                                //   {isLoading ? (
                                //     <>
                                //       <Spinner
                                //         as="span"
                                //         animation="grow"
                                //         size="sm"
                                //         role="status"
                                //         aria-hidden="true"
                                //       />
                                //       {t("common.loading")}
                                //     </>
                                //   ) : (
                                //     isUpdate ? t("Approved") : t("common.submit")
                                //   )}
                                // </Button>
                                <Button type="submit" disabled={isSaving}>
                                  {isSaving ? (
                                    <>
                                      <Spinner
                                        as="span"
                                        animation="grow"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                      />
                                      {t("common.loading")}
                                    </>
                                  ) : (
                                    isUpdate ? t("Approved") : t("common.submit")
                                  )}
                                </Button>




                              )}
                            </div>
                          </div>
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
    </>
  );
};
CustomComponentForm.layout = "Contentlayout";
export default CustomComponentForm;
