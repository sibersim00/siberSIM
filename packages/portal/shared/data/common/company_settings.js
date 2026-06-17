import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Form, OverlayTrigger, Tooltip, Spinner, Alert} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../layout-components/seo/seo";
import Select from 'react-select'
import { getComponentDetails } from "../../redux/slices/localstorage/LocalStorage";
import * as yup from "yup";
import { useFormik } from "formik";
import { getWebSettings, addWebSetting, clearAddWebSetting, updateWebSetting, clearUpdateWebSetting, clearHasError, uploadLogo, clearUploadLogo} from "../../redux/slices/web-settings/company-setting";
import {
  exportMastersAction,
  clearimportMastersAction,
} from "../../redux/slices/companySetting/companySetting";
import { error } from "./vaidationMessage/formValidationMsg";
import defaultFavicon from "../../../public/assets/img/brand/favicon.png";
import defaultAdminLogin from "../../../public/assets/img/brand/logo-light.png";
import axios from "axios";
import dynamic from "next/dynamic";
import ImportSqlSourceFile from "../companySettingModal/companySettingModal";
import {
  logOutData,
  clearlogOutData,
} from "../../redux/slices/authentication/Auth";

const FileUploader = dynamic(
  () => {
    return import("./fileuploads/fileuploader");
  },
  { ssr: false },
);
import { FilePath } from "./fileuploads/filepath";
import { useRouter } from "next/router";

