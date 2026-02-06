import { useState, useEffect } from "react";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import {addLicenseKey, clearAddLicenseKey, clearHasError} from "../../../shared/redux/slices/web-settings/company-setting";
import { logOutData, clearlogOutData } from "../../../shared/redux/slices/authentication/Auth";
import { useRouter } from "next/router";
import Seo from "../../../shared/layout-components/seo/seo";
import defaultLogo from "../../../public/assets/img/brand/logo-dark.png";


const activeyouraccount = () => {
  const [oneClick, setOneClick] = useState(false);
  const [isSessionCheck, setSessionCheck] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const [pageType, setPageType] = useState("activate");

  const { addLicenseKeyData, errorData, logoutData } = useSelector((state) => {
    return {
      addLicenseKeyData:state && state.companySetting && state.companySetting.addLicenseKeyResp,
      errorData: state && state.companySetting && state.companySetting.error,
      logoutData: state && state.authData && state.authData.logout,
    };
  });

  const formValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      licenseKey: "",
    },
    validationSchema: yup.object().shape({
      licenseKey: yup.string().required("Required"),
    }),
    onSubmit: (data) => {
      setOneClick(true);
      const payload = {license_key: data.licenseKey};
      dispatch(addLicenseKey(payload));
    },
  });

  useEffect(() => {
    if (addLicenseKeyData?.statusCode == 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {addLicenseKeyData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      if (addLicenseKeyData?.new === true) {
        // if new license → redirect to the correct page
        setTimeout(() => { router.replace("/company-configuration"); }, 2000);
      } else {
        dispatch(logOutData());
      }
    }
  }, [addLicenseKeyData]);

  useEffect(() => {
    if (logoutData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">Configuration applied. Please log in again to continue using the system.</p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      const signOut = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("menus");
        localStorage.clear();
        setTimeout(() => { document.body.classList.remove("dark-theme");  router.replace("/admin-login", "", { shallow: true });  }, 5000);
      };
      dispatch(clearlogOutData());
      signOut();
    }
  }, [logoutData]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const usertype = user?.usertype;
    if(usertype!='Admin'){
      router.replace("/", "", { shallow: true });
    }else{
      setSessionCheck(true)
    }
  }, []);

  useEffect(() => {
    if (errorData?.statusCode) {
      setOneClick(false);
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
    }
  }, [errorData]);

// Detect page mode from query params
useEffect(() => {
  if (!router.isReady) return;

  const mode = router.query.mode;
  setPageType(mode === "upgrade" ? "upgrade" : "activate");
}, [router.isReady, router.query.mode]);

  return (
   <>
  <Seo title={pageType === "upgrade" ? "Upgrade License" : "Activate License"} />
  <ToastContainer />

  <div
     className="ltr main-body leftmenu main-signin-wrapper"
          style={{
            margin: 0,
            padding: 0,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            color: "#fff",
          }}
  >
   
       <div className='background-black'
              style={{
                padding: "40px 40px",
                borderRadius: "20px",
                maxWidth: "500px",
                margin: "0 auto",
                boxShadow: "0 8px 20px #fff",
              }}
    >
      {/* LOGO */}
      <div className="text-center mb-3">
        <img
          src={defaultLogo.src}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultLogo.src;
          }}
          alt="logo"
          style={{ width: "160px", marginBottom: "10px" }}
        />
      </div>
      {isSessionCheck && <>
      {/* TITLE */}
    <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "10px" }}>
     {pageType === "activate" ? "🔐 Activate Your Account" : "🔄 Upgrade Your Account"}
    </h1>

   <p style={{ opacity: 0.9, marginBottom: "30px" }}>
    {pageType === "activate"
    ? "Enter the license key provided to you."
    : "Enter your upgraded license key to extend your service."}

</p>
      {/* FORM */}
      <Form onSubmit={formValidation.handleSubmit}>
        <Form.Group className="mb-4 text-start">
          <Form.Label style={{ fontWeight: 500, color: "#ddd" }}>
            License Key <span className="text-danger">*</span>
          </Form.Label>

          <Form.Control
            type="text"
            name="licenseKey"
            placeholder="Enter your license key"
            value={formValidation.values.licenseKey}
            onChange={formValidation.handleChange}
            onBlur={formValidation.handleBlur}
            isInvalid={
              formValidation.touched.licenseKey &&
              formValidation.errors.licenseKey
            }
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
            }}
          />
          <Form.Control.Feedback type="invalid">
            {formValidation.errors.licenseKey}
          </Form.Control.Feedback>
        </Form.Group>

        {/* BUTTON */}
        <Button
          type="submit"
          className="w-100"
          disabled={oneClick}
          style={{
            padding: "12px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            background: "#28a745",
            border: "none",
            boxShadow: "0 4px 12px rgba(40,167,69,0.4)",
          }}
        >
          {oneClick ? (
            <Spinner animation="border" size="sm" className="me-2" />
          ) : null}
          {oneClick ? "Processing..." : "Submit"}
        </Button>
      </Form>
      </>}
      {/* FOOTER INFO */}
      <div
        style={{
          marginTop: "25px",
          opacity: 0.85,
          lineHeight: "1.6rem",
          fontSize: "0.9rem",
        }}
      >
        <p>Need help with activation?</p>
        <a href="mailto:support@ofisgate.com?subject=Issue%20with%20License%20Key%20Activation&body=My%20license%20key%20is%20not%20working.%20Please%20help%20me%20activate%20my%20account.">Contact siberSIM Support</a>
      </div>
    </div>
  </div>

  {/* Loader Keyframes */}
  <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
  `}</style>
</>

  );
};

activeyouraccount.layout = "Authenticationlayout";
export default activeyouraccount;
