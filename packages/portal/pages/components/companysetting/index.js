import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Alert,
} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../../shared/layout-components/seo/seo";
import { getComponentDetails } from "../../../shared/redux/slices/localstorage/LocalStorage";
import * as yup from "yup";
import { useFormik } from "formik";
import {
  getWebSettings,
  addWebSetting,
  clearAddWebSetting,
  updateWebSetting,
  clearUpdateWebSetting,
  clearHasError,
  uploadLogo,
  clearUploadLogo,

} from "../../../shared/redux/slices/web-settings/company-setting";
import { exportMastersAction, clearimportMastersAction } from "../../../shared/redux/slices/companySetting/companySetting";
import { error } from "../../../shared/data/common/vaidationMessage/formValidationMsg";
import defaultLogo from "../../../public/assets/img/brand/logo-light.png";
import defaultLightLogo from "../../../public/assets/img/brand/logo.png";
import defaultFavicon from "../../../public/assets/img/brand/favicon.png";
import defaultAdminLogin from "../../../public/assets/img/brand/logo-light.png";
import axios from "axios";
import dynamic from "next/dynamic";
import ImportSqlSourceFile from "../../../shared/data/companySettingModal/companySettingModal";

const FileUploader = dynamic(
  () => {
    return import("../../../shared/data/common/fileuploads/fileuploader");
  },
  { ssr: false }
);
import { FilePath } from "../../../shared/data/common/fileuploads/filepath";