const CompanySettingsCommon = ({ isSL }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [oneClick, setOneClick] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(false);
  const [isDefaultFavicon, setIsDefaultFavicon] = useState(false);
  const [otp_verification, setisotp_verification] = useState(false);
  const [component_approval, setiscomponent_approval] = useState(true);
  const [scenario_approval, setisscenario_approval] = useState(true);
  const [isDefaultPanel, setIsDefaultPanel] = useState(false);
  const [isDefaultWeb, setIsDefaultWeb] = useState(false);
  const [showListImort, setShowListImport] = useState(true);
  const [openImportModal, setOpenImportModal] = useState(false);
  const favicon_path = (FilePath?.logos).replace("{name}", "Favicon");
  const panel_path = (FilePath?.logos).replace("{name}", "AdminPanelLogo");
  const web_path = (FilePath?.logos).replace("{name}", "WebPanelLogo");
  let navigate = useRouter();

  const {
    cmpSettingData,
    addDataResp,
    updateDataResp,
    componentData,
    errorData,
    uploadLogoResp,
    hasExportSucc,
    importStatus,
    logoutData,
  } = useSelector((data) => {
    return {
      cmpSettingData:
        data &&
        data.companySetting &&
        data.companySetting.cmpSettingData &&
        data.companySetting.cmpSettingData.data,
      addDataResp:
        data && data.companySetting && data.companySetting.addDataResp,
      updateDataResp:
        data && data.companySetting && data.companySetting.updateDataResp,
      uploadLogoResp:
        data && data.companySetting && data.companySetting.uploadLogoResp,
      componentData: data && data.localData && data.localData.componentData,
      hasExportSucc:
        data && data.company_setting && data.company_setting.exportResp,
      importStatus:
        data && data.company_setting && data.company_setting.importResp,
      logoutData: data && data.authData && data.authData.logout,
      errorData: data && data.companySetting && data.companySetting.error,
    };
  });

const clusterMethodOptions = [
  { value: "RoundRobin", label: "Round Robin" },
  { value: "LeastLoaded", label: "Least Loaded" },
  { value: "Weighted", label: "Weighted" },
  { value: "Threshold", label: "Threshold" },
];

  useEffect(() => {
    dispatch(getWebSettings());
    dispatch(getComponentDetails("/company-setting"));
    return () => {
      dispatch(clearlogOutData());
    };
  }, []);

  useEffect(() => {
    if (cmpSettingData) {
      setIsDefaultFavicon(
        cmpSettingData?.is_default_favicon == "false" ? false : true,
      );
      setIsDefaultPanel(
        cmpSettingData?.is_default_ad_logo == "false" ? false : true,
      );
      setIsDefaultWeb(
        cmpSettingData?.is_default_web_logo == "false" ? false : true,
      );
      setisotp_verification(
        cmpSettingData?.otp_verification == "false" ? false : true,
      );
      setiscomponent_approval(
        cmpSettingData?.component_approval == "true" ? true : false,
        // -----
      );
      setisscenario_approval(
        cmpSettingData?.scenario_approval == "true" ? true : false,
        // -----
      );
    }
  }, [cmpSettingData]);

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
              },
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
            },
          );
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  useEffect(() => {
    if (logoutData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          Configuration applied. Please log in again to continue using the
          system.
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      const signOut = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("menus");
        localStorage.clear();
        setTimeout(() => {
          document.body.classList.remove("dark-theme");
          setOneClick(false);
          navigate.replace("/admin-login", "", { shallow: true });
        }, 5000);
      };
      dispatch(clearlogOutData());
      signOut();
    }
  }, [logoutData]);

  useEffect(() => {
    if (addDataResp?.statusCode) {
      if (isSL) {
        dispatch(logOutData());
      } else {
        setOneClick(false);
        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
            {addDataResp?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: false,
            theme: "colored",
          },
        );
        dispatch(getWebSettings());
      }
      dispatch(clearAddWebSetting());
    }
  }, [addDataResp]);

  useEffect(() => {
    if (updateDataResp?.statusCode) {
      if (isSL) {
        dispatch(logOutData());
      } else {
        setOneClick(false);
        toast.success(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
            {updateDataResp?.message}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: false,
            theme: "colored",
          },
        );
        dispatch(getWebSettings());
      }
      dispatch(clearUpdateWebSetting());
    }
  }, [updateDataResp]);

  useEffect(() => {
    if (!importStatus) return;

    if (importStatus.message && !importStatus.error) {
      //  Success
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {importStatus.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );

      // close modal AFTER toast
      handleImportModal();
    } else if (importStatus.error) {
      //  Error
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {importStatus.error}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
    }

    // clear redux state after handling
    dispatch(clearimportMastersAction());
  }, [importStatus, dispatch]);

  useEffect(() => {
    if (uploadLogoResp?.statusCode) {
      setOneClick(false);
      setUploadedFile(false);
      dispatch(clearUploadLogo());
    }
  }, [uploadLogoResp]);

  const customStyles = {
    control: (styles, { isFocused, isDisabled }) => ({
      ...styles,
      borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#1f1f1f",
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
      !formValidation.values[fieldName] &&
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

  const formValidation = useFormik({
    enableReinitialize: true,
    // initialValues: {
    //   id: cmpSettingData?.id ? cmpSettingData?.id : 0,
    //   name: cmpSettingData?.name ? cmpSettingData?.name : "",
    //   phone_number: cmpSettingData?.phone_number
    //     ? cmpSettingData?.phone_number
    //     : "",
    //   website: cmpSettingData?.website ? cmpSettingData?.website : "",
    //   otp_verification: cmpSettingData?.otp_verification
    //     ? cmpSettingData?.otp_verification
    //     : "",

    //   component_approval: cmpSettingData?.component_approval
    //     ? cmpSettingData?.component_approval
    //     : "",
    //   scenario_approval: cmpSettingData?.scenario_approval
    //     ? cmpSettingData?.scenario_approval
    //     : "",
    //   // -----
    //   max_questions: cmpSettingData?.max_questions
    //     ? cmpSettingData?.max_questions
    //     : "",

    //   email: cmpSettingData?.email ? cmpSettingData?.email : "",
    //   system_name: cmpSettingData?.system_name
    //     ? cmpSettingData?.system_name
    //     : "",
    //   system_footer: cmpSettingData?.system_footer
    //     ? cmpSettingData?.system_footer
    //     : "",
    //   proxmox_alert_time: cmpSettingData?.proxmox_alert_time
    //     ? cmpSettingData?.proxmox_alert_time
    //     : "",
    //   proxmox_email_sent: cmpSettingData?.proxmox_email_sent
    //     ? cmpSettingData?.proxmox_email_sent
    //     : "",
    //   termination_delay: cmpSettingData?.termination_delay
    //     ? cmpSettingData?.termination_delay
    //     : "",
    //   configuration_delay: cmpSettingData?.configuration_delay
    //     ? cmpSettingData?.configuration_delay
    //     : "",
    //   cloning_delay: cmpSettingData?.cloning_delay
    //     ? cmpSettingData?.cloning_delay
    //     : "",
    //   hibernate_delay: cmpSettingData?.hibernate_delay
    //     ? cmpSettingData?.hibernate_delay
    //     : "",
    //   pause_limit: cmpSettingData?.pause_limit
    //     ? cmpSettingData?.pause_limit
    //     : "",
    //   max_ports: cmpSettingData?.max_ports
    //     ? cmpSettingData?.max_ports
    //     : "",
    //   address: cmpSettingData?.address ? cmpSettingData?.address : "",
    //   favicon: cmpSettingData?.favicon ? cmpSettingData?.favicon : "",
    //   admin_panel_logo: cmpSettingData?.admin_panel_logo
    //     ? cmpSettingData?.admin_panel_logo
    //     : "",
    //   web_panel_logo: cmpSettingData?.web_panel_logo
    //     ? cmpSettingData?.web_panel_logo
    //     : "",
    //   expiry_date: "",
    //   license_key: "",
    //   domail_url: "",
    // },

    initialValues: {
      id: cmpSettingData?.id ? cmpSettingData?.id : 0,
      name: cmpSettingData?.name ? cmpSettingData?.name : "",
      phone_number: cmpSettingData?.phone_number
        ? cmpSettingData?.phone_number
        : "",
      email: cmpSettingData?.email ? cmpSettingData?.email : "",
      address: cmpSettingData?.address ? cmpSettingData?.address : "",
      website: cmpSettingData?.website ? cmpSettingData?.website : "",

      system_name: cmpSettingData?.system_name
        ? cmpSettingData?.system_name
        : "",
      system_footer: cmpSettingData?.system_footer
        ? cmpSettingData?.system_footer
        : "",

      domain_url: cmpSettingData?.domain_url ? cmpSettingData?.domain_url : "",
      license_key: cmpSettingData?.license_key
        ? cmpSettingData?.license_key
        : "",

      otp_verification: cmpSettingData?.otp_verification
        ? cmpSettingData?.otp_verification
        : false,
      component_approval: cmpSettingData?.component_approval
        ? cmpSettingData?.component_approval
        : true,
      scenario_approval: cmpSettingData?.scenario_approval
        ? cmpSettingData?.scenario_approval
        : true,

      base_clone_vmid: cmpSettingData?.base_clone_vmid
        ? cmpSettingData?.base_clone_vmid
        : "",
      template_clone_vmid: cmpSettingData?.template_clone_vmid
        ? cmpSettingData?.template_clone_vmid
        : "",
      start_network_id: cmpSettingData?.start_network_id
        ? cmpSettingData?.start_network_id
        : "",
      cluster_task_type: cmpSettingData?.cluster_task_type
        ? cmpSettingData?.cluster_task_type
        : "",

      max_questions: cmpSettingData?.max_questions
        ? cmpSettingData?.max_questions
        : "",

      proxmox_current_node: cmpSettingData?.proxmox_current_node
        ? cmpSettingData?.proxmox_current_node
        : "",
      proxmox_other_node: cmpSettingData?.proxmox_other_node
        ? cmpSettingData?.proxmox_other_node
        : "",
      proxmox_host: cmpSettingData?.proxmox_host
        ? cmpSettingData?.proxmox_host
        : "",
      proxmox_username: cmpSettingData?.proxmox_username
        ? cmpSettingData?.proxmox_username
        : "",
      proxmox_password: cmpSettingData?.proxmox_password
        ? cmpSettingData?.proxmox_password
        : "",

      file_server_username: cmpSettingData?.file_server_username
        ? cmpSettingData?.file_server_username
        : "",
      file_server_password: cmpSettingData?.file_server_password
        ? cmpSettingData?.file_server_password
        : "",

      proxmox_alert_time: cmpSettingData?.proxmox_alert_time
        ? cmpSettingData?.proxmox_alert_time
        : "",
      proxmox_email_sent: cmpSettingData?.proxmox_email_sent
        ? cmpSettingData?.proxmox_email_sent
        : "",

      termination_delay: cmpSettingData?.termination_delay
        ? cmpSettingData?.termination_delay
        : "",
      configuration_delay: cmpSettingData?.configuration_delay
        ? cmpSettingData?.configuration_delay
        : "",
      cloning_delay: cmpSettingData?.cloning_delay
        ? cmpSettingData?.cloning_delay
        : "",
      hibernate_delay: cmpSettingData?.hibernate_delay
        ? cmpSettingData?.hibernate_delay
        : "",

      pause_limit: cmpSettingData?.pause_limit
        ? cmpSettingData?.pause_limit
        : "",
      max_ports: cmpSettingData?.max_ports ? cmpSettingData?.max_ports : "",

      favicon: cmpSettingData?.favicon ? cmpSettingData?.favicon : "",
      admin_panel_logo: cmpSettingData?.admin_panel_logo
        ? cmpSettingData?.admin_panel_logo
        : "",
      web_panel_logo: cmpSettingData?.web_panel_logo
        ? cmpSettingData?.web_panel_logo
        : "",
    },
    validationSchema: yup.object().shape({
      name: yup.string().required(error?.required),
      system_name: yup.string().required(error?.required),
      system_footer: yup.string().required(error?.required),

      pause_limit: yup
        .number()
        .typeError("Pause limit must be a number")
        .integer("Pause limit must be an integer")
        .min(2, "Pause limit must be greater than or equal to 2")
        .required(error?.required),
      max_ports: yup
        .number()
        .typeError("Pause limit must be a number")
        .integer("Pause limit must be an integer")
        .max(16, "Maximum port limit should not exceed 16")
        .min(1, "Minimum port limit should be 1")
        .required(error?.required),
    }),

    onSubmit: (data, action) => {
      const payload = {
        id: data?.id ? data?.id : 0,

        name: data?.name ? data?.name : "",
        phone_number: data?.phone_number ? data?.phone_number : "",
        email: data?.email ? data?.email : "",
        address: data?.address ? data?.address : "",
        website: data?.website ? data?.website : "",

        system_name: data?.system_name ? data?.system_name : "",
        system_footer: data?.system_footer ? data?.system_footer : "",

        domain_url: data?.domain_url ? data?.domain_url : "",
        license_key: data?.license_key ? data?.license_key : "",

        otp_verification: data?.otp_verification.toString(),
        component_approval: data?.component_approval.toString(),
        scenario_approval: data?.scenario_approval.toString(),

        base_clone_vmid: data?.base_clone_vmid ? data?.base_clone_vmid : "",
        template_clone_vmid: data?.template_clone_vmid
          ? data?.template_clone_vmid
          : "",
        start_network_id: data?.start_network_id ? data?.start_network_id : "",
        cluster_task_type: data?.cluster_task_type
          ? data?.cluster_task_type
          : "",

        max_questions: data?.max_questions ? data?.max_questions : "",

        proxmox_current_node: data?.proxmox_current_node
          ? data?.proxmox_current_node
          : "",
        proxmox_other_node: data?.proxmox_other_node
          ? data?.proxmox_other_node
          : "",
        proxmox_host: data?.proxmox_host ? data?.proxmox_host : "",
        proxmox_username: data?.proxmox_username ? data?.proxmox_username : "",
        proxmox_password: data?.proxmox_password ? data?.proxmox_password : "",

        file_server_username: data?.file_server_username
          ? data?.file_server_username
          : "",
        file_server_password: data?.file_server_password
          ? data?.file_server_password
          : "",

        proxmox_alert_time: data?.proxmox_alert_time
          ? data?.proxmox_alert_time
          : "",
        proxmox_email_sent: data?.proxmox_email_sent
          ? data?.proxmox_email_sent
          : "",

        termination_delay: data?.termination_delay
          ? data?.termination_delay
          : "",
        configuration_delay: data?.configuration_delay
          ? data?.configuration_delay
          : "",
        cloning_delay: data?.cloning_delay ? data?.cloning_delay : "",
        hibernate_delay: data?.hibernate_delay ? data?.hibernate_delay : "",

        pause_limit: data?.pause_limit ? data?.pause_limit : "",
        max_ports: data?.max_ports ? data?.max_ports : "",

        favicon: isDefaultFavicon ? "" : data?.favicon || "",
        admin_panel_logo: isDefaultPanel ? "" : data?.admin_panel_logo || "",
        web_panel_logo: isDefaultWeb ? "" : data?.web_panel_logo || "",

        is_default_favicon: isDefaultFavicon.toString(),
        is_default_ad_logo: isDefaultPanel.toString(),
        is_default_web_logo: isDefaultWeb.toString(),
      };
      if (data?.id == 0) {
        dispatch(addWebSetting(payload));
      } else {
        dispatch(updateWebSetting(payload));
      }
      setOneClick(true);
    },
  });

  const handleUpload = (name = "", files = "", flag = "") => {
    formValidation.setFieldValue(name, files[0]?.file ? files[0]?.file : "");
    setUploadedFile(
      files && files.length > 0 && files[0]?.file ? files[0]?.file : {},
    );
    formValidation.setFieldValue("flag", flag);
  };

  useEffect(() => {
    if (typeof uploadedFile == "string") {
      let payload = {
        id: cmpSettingData?.id ? cmpSettingData?.id : 0,
        favicon: isDefaultFavicon ? "" : formValidation.values.favicon,
        admin_panel_logo: isDefaultPanel
          ? ""
          : formValidation.values.admin_panel_logo,
        web_panel_logo: isDefaultWeb
          ? ""
          : formValidation.values.web_panel_logo,
        flag: formValidation.values.flag,
        is_default_favicon: isDefaultFavicon.toString(),
        is_default_ad_logo: isDefaultPanel.toString(),
        is_default_web_logo: isDefaultWeb.toString(),
      };
      dispatch(uploadLogo(payload));
      setOneClick(true);
    }
  }, [uploadedFile]);

  const handleExport = async () => {
    try {
      // wait for the blob from thunk
      const blob = await dispatch(exportMastersAction());

      // Create downloadable file
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = `masters_export.sql`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("Export successful:", fileName);
    } catch (error) {
      console.error("Export failed:", error.response || error);
      alert(`Failed to export data: ${error.message}`);
    }
  };

  const handleImportModal = () => {
    setOpenImportModal(!openImportModal);
  };

  function TagInput({ name, value, onChange, placeholder, disabled = false }) {
    const [inputVal, setInputVal] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    const tags = value ? value.split(",").filter(Boolean) : [];

    const addTag = (raw) => {
      if (disabled) return; // ← block adding
      const val = raw.trim().replace(/,+$/, "").trim();
      if (!val) return;
      if (tags.includes(val)) {
        setError(`"${val}" is already added`);
        setTimeout(() => setError(""), 2000);
        return;
      }
      const newVal = [...tags, val].join(",");
      onChange({ target: { name, value: newVal } }); // works with formik handleChange
      setError("");
    };

    const removeTag = (tag) => {
      if (disabled) return;
      const newVal = tags.filter((t) => t !== tag).join(",");
      onChange({ target: { name, value: newVal } });
    };

    const handleKeyDown = (e) => {
      // if (disabled) return;
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputVal);
        setInputVal("");
      }
      if (e.key === "Backspace" && inputVal === "" && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    };

    const handleBlur = () => {
      if (inputVal.trim()) {
        addTag(inputVal);
        setInputVal("");
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      e.clipboardData
        .getData("text")
        .split(",")
        .forEach((v) => {
          if (v.trim()) addTag(v);
        });
      setInputVal("");
    };

    return (
      <div
        className={`tag-input-wrapper form-control d-flex flex-wrap gap-1 align-items-center ${error ? "is-invalid" : ""}`}
        style={{
          height: "auto",
          minHeight: "42px",
          cursor: "text",
          padding: "5px 10px",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="badge d-inline-flex align-items-center gap-1"
            style={{
              background: "#E6F1FB",
              color: "#0C447C",
              border: "0.5px solid #B5D4F4",
              borderRadius: "999px",
              fontWeight: 500,
              fontSize: "12px",
              padding: "3px 8px",
            }}
          >
            <i className="fa fa-server" style={{ fontSize: "11px" }} />
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "#185FA5",
                  lineHeight: 1,
                }}
                aria-label={`Remove ${tag}`}
              >
                <i className="fa fa-times" style={{ fontSize: "11px" }} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? placeholder : ""}
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            minWidth: "140px",
            background: "transparent",
            fontSize: "14px",
          }}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <>
      <Seo title="Company Setting" />
      <ToastContainer />
      <Card className="custom-card overflow-hidden">
        <Card.Body>
          <Row className="row-sm">
            <Col md={12}>
              <Form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  formValidation.handleSubmit();
                  return false;
                }}
              >
                <Card
                  className=""
                  style={{
                    border: "2px dashed #666769",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="position-absolute px-3 py-1 bg-white fw-semibold text-primary"
                    style={{
                      top: "-15px",
                      left: "20px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Company Settings
                  </div>

                  <Card.Body>
                    <Row className="mb-3 mt-3">
                      {/* Customer / Company */}
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>
                          Customer/Company Name{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          autoComplete="off"
                          placeholder="Enter name"
                          onChange={(e) => {
                            formValidation.handleChange(e);
                          }}
                          value={formValidation.values.name}
                          isInvalid={
                            formValidation.touched.name &&
                            formValidation.errors.name
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.name}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>Customer/Company Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="phone_number"
                          autoComplete="off"
                          placeholder="Enter Phone Number"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.phone_number}
                          isInvalid={
                            formValidation.touched.phone_number &&
                            formValidation.errors.phone_number
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.phone_number}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>Customer/Company Email</Form.Label>
                        <Form.Control
                          type="text"
                          name="email"
                          autoComplete="off"
                          placeholder="Enter email"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.email}
                          isInvalid={
                            formValidation.touched.email &&
                            formValidation.errors.email
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.email}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>Customer/Company Address</Form.Label>
                        <Form.Control
                          type="text"
                          name="address"
                          autoComplete="off"
                          placeholder="Enter Company Address"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.address}
                          isInvalid={
                            formValidation.touched.address &&
                            formValidation.errors.address
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.address}
                        </Form.Control.Feedback>
                      </Form.Group>

                      {/* System */}
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>
                          System Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="system_name"
                          autoComplete="off"
                          placeholder="Enter system name"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.system_name}
                          isInvalid={
                            formValidation.touched.system_name &&
                            formValidation.errors.system_name
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.system_name}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>
                          System Footer <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="system_footer"
                          autoComplete="off"
                          placeholder="Enter system footer"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.system_footer}
                          isInvalid={
                            formValidation.touched.system_footer &&
                            formValidation.errors.system_footer
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.system_footer}
                        </Form.Control.Feedback>
                      </Form.Group>

                      {/* Quiz / Website */}
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>
                          Quiz Max Question Limit{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="max_questions"
                          autoComplete="off"
                          placeholder="Enter Maximum Questions"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.max_questions}
                          isInvalid={
                            formValidation.touched.max_questions &&
                            formValidation.errors.max_questions
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.max_questions}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>Website Url </Form.Label>
                        <Form.Control
                          type="text"
                          name="website"
                          autoComplete="off"
                          placeholder="Enter website url"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.website}
                          isInvalid={
                            formValidation.touched.website &&
                            formValidation.errors.website
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.website}
                        </Form.Control.Feedback>
                      </Form.Group>

                      {/* Toggles */}

                      <Form.Group
                        as={Col}
                        md="4"
                        controlId="validationFormikOtp"
                        className="my-4"
                      >
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Label className="mb-0">
                            Auto Approval for a Master Component
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Auto Approval for a Master Component
                              </Tooltip>
                            }
                          >
                            <label className="custom-switch mb-0">
                              <input
                                type="checkbox"
                                className="custom-switch-input"
                                checked={component_approval}
                                onChange={(e) => {
                                  setiscomponent_approval(!component_approval);
                                  formValidation.setFieldValue(
                                    "component_approval",
                                    e.target.checked,
                                  );
                                }}
                              />
                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                            </label>
                          </OverlayTrigger>
                        </div>
                      </Form.Group>
                      <Form.Group
                        as={Col}
                        md="4"
                        controlId="validationFormikOtp"
                        className="my-4"
                      >
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Label className="mb-0">
                            Auto Approval for a Master Scenario
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Auto Approval for a Master Scenario
                              </Tooltip>
                            }
                          >
                            <label className="custom-switch mb-0">
                              <input
                                type="checkbox"
                                className="custom-switch-input"
                                checked={scenario_approval}
                                onChange={(e) => {
                                  setisscenario_approval(!scenario_approval);
                                  formValidation.setFieldValue(
                                    "scenario_approval",
                                    e.target.checked,
                                  );
                                }}
                              />
                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                            </label>
                          </OverlayTrigger>
                        </div>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlId="validationFormikOtp"
                        className="my-4"
                      >
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Label className="mb-0">
                            OTP Verification Required
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Toggle OTP Requirement</Tooltip>}
                          >
                            <label className="custom-switch mb-0">
                              <input
                                type="checkbox"
                                className="custom-switch-input"
                                checked={otp_verification}
                                onChange={(e) => {
                                  setisotp_verification(!otp_verification);
                                  formValidation.setFieldValue(
                                    "otp_verification",
                                    e.target.checked,
                                  );
                                }}
                              />
                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                            </label>
                          </OverlayTrigger>
                        </div>
                      </Form.Group>

                      {!isSL && (
                        <>
                          <Form.Group as={Col} md="4" className="my-4">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-2">
                                <Form.Label className="mb-0">
                                  Export Master Data
                                </Form.Label>

                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip>
                                      Export the Masters of Scenario, Component,
                                      Component Category, Scenario Category and
                                      Scenario Subcategory
                                    </Tooltip>
                                  }
                                >
                                  <i
                                    className="fa fa-info-circle text-dark"
                                    style={{ cursor: "pointer" }}
                                  ></i>
                                </OverlayTrigger>
                              </div>

                              <Button
                                type="button"
                                variant="outline-info"
                                onClick={() => handleExport()}
                              >
                                <i className="fa fa-file-excel-o"></i> Export
                              </Button>
                            </div>
                          </Form.Group>
                          <Form.Group as={Col} md="4" className="my-4">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-2">
                                <Form.Label className="mb-0">
                                  Import Master Data
                                </Form.Label>

                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip>
                                      Import the Masters of Scenario, Component,
                                      Component Category, Scenario Category and
                                      Scenario Subcategory
                                    </Tooltip>
                                  }
                                >
                                  <i
                                    className="fa fa-info-circle text-dark"
                                    style={{ cursor: "pointer" }}
                                  ></i>
                                </OverlayTrigger>
                              </div>

                              <Button
                                type="button"
                                variant="outline-warning"
                                onClick={() => {
                                  setShowListImport(true);
                                  handleImportModal();
                                }}
                              >
                                <i className="fa fa-file-excel-o"></i> Import
                              </Button>
                            </div>
                          </Form.Group>
                        </>
                      )}
                    </Row>
                  </Card.Body>
                </Card>

                <Card
                  className="mb-4 mt-4"
                  style={{
                    border: "2px dashed #666769",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="position-absolute px-3 py-1 bg-white fw-semibold text-primary"
                    style={{
                      top: "-15px",
                      left: "20px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    SiberSim Settings
                  </div>

                  <Card.Body>
                    <Row className="mt-3">
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Delay Bettwen Two Component Cloning (Sec)
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Cloning delay between the components in seconds.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="cloning_delay"
                          autoComplete="off"
                          placeholder="Enter Cloning Delay"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.cloning_delay}
                          isInvalid={
                            formValidation.touched.cloning_delay &&
                            formValidation.errors.cloning_delay
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.cloning_delay}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>Configuration Delay (Sec)</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Configuration delay between cloning and
                                Configuration the process in seconds.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="configuration_delay"
                          autoComplete="off"
                          placeholder="Enter system footer"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.configuration_delay}
                          isInvalid={
                            formValidation.touched.configuration_delay &&
                            formValidation.errors.configuration_delay
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.configuration_delay}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>Hibernate Delay (Sec)</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Hibernate delay between the components in
                                seconds.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="hibernate_delay"
                          autoComplete="off"
                          placeholder="Enter system footer"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.hibernate_delay}
                          isInvalid={
                            formValidation.touched.hibernate_delay &&
                            formValidation.errors.hibernate_delay
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.hibernate_delay}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>Termination Delay (Sec)</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Time delay between stopping and terminating the
                                process in seconds.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="termination_delay"
                          autoComplete="off"
                          placeholder="Enter system footer"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.termination_delay}
                          isInvalid={
                            formValidation.touched.termination_delay &&
                            formValidation.errors.termination_delay
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.termination_delay}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Max Hibernate Scenario Limit{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Maximum hibernate limit of scenario.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="pause_limit"
                          autoComplete="off"
                          placeholder="Enter Pause Limit"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.pause_limit}
                          isInvalid={
                            formValidation.touched.pause_limit &&
                            formValidation.errors.pause_limit
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.pause_limit}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>SiberSim Alert Time (Minutes)</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Proxmox Down Notification Delay Time (In Min).
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="proxmox_alert_time"
                          autoComplete="off"
                          placeholder="Enter SiberSim Alert Time"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.proxmox_alert_time}
                          isInvalid={
                            formValidation.touched.proxmox_alert_time &&
                            formValidation.errors.proxmox_alert_time
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.proxmox_alert_time}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>SiberSim Email Sent</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Proxmox Down Notification Send On Mail.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="proxmox_email_sent"
                          autoComplete="off"
                          placeholder="Enter SiberSim Email Sent"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.proxmox_email_sent}
                          isInvalid={
                            formValidation.touched.proxmox_email_sent &&
                            formValidation.errors.proxmox_email_sent
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.proxmox_email_sent}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Maximum Ports <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Maximum number of ports for the manipulation of
                                scenario.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>
                        <Form.Control
                          type="text"
                          name="max_ports"
                          autoComplete="off"
                          placeholder="Enter system footer"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.max_ports}
                          isInvalid={
                            formValidation.touched.max_ports &&
                            formValidation.errors.max_ports
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.max_ports}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Compute Node Identifier{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Proxmox cluster node where virtual machines will
                                be deployed.
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="proxmox_current_node"
                          disabled
                          autoComplete="off"
                          placeholder="Enter compute node"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.proxmox_current_node}
                          isInvalid={
                            formValidation.touched.proxmox_current_node &&
                            formValidation.errors.proxmox_current_node
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.proxmox_current_node}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Host Address <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>Host Address of Proxmox server</Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="proxmox_host"
                          disabled
                          autoComplete="off"
                          placeholder="Enter Host Address"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.proxmox_host}
                          isInvalid={
                            formValidation.touched.proxmox_host &&
                            formValidation.errors.proxmox_host
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.proxmox_host}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Login Username{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                username for Proxmox authentication
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="proxmox_username"
                          autoComplete="off"
                          placeholder="Enter Login Username"
                          disabled
                          onChange={formValidation.handleChange}
                          value={formValidation.values.proxmox_username}
                          isInvalid={
                            formValidation.touched.proxmox_username &&
                            formValidation.errors.proxmox_username
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.proxmox_username}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Login Password{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Secure password for Proxmox access
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="proxmox_password"
                          disabled
                          autoComplete="off"
                          placeholder="Enter Login Password"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.proxmox_password}
                          isInvalid={
                            formValidation.touched.proxmox_password &&
                            formValidation.errors.proxmox_password
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.proxmox_password}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>File Server Username</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Username used to access file storage server
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="file_server_username"
                          disabled
                          autoComplete="off"
                          placeholder="Enter File Server Username"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.file_server_username}
                          isInvalid={
                            formValidation.touched.file_server_username &&
                            formValidation.errors.file_server_username
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.file_server_username}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>File Server Password</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Authentication password for file server access
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="file_server_password"
                          autoComplete="off"
                          placeholder="Enter File Server Password"
                          disabled
                          onChange={formValidation.handleChange}
                          value={formValidation.values.file_server_password}
                          isInvalid={
                            formValidation.touched.file_server_password &&
                            formValidation.errors.file_server_password
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.file_server_password}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Starting VM Identifier (VMID){" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Initial VM ID used for provisioning virtual
                                machines
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="base_clone_vmid"
                          autoComplete="off"
                          disabled
                          placeholder="Enter Starting VM Identifier"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.base_clone_vmid}
                          isInvalid={
                            formValidation.touched.base_clone_vmid &&
                            formValidation.errors.base_clone_vmid
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.base_clone_vmid}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Custom Component VMID Range Start{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Starting point for custom VM ID allocation range
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="template_clone_vmid"
                          autoComplete="off"
                          placeholder="Enter Custom Component VMID Range Start"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.template_clone_vmid}
                          disabled
                          isInvalid={
                            formValidation.touched.template_clone_vmid &&
                            formValidation.errors.template_clone_vmid
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.template_clone_vmid}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Network Segment ID{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Virtual network segment identifier for VM
                                connectivity
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Control
                          type="text"
                          name="start_network_id"
                          autoComplete="off"
                          placeholder="Enter Network Segment ID"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.start_network_id}
                          disabled
                          isInvalid={
                            formValidation.touched.start_network_id &&
                            formValidation.errors.start_network_id
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.start_network_id}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group as={Col} md="4" className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>Other Nodes</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Additional Proxmox cluster nodes
                                (comma-separated)
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            />
                          </OverlayTrigger>
                        </div>

                        <TagInput
                          name="proxmox_other_node"
                          value={formValidation.values.proxmox_other_node}
                          onChange={formValidation.handleChange}
                          placeholder="Type node name, press Enter or ,"
                          disabled={true}
                        />

                        {formValidation.touched.proxmox_other_node &&
                          formValidation.errors.proxmox_other_node && (
                            <div className="invalid-feedback d-block">
                              {formValidation.errors.proxmox_other_node}
                            </div>
                          )}
                      </Form.Group>
                      {/* <Form.Group
                        as={Col}
                        md="4"
                        controlId="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                            Cluster Method{" "}
                            <span className="text-danger">*</span>
                          </Form.Label>

                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Select the load balancing method for the cluster
                              </Tooltip>
                            }
                          >
                            <i
                              className="fa fa-info-circle text-dark"
                              style={{ cursor: "pointer" }}
                            ></i>
                          </OverlayTrigger>
                        </div>

                        <Form.Select
                          name="cluster_task_type"
                          value={formValidation.values.cluster_task_type}
                          onChange={formValidation.handleChange}
                          disabled
                          isInvalid={
                            formValidation.touched.cluster_task_type &&
                            !!formValidation.errors.cluster_task_type
                          }
                        >
                          <option value="">Select Cluster Method</option>
                          <option value="RoundRobin">Round Robin</option>
                          <option value="LeastLoaded">Least Loaded</option>
                          <option value="Weighted">Weighted</option>
                          <option value="Threshold">Threshold</option>
                        </Form.Select>

                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.cluster_task_type}
                        </Form.Control.Feedback>
                      </Form.Group> */}
                      <Form.Group
  as={Col}
  md="4"
  controlid="validationFormik102"
  className="mb-3"
