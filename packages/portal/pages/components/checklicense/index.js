import { useState, useEffect } from "react";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import {
  addLicenseKey,
  clearAddLicenseKey,
  clearHasError,
} from "../../../shared/redux/slices/authentication/Auth";
import { useRouter } from "next/router";
import Seo from "../../../shared/layout-components/seo/seo";

const CheckLicenseKey = () => {
  const [oneClick, setOneClick] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const { addLicenseKeyData, errorData } = useSelector((state) => {
    return {
      addLicenseKeyData:
        state && state.authData && state.authData.addLicenseKeyResp,
      errorData: state && state.authData && state.authData.error,
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

      const payload = {
        license_key: data.licenseKey,
        id: null,
      };

      dispatch(addLicenseKey(payload));
    },
  });

  useEffect(() => {
    if (addLicenseKeyData?.statusCode == 200) {
      setOneClick(false); 
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
        router.replace("/companylicense");
      } else {
        // otherwise go to dashboard
        router.replace("/dashboard");
      }

      // dispatch(clearAddLicenseKey());
    }
  }, [addLicenseKeyData]);

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

  return (
    <>
     <Seo title="Activate License"/>
      <ToastContainer />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(to bottom right, #eef2ff, #f8fafc)",
        }}
      >
        <Card
          className="p-4 shadow-lg"
          style={{
            width: "100%",
            maxWidth: "420px",
            borderRadius: "16px",
          }}
        >
          <h3 className="text-center mb-4" style={{ fontWeight: 600 }}>
            <i className="fa fa-key me-2"></i>
            Activate License
          </h3>

          <Form onSubmit={formValidation.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 500 }}>
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
                  padding: "12px",
                  borderRadius: "10px",
                }}
              />
              <Form.Control.Feedback type="invalid">
                {formValidation.errors.licenseKey}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              variant="success"
              className="w-100 mt-2"
              disabled={oneClick}
              style={{
                padding: "12px",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {oneClick ? (
                <Spinner animation="border" size="sm" className="me-2" />
              ) : null}
              {oneClick ? "Processing..." : "Submit"}
            </Button>
          </Form>
        </Card>
      </div>
    </>
  );
};

CheckLicenseKey.layout = "Authenticationlayout";
export default CheckLicenseKey;
