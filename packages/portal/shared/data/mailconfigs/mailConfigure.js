import React, { useEffect, useState } from "react";
import { Card, Col, Form, Row, Button, Spinner } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as yup from "yup";
import Select from "react-select";
import {
  getSelectorTypes,
  getActionDropdown,
  saveTemplate,
  ClearSaveTemplate,
  CleargetSelectorTypes,
  clearHasError,
} from "../../redux/slices/mailconfig/configureTemplate";
import { getActivityList } from "../../redux/slices/mailconfig/mailOverview";
import { getLocalStorageData,setLocalStorageData } from "../../redux/slices/localstorage/LocalStorage";
import dynamic from "next/dynamic";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";
import { error } from "../common/vaidationMessage/formValidationMsg";
const EditorComponent = dynamic(
  () => {
    return import("./Editor");
  },
  { ssr: false }
);
const EmailTemplateBuilder = dynamic(
  () => {
    return import("./GrapeJsComponent");
  },
  { ssr: false }
);

const customStyles = {
  control: (styles, { isFocused, isDisabled }) => ({
    ...styles,
    borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
    boxShadow: isDisabled ? null : isFocused ? "0 0 0 0.001rem #00d683" : null,
    "&:hover": {
      borderColor: isDisabled
        ? "#e8e8f7"
        : isFocused
        ? "#00d683"
        : styles.borderColor,
    },
  }),
};