>
  <div className="d-flex justify-content-between align-items-center">
    <Form.Label>
      Cluster Method <span className="text-danger">*</span>
    </Form.Label>

    <OverlayTrigger
      placement="bottom"
      overlay={
        <Tooltip>
          Select the load balancing method for the cluster
        </Tooltip>
      }
    >
      <i
        className="fa fa-info-circle text-dark"
        style={{ cursor: "pointer" }}
      ></i>
    </OverlayTrigger>
  </div>

  <Select
    theme={(theme) => ({
      ...theme,
      colors: {
        ...theme.colors,
        primary25: "var(--primary-bg-color)",
        primary: "var(--primary-bg-color)",
      },
    })}
    name="cluster_task_type"
    styles={getSelectStyles("cluster_task_type")}
    value={
      clusterMethodOptions.find(
        (x) => x.value === formValidation.values.cluster_task_type
      ) || null
    }
    options={clusterMethodOptions}
    getOptionLabel={(x) => x.label}
    getOptionValue={(x) => x.value}
    placeholder="Select Cluster Method"
    isDisabled
    onChange={(e) => {
      console.log("Selected:", e);
      formValidation.setFieldValue("cluster_task_type", e.value);
    }}
    menuPosition="fixed"
  />
  {formValidation.errors.cluster_task_type && formValidation.touched.cluster_task_type && (
    <div className="invalid-tooltiped">
      {formValidation.errors.cluster_task_type}
    </div>
  )}
