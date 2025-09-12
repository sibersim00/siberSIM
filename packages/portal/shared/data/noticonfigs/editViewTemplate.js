import React, { useState,useEffect } from 'react'
import {
  Col,
  Offcanvas,
  Row,
  Card,
  Form,
  Button,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { useFormik } from "formik";
import { regex,error } from '../common/vaidationMessage/formValidationMsg';
import "../../utils/i18n";
import PerfectScrollbar from "react-perfect-scrollbar";
import { useTranslation } from "react-i18next";
import { saveTemplate } from '../../redux/slices/noticonfigs/noticonfigs';

const EditViewTemplate = (props) => {
	const {openOffcanvas, handleOffcanvas, rowValues, getSelectorData} = props;
  const { t } = useTranslation();
	const dispatch = useDispatch()
	const [oneClick, setOneClick] = useState(false);
  const [selectorsList, setSelectorsList] = useState([]);
	const [staticPayload, setStaticPayload] = useState([]);
	const [selectedItems, setSelectedItems] = useState([]);
  const [selectedSingleItems, setSelectedSingleItems] = useState("");
	const [isChecked, setIsChecked] = useState(true)
	const styles = {
    container: {
      maxWidth: "100%",
      margin: "auto",
      height : "350px",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #ddd",
      padding: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px", 
    },
    container1: {
      maxWidth: "100%",
      margin: "auto",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #ddd",
      padding: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px", 
    },

    body: {
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#333",
    },
  };

	const templateForm = useFormik({
		enableReinitialize: true,
    initialValues: {
      name : rowValues && rowValues.template_name || "",
      body :  rowValues && rowValues.body || "",
      link: rowValues && rowValues.link || "" 
    }, 
    validationSchema: yup.object().shape({
      // criteria: yup.string().required(error?.required),
    }),
    onSubmit: (data, action) => {
			const payload = {
        "id": rowValues.template_id,
        "template_name": data?.name,
        "body": data?.body,
        "link": data?.link,
        "status": isChecked == true ? "Active" : "In Active"
    	}
		dispatch(saveTemplate(payload))
    }
  });

	useEffect(() => {
    if (getSelectorData && getSelectorData != undefined) {
      const myKeyData = getSelectorData.map((str, index) => ({
        ...str,
        selector_name_display: "$$" + str.selector_name + "$$",
      }));
      setSelectorsList(myKeyData);
    }
  }, [getSelectorData]);

	useEffect(() => {
    if (rowValues && rowValues != "") {
			setIsChecked(rowValues?.status == "Active" ? true : false)
      if (
        rowValues?.static_payloads &&
        rowValues?.static_payloads.length > 0
      ) {
        const staticData = rowValues?.static_payloads.map((str, index) => ({
          selector_name_display: "##$." + str + "##",
          display_name: str,
        }));
        setStaticPayload(staticData);
      } else {
        setStaticPayload([]);
      }
    }
  }, [rowValues]);

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
        {t("noti_config.selector_copied")}
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

	const handleToggle = () => {setIsChecked(!isChecked)}

  return (
    <>
      <Offcanvas
        show={openOffcanvas}
        onHide={handleOffcanvas}
        placement="end"
        className="wd-75p"
      >
        <Offcanvas.Header closeButton className="">
					<strong className="text-black fs-16">
						{t("noti_config.edit_view_template")}
					</strong>
        </Offcanvas.Header>
        <hr className="m-0 mb-2" />
        <Offcanvas.Body className="pt-0">
          <Row className="row-sm">
            <Col md={6}>
              <Card style={styles.container} className="">
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
              </Card>
            </Col>
            <Col md={6}>
              <Card style={styles.container} className="">
								<Form
									noValidate
									onSubmit={(e) => {
									e.preventDefault();
									templateForm.handleSubmit();
									return false;
									}}
								>
									<Row className="row-sm">
									<Form.Group 
										as={Col}
										md="12"
										controlid="validationFormik102"
										className="mb-3"
										>
										<Form.Label>{t("noti_config.form.name")} <span className='text-danger'>*</span></Form.Label>
										<Form.Control
											type="text"
											name='name'
											autoComplete="off"
											className={
												templateForm.touched.name &&
												templateForm.errors.name
												? "red-field is-invalid"
												: ""
											}
											rows={3}
												value={templateForm.values.name}
												isInvalid={
													templateForm.touched.name &&
													templateForm.errors.name
												}
											placeholder={t("noti_config.form.name")}
											onChange={(e)=>{templateForm.handleChange(e);}}
										/>
										<div className='d-flex justify-content-between'>
											{
												templateForm.touched.name &&
												templateForm.errors.name ? 
												<div className='text-danger tx-12'>
													{templateForm.errors.name}
												</div>  :<div></div>
												
											}
										</div>
									</Form.Group>
										<Form.Group 
											as={Col}
											md="12"
											controlid="validationFormik102"
											className="mb-3"
											>
											<Form.Label>{t("noti_config.form.body")} <span className='text-danger'>*</span></Form.Label>
											<Form.Control
												type="text"
												name='body'
												autoComplete="off"
												className={
													templateForm.touched.body &&
													templateForm.errors.body
													? "red-field is-invalid"
													: ""
												}
												rows={3}
													value={templateForm.values.body}
													isInvalid={
														templateForm.touched.body &&
														templateForm.errors.body
													}
												placeholder={t("noti_config.form.body")}
												as="textarea"
												onChange={(e)=>{templateForm.handleChange(e);}}
												maxLength={regex?.charCount}
											/>
											<div className='d-flex justify-content-between'>
												{
													templateForm.touched.body &&
													templateForm.errors.body ? 
													<div className='text-danger tx-12'>
														{templateForm.errors.body}
													</div>  :<div></div>
													
												}
											</div>
										</Form.Group>
										<Form.Group 
											as={Col}
											md="10"
											controlid="validationFormik102"
											className="mb-3"
											>
											<Form.Label>{t("noti_config.form.link")} <span className='text-danger'>*</span></Form.Label>
											<Form.Control
												type="text"
												name='link'
												autoComplete="off"
												className={
													templateForm.touched.link &&
													templateForm.errors.link
													? "red-field is-invalid"
													: ""
												}
												rows={3}
													value={templateForm.values.link}
													isInvalid={
														templateForm.touched.link &&
														templateForm.errors.link
													}
												placeholder={t("noti_config.form.link")}
												onChange={(e)=>{templateForm.handleChange(e);}}
											/>
											<div className='d-flex justify-content-between'>
												{
													templateForm.touched.link &&
													templateForm.errors.link ? 
													<div className='text-danger tx-12'>
														{templateForm.errors.link}
													</div>  :<div></div>
													
												}
											</div>
										</Form.Group>
										<Form.Group
                      as={Col}
                      md="2"
                      className="mb-0"
                    >
                      <div className="form-group ">
                        <Form.Label>{t("noti_config.form.status")}</Form.Label>
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
									<Row className="row-sm">
									<Col md={12} className='text-right'>
									{oneClick ? (
										<Button disabled size="sm"
										variant="outline-primary">
										<Spinner
										as="span"
										animation="grow"
										size="sm"
										role="status"
										aria-hidden="true"
										/>
										{t("common.loading")}
										</Button>
									) 
									:
										<Button
											size="sm"
											variant="outline-primary"
											type="submit"
										>
											{t("common.update")}
										</Button>}
									</Col>
									</Row>
								</Form>
              </Card>
            </Col>
          </Row>
        
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}

export default EditViewTemplate