const MailConfigure = (props) => {
  const { setTabIndex } = props;
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [eventAction, setEventAction] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedSingleItems, setSelectedSingleItems] = useState("");
  const [initialHtml, setInitialHtml] = useState("");
  const [selectorsList, setSelectorsList] = useState([]);
  const [oneClick, setOneClick] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [eventActivities, setEventActivities] = useState("");
  const {
    selectorsListResp,
    actiondata,
    savetemplateResp,
    activityResp,
    getTemplateDataFromLocal,
    errorData,
  } = useSelector((state) => {
    return {
      selectorsListResp:
        state &&
        state.mailconfigSlice &&
        state.mailconfigSlice.selectorData &&
        state.mailconfigSlice.selectorData.data,

      actiondata:
        state &&
        state.mailconfigSlice &&
        state.mailconfigSlice.actionList &&
        state.mailconfigSlice.actionList.data,

      savetemplateResp:
        state &&
        state.mailconfigSlice &&
        state.mailconfigSlice.templateSaveResp,
      
      activityResp:
      state &&
      state.mailOverViewResp &&
      state.mailOverViewResp.activityData &&
      state.mailOverViewResp.activityData.data,

      getTemplateDataFromLocal:
        state && state.localData && state.localData.getLocalData,

      errorData: state && state.mailconfigSlice && state.mailconfigSlice.error,
    };
  });

  const handleOneClick = (flag) => {
    setOneClick(flag);
  };

  console.log(getTemplateDataFromLocal,"getTemplateDataFromLocal")
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

  useEffect(() => {
    dispatch(getActionDropdown());
    dispatch(CleargetSelectorTypes());
    dispatch(getLocalStorageData("tempateData"));
    dispatch(getActivityList());
  }, []);


  useEffect(() => {
    if (selectorsListResp && selectorsListResp != undefined) {
      const myKeyData = selectorsListResp.map((str, index) => ({
        ...str,
        selector_name_display: "$$" + str.selector_name + "$$",
      }));
      setSelectorsList(myKeyData);
    }
  }, [selectorsListResp]);

  useEffect(() => {
    if (getTemplateDataFromLocal && actiondata != undefined && activityResp != undefined && activityResp.length > 0) {
      const data = actiondata.filter(
        (obj) => obj.action_id == getTemplateDataFromLocal.action_id
      )[0];
      const activityset = activityResp.filter(
        (obj) => obj.type == data?.type
        )[0];
        setEventActivities(activityset);
    }
  }, [getTemplateDataFromLocal, actiondata]);

  useEffect(() => {
    if (actiondata && actiondata != undefined && !getTemplateDataFromLocal && activityResp != undefined &&         activityResp.length > 0) {
      setEventActivities(activityResp[0]);
    }
  }, [actiondata,activityResp]);

  const [filterAction, setFilterAction] = useState([]);
  useEffect(()=>{
    if(eventActivities && actiondata != undefined &&  actiondata.length > 0){
      if(getTemplateDataFromLocal &&
        getTemplateDataFromLocal.length != 0){
          const filteredList = actiondata.filter((action) => {
            return action.type === eventActivities.type;
          });
          setFilterAction(filteredList);
          const data = actiondata.filter(
            (obj) => obj.action_id == getTemplateDataFromLocal.action_id
          )[0];
          setEventAction(data);
        }else{
          const filteredList = actiondata.filter((action) => {
            return action.type === eventActivities.type;
          });
          setEventAction(filteredList && filteredList[0]);
          setFilterAction(filteredList);
        }
    }
  },[actiondata,eventActivities,getTemplateDataFromLocal])

  const [staticPayload, setStaticPayload] = useState([]);
  useEffect(() => {
    if (eventAction && eventAction != "") {
      if (
        eventAction?.static_payloads &&
        eventAction?.static_payloads.length > 0
      ) {
        const staticData = eventAction?.static_payloads.map((str, index) => ({
          selector_name_display: "##$." + str + "##",
          display_name: str,
        }));
        setStaticPayload(staticData);
      } else {
        setStaticPayload([]);
      }
    }
  }, [eventAction]);

  useEffect(() => {
    if (eventAction) {
      dispatch(getSelectorTypes(eventAction.action_id));
    }
  }, [eventAction]);

  useEffect(() => {
    if (getTemplateDataFromLocal && getTemplateDataFromLocal.body) {
      setInitialHtml(getTemplateDataFromLocal.body);
    }
  }, [getTemplateDataFromLocal]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      // To: getTemplateDataFromLocal
      //   ? selectorsList &&
      //     selectorsList.filter(
      //       (obj) => obj.selector_name == getTemplateDataFromLocal.to_email_ids
      //     )[0]
      //   : "",
      To:
        getTemplateDataFromLocal && getTemplateDataFromLocal.to_email_ids
          ? (getTemplateDataFromLocal.to_email_ids?.split(",") || []).map(
              (toId) =>
                selectorsList &&
                selectorsList.find(
                  (selector) => selector.selector_name_display == toId
                )
            )
          : [],
      CC:
        getTemplateDataFromLocal && getTemplateDataFromLocal.cc_email_ids
          ? (getTemplateDataFromLocal.cc_email_ids?.split(",") || []).map(
              (ccId) =>
                selectorsList &&
                selectorsList.find(
                  (selector) => selector.selector_name_display == ccId
                )
            )
          : [],
      BC:
        getTemplateDataFromLocal && getTemplateDataFromLocal.bcc_email_ids
          ? (getTemplateDataFromLocal.bcc_email_ids?.split(",") || []).map(
              (bccId) =>
                selectorsList &&
                selectorsList.find(
                  (selector) => selector.selector_name_display == bccId
                )
            )
          : [],
      subject:
        getTemplateDataFromLocal && getTemplateDataFromLocal.subject
          ? getTemplateDataFromLocal.subject
          : "",
      // message: getTemplateDataFromLocal ? getTemplateDataFromLocal.body : "",
      Name:
        getTemplateDataFromLocal && getTemplateDataFromLocal.template_name
          ? getTemplateDataFromLocal.template_name
          : "",
      typeofEditor:
        getTemplateDataFromLocal && getTemplateDataFromLocal.editor
          ? getTemplateDataFromLocal.editor
          : "CK",
    },

    validationSchema: yup.object().shape({
      To: yup.array().nullable().required(error?.required).min(1, "Required"),
      subject: yup.string().required(error?.required),
      Name: yup.string().required(error?.required),
      // typeofEditor: yup.string().required("Required"),
    }),

    onSubmit: async (data) => {
      try {
        let ToidData = "";
        data?.To.forEach((x) => {
          if (ToidData == "") {
            ToidData = x.selector_name_display;
          } else {
            ToidData = ToidData + "," + x.selector_name_display;
          }
        });
        let ccid = "";
        data?.CC.forEach((x) => {
          if (ccid == "") {
            ccid = x.selector_name_display;
          } else {
            ccid = ccid + "," + x.selector_name_display;
          }
        });
        let bccid = "";
        data?.BC.forEach((x) => {
          if (bccid == "") {
            bccid = x.selector_name_display;
          } else {
            bccid = bccid + "," + x.selector_name_display;
          }
        });
        let mailselectorsCopied = "";
        selectedItems.forEach((x) => {
          if (mailselectorsCopied == "") {
            mailselectorsCopied = x.selector_name_display;
          } else {
            mailselectorsCopied =
              mailselectorsCopied + "," + x.selector_name_display;
          }
        });
        const payload = {
          id: getTemplateDataFromLocal ? getTemplateDataFromLocal?.id : 0,
          template_name: data?.Name,
          subject: data?.subject,
          // body: data?.message,
          body: initialHtml,
          action_id: eventAction?.action_id,
          payloads: mailselectorsCopied,
          to_email_ids: ToidData,
          cc_email_ids: ccid,
          bcc_email_ids: bccid,
          editor: data?.typeofEditor,
          status: getTemplateDataFromLocal
            ? getTemplateDataFromLocal?.status
            : "Active",
        };
        if (initialHtml == "") {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
              {t("mail_config.configure_template.forms.label.body_required")}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: false,
              theme: "colored",
            }
          );
        } else {
          handleOneClick(true);
          dispatch(saveTemplate(payload));
          // dispatch(setLocalStorageData("tempateData", payload));
        }
      } catch (error) {
        // Handle errors
        console.error(error);
      }
    },
  });

  useEffect(() => {
    if (savetemplateResp?.statusCode) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {savetemplateResp?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      handleOneClick(false);
      dispatch(ClearSaveTemplate());
      validation.resetForm();
      setTabIndex("tab2");
      setSelectedItems([]);
    }
  }, [savetemplateResp]);

  const handleResetForm = () => {
    if (getTemplateDataFromLocal) {
      setTabIndex("tab2");
    } else {
      validation.resetForm();
    }
  };

  const getSelectStyles1 = (fieldName) => {
    const error =
      !validation.values[fieldName]?.length &&
      validation.errors[fieldName] &&
      validation.touched[fieldName];
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

  const handleChangeAction = (event) => {
    setEventAction(event);
    // dispatch(getSelectorTypes(event.action_id));
  };

  const handleChangeActivity = (event) => {
    setEventActivities(event);
  };

  const handleCopyClick = (text, item) => {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    // Select and copy the text
    textarea.select();
    document.execCommand("copy");

    // Clean up
    document.body.removeChild(textarea);

    if (
      !selectedItems.some(
        (selector) =>
          selector.selector_name_display == item.selector_name_display
      )
    ) {
      // Add the copied selector to the array if it's not a duplicate
      setSelectedItems((prevSelectors) => [...prevSelectors, item]);
    }
    setSelectedSingleItems(item);
    toast.success(
      <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
        selector copied
      </p>,
      {
        position: toast.POSITION.TOP_RIGHT,
        hideProgressBar: false,
        theme: "colored",
      }
    );
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("text/plain", item.selector_name_display);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <>
      <Row className="row-sm mg-t-10">
        <Col md={12} lg={4} xl={3}>
          <Card className=" custom-card">
          <div className="p-3 mg-t-5 border-bottom">
                <Select
                  name="action"
                  theme={(theme) => ({
                    ...theme,
                    borderRadius: 3,
                    colors: {
                      ...theme.colors,
                      primary25: "var(--primary-bg-color)",
                      primary: "var(--primary-bg-color)",
                    },
                  })}
                  placeholder=""
                  isDisabled={getTemplateDataFromLocal &&
                    getTemplateDataFromLocal.length != 0}
                  value={eventActivities}
                  styles={customStyles}
                  options={activityResp}
                  getOptionLabel={(x) => x.type}
                  getOptionValue={(x) => x.action_id}
                  onChange={(e) => handleChangeActivity(e)}
                />
              </div>
            <div className="p-3 mg-t-5 border-bottom">
              <Select
                name="action"
                theme={(theme) => ({
                  ...theme,
                  borderRadius: 3,
                  colors: {
                    ...theme.colors,
                    primary25: "var(--primary-bg-color)",
                    primary: "var(--primary-bg-color)",
                  },
                })}
                placeholder=""
                isDisabled={getTemplateDataFromLocal &&
                  getTemplateDataFromLocal.length != 0}
                value={eventAction}
                styles={customStyles}
                options={filterAction}
                getOptionLabel={(x) => x.displayname}
                getOptionValue={(x) => x.action_id}
                onChange={(e) => handleChangeAction(e)}
              />
            </div>

            <Card.Body className="card-body pd-t-15">
              <PerfectScrollbar style={{ height: "61vh" }}>
                <div className="main-content-left main-content-left-mail">
                  <div className="main-mail-menu">
                    <div className="main-nav-column mg-b-20">
                      {staticPayload &&
                      staticPayload != undefined &&
                      staticPayload.length > 0 ? (
                        <div className="tags">
                          {staticPayload &&
                          staticPayload != undefined &&
                          staticPayload.length > 0
                            ? staticPayload?.map((item, i) => {
                                return (
                                  <span
                                    key={i}
                                    onClick={() =>
                                      handleCopyClick(
                                        item.selector_name_display,
                                        item
                                      )
                                    }
                                    draggable="true" // Add this line
                                    onDragStart={(e) =>
                                      handleDragStart(e, item)
                                    }
                                    className={`mg-r-10 pointer  ${
                                      selectedSingleItems &&
                                      selectedSingleItems?.selector_name ==
                                        item.selector_name
                                        ? ""
                                        : ""
                                    }`}
                                  >
                                    <Button
                                      variant="outline-secondary btn-rounded"
                                      className="mg-b-10"
                                      size="sm"
                                    >
                                      {item?.display_name} &nbsp;&nbsp;
                                      <i className="fe fe-copy"></i>
                                    </Button>
                                  </span>
                                );
                              })
                            : ""}
                        </div>
                      ) : (
                        ""
                      )}
                      {staticPayload &&
                        staticPayload != undefined &&
                        staticPayload.length > 0 && <hr />}
                      <div className="tags">
                        {selectorsList &&
                        selectorsList != undefined &&
                        selectorsList.length > 0
                          ? selectorsList?.map((item, i) => {
                              return (
                                <span
                                  key={i}
                                  onClick={() =>
                                    handleCopyClick(
                                      item.selector_name_display,
                                      item
                                    )
                                  }
                                  draggable="true" // Add this line
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  className={`mg-r-10 pointer  ${
                                    selectedSingleItems &&
                                    selectedSingleItems?.selector_name ==
                                      item.selector_name
                                      ? "" // Apply your active background class here
                                      : ""
                                  }`}
                                >
                                  <Button
                                    variant="outline-primary btn-rounded"
                                    className="mg-b-10"
                                    size="sm"
                                  >
                                    {item?.display_name} &nbsp;&nbsp;
                                    <i className="fe fe-copy"></i>
                                  </Button>
                                </span>
                              );
                            })
                          : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </PerfectScrollbar>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8} xl={9} md={12}>
          <Card className=" custom-card">
            <Form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
              }}
            >
              <Card.Body>
                <Form.Group className="form-group">
                  <div className="row align-items-center">
                    <Form.Label className="col-sm-3 col-xl-2  tx-semibold">
                      {t("mail_config.configure_template.forms.label.subject")}{" "}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="col-sm-9 col-xl-10">
                      <Form.Control
                        type="text"
                        // as="textarea"
                        // rows={3}
                        name="subject"
                        autoComplete="off"
                        value={validation.values.subject}
                        onChange={validation.handleChange}
                        placeholder=""
                        isValid={
                          validation.touched.subject &&
                          !validation.errors.subject
                        }
                        isInvalid={
                          validation.touched.subject &&
                          validation.errors.subject
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {validation.errors.subject}
                      </Form.Control.Feedback>
                    </div>
                  </div>
                </Form.Group>
                <Form.Group className="form-group">
                  <div className="row">
                    <Form.Label className="col-sm-2 form-label tx-semibold">
                      {t("mail_config.configure_template.forms.label.body")}{" "}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="col-sm-10 d-flex">
                      <Form.Check
                        type="radio"
                        name="typeofEditor"
                        label={t(
                          "mail_config.configure_template.forms.label.ckeditor"
                        )}
                        value={"CK"}
                        checked={validation.values.typeofEditor == "CK"}
                        onClickCapture={(e) => {
                          (e.target.checked = true),
                            validation.setFieldValue("typeofEditor", "CK");
                        }}
                        onChange={validation.handleChange}
                      />{" "}
                      &nbsp; &nbsp; &nbsp;
                      <Form.Check
                        type="radio"
                        name="typeofEditor"
                        label={t(
                          "mail_config.configure_template.forms.label.grapejs"
                        )}
                        value={"GP"}
                        checked={validation.values.typeofEditor == "GP"}
                        onClickCapture={(e) => {
                          (e.target.checked = true),
                            validation.setFieldValue("typeofEditor", "GP");
                        }}
                        onChange={validation.handleChange}
                      />{" "}
                      &nbsp; &nbsp; &nbsp;
                      {validation.errors.typeofEditor &&
                        validation.touched.typeofEditor && (
                          <div className="invalid-tooltiped">
                            {validation.errors.typeofEditor}
                          </div>
                        )}
                    </div>
                  </div>
                </Form.Group>
                {validation.values.typeofEditor == "GP" ? (
                  <Form.Group className="form-group">
                    <div className="row">
                      <div className="col-sm-12 col-xl-12">
                        <EmailTemplateBuilder
                          initialHtml={initialHtml}
                          setInitialHtml={setInitialHtml}
                        />
                      </div>
                    </div>
                  </Form.Group>
                ) : (
                  ""
                )}
                {validation.values.typeofEditor == "CK" ? (
                  <Form.Group className="form-group">
                    <div className="row">
                      <div className="col-sm-12 col-xl-12">
                        <EditorComponent
                          name="description"
                          onChange={(data) => {
                            setInitialHtml(data);
                          }}
                          editorLoaded={editorLoaded}
                          data={initialHtml}
                          setEditorLoaded={setEditorLoaded}
                        />
                      </div>
                    </div>
                  </Form.Group>
                ) : (
                  ""
                )}
                <Form.Group className="form-group">
                  <div className="row align-items-center">
                    <Form.Label className="col-sm-3 col-xl-2  tx-semibold">
                      {t("mail_config.configure_template.forms.label.to")} {""}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="col-sm-9 col-xl-10">
                      <Select
                        name="To"
                        theme={(theme) => ({
                          ...theme,
                          borderRadius: 3,
                          colors: {
                            ...theme.colors,
                            primary25: "var(--primary-bg-color)",
                            primary: "var(--primary-bg-color)",
                          },
                        })}
                        placeholder=""
                        value={validation.values.To}
                        styles={getSelectStyles1("To")}
                        options={
                          selectorsList != undefined &&
                          selectorsList.filter(
                            (item) => item.key_type == "Email"
                          )
                        }
                        getOptionLabel={(x) => x.display_name}
                        getOptionValue={(x) => x.selector_id}
                        onChange={(e) => validation.setFieldValue("To", e)}
                        isClearable
                        isMulti
                      />

                      {!validation.values.To?.length &&
                        validation.errors.To &&
                        validation.touched.To && (
                          <div className="invalid-tooltiped">
                            {validation.errors.To}
                          </div>
                        )}
                    </div>
                  </div>
                </Form.Group>
                <Form.Group className="form-group">
                  <div className="row align-items-center">
                    <Form.Label className="col-sm-3 col-xl-2  tx-semibold">
                      {t("mail_config.configure_template.forms.label.cc")}
                    </Form.Label>
                    <div className="col-sm-9 col-xl-10">
                      <Select
                        name="CC"
                        theme={(theme) => ({
                          ...theme,
                          borderRadius: 3,
                          colors: {
                            ...theme.colors,
                            primary25: "var(--primary-bg-color)",
                            primary: "var(--primary-bg-color)",
                          },
                        })}
                        placeholder=""
                        value={validation.values.CC}
                        styles={customStyles}
                        options={
                          selectorsList != undefined &&
                          selectorsList.filter(
                            (item) => item.key_type == "Email"
                          )
                        }
                        isClearable
                        isMulti
                        getOptionLabel={(x) => x.display_name}
                        getOptionValue={(x) => x.selector_id}
                        onChange={(e) => validation.setFieldValue("CC", e)}
                      />
                    </div>
                  </div>
                </Form.Group>
                <Form.Group className="form-group">
                  <div className="row align-items-center">
                    <Form.Label className="col-sm-3 col-xl-2  tx-semibold">
                      {t("mail_config.configure_template.forms.label.bcc")}
                    </Form.Label>
                    <div className="col-sm-9 col-xl-10">
                      <Select
                        name="BC"
                        theme={(theme) => ({
                          ...theme,
                          borderRadius: 3,
                          colors: {
                            ...theme.colors,
                            primary25: "var(--primary-bg-color)",
                            primary: "var(--primary-bg-color)",
                          },
                        })}
                        placeholder=""
                        value={validation.values.BC}
                        styles={customStyles}
                        options={
                          selectorsList != undefined &&
                          selectorsList.filter(
                            (item) => item.key_type == "Email"
                          )
                        }
                        isClearable
                        isMulti
                        getOptionLabel={(x) => x.display_name}
                        getOptionValue={(x) => x.selector_id}
                        onChange={(e) => validation.setFieldValue("BC", e)}
                      />
                    </div>
                  </div>
                </Form.Group>
                <Form.Group className="form-group">
                  <div className="row align-items-center">
                    <Form.Label className="col-sm-3 col-xl-2  tx-semibold">
                      {t("mail_config.configure_template.forms.label.name")}{" "}
                      {""}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="col-sm-9 col-xl-10">
                      <Form.Control
                        type="text"
                        name="Name"
                        autoComplete="off"
                        value={validation.values.Name}
                        onChange={validation.handleChange}
                        placeholder=""
                        isValid={
                          validation.touched.Name && !validation.errors.Name
                        }
                        isInvalid={
                          validation.touched.Name && validation.errors.Name
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {validation.errors.Name}
                      </Form.Control.Feedback>
                    </div>
                  </div>
                </Form.Group>
              </Card.Body>

              <Card.Footer className=" d-sm-flex rounded-0">
                <div className="btn-list ms-auto">
                  <>
                    {oneClick ? (
                      <Button variant="primary" disabled>
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
                      <Button
                        variant="primary"
                        type="submit"
                        className="btn btn-primary"
                      >
                        {getTemplateDataFromLocal
                          ? t("common.update")
                          : t("common.submit")}
                      </Button>
                    )}
                  </>

                  <Button
                    variant="secondary"
                    className="btn btn-secondary"
                    onClick={handleResetForm}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </Card.Footer>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default MailConfigure;