</Form.Group>

                      {isSL && (
                        <>
                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>
                                Compute Node Identifier{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Proxmox cluster node where virtual machines
                                    will be deployed.
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="proxmox_current_node"
                              autoComplete="off"
                              placeholder="Enter compute node"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.proxmox_current_node}
                              isInvalid={
                                formValidation.touched.proxmox_current_node &&
                                formValidation.errors.proxmox_current_node
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.proxmox_current_node}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>
                                Host Address{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>Host address of server</Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="proxmox_host"
                              autoComplete="off"
                              placeholder="Enter Host Address"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.proxmox_host}
                              isInvalid={
                                formValidation.touched.proxmox_host &&
                                formValidation.errors.proxmox_host
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.proxmox_host}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>
                                Login Username{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    username for Proxmox authentication
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="proxmox_username"
                              autoComplete="off"
                              placeholder="Enter Login Username"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.proxmox_username}
                              isInvalid={
                                formValidation.touched.proxmox_username &&
                                formValidation.errors.proxmox_username
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.proxmox_username}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>
                                Login Password{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Secure password for Proxmox access
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="proxmox_password"
                              autoComplete="off"
                              placeholder="Enter Login Password"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.proxmox_password}
                              isInvalid={
                                formValidation.touched.proxmox_password &&
                                formValidation.errors.proxmox_password
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.proxmox_password}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>File Server Username</Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Username used to access file storage server
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="file_server_username"
                              autoComplete="off"
                              placeholder="Enter File Server Username"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.file_server_username}
                              isInvalid={
                                formValidation.touched.file_server_username &&
                                formValidation.errors.file_server_username
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.file_server_username}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>File Server Password</Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Authentication password for file server
                                    access
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="file_server_password"
                              autoComplete="off"
                              placeholder="Enter File Server Password"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.file_server_password}
                              isInvalid={
                                formValidation.touched.file_server_password &&
                                formValidation.errors.file_server_password
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.file_server_password}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>
                                Starting VM Identifier (VMID){" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Initial VM ID used for provisioning virtual
                                    machines
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="base_clone_vmid"
                              autoComplete="off"
                              placeholder="Starting VM Identifier (VMID)"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.base_clone_vmid}
                              isInvalid={
                                formValidation.touched.base_clone_vmid &&
                                formValidation.errors.base_clone_vmid
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.base_clone_vmid}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>
                                Custom Component VMID Range Start{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Starting point for custom VM ID allocation
                                    range
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="template_clone_vmid"
                              autoComplete="off"
                              placeholder="Enter Custom Component VMID Range Start"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.template_clone_vmid}
                              isInvalid={
                                formValidation.touched.template_clone_vmid &&
                                formValidation.errors.template_clone_vmid
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.template_clone_vmid}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group
                            as={Col}
                            md="4"
                            controlid="validationFormik102"
                            className="mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>
                                Network Segment ID{" "}
                                <span className="text-danger">*</span>
                              </Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Virtual network segment identifier for VM
                                    connectivity
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                ></i>
                              </OverlayTrigger>
                            </div>

                            <Form.Control
                              type="text"
                              name="start_network_id"
                              autoComplete="off"
                              placeholder="Enter Network Segment ID"
                              onChange={formValidation.handleChange}
                              value={formValidation.values.start_network_id}
                              isInvalid={
                                formValidation.touched.start_network_id &&
                                formValidation.errors.start_network_id
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formValidation.errors.start_network_id}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group as={Col} md="4" className="mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Label>Other Nodes</Form.Label>
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip>
                                    Additional Proxmox cluster nodes
                                    (comma-separated)
                                  </Tooltip>
                                }
                              >
                                <i
                                  className="fa fa-info-circle text-dark"
                                  style={{ cursor: "pointer" }}
                                />
                              </OverlayTrigger>
                            </div>

                            <TagInput
                              name="proxmox_other_node"
                              value={formValidation.values.proxmox_other_node}
                              onChange={formValidation.handleChange}
                              placeholder="Type node name, press Enter or ,"
                            />

                            {formValidation.touched.proxmox_other_node &&
                              formValidation.errors.proxmox_other_node && (
                                <div className="invalid-feedback d-block">
                                  {formValidation.errors.proxmox_other_node}
                                </div>
                              )}
                          </Form.Group>

                                              <Form.Group
  as={Col}
  md="4"
  controlid="validationFormik102"
  className="mb-3"
