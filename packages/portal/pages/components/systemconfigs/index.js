import React,{useState,useEffect} from 'react'
import { Row, Col, Card,Button,Modal,Tooltip,OverlayTrigger, Offcanvas,Form,Table,Spinner } from "react-bootstrap";
import Seo from '../../../shared/layout-components/seo/seo';
import DynamicForm from '../../../shared/data/common/dynamicForm/mainForm';
import { 
  getSystemConfigTypes,
  systemConfigSubmit,
  clearSystemConfigSubmit,
  systemConfigUpdateStatus,
  clearSystemConfigUpdateStatus,
  getSystemConfigEmailUser,
  systemConfigUserSubmit,
  clearSystemConfigUserSubmit,
  getUserUpdateStatus,
  clearUserUpdateStatus,
  clearHasError,
  getDefaultUpdate,
  clearGetDefaultUpdate,
  testEmail,
  clearTestEmail
} from '../../../shared/redux/slices/systemconfig/systemConfig';
import { useDispatch,useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import Select from "react-select";
import '../../../shared/utils/i18n';
import { useTranslation } from "react-i18next";
import { error,regex } from '../../../shared/data/common/vaidationMessage/formValidationMsg';
import { getComponentDetails } from '../../../shared/redux/slices/localstorage/LocalStorage';

const SystemConfiguration = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const [openOffcanvas, setOpenOffcanvas] = useState(false);

  const [modalTitle, setModalTitle]=useState("");
  const [openModal, setOpenModal] = useState(false);

  const [systemConfigList, setSystemConfigList] = useState([])
  const [jsonSchemaFromBackend, setJsonSchemaFromBackend] = useState({});
  const [serviceTypeId, setServiceTypeID] = useState();
  const [serviceName, setServiceName] = useState("");

  const [openTestModal, setOpenTestModal] = useState(false)
  const [selectedSenderUser, setSeletedSenderUser] = useState("");
  const [enteredEmail, setEnteredEmai] = useState("");
  const [senderOptions, setSenderOptions] = useState([]);
  const [loaderForTestModal, setLoaderForTestModal] = useState(false)

  const { systemConfigTypeData,systemConfigUpdateStatusData,systemConfigSubmitData,systemConfigUserSubmitData,systemConfigEmailUserData,userUpdateStatusData,getDefaultUpdateData,getTestEmailData,componentData,errorData } = useSelector(
  (state) => {
      return {
        systemConfigTypeData:
          state &&
          state.systemConfig &&
          state.systemConfig.systemConfigTypeData &&
          state.systemConfig.systemConfigTypeData,

        systemConfigUpdateStatusData:
          state &&
          state.systemConfig &&
          state.systemConfig.systemConfigUpdateStatusData &&
          state.systemConfig.systemConfigUpdateStatusData,

        systemConfigSubmitData :
          state &&
          state.systemConfig &&
          state.systemConfig.systemConfigSubmitData &&
          state.systemConfig.systemConfigSubmitData,

        systemConfigUserSubmitData:
          state &&
          state.systemConfig &&
          state.systemConfig.systemConfigUserSubmitData &&
          state.systemConfig.systemConfigUserSubmitData,

        systemConfigEmailUserData:
          state &&
          state.systemConfig &&
          state.systemConfig.systemConfigEmailUserData &&
          state.systemConfig.systemConfigEmailUserData.data,

        userUpdateStatusData:
          state &&
          state.systemConfig &&
          state.systemConfig.userUpdateStatusData &&
          state.systemConfig.userUpdateStatusData,
        
        getDefaultUpdateData:
          state &&
          state.systemConfig &&
          state.systemConfig.getDefaultUpdateData &&
          state.systemConfig.getDefaultUpdateData,

        getTestEmailData:
          state &&
          state.systemConfig &&
          state.systemConfig.getTestEmailData &&
          state.systemConfig.getTestEmailData,

        componentData: 
          state && state.localData && state.localData.componentData,

        errorData: state && state.systemConfig && state.systemConfig.error,
      };
    }
  );


  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderWidth: 1,
      borderRadius: 3,
      boxShadow: state.isFocused ? 0 : 0,
      borderColor: state.isFocused ? base.borderColor : "#e8e8f7",
      "&:hover": {
        borderColor: state.isFocused ? base.borderColor : "#e8e8f7",
      },
    }),
  };

  useEffect(()=>{
    dispatch(getSystemConfigTypes());
    dispatch(getComponentDetails('/system_configuration'));
  },[])

  useEffect(()=>{
    if(systemConfigTypeData){
      setSystemConfigList(systemConfigTypeData)
    }
  },[systemConfigTypeData])

  useEffect(() => {
    if (systemConfigUpdateStatusData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {systemConfigUpdateStatusData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearSystemConfigUpdateStatus());
      dispatch(getSystemConfigTypes());
    }
  }, [systemConfigUpdateStatusData]);

  useEffect(() => {
    if (systemConfigSubmitData?.statusCode === 200) {
      handleOpenOffcanvas("","")
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {systemConfigSubmitData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearSystemConfigSubmit());
      dispatch(getSystemConfigTypes());
    }
  }, [systemConfigSubmitData]);

  useEffect(() => {
    if (systemConfigUserSubmitData?.statusCode === 200) {
      formsFieldsModal.resetForm()
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {systemConfigUserSubmitData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearSystemConfigUserSubmit());
      dispatch(getSystemConfigEmailUser(serviceTypeId))
    }
  }, [systemConfigUserSubmitData]);
 
  useEffect(() => {
    if (getDefaultUpdateData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {getDefaultUpdateData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(getSystemConfigTypes());
      dispatch(clearGetDefaultUpdate());
    }
  }, [getDefaultUpdateData]);  

  useEffect(() => {
    if (systemConfigEmailUserData) {
      let rows = []
      let tempDropDownList = [];
      systemConfigEmailUserData.length > 0 && systemConfigEmailUserData.map((obj) => {
        let temp = {
          id : obj?.mailuser_id,
          username : obj?.smtp_username,
          password : obj?.smtp_password,
          senderemailid : obj?.sender_emailid,
          sendername : obj?.sender_name,
          status : obj?.status == "Active" ? true : false,
          show : JSON.parse(obj?.iseditable)
        }
        rows.push(temp)

        if(obj?.status == "Active"){
          let pushObj = {
            showname : `${obj.smtp_username} ${obj.sender_name ? `(${obj.sender_name})` : ''}`,
            iseditable : obj.iseditable,
            mailuser_id : obj.mailuser_id,
            sender_emailid : obj.sender_emailid,
            sender_name : obj.sender_name,
            service_type_id :  obj.service_type_id,
            smtp_password : obj.smtp_password,
            smtp_username : obj.smtp_username,
            status: obj.status,
          }
          tempDropDownList.push(pushObj)
        }
      })
      if (rows.length > 0) {
        formsFieldsModal.setFieldValue("rows", rows);
      }

      if(tempDropDownList && tempDropDownList.length > 0){
        setSenderOptions(tempDropDownList)
      }else{
        setSenderOptions([])
      }      
    }
  }, [systemConfigEmailUserData])

  useEffect(() => {
    if (userUpdateStatusData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {userUpdateStatusData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearUserUpdateStatus());
      dispatch(getSystemConfigEmailUser(serviceTypeId))
    }
  }, [userUpdateStatusData]);  

  useEffect(() => {
    if (getTestEmailData?.statusCode === 200) {
      // handleOpenTestModal()
      setLoaderForTestModal(false)
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {getTestEmailData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearTestEmail());
    }
  }, [getTestEmailData]); 

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
      setLoaderForTestModal(false)
      dispatch(clearHasError());
    }
  }, [errorData]);

  const handleOpenTestModal = () =>{
    setOpenTestModal(!openTestModal)
    setSeletedSenderUser("")
    setEnteredEmai("")
  }
  
  const handleOpenOffcanvas = (title,service) =>{
    setModalTitle(t("system_config.tooltip.configure")+" "+title+" - "+service)
    setOpenOffcanvas(!openOffcanvas)
  }

  const handleOpenModal = () =>{
    setOpenModal(!openModal)
  }

  const onSubmit = (values) => {
    dispatch(systemConfigSubmit(serviceTypeId,values))
  };

  const handleStatusSwitch =(props)=>{
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_status"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)" ,
      confirmButtonText:t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const Payload = {
          "service_type_id":props?.service_type_id,
          "status":props?.status // Current Status
        }
        dispatch(systemConfigUpdateStatus(Payload));
      }
    });
    
  }

  const formsFieldsModal = useFormik({
    initialValues: {
      rows: []
    }, 
    validationSchema: yup.object().shape({
      rows: yup.array().of(
        yup.object().shape({
          username: yup.string().required(error.required),
          password: yup.string().required(error.required),
          senderemailid: yup.string().required(error.required).matches(regex.emailRegex, error.invalid),
          sendername: yup.string().required(error.required).matches(regex.alpaRegex, error.onlyAlphabet)
        })
      ),
    }),
  });

  const createNewRowExcp = () => {
    formsFieldsModal.setFieldValue("rows", [
      {
        id : 0,
        username : "",
        password : "",
        senderemailid : "",
        sendername : "",
        status : false,
        show : true
      },...formsFieldsModal.values.rows,
    ]);
   
  };

  const submitConfigureUser = (obj,index) => {
    if(!obj.senderemailid || obj.senderemailid == "" || !obj.username || obj.username == "" || !obj.password || obj.password == ""){
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {t("system_config.validation_msg_toast.required_field")}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
      formsFieldsModal.setFieldValue(
        `rows[${index}].show`,
        formsFieldsModal.values.rows[index]?.show
      );
      return false
    }

    let stringRegex =  regex.alpaRegex;
    if (typeof obj.sendername !== 'string' || (obj.sendername && !stringRegex.test(obj.sendername))) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {t("system_config.validation_msg_toast.valid_sender_name")}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
      formsFieldsModal.setFieldValue(
        `rows[${index}].show`,
        formsFieldsModal.values.rows[index]?.show
      );
      return false
    }

    const emailRegex = regex.emailRegex;
    if (!obj.senderemailid || typeof obj.senderemailid !== 'string' || !emailRegex.test(obj.senderemailid)) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {t("system_config.validation_msg_toast.valid_email")}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
      formsFieldsModal.setFieldValue(
        `rows[${index}].show`,
        formsFieldsModal.values.rows[index]?.show
      );
      return false
    }


    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_save_user_data"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)" ,
      confirmButtonText: t("common.swal.save"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          "mailuser_id" : obj?.id,
          "smtp_username": obj?.username,
          "smtp_password": obj?.password,
          "sender_emailid":obj?.senderemailid,
          "sender_name":obj?.sendername,
          "status" : obj?.status ? 'Active' : 'Inactive'
        }
        dispatch(systemConfigUserSubmit(serviceTypeId,payload))
        formsFieldsModal.setFieldValue(
          `rows[${index}].show`,
          !formsFieldsModal.values.rows[index]?.show
        );

      }
    });
  };

  const handleUserUpdateStatus =(index)=>{
    Swal.fire({
      title: t("common.swal.title"),
      text:  t("common.swal.text_status"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)" ,
      confirmButtonText:  t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          "mailuser_id":formsFieldsModal.values.rows[index]?.id,
          "status":formsFieldsModal.values.rows[index]?.status ? "Active" : "Inactive"
        }
        dispatch(getUserUpdateStatus(payload))
        // formsFieldsModal.setFieldValue(
        //   `rows[${index}].status`,
        //   !formsFieldsModal.values.rows[index]?.status
        // );
      }
    });
  }

  const handleDefaultUpdateStatus =(service_type_id)=>{
    Swal.fire({
      title: t("common.swal.title"),
      text: t("common.swal.text_mark_default"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)" ,
      confirmButtonText:t("common.swal.yes"),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(getDefaultUpdate({"service_type_id":service_type_id}))
      }
    });
  }

  const sendToTest = () =>{  
    const emailRegex = regex.emailRegex;
    if (!enteredEmail || typeof enteredEmail !== 'string' || !emailRegex.test(enteredEmail)) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {t("system_config.validation_msg_toast.valid_email")}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
      return false
    }

    if (!selectedSenderUser) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {t("system_config.validation_msg_toast.select_user_name")}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
      return false
    }
    setLoaderForTestModal(true)
    const payload = {
      "service_type_id":selectedSenderUser?.service_type_id,
      "mailuser_id":selectedSenderUser?.mailuser_id,
      "email_id":enteredEmail
  }
    dispatch(testEmail(payload))
  }

  const deleteRoow = (index) =>{
    const updatedRows = [...formsFieldsModal.values.rows];
    updatedRows.splice(index, 1);
    formsFieldsModal.setFieldValue("rows", updatedRows);
  }

  // ---------Razorpay----------------
  const makePayment = async (data) => {
   if(data?.service == "Razor Pay"){
     const Razorkey = 'ADD RAZORPAY_API_KEY';
       const options = {
         key:  Razorkey,
         name: "Ezee LMS",
         currency: "INR",
         amount: 100,
         order_id: "order_NM259DoMsaoDAC",
         description: t("system_config.tooltip.test_configuration_of") + "" + data?.service,
       
       handler: async function (response) {
 
       },
       prefill: {
         name: "admin",
         email: "admin@gmail.com",
         contact: "9876543210",
       },
       };
 
     const paymentObject = new window.Razorpay(options);
     paymentObject.open();
  
     paymentObject.on("payment.failed", function (response) {
       alert("Payment failed. Please try again. Contact support for help");
     });
   }
  };

  return (
    <>
      <ToastContainer />
      <Seo title = {componentData && componentData?.title ? componentData.title : ""} />
      <Row className="row-sm mg-t-35">
        {systemConfigList && systemConfigList?.data && systemConfigList.data.length > 0 && systemConfigList.data.map((obj,index)=>{
          return (
            <>
            <Col md={4} key={index}>
            <Card className=" custom-card">
              <Card.Header className="pd-10">
                <div className='d-flex justify-content-between align-items-center'>
                  <div>
                    {obj?.type} 
                  </div> 
                  {obj?.description && obj?.description != "" &&
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>{obj?.description}</Tooltip>}
                    >
                      <span className="pull-right mg-r-10 tx-16 text-secondary">
                        <i className="fe fe-info"></i>
                      </span>
                    </OverlayTrigger>}
                </div>
              </Card.Header>
              <Card.Body className="pd-10 ht-200 overflow-auto"> 
                <nav className="nav flex-column"> 
                { obj.services.map((objserv,servindex)=>{
                  return (
                    <>   
                      <p className="nav-link mb-2 text-muted bd-b" key={servindex}>
                        <img src={objserv?.service_icon} className='wd-30 ht-30 rounded-circle border'/>
                        
                        &nbsp; {objserv?.service}
                        <span
                          className="pull-right text-info d-flex justify-content-end align-items-center">
                            {objserv?.is_testshow && obj?.type == "Mail" && 
                            <>  
                            <OverlayTrigger
                              placement="bottom"
                              overlay={<Tooltip>{t("system_config.tooltip.test_configuration_of")} {objserv?.service}</Tooltip>}
                            > 
                              <i className="fe fe-send" onClick={()=>{dispatch(getSystemConfigEmailUser(objserv?.service_type_id));setServiceName(objserv?.service);handleOpenTestModal()}}></i> 
                            </OverlayTrigger>
                            &nbsp; | &nbsp;
                            </>}
                            {obj?.type == "Payment Gateway" && 
                            <>  
                            <OverlayTrigger
                              placement="bottom"
                              overlay={<Tooltip>{t("system_config.tooltip.test_configuration_of")} {objserv?.service}</Tooltip>}
                            > 
                              <i className="fe fe-send" onClick={() => {
                                  makePayment(objserv);
                                }}></i> 
                            </OverlayTrigger>
                            &nbsp; | &nbsp;
                            </>}

                            {obj?.type && obj?.type == "Mail" &&
                              <> 
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={<Tooltip>{t("system_config.tooltip.manage_email_users")}</Tooltip>}
                                > 
                                  <i className="fe fe-users" onClick={()=>{dispatch(getSystemConfigEmailUser(objserv?.service_type_id)); setServiceName(objserv?.service); handleOpenModal(); setServiceTypeID(objserv?.service_type_id); }}>
                                  </i> 
                                 
                                </OverlayTrigger>
                                &nbsp; | &nbsp;
                              </>
                            }

                            <>
                            <OverlayTrigger
                              placement="bottom"
                              overlay={<Tooltip>{t("system_config.tooltip.mark_as_default")}</Tooltip>}
                            >
                              <label className="custom-control custom-radio m-0">
                                <input
                                  key={servindex}
                                  type="checkbox"
                                  className="custom-control-input"
                                  name="example-radios"
                                  value="option1"
                                  checked={objserv?.is_default == "Y" ? true : false}
                                  onChange={()=>{handleDefaultUpdateStatus(objserv?.service_type_id)}}
                                />
                                <span className="custom-control-label"></span>  
                              </label>
                              </OverlayTrigger>
                              | &nbsp;
                            </>

                            <>
                            <OverlayTrigger
                              placement="bottom"
                              overlay={<Tooltip>{t("system_config.tooltip.configure")} {objserv?.service}</Tooltip>}
                              >
                                <i onClick={()=>{
                                  handleOpenOffcanvas(obj?.type,objserv?.service),
                                  setJsonSchemaFromBackend(objserv),
                                  setServiceTypeID(objserv?.service_type_id)}} 
                                  className="fe fe-settings settings-icon pointer">
                                </i>
                            </OverlayTrigger>
                            &nbsp; | &nbsp;
                            </>

                            <>
                              <label className="custom-switch">
                                <input
                                  type="checkbox"
                                  name="custom-switch-checkbox1"
                                  className="custom-switch-input"
                                  checked={objserv?.status=='Active' ? true : false}
                                  onChange={e => handleStatusSwitch(objserv)}
                                />
                                <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                              </label>
                            </> 
                              
                        </span>
                      </p> 
                    </>
                    )  
                  })
                }
                </nav>  
              </Card.Body>
            </Card>
          </Col>
          </>
          )
        })}
      </Row>


    {/*////////////////////// Dynamic Form OffCanvas ///////////////////////////// */}
      <Offcanvas show={openOffcanvas}  placement="end" backdrop="static" className="wd-40p">
        <Offcanvas.Header closeButton onClick={()=>{handleOpenOffcanvas("","")}}>
          {modalTitle}
        </Offcanvas.Header>
        <Offcanvas.Body className='pd-20'>
          <DynamicForm formSchema={jsonSchemaFromBackend} onSubmit={onSubmit} />
        </Offcanvas.Body>
      </Offcanvas>

    {/*////////////////////// Configure Email User Modal ///////////////////////////// */}  
      <Modal show={openModal} size="xl" backdrop="static">
      <Form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            formsFieldsModal.handleSubmit();
            return false;
          }}
        >
        <Modal.Header closeButton onClick={()=>{handleOpenModal();formsFieldsModal.resetForm()}}>
        {t("system_config.modal_title.configure_email_user")} - <span className='text-primary mg-l-4'>{serviceName}</span>
        </Modal.Header>
        <Modal.Body>
          <Table className="table bd bd-2">
            <thead>
              <tr className="overflow-hidden">
                <th className="wd-20p"> {t("system_config.configure_mail_modal.table_header.smtp_user")} <span className='text-danger'>*</span></th>
                <th className="wd-20p"> {t("system_config.configure_mail_modal.table_header.smtp_password")} <span className='text-danger'>*</span></th>
                <th className="wd-12p"> {t("system_config.configure_mail_modal.table_header.sender_name")}</th>
                <th className="wd-12p"> {t("system_config.configure_mail_modal.table_header.sender_email_id")} <span className='text-danger'>*</span></th>
                <th className="wd-5p"> {t("common.status")}</th>
                <th className="wd-5p">  
                  <span 
                    className="bg-teal rounded-circle pd-8 pd-l-12 pd-r-12 bd-0 ht-35 wd-35 pointer"
                    onClick={() => {
                      createNewRowExcp();
                    }}
                  >
                    <i className="fa fa-plus tx-12 text-white"></i>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
            {formsFieldsModal?.values?.rows && formsFieldsModal?.values?.rows.length == 0 && <tr><td colSpan={6} className='text-center'>{t("system_config.no_user_data")}</td></tr>}
            {formsFieldsModal &&
              formsFieldsModal.values &&
              formsFieldsModal.values.rows &&
              formsFieldsModal.values.rows.map((data, index) => {
                return (
                  <tr key={index}>
                    <td className="wd-20p">
                      <Form.Group>
                        <Form.Control
                          type="text"
                          name={`rows[${index}].username`}
                          autoComplete="off"
                          onChange={(e) => {
                            formsFieldsModal.setFieldValue(
                              `rows[${index}].username`,
                              e.target.value
                            );
                            // setValidationExceptionRule(e);
                          }}
                          value={formsFieldsModal.values.rows[index]?.username}
                          className={
                            formsFieldsModal.errors.rows &&
                              formsFieldsModal.errors.rows[index] &&
                              formsFieldsModal.errors.rows[index]?.username &&
                              formsFieldsModal.touched.rows &&
                              formsFieldsModal.touched.rows[index] &&
                              formsFieldsModal.touched.rows[index]?.username
                              ? "red-field is-invalid"
                              : ""
                          }
                          placeholder={t("system_config.configure_mail_modal.placeholders.smtp_user")}
                          disabled ={!formsFieldsModal.values.rows[index]?.show}
                        />
                      </Form.Group>
                    </td>
                    <td className="wd-20p">
                    <Form.Group>
                        <Form.Control
                          type="text"
                          name={`rows[${index}].password`}
                          autoComplete="off"
                          onChange={(e) => {
                            formsFieldsModal.setFieldValue(
                              `rows[${index}].password`,
                              e.target.value
                            );
                            // setValidationExceptionRule(e);
                          }}
                          value={formsFieldsModal.values.rows[index]?.password}
                          className={
                            formsFieldsModal.errors.rows &&
                              formsFieldsModal.errors.rows[index] &&
                              formsFieldsModal.errors.rows[index]?.password &&
                              formsFieldsModal.touched.rows &&
                              formsFieldsModal.touched.rows[index] &&
                              formsFieldsModal.touched.rows[index]?.password
                              ? "red-field is-invalid"
                              : ""
                          }
                          placeholder={t("system_config.configure_mail_modal.placeholders.smtp_password")}
                          disabled ={!formsFieldsModal.values.rows[index]?.show}
                        />
                      </Form.Group>
                    </td>
                    <td className="wd-12p">
                      <Form.Group>
                        <Form.Control
                          type="text"
                          name={`rows[${index}].sendername`}
                          autoComplete="off"
                          onChange={(e) => {
                            formsFieldsModal.setFieldValue(
                              `rows[${index}].sendername`,
                              e.target.value
                            );
                            // setValidationExceptionRule(e);
                          }}
                          value={formsFieldsModal.values.rows[index]?.sendername}
                          className={
                            formsFieldsModal.errors.rows &&
                              formsFieldsModal.errors.rows[index] &&
                              formsFieldsModal.errors.rows[index]?.sendername &&
                              formsFieldsModal.touched.rows &&
                              formsFieldsModal.touched.rows[index] &&
                              formsFieldsModal.touched.rows[index]?.sendername
                              ? "red-field is-invalid"
                              : ""
                          }
                          placeholder={t("system_config.configure_mail_modal.placeholders.sender_name")}
                          disabled ={!formsFieldsModal.values.rows[index]?.show}
                        />
                      </Form.Group>
                    </td>
                    <td className="wd-12p">
                      <Form.Group>
                        <Form.Control
                          type="text"
                          name={`rows[${index}].senderemailid`}
                          autoComplete="off"
                          onChange={(e) => {
                            formsFieldsModal.setFieldValue(
                              `rows[${index}].senderemailid`,
                              e.target.value
                            );
                            // setValidationExceptionRule(e);
                          }}
                          value={formsFieldsModal.values.rows[index]?.senderemailid}
                          className={
                            formsFieldsModal.errors.rows &&
                              formsFieldsModal.errors.rows[index] &&
                              formsFieldsModal.errors.rows[index]?.senderemailid &&
                              formsFieldsModal.touched.rows &&
                              formsFieldsModal.touched.rows[index] &&
                              formsFieldsModal.touched.rows[index]?.senderemailid
                              ? "red-field is-invalid"
                              : ""
                          }
                          placeholder={t("system_config.configure_mail_modal.placeholders.sender_email_id")}
                          disabled ={!formsFieldsModal.values.rows[index]?.show}
                        />
                      </Form.Group>
                    </td>

                    <td className="wd-5p">
                      <Form.Group>
                        <label className="custom-switch">
                          <input
                            type="checkbox"
                            name={`rows[${index}].status`}
                            className="custom-switch-input"
                            checked={formsFieldsModal.values.rows[index]?.status == true ? true : false}
                            disabled = {formsFieldsModal.values.rows[index]?.id == 0 ? true : false}
                            onChange ={(e) => {
                              handleUserUpdateStatus(index)
                              
                            }}
                          />
                          <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                        </label>
                      </Form.Group>
                    </td>

                    <td className="wd-5p">
                      {formsFieldsModal.values.rows[index]?.show && 
                      <div className='d-flex'>
                      <button
                        className="bg-success rounded-circle ht-35 wd-35 pd-l-12 pd-r-12 mg-r-3 bd-0"
                        onClick={() => {
                          submitConfigureUser(formsFieldsModal.values.rows[index],index);
                        }}
                        type='button'
                      >
                        <i className="fa fa-save tx-12 text-white"></i>
                      </button>
                      <button
                        className="bg-danger rounded-circle ht-35 wd-35 pd-l-12 pd-r-12 mg-r-3 bd-0"
                        onClick={() => {
                          if(formsFieldsModal.values.rows[index]?.id == 0){
                            deleteRoow(index)
                          }else{
                            formsFieldsModal.setFieldValue(
                              `rows[${index}].show`,
                              !formsFieldsModal.values.rows[index]?.show
                            );
                          }
                          
                        }}
                        type='button'
                      >{
                        formsFieldsModal.values.rows[index]?.id == 0 ? <i className="fa fa-close tx-12 text-white"></i> : <i className="fe fe-refresh-cw tx-12 text-white"></i>
                      }
                        
                      </button>
                      </div>
                      }
                      {!formsFieldsModal.values.rows[index]?.show && 
                      <button
                        className="bg-info rounded-circle ht-35 wd-35 pd-l-12 pd-r-12 mg-r-3 bd-0"
                        onClick={() => {
                          formsFieldsModal.setFieldValue(
                            `rows[${index}].show`,
                            !formsFieldsModal.values.rows[index]?.show
                          );
                        }}
                        type='button'
                      >
                        <i className="fa fa-edit tx-12 text-white"></i>
                      </button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={()=>{handleOpenModal(); formsFieldsModal.resetForm()}}
            >
              {t("common.close")}
            </button>
          </div>
        </Modal.Footer>
        </Form>
      </Modal>

    {/*////////////////////// Test Modal ///////////////////////////// */} 
      <Modal show={openTestModal} size="md" backdrop="static">
        <Modal.Header closeButton onClick={()=>{handleOpenTestModal(); formsFieldsModal.setFieldValue("rows", []);}}>{t("system_config.modal_title.test_configuration_of")} <span className='text-primary mg-l-3'>{serviceName}</span></Modal.Header>
        <Modal.Body>
          <Row>
          <Form.Group 
            as={Col}
            md="12"
            controlid="validationFormik102"
            className="mb-2"
          >
            <Form.Label>{t("system_config.test_configuration_modal.label.email_send_on")} <span className='text-danger'>*</span></Form.Label>
            <Form.Control
              type="text"
              name="email"
              autoComplete="off"
              onChange={(e) => {setEnteredEmai(e.target.value)}}
              value={enteredEmail}
              placeholder={t("system_config.test_configuration_modal.placeholders.email_send_on")}
            />
          </Form.Group>

          <Form.Group
            as={Col}
            md="12"
            controlid="validationFormik102"
            className="mb-0"
          >
            <Form.Label>{t("system_config.test_configuration_modal.label.select_user")} <span className='text-danger'>*</span></Form.Label>
            <Select
              styles={selectStyles}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary25: "var(--primary-bg-color)",
                  primary: "var(--primary-bg-color)",
                },
              })}
              name="type"
              placeholder={t("system_config.test_configuration_modal.placeholders.select_user")}
              options={senderOptions}
              getOptionLabel={(x) => x.showname}
              getOptionValue={(x) => x.mailuser_id}
              value={selectedSenderUser}
              onChange={(e) => setSeletedSenderUser(e)}
            />
          </Form.Group>
          </Row>
        </Modal.Body>
        <Modal.Footer className='text-right'>
          {loaderForTestModal && 
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
          }
          {!loaderForTestModal && 
          <Button 
            className="btn btn-primary ms-2" 
            onClick={sendToTest}>
            {t("system_config.test_configuration_modal.text_email_btn")}
          </Button>
          }
          <button type="button" className="btn btn-secondary ms-2" onClick={()=>{handleOpenTestModal(); formsFieldsModal.setFieldValue("rows", []);}}>{t("common.close")}</button>
          </Modal.Footer>
      </Modal>
    </>
  )
}
SystemConfiguration.layout = "Contentlayout";
export default SystemConfiguration