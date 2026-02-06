import React, { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import {
  Button,
  Col,
  Form,
  Row,
  Container,
  Card,
  Spinner,
} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
//Images
import logolight from "../../public/assets/img/brand/logo-light.png";
import logo from "../../public/assets/img/brand/logo.png";
import tutor_login from "../../public/assets/img/brand/tutor_login.png";
import defaultLogo from "../../public/assets/img/brand/logo-dark.png";
import defaultLightLogo from "../../public/assets/img/brand/logo.png";
import defaultFavicon from "../../public/assets/img/brand/favicon.png";
import { useTranslation } from "react-i18next";
import "../../shared/utils/i18n"; // Initialize i18next
import {
  checkForgotpassword,
  clearCheckForgotpassword,
  verifyForgot,
  clearVerifyForgot,
  clearHasError,
  getCompanyList
} from "../../shared/redux/slices/auth/auth";

import { d_mmm_y } from"../../shared/data/helperFunctions/dateCustom";
// import {
//   getCompanyList,

// } from "../shared/redux/slices/auth/auth";
import ReCAPTCHA from "react-google-recaptcha";

const Forgotpassword = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { push } = useRouter();
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");
  const [showpassIcon2, setPassicon2] = useState("fe fe-eye-off");
  const [eventKey, setEventKey] = useState("");
  const [data, setData] = useState({
    username: "",
    otp: "",
    new_password: "",
    confirm_password: "",
  });
  const { username, otp, new_password, confirm_password } = data;
  const [isLoginSuccess, setLoginSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  let [timerval, settimerval] = useState(0);
  let navigate = useRouter();
  // const [cookies, setCookie] = useCookies(["user"]);

  const timeOutCallback = useCallback(
    () => settimerval((currTimer) => currTimer - 1),
    []
  );

  useEffect(() => {
    timerval > 0 && setTimeout(timeOutCallback, 1000);
  }, [timerval, timeOutCallback]);

  const changeHandler = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const [isShowCaptcha, setIsShowCaptcha] = useState(false);
  const [captchaDetails, setCaptchaDetails] = useState({});
  const captchaRef = useRef(null);

  const { otpSuccessData, changepasswordData, errorData } = useSelector(
    (state) => {
      return {
        otpSuccessData:
          state && state.authData && state.authData.otpforgetSuccResp,
        changepasswordData:
          state && state.authData && state.authData.forgetSuccData,
        errorData: state && state.authData && state.authData.error,
      };
    }
  );
  const getCompanyListData = useSelector((state) => state?.authData?.getCompanyListData?.data);
  const getCompanySettingsData = useSelector((state) => state?.authData?.getCompanyListData);
  // ---------------handle errors msg in slice----------------------------
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
      if (captchaRef.current) {
        captchaRef.current.value = ""; // Reset the value of the input element
        captchaRef.current.reset();
      }
    }
  }, [errorData]);