>
  <div className="d-flex justify-content-between align-items-center">
    <Form.Label>
      Cluster Method <span className="text-danger">*</span>
    </Form.Label>

    <OverlayTrigger
      placement="bottom"
      overlay={
        <Tooltip>
          Select the load balancing method for the cluster
        </Tooltip>
      }
    >
      <i
        className="fa fa-info-circle text-dark"
        style={{ cursor: "pointer" }}
      ></i>
    </OverlayTrigger>
  </div>

  <Select
    theme={(theme) => ({
      ...theme,
      colors: {
        ...theme.colors,
        primary25: "var(--primary-bg-color)",
        primary: "var(--primary-bg-color)",
      },
    })}
    name="cluster_task_type"
    styles={getSelectStyles("cluster_task_type")}
    value={
      clusterMethodOptions.find(
        (x) => x.value === formValidation.values.cluster_task_type
      ) || null
    }
    options={clusterMethodOptions}
    getOptionLabel={(x) => x.label}
    getOptionValue={(x) => x.value}
    placeholder="Select Cluster Method"
    onChange={(e) => {
      console.log("Selected:", e);
      formValidation.setFieldValue("cluster_task_type", e.value);
    }}
    menuPosition="fixed"
  />
  {formValidation.errors.cluster_task_type && formValidation.touched.cluster_task_type && (
    <div className="invalid-tooltiped">
      {formValidation.errors.cluster_task_type}
    </div>
  )}
