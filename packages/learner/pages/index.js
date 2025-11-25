import React, { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import { Button, Col, Form, Row, Container, Card, Spinner } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import logo_dark from "../public/assets/img/brand/logo-dark.png";
import defaultLogo from "../public/assets/img/brand/logo-dark.png";
import defaultFavicon from "../public/assets/img/brand/favicon.png";
import { useTranslation } from "react-i18next";
import "../shared/utils/i18n";
import {
  getCompanyList,
  dispatchDirectLogin,
  clearDispatchDirectLogin,
  dispatchFromUserPass,
  cleardispatchFromUserPass,
  verifyLogin,
  clearVerifyLogin,
  clearHasError
} from "../shared/redux/slices/auth/auth";


import ReCAPTCHA from "react-google-recaptcha";

const Home = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  let navigate = useRouter();
  const [showpassIcon, setPassicon] = useState("fe fe-eye-off");
  const [eventKey, setEventKey] = useState("");
  const [data, setData] = useState({
    username: "",
    password: "",
    otp: "",
  });
  const { username, password, otp } = data;
  const [isLoginSuccess, setLoginSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  let [timerval, settimerval] = useState(0);

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

  const otpSuccessData = useSelector((state) => state?.authData?.otpSuccessData);
  const getCompanyListData = useSelector((state) => state?.authData?.getCompanyListData?.data);
  const getCompanySettingsData = useSelector((state) => state?.authData?.getCompanyListData);
  const loginSuccData = useSelector((state) => state?.authData?.loginSuccessData);
  const directLoginData = useSelector((state) => state?.authData?.directLoginData);


  const errorData = useSelector((state) => state?.authData?.error);

  useEffect(() => {
      const domain = window.location;
        dispatch(getCompanyList({domain_url : domain?.origin}));
  }, [dispatch]);

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
        captchaRef.current.value = "";
        captchaRef.current.reset();
      }
    }
  }, [errorData]);
  useEffect(() => {
    if (otpSuccessData?.statusCode === 200) {
      let userData = otpSuccessData?.data;
      const lastDigitMobile = String(userData.mobile).slice(-4);
      let newuserData = {
        ...userData,
        personalmobile: "XXXXXX" + lastDigitMobile,
      };
      setUserInfo(newuserData);
      setLoginSuccess(true);
      setIsLoading(false);
      dispatch(cleardispatchFromUserPass());
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
    }
  }, [otpSuccessData]);


  useEffect(() => {
    if (loginSuccData?.statusCode === 200) {
      localStorage.setItem("accessTokenLearner", JSON.stringify(loginSuccData?.data?.accessToken));
      
      localStorage.setItem("menusLearner", JSON.stringify(loginSuccData?.data?.menus));
      localStorage.setItem("userLearner", JSON.stringify(loginSuccData?.data?.user));
      localStorage.setItem("company_settings", JSON.stringify(getCompanyListData));
      localStorage.setItem("apps", JSON.stringify([]));
      dispatch(clearVerifyLogin());
      setTimeout(() => {
        navigate.replace("/dashboard", "", { shallow: true });
        //window.location.href = '/dashboard';
      }, 1500);
      if (captchaRef.current) {
        captchaRef.current.value = ""; // Reset the value of the input element
        captchaRef.current.reset();
      }
    }
  }, [loginSuccData]);


  // -------------Login function----------------------------
  const LoginTopanel = (e) => {
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
    }
    else if (data.password == "") {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {t("login.errormsg.please_enter_password")}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
    } else {
      if (isLoginSuccess) {
        if (!data.otp) {
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
              password: data.password,
              otp: data.otp,
            };

            dispatch(verifyLogin(payload));
          }
        }
      } else {

        const payload = {
          loginid: data.username,
          password: data.password,

        };
        setIsLoading(true);
        if (getCompanyListData?.otp_verification == "true") {
          dispatch(dispatchFromUserPass(payload));
        } else {
          dispatch(dispatchDirectLogin(payload));
        }
       

      }
    }
  };

  useEffect(() => {
    if (getCompanySettingsData?.statusCode === 200 && getCompanySettingsData?.redirect == true) {
        navigate.replace("/503");
    }
  }, [getCompanySettingsData]);

  useEffect(() => {
    if (directLoginData?.statusCode === 200) {
      localStorage.setItem("accessTokenLearner", JSON.stringify(directLoginData?.data?.accessToken));
      localStorage.setItem("menusLearner", JSON.stringify(directLoginData?.data?.menus));
      localStorage.setItem("userLearner", JSON.stringify(directLoginData?.data?.user));
      localStorage.setItem("company_settings", JSON.stringify(getCompanyListData));
      localStorage.setItem("apps", JSON.stringify([]));
      dispatch(clearDispatchDirectLogin());
      setTimeout(() => { navigate.replace("/dashboard", "", { shallow: true }); }, 1500);
      if (captchaRef.current) {
        captchaRef.current.value = ""; // Reset the value of the input element
        captchaRef.current.reset();
      }
    }
  }, [directLoginData]);



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
      setEventKey("Enter");
    }
  };

  useEffect(() => {
    if (eventKey === "Enter") {
      LoginTopanel();
      setEventKey("");
    }
  }, [eventKey]);

  // ----------Login function key press enter end------------

  useEffect(() => {
    if (isLoginSuccess) {
      settimerval(59);
    }
  }, [isLoginSuccess]);

  // --------Auto Login if 6 digit number insterted------
  useEffect(() => {
    if (data && data?.otp.length == 6) {
      LoginTopanel();
    }
  }, [data.otp]);

  const resetTimer = () => {
    if (timerval == 0) {
      settimerval(59);
    }

    const payload = {
      loginid: data.username,
      password: data.password,
    };
    setData({ ...data, otp: "" });
    dispatch(dispatchFromUserPass(payload));
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


  const baseUrl = process.env.API_URL_FILEMANAGER;

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
                  <div className="mt-5 pt-4 p-2 ">
                 
                    <div className="clearfix"></div>
                    <img
                      src={adminLogoUrl}
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultLogo.src }}
                      className="mb-0 mt-4"
                   
                      alt="user"
                    />
                    <h5 className="mt-4 mb-4 text-white">{t("login.title_student")}</h5>
                    <span className="tx-white-6 tx-13 mb-5 mt-xl-0">
                      {/* {t("login.labels.sub_title1")} */}
                    </span>
                  </div>

                  
                  <div></div>
                </Col>
                <Col lg={6} xl={7} xs={12} sm={12} className="login_form ">
                  <Container fluid>
                    <Row className="row-sm">
                      <Card.Body className="mt-2 mb-2">
                        <img
                          src={logo_dark.src}
                          className=" d-lg-none header-brand-img text-start float-start mb-4 auth-light-logo"
                          alt="logo"
                        />
                        <img
                          src={logo_dark.src}
                          className=" d-lg-none header-brand-img text-start float-start mb-4 auth-dark-logo"
                          alt="logo"
                        />
                        <div className="clearfix"></div>
                        <Form className="mb-2">
                          {!isLoginSuccess ? (
                            <>
                              <h5 className="text-start mb-2">
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
                                {t("login.labels.otp_title")}
                                {t("login.labels.otp_title1")}
                              </p>
                            </>
                          )}
                          <div className="inputgroup-toggles input-group text-start mb-4">
                            <Form.Control
                              style={{ paddingLeft: "1.5em" }}
                              className="form-control ht-45 rounded-50"
                              placeholder={t("login.forms.placeholder.username")}
                              name="username"
                              type="text"
                              value={username}
                              onChange={changeHandler}
                              required
                              disabled={isLoginSuccess}
                            />
                          </div>
                          {!isLoginSuccess ? (
                            <>
                              <div className="inputgroup-toggles input-group text-start mb-4">
                                <Form.Control
                                  type={
                                    showpassIcon == "fe fe-eye"
                                      ? "text"
                                      : "password"
                                  }
                                  name="password"
                                  className="form-control ht-45 rounded-50"
                                  placeholder={t("login.forms.placeholder.password")}
                                  autoComplete="off"

                                  value={password}
                                  onChange={changeHandler}
                                  style={{ paddingLeft: "1.5em" }}
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
                              {isShowCaptcha &&
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
                              <hr />
                              {!isLoading ? (
                                <><Button
                                  onClick={LoginTopanel}
                                  // variant="primary"
                                    variant="mute"
                                  className="btn-block mt-4 ht-45 rounded-50 background-black text-white"
                                >
                               
                                  {getCompanyListData?.otp_verification == "true" ? (
                                    <>{t("login.forms.button.generate_otp")}</>
                                  ) : (
                                    <>Login</>
                                  )}
                                </Button>
                                  <br /></>
                              ) : (
                                <><Button
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
                                 
                                    {getCompanyListData?.otp_verification == "true" ? (
                                      <>{t("login.forms.button.sending_otp")}</>
                                    ) : (
                                      <>{t("login.forms.button.verifying")}</>
                                    )}
                                  </span>
                                </Button>
                                  <br /></>
                              )}
                            </>
                          ) : (
                            <>
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
                                    <strong>{t("login.labels.resend_again")}</strong>
                                  </span>
                                ) : (
                                  <span className="text pointer tx-12 pd-r-10 ">
                                    {t("login.labels.resent_otp_sec", {
                                      name:
                                        timerval < 10 ? `0${timerval}` : timerval,
                                    })}
                                  </span>
                                )}
                              </p>
                              <hr className="mt-2 mb-3" />

                              {!isLoading ? (
                                <Button
                                  onClick={LoginTopanel}
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
                                  <span className=""> {t("login.forms.button.verifying")}</span>
                                </Button>
                              )}
                              <span
                                className="text pointer tx-12 mg-t-10 "
                                onClick={(e) => {
                                  setLoginSuccess(false);
                                  settimerval(0);
                                  
                                  setData({
                                    username: "",
                                    password: "",
                                    otp: "",
                                     // clear this if needed
                                    // clear other login fields too if any
                                  });
                                }}
                              >
                                {t("login.labels.sign_diffrent_title")}
                              </span>
                            </>
                          )}
                        </Form>
                        <div className="text-start mt-4 ms-0">
                          <div className="mb-1">
                            <Link href={`/forgot-password`} style={{ color: "#044668ff" }}> {t("login.labels.forget_password")}</Link>
                          </div>
                          <div>
                            {t("login.labels.don't_have_account")}
                            <Link href={`/sign-up`} style={{ color: "#044668ff" }}>
                              {" "}
                              {t("login.labels.resgister_here")}
                            </Link>
                          </div>
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
Home.layout = "Authenticationlayout";

export default Home;