useEffect(() => {
       if (getCompanySettingsData?.statusCode === 200 && getCompanySettingsData?.redirect == true) {
           navigate.replace("/503");
       }else if(getCompanySettingsData?.statusCode === 200 && getCompanySettingsData?.redirect == false){
         let licenseStatus = getCompanySettingsData?.data?.licenseStatus;
         if(!licenseStatus.isStart){
           let startDate = d_mmm_y(licenseStatus.start_date)
           navigate.replace(`/503?startDate=${startDate}`);
         }
       }
   }, [getCompanySettingsData]);

  useEffect(() => {
        dispatch(getCompanyList());
  }, [dispatch]);
  useEffect(() => {
    if (otpSuccessData?.statusCode == 200) {
      let userData = otpSuccessData?.data;
      const lastDigitMobile = String(userData.mobile).slice(-4);
      let newuserData = {
        ...userData,
        personalmobile: "XXXXXX" + lastDigitMobile,
      };
      setUserInfo(newuserData);
      setLoginSuccess(true);
      setIsLoading(false);
      dispatch(clearCheckForgotpassword());
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {otpSuccessData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      if (captchaRef.current) {
        captchaRef.current.value = ""; // Reset the value of the input element
        captchaRef.current.reset();
      }
    }
  }, [otpSuccessData]);

  // -------------success code for veriefy OTP---------------------

  useEffect(() => {
    if (changepasswordData?.statusCode == 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {changepasswordData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearVerifyForgot());
      setTimeout(() => {
        push("/");
      }, [1000]);
    }
  }, [changepasswordData]);

  // -------------Login function----------------------------
  const handleForgotPassword = (e) => {
    if (!isLoginSuccess) {
      setUserInfo({});
      setLoginSuccess(false);
    }

    const myString = data.username;
    const regex = /[a-zA-Z]/;

    if (data.username == "") {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {t("login.errormsg.please_enter_username")}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
    } else {
      if (isLoginSuccess) {
        if (data.new_password == "") {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {t("login.errormsg.please_enter_new_password")}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        }
        else if (
          data.new_password.length < 8 ||
          !/[A-Z]/.test(data.new_password) ||       // At least one uppercase
          !/[a-z]/.test(data.new_password) ||       // At least one lowercase
          !/[^A-Za-z0-9]/.test(data.new_password)   // At least one special character
        ) {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {t("login.errormsg.password_length")}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        }
        else if (data.confirm_password == "") {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {t("login.errormsg.please_enter_confirm_password")}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        } else if (data.confirm_password != data.new_password) {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {t("login.errormsg.password_must_be_match")}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        } else if (!data.otp) {
          toast.error(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0">
              {t("login.errormsg.please_enter_otp")}
            </p>,
            {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: true,
              theme: "colored",
            }
          );
        } else {
          var reg = /^\d+$/;
          //validate OTP
          if (!reg.test(data.otp)) {
            toast.error(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0">
                {t("login.errormsg.please_enter_valid_otp")}
              </p>,
              {
                position: toast.POSITION.TOP_RIGHT,
                hideProgressBar: true,
                theme: "colored",
              }
            );
          } else if (data.otp.length < 6) {
            toast.error(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0">
                {t("login.errormsg.otp_should_be_digit")}
              </p>,
              {
                position: toast.POSITION.TOP_RIGHT,
                hideProgressBar: true,
                theme: "colored",
              }
            );
          } else {
            setIsLoading(true);
            const payload = {
              loginid: data.username,
              password: data.new_password,
              otp: data.otp,
            };
            dispatch(verifyForgot(payload));
          }
        }
      }
      else {
        if (isShowCaptcha && isShowCaptcha === true) {
          const CollectedCaptchaValue = captchaRef.current.getValue();
          if (!CollectedCaptchaValue) {
            toast.error(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0">
                {t("common.captcha_error")}
              </p>,
              {
                position: toast.POSITION.TOP_RIGHT,
                hideProgressBar: true,
                theme: "colored",
              }
            );
          } else {
            const payload = {
              loginid: data.username,
            };
            setIsLoading(true);
            dispatch(checkForgotpassword(payload));
          }
        } else {
          const payload = {
            loginid: data.username,
          };
          setIsLoading(true);
          dispatch(checkForgotpassword(payload));
        }
      }
    }
  };


  useEffect(() => {
    // Add the event listener when the component mounts
    document.addEventListener("keydown", handleKeyPress);
    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      setEventKey("Enter");
    }
  };




  useEffect(() => {
    if (eventKey === "Enter") {
      handleForgotPassword();
      setEventKey("");
    }
  }, [eventKey]);

  console.log("handleKeyPress", eventKey);

  // ----------Login function key press enter end------------

  useEffect(() => {
    if (isLoginSuccess) {
      settimerval(59);
    }
  }, [isLoginSuccess]);

  // --------Auto Login if 6 digit number insterted------
  useEffect(() => {
    if (data && data?.otp.length == 6) {
      handleForgotPassword();
    }
  }, [data.otp]);

  const resetTimer = () => {
    if (timerval == 0) {
      settimerval(59);
    }

    const payload = {
      loginid: data.username,
    };
    setData({ ...data, otp: "" });
    dispatch(checkForgotpassword(payload));
  };


  const [companySettings, setCompanySettings] = useState(null);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem("company_settings");
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setCompanySettings(parsedSettings); // Set to state
        } catch (err) {
          console.error("Error parsing company_settings from localStorage", err);
        }
      }
    }
  }, []);

  console.log("getCompanyListData===>", companySettings?.admin_panel_logo)
  const baseUrl = process.env.API_URL_FILEMANAGER;
  console.log("baseUrlbaseUrl", baseUrl)
  const logoUrl = companySettings?.web_panel_logo
    ? `${baseUrl}${companySettings.web_panel_logo}`
    : defaultLogo.src
    ;
  const adminLogoUrl = getCompanyListData?.admin_panel_logo
    ? `${baseUrl}${getCompanyListData.admin_panel_logo}`
    : defaultLogo.src;


  const faviconUrl = companySettings?.favicon
    ? `${baseUrl}${companySettings.favicon}`
    : defaultFavicon.src
    ;



  useEffect(() => {
    if (companySettings?.favicon) {
      const baseUrl = process.env.API_URL_FILEMANAGER;
      const faviconLink = document.querySelector("link[rel~='icon']") || document.createElement("link");
      faviconLink.rel = "icon";
      faviconLink.href = `${baseUrl}${companySettings.favicon}`;
      document.getElementsByTagName("head")[0].appendChild(faviconLink);
    }
  }, [companySettings]);






  return (
    <div>
      <Head>
        <title>{t("login.meta_title")}</title>
        <meta name="description" content="Tbs" />
        <link rel="icon" href={faviconUrl} />
      </Head>
      <ToastContainer />
      <div className="page main-signin-wrapper">
        <Row className="signpages text-center">
          <Col md={12}>
            <Card>
              <Row className="row-sm">
                <Col
                  lg={6}
                  xl={5}
                  // className="d-none d-lg-block text-center bg-primary details"
                  className="d-none d-lg-block text-center background-black "
                >
                  <div className="mt-5 pt-4 p-2">
                    <img
                      src={adminLogoUrl}
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultLogo.src }}
                      className="mb-0 mt-4"
                      style={{ width: '155px', height: 'auto' }}
                      alt="user"
                    />
                    <div className="clearfix"></div>
                    <h5 className="mt-4 mb-4 text-white">{t("login.title-forget")}</h5>
                    <span className="tx-white-6 tx-13 mb-5 mt-xl-0">
                      {/* {t("login.labels.sub_title1")} */}
                    </span>
                  </div>
                  <div></div>
                </Col>
                <Col lg={6} xl={7} xs={12} sm={12} className="login_form ">
                  <Container fluid>
                    <Row className="row-sm">
                      <Card.Body className="mt-2 mb-2 pd-55">
                        <img
                          src={adminLogoUrl}
                          className=" d-lg-none header-brand-img text-start float-start mb-4 auth-light-logo"
                          alt="logo"
                        />
                        <img
                          src={adminLogoUrl}
                          className=" d-lg-none header-brand-img text-start float-start mb-4 auth-dark-logo"
                          alt="logo"
                        />
                        <div className="clearfix"></div>
                        <Form className="mb-2">
                          {!isLoginSuccess ? (
                            <>
                              <h5 className="text-start">
                                {t("login.labels.title")}
                              </h5>
                              <p className="mb-4 text-muted tx-13 ms-0 text-start">
                                {/* {t("login.labels.sub_title")} */}
                              </p>
                            </>
                          ) : (
                            <>
                              <h5 className="text-start mb-2">
                                {t("login.labels.title1")}
                              </h5>
                              <p className="mb-2 text-muted tx-13 ms-0 text-start">
                                {t("login.labels.otp_title")}{" "}
                                {/* <span className="text-info">
                                  {userInfo.personalmobile}
                                </span>{" "} */}
                                {t("login.labels.otp_title1")}
                              </p>
                            </>
                          )}
                          <div className="inputgroup-toggles input-group text-start mb-4">
                            <Form.Control
                              style={{ paddingLeft: "1.5em" }}
                              className="form-control ht-45 rounded-50"
                              placeholder={t(
                                "login.forms.placeholder.username"
                              )}
                              name="username"
                              type="text"
                              value={username}
                              onChange={changeHandler}
                              required
                              disabled={isLoginSuccess}
                            />

                          </div>
                          {!isLoginSuccess && isShowCaptcha &&
                            isShowCaptcha === true &&
                            captchaDetails?.google_recaptcha_site_key ? (
                            <div className="d-flex align-items-center">
                              <ReCAPTCHA
                                sitekey={captchaDetails?.google_recaptcha_site_key}
                                ref={captchaRef}
                              />
                            </div>
                          ) : (
                            ""
                          )}

                          {!isLoginSuccess ? (
                            <>
                              <hr />
                              {!isLoading ? (
                                <>
                                  <Button
                                    onClick={handleForgotPassword}
                                    // variant="primary"
                                      variant="mute"
                                    className="btn-block mt-4 ht-45 rounded-50 background-black text-white"
                                  >
                                    {t("login.forms.button.generate_otp")}
                                  </Button>
                                  <br />
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="primary"
                                    className="btn-block ht-45 rounded-50 background-black text-white"
                                    disabled
                                  >
                                    <Spinner
                                      as="span"
                                      animation="border"
                                      size="sm"
                                      role="status"
                                      aria-hidden="true"
                                    />{" "}
                                    <span className="">
                                      {t("login.forms.button.sending_otp")}
                                    </span>
                                  </Button>
                                  <br />
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="inputgroup-toggles input-group text-start mb-4">
                                <Form.Control
                                  style={{ paddingLeft: "1.5em" }}
                                  className="form-control ht-45 rounded-50"
                                  placeholder={t(
                                    "login.forms.placeholder.new_password"
                                  )}
                                  name="new_password"
                                  type={
                                    showpassIcon == "fe fe-eye"
                                      ? "text"
                                      : "password"
                                  }
                                  value={new_password}
                                  onChange={changeHandler}
                                  required
                                />
                                <div className="input-group-prepend">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      let ic =
                                        showpassIcon == "fe fe-eye"
                                          ? "fe fe-eye-off"
                                          : "fe fe-eye";
                                      setPassicon(ic);
                                    }}
                                    className="input-group-text"
                                    style={{
                                      borderTopRightRadius: 50,
                                      borderBottomRightRadius: 50,
                                    }}
                                  >
                                    <i className={`fe ${showpassIcon}`}></i>
                                  </button>
                                </div>
                              </div>
                              <div className="inputgroup-toggles input-group text-start mb-4">
                                <Form.Control
                                  style={{ paddingLeft: "1.5em" }}
                                  className="form-control ht-45 rounded-50"
                                  placeholder={t(
                                    "login.forms.placeholder.confirm_password"
                                  )}
                                  name="confirm_password"
                                  type={
                                    showpassIcon2 == "fe fe-eye"
                                      ? "text"
                                      : "password"
                                  }
                                  value={confirm_password}
                                  onChange={changeHandler}
                                  required
                                />
                                <div className="input-group-prepend">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      const ic = showpassIcon2 === "fe fe-eye-off" ? "fe fe-eye" : "fe fe-eye-off"; // Reversed logic
                                      setPassicon2(ic);
                                    }}
                                    className="input-group-text"
                                    style={{
                                      borderTopRightRadius: 50,
                                      borderBottomRightRadius: 50,
                                    }}
                                  >
                                    <i className={`fe ${showpassIcon2}`}></i>
                                  </button>
                                </div>
                              </div>
                              <div className="inputgroup-toggles input-group text-start">
                                <Form.Control
                                  style={{ paddingLeft: "1.5em" }}
                                  className="form-control ht-45 rounded-50"
                                  placeholder={t("login.forms.placeholder.otp")}
                                  name="otp"
                                  type="text"
                                  value={otp}
                                  onChange={changeHandler}
                                  required
                                  autoComplete={"off"}
                                  maxLength={6}
                                  pattern="[0-9]{1,6}"
                                />
                              </div>
                              <p className="mb-0 text-right">
                                {timerval <= 0 ? (
                                  <span
                                    className="text pointer tx-12 pd-r-10 "
                                    onClick={() => {
                                      resetTimer();
                                    }}
                                  >
                                    {t("login.labels.didn't_recieve_otp")}{" "}
                                    <strong>
                                      {t("login.labels.resend_again")}
                                    </strong>
                                  </span>
                                ) : (
                                  <span className="text-secondary pointer tx-12 pd-r-10 ">
                                    {t("login.labels.resent_otp_sec", {
                                      name:
                                        timerval < 10
                                          ? `0${timerval}`
                                          : timerval,
                                    })}
                                  </span>
                                )}
                              </p>
                              <hr className="mt-2 mb-3" />

                              {!isLoading ? (
                                <Button
                                  onClick={handleForgotPassword}
                                  // variant="primary"
                                  variant="mute"
                                  className="btn-block ht-45 rounded-50 background-black text-white"
                                >
                                  {t("login.forms.button.verify_otp")}
                                </Button>
                              ) : (
                                <Button
                                  // variant="primary"
                                  variant="mute"
                                  className="btn-block ht-45 rounded-50 background-black text-white"
                                  disabled
                                >
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                  />{" "}
                                  <span className="">
                                    {" "}
                                    {t("login.forms.button.verifying")}
                                  </span>
                                </Button>
                              )}
                            </>
                          )}
                        </Form>
                        <div className="card-footer border-top-0 ps-0 mt-3 text-start ">
                          <p>
                            {t("login.labels.did_you_remembered_your_password")}
                          </p>
                          <p className="mb-0">
                            {t("login.labels.try_to")}
                            <Link href={`/`} style={{ color: "#044668ff" }}> {t("login.labels.signin")}</Link>
                          </p>
                        </div>
                      </Card.Body>
                    </Row>
                  </Container>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};
Forgotpassword.layout = "Authenticationlayout";

export default Forgotpassword;