</Form.Group>
                        </>
                      )}
                    </Row>
                  </Card.Body>
                </Card>

                <Card
                  className="mb-4 mt-4"
                  style={{
                    border: "2px dashed #666769",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="position-absolute px-3 py-1 bg-white fw-semibold text-primary"
                    style={{
                      top: "-15px",
                      left: "20px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Logo Settings
                  </div>
                  <Card.Body>
                    <Row>
                      <Col md={12} className="">
                        <Alert>
                          Note: For optimal UI experience, the logo will be
                          sized at 190px * 42px
                        </Alert>
                      </Col>
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label className="d-flex justify-content-between">
                          <span>Favicon</span>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Use Default</Tooltip>}
                          >
                            <label className="custom-switch">
                              <input
                                type="checkbox"
                                name="custom-switch-checkbox1"
                                className="custom-switch-input"
                                checked={isDefaultFavicon}
                                onChange={() => {
                                  setIsDefaultFavicon(!isDefaultFavicon);
                                  formValidation.setFieldValue("favicon", "");
                                }}
                              />
                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                            </label>
                          </OverlayTrigger>
                        </Form.Label>
                        <FileUploader
                          folderpath={favicon_path}
                          ismulti={false}
                          name="favicon"
                          acceptedFileTypes={["image/png", "image/jpeg"]}
                          handleUpload={handleUpload}
                          fetchfiles={[formValidation.values.favicon]}
                          disabled={isDefaultFavicon}
                        />
                        <div className="picture avatar-lg online text-center mt-2">
                          <div className="pointer overflow-hidden">
                            {isDefaultFavicon && (
                              <img
                                alt="SIMMaster Panel Logo Preview"
                                src={`${defaultFavicon.src}`}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}
                              />
                            )}
                            {formValidation.values.favicon &&
                              formValidation.values.favicon != "" && (
                                <img
                                  alt="SIMMaster Panel Logo Preview"
                                  src={`${process.env.API_URL_FILEMANAGER}${formValidation.values.favicon}`}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = defaultFavicon.src;
                                  }}
                                  style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "100%",
                                  }}
                                />
                              )}
                          </div>
                        </div>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label className="d-flex justify-content-between">
                          <span>SIMMaster and SIMManager panel logo</span>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Use Default</Tooltip>}
                          >
                            <label className="custom-switch">
                              <input
                                type="checkbox"
                                name="custom-switch-checkbox1"
                                className="custom-switch-input"
                                checked={isDefaultPanel}
                                onChange={() => {
                                  setIsDefaultPanel(!isDefaultPanel);
                                  formValidation.setFieldValue(
                                    "admin_panel_logo",
                                    "",
                                  );
                                }}
                              />
                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                            </label>
                          </OverlayTrigger>
                        </Form.Label>
                        <FileUploader
                          folderpath={panel_path}
                          ismulti={false}
                          name="admin_panel_logo"
                          acceptedFileTypes={["image/png", "image/jpeg"]}
                          handleUpload={handleUpload}
                          fetchfiles={[formValidation.values.admin_panel_logo]}
                          disabled={isDefaultPanel}
                        />
                        <div className="picture avatar-lg online text-center mt-2">
                          <div className="pointer overflow-hidden">
                            {isDefaultPanel && (
                              <img
                                alt="SIMMaster Panel Logo Preview"
                                src={`${defaultAdminLogin.src}`}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}
                              />
                            )}
                            {formValidation.values.admin_panel_logo &&
                              formValidation.values.admin_panel_logo != "" && (
                                <img
                                  alt="SIMMaster Panel Logo Preview"
                                  src={`${process.env.API_URL_FILEMANAGER}${formValidation.values.admin_panel_logo}`}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = defaultAdminLogin.src;
                                  }}
                                  style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "100%",
                                  }}
                                />
                              )}
                          </div>
                        </div>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label className="d-flex justify-content-between">
                          <span>SIMUser Panel logo</span>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Use Default</Tooltip>}
                          >
                            <label className="custom-switch">
                              <input
                                type="checkbox"
                                name="custom-switch-checkbox1"
                                className="custom-switch-input"
                                checked={isDefaultWeb}
                                onChange={() => {
                                  setIsDefaultWeb(!isDefaultWeb);
                                  formValidation.setFieldValue(
                                    "web_panel_logo",
                                    "",
                                  );
                                }}
                              />
                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                            </label>
                          </OverlayTrigger>
                        </Form.Label>
                        <FileUploader
                          folderpath={web_path}
                          ismulti={false}
                          name="web_panel_logo"
                          acceptedFileTypes={["image/png", "image/jpeg"]}
                          handleUpload={handleUpload}
                          fetchfiles={[formValidation.values.web_panel_logo]}
                          disabled={isDefaultWeb}
                        />
                        <div className="picture avatar-lg online text-center mt-2">
                          <div className="pointer overflow-hidden">
                            {isDefaultWeb && (
                              <img
                                alt="SIMMaster Panel Logo Preview"
                                src={`${defaultAdminLogin.src}`}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}
                              />
                            )}
                            {formValidation.values.web_panel_logo &&
                              formValidation.values.web_panel_logo != "" && (
                                <img
                                  alt="SIMMaster Panel Logo Preview"
                                  src={`${process.env.API_URL_FILEMANAGER}${formValidation.values.web_panel_logo}`}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = defaultAdminLogin.src;
                                  }}
                                  style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "100%",
                                  }}
                                />
                              )}
                          </div>
                        </div>
                      </Form.Group>
                    </Row>
                  </Card.Body>
                </Card>

                <Row>
                  <Col className="d-flex justify-content-end mt-3">
                    {oneClick ? (
                      <Button>
                        <Spinner
                          as="span"
                          animation="grow"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        Loading
                      </Button>
                    ) : (
                      <Button type="submit">Submit</Button>
                    )}
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <ImportSqlSourceFile
        openImportModal={openImportModal}
        handleImportModal={handleImportModal}
        showListImort={showListImort}
        setShowListImport={setShowListImport}
      />
    </>
  );
};

export default CompanySettingsCommon;