const CompanySettings = () => {
  const dispatch = useDispatch();
  const [oneClick, setOneClick] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(false);
  const [isDefaultFavicon, setIsDefaultFavicon] = useState(false);
  const [otp_verification, setisotp_verification] = useState(false);
  const [isDefaultPanel, setIsDefaultPanel] = useState(false);
  const [isDefaultWeb, setIsDefaultWeb] = useState(false);
  const [showListImort, setShowListImport] = useState(true);
  const [openImportModal, setOpenImportModal] = useState(false);
  const favicon_path = (FilePath?.logos).replace("{name}", "Favicon");
  const panel_path = (FilePath?.logos).replace("{name}", "AdminPanelLogo");
  const web_path = (FilePath?.logos).replace("{name}", "WebPanelLogo");

  const {
    cmpSettingData,
    addDataResp,
    updateDataResp,
    componentData,
    errorData,
    uploadLogoResp,
    hasExportSucc,
    importStatus,
  } = useSelector((data) => {
    return {
      cmpSettingData: data && data.companySetting && data.companySetting.cmpSettingData && data.companySetting.cmpSettingData.data,
      addDataResp:
        data && data.companySetting && data.companySetting.addDataResp,
      updateDataResp:
        data && data.companySetting && data.companySetting.updateDataResp,
      uploadLogoResp:
        data && data.companySetting && data.companySetting.uploadLogoResp,
      componentData: data && data.localData && data.localData.componentData,
      hasExportSucc: data && data.company_setting && data.company_setting.exportResp,
      importStatus: data && data.company_setting && data.company_setting.importResp,

      errorData: data && data.companySetting && data.companySetting.error,
    };
  });


  console.log("hasExportSucchasExportSucc", hasExportSucc)
  useEffect(() => {
    dispatch(getWebSettings());
    dispatch(getComponentDetails("/company-setting"));
    return () => { };
  }, []);

  useEffect(() => {
    if (cmpSettingData) {
      setIsDefaultFavicon(
        cmpSettingData?.is_default_favicon == "false" ? false : true
      );
      setIsDefaultPanel(
        cmpSettingData?.is_default_ad_logo == "false" ? false : true
      );
      setIsDefaultWeb(
        cmpSettingData?.is_default_web_logo == "false" ? false : true
      );
      setisotp_verification(
        cmpSettingData?.otp_verification == "false" ? false : true
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
      handleOneClick(false);
      dispatch(clearHasError());
    }
  }, [errorData]);

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  useEffect(() => {
    if (addDataResp?.statusCode) {
      setOneClick(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addDataResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getWebSettings());
      dispatch(clearAddWebSetting());
    }
  }, [addDataResp]);

  useEffect(() => {
    if (updateDataResp?.statusCode) {
      setOneClick(false);
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {updateDataResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getWebSettings());
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
        }
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
        }
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
  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: cmpSettingData?.id ? cmpSettingData?.id : 0,
      name: cmpSettingData?.name ? cmpSettingData?.name : "",
      phone_number: cmpSettingData?.phone_number
        ? cmpSettingData?.phone_number
        : "",
      website: cmpSettingData?.website ? cmpSettingData?.website : "",
      proxmox_base_url: cmpSettingData?.proxmox_base_url
        ? cmpSettingData?.proxmox_base_url
        : "",
      qemu_url: cmpSettingData?.qemu_url ? cmpSettingData?.qemu_url : "",
      lxc_url: cmpSettingData?.lxc_url ? cmpSettingData?.lxc_url : "",
      otp_verification: cmpSettingData?.otp_verification
        ? cmpSettingData?.otp_verification
        : "",
      max_questions: cmpSettingData?.max_questions
        ? cmpSettingData?.max_questions
        : "",

      email: cmpSettingData?.email ? cmpSettingData?.email : "",
      system_name: cmpSettingData?.system_name
        ? cmpSettingData?.system_name
        : "",
      system_footer: cmpSettingData?.system_footer
        ? cmpSettingData?.system_footer
        : "",
      proxmox_alert_time: cmpSettingData?.proxmox_alert_time ? cmpSettingData?.proxmox_alert_time : "",
      proxmox_email_sent: cmpSettingData?.proxmox_email_sent ? cmpSettingData?.proxmox_email_sent : "",
      termination_delay: cmpSettingData?.termination_delay ? cmpSettingData?.termination_delay : "",
      configuration_delay: cmpSettingData?.configuration_delay ? cmpSettingData?.configuration_delay : "",
      address: cmpSettingData?.address ? cmpSettingData?.address : "",
      favicon: cmpSettingData?.favicon ? cmpSettingData?.favicon : "",
      admin_panel_logo: cmpSettingData?.admin_panel_logo ? cmpSettingData?.admin_panel_logo : "",
      web_panel_logo: cmpSettingData?.web_panel_logo ? cmpSettingData?.web_panel_logo : "",
    },

    validationSchema: yup.object().shape({
      name: yup.string().required(error?.required),
      system_name: yup.string().required(error?.required),
      system_footer: yup.string().required(error?.required),
    }),

    onSubmit: (data, action) => {
      const payload = {
        id: data?.id ? data?.id : 0,
        name: data?.name ? data?.name : "",
        phone_number: data?.phone_number ? data?.phone_number : "",
        website: data?.website ? data?.website : "",
        proxmox_base_url: data?.proxmox_base_url ? data?.proxmox_base_url : "",
        qemu_url: data?.qemu_url ? data?.qemu_url : "",
        lxc_url: data?.lxc_url ? data?.lxc_url : "",
        max_questions: data?.max_questions ? data?.max_questions : "",
        email: data?.email ? data?.email : "",
        system_name: data?.system_name ? data?.system_name : "",
        system_footer: data?.system_footer ? data?.system_footer : "",
        proxmox_alert_time: data?.proxmox_alert_time ? data?.proxmox_alert_time : "",
        proxmox_email_sent: data?.proxmox_email_sent ? data?.proxmox_email_sent : "",
        termination_delay: data?.termination_delay ? data?.termination_delay : "",
        configuration_delay: data?.configuration_delay ? data?.configuration_delay : "",
        address: data?.address ? data?.address : "",
        otp_verification: data?.otp_verification.toString(),
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
      files && files.length > 0 && files[0]?.file ? files[0]?.file : {}
    );

    formValidation.setFieldValue("flag", flag);
  };

  useEffect(() => {
    if (typeof uploadedFile == "string") {
      let payload = {
        id: cmpSettingData?.id ? cmpSettingData?.id : 0,
        favicon: isDefaultFavicon ? "" : formValidation.values.favicon,
        admin_panel_logo: isDefaultPanel ? "" : formValidation.values.admin_panel_logo,
        web_panel_logo: isDefaultWeb ? "": formValidation.values.web_panel_logo,
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

  return (
    <>
      <Seo
        // title={componentData && componentData?.title ? componentData.title : ""}
        title="Company Setting"
      />
      <ToastContainer />
      <Card className="custom-card overflow-hidden">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Company Settings</h5>
          </div>


          <Row className="row-sm">
            <Col md={12} className="mg-b-5 bd-b">
              <div className="d-flex justify-content-between">
                <h5>
                  {componentData && componentData?.title
                    ? componentData.title
                    : ""}
                </h5>
                <div></div>
              </div>
            </Col>
            <Col md={12}>
              <Form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  formValidation.handleSubmit();
                  return false;
                }}
              >
                <Card className="custom-card">
                  <Card.Body>
                    <Row>
                      {/* //name */}
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>
                          Name <span className="text-danger">*</span>
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

                      {/* phone number */}
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>Phone Number</Form.Label>
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

                      {/* email */}
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>Email</Form.Label>
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

                      {/* url website */}
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

                      {/* proxmox base url */}
                      {/* <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>Proxmox Base url</Form.Label>
                        <Form.Control
                          type="text"
                          name="proxmox_base_url"
                          autoComplete="off"
                          placeholder="Enter Proxmox Base url"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.proxmox_base_url}
                          isInvalid={
                            formValidation.touched.proxmox_base_url &&
                            formValidation.errors.proxmox_base_url
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.proxmox_base_url}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>QEMU Url</Form.Label>
                        <Form.Control
                          type="text"
                          name="qemu_url"
                          autoComplete="off"
                          placeholder="Enter QEMU Url"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.qemu_url}
                          isInvalid={
                            formValidation.touched.qemu_url &&
                            formValidation.errors.qemu_url
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.qemu_url}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>LXC Url</Form.Label>
                        <Form.Control
                          type="text"
                          name="lxc_url"
                          autoComplete="off"
                          placeholder="Enter LXC url"
                          onChange={formValidation.handleChange}
                          value={formValidation.values.lxc_url}
                          isInvalid={
                            formValidation.touched.lxc_url &&
                            formValidation.errors.lxc_url
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {formValidation.errors.lxc_url}
                        </Form.Control.Feedback>
                      </Form.Group> */}

                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <Form.Label>
                          Max Question <span className="text-danger">*</span>
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
                        <Form.Label>SiberSim Alert Time (Minutes)</Form.Label>
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
                        <Form.Label>SiberSim Email Sent</Form.Label>
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
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          type="text"
                          name="address"
                          autoComplete="off"
                          placeholder="Enter system footer"
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
                      <Form.Group
                        as={Col}
                        md="4"
                        controlid="validationFormik102"
                        className="mb-3"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>Termination Delay (Seconds)</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                                Time delay between stopping and terminating the process in seconds.
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
                          <Form.Label>Configuration Delay (Seconds)</Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={
                              <Tooltip>
                              Configuration delay between stopping and terminating the process in seconds.
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
                                    e.target.checked
                                  );
                                }}
                              />
                              <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                            </label>
                          </OverlayTrigger>
                        </div>
                      </Form.Group>

                      <Form.Group as={Col} md="4" className="my-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label className="mb-0">
                            Export Master Data
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Export the Masters of Scenario , Component , Component Category , Scenario Category and Scenario Subcategory</Tooltip>}
                          >
                            <i className="fa fa-info-circle text-info" style={{ cursor: "pointer" }}></i>
                          </OverlayTrigger>
                        </div>
                        <div className="mt-3">
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
                          <Form.Label className="mb-0">
                            Import Master Data
                          </Form.Label>
                          <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Import the Masters of Scenario , Component , Component Category , Scenario Category and Scenario Subcategory</Tooltip>}
                          >
                            <i className="fa fa-info-circle text-warning" style={{ cursor: "pointer" }}></i>
                          </OverlayTrigger>
                        </div>
                        <div className="mt-3">
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

                    </Row>

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
                                <img alt="SIMMaster Panel Logo Preview"
                                src={`${defaultFavicon.src}`}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}/>)}
                              {formValidation.values.favicon && formValidation.values.favicon!="" && (
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
                                  formValidation.setFieldValue("admin_panel_logo","");
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
                                <img alt="SIMMaster Panel Logo Preview"
                                src={`${defaultAdminLogin.src}`}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}/>)}
                              {formValidation.values.admin_panel_logo && formValidation.values.admin_panel_logo!="" && (
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
                                  formValidation.setFieldValue("web_panel_logo","");
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
                                <img alt="SIMMaster Panel Logo Preview"
                                src={`${defaultAdminLogin.src}`}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}/>)}
                              {formValidation.values.web_panel_logo && formValidation.values.web_panel_logo!="" && (
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

                    <Row>
                      <Col className="d-flex justify-content-end">
                        {oneClick ? (
                          <Button >
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
                  </Card.Body>
                </Card>
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

CompanySettings.layout = "Contentlayout";
export default CompanySettings;
