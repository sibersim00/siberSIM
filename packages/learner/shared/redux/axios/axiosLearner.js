import axios from "axios";
import Router from 'next/router';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import CryptoJS from 'crypto-js';

const secretKey = process.env.CRYPTO_SECURITY_KEY;
let isSwalOpen401 = false;
let isSwalOpen403 = false;

const formatValue = (val) => {
  if (!val) return "";
  if (typeof val === "object") {
    return val.message || JSON.stringify(val);
  }
  return val;
};

const axiosInstance = axios.create({ baseURL: process.env.API_URL_LEARNER });

axiosInstance.interceptors.request.use(
  (request) => {
    const accessToken = JSON.parse(localStorage.getItem('accessTokenLearner'));
    if (accessToken) {
      request.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return request;
  },
  (error) => {
    return Promise.reject((error.response && error.response.data) || "Something went wrong");
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    try{
    if (response && response.data && typeof(response?.data?.data) === "string") {
      const decryptedBytes = CryptoJS.AES.decrypt(response.data.data, secretKey);
      const decryptedPayload = decryptedBytes.toString(CryptoJS.enc.Utf8);
      response.data.data = JSON.parse(decryptedPayload);
      isSwalOpen401 = false;
      if (response.data.data?.accessToken) {
        localStorage.setItem("accessTokenLearner", JSON.stringify(response.data.data.accessToken));
        Router.push('/dashboard');
      }
    }
  }catch (err) {
      console.error("Error parsing response data:", err);
      // fallback: keep the raw string
    }
    return response;
  }, 
  (error) => {
    const requestUrl = error?.config?.url || "";

    // Special case for 'restart-event-learner' — don't show toast for this
    if (requestUrl.includes("restart-event-learner")) {
      return error.response; // Simply return the response without triggering the toast
    }

    // Handle different error statuses
    if (error?.response?.status === 401) {
      if (!isSwalOpen401) {
        isSwalOpen401 = true;
        Swal.fire({
          title: '',
          text: 'Your session has ended. Would you like to start over?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',
          cancelButtonText: 'No',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            axiosInstance.get(`/auth/refreshToken`).finally(() => { });
          } else {
            axiosInstance.post(`/auth/logout`).finally(() => {
              document.body.classList.remove("dark-theme");
              isSwalOpen401 = false;
              localStorage.clear();
              Router.push('/');
            });
          }
        });
      }
    } else if (error?.response?.status === 403) {
      if (!isSwalOpen403) {
        isSwalOpen403 = true;
        Swal.fire({
          title: '',
          text: formatValue(error?.response?.data?.message),
          icon: 'warning',
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false,
          timer: 5000,
          timerProgressBar: true,
          didClose: () => {
            axiosInstance.post(`/auth/logout`).finally(() => {
              document.body.classList.remove("dark-theme");
              isSwalOpen403 = false;
              Router.push('/');
              localStorage.clear();
            });
          }
        });
      }
    }  else if (error?.response?.status === 503) {
      if(!isSwalOpen403){
        isSwalOpen403 = true;
        Swal.fire({
          title: '',
          text: error?.response?.data.message,
          icon: 'warning',
          confirmButtonText: 'Ok',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            axiosInstance.post(`/auth/logout`).finally(() => {
              document.body.classList.remove("dark-theme");
              isSwalOpen403 = false;
              Router.push('/');
              localStorage.clear();
            });
          } 
        });
      }
    } else if (error?.response?.status === 404) {
      if (Router.pathname !== '/404') {
        Router.push('/404');
      }
    } else if (error?.response?.status === 500) {
      // Show error toast for 500 status
      if (error?.response?.data?.error) {
        toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {formatValue(error?.response?.data?.error)}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            theme: "colored",
            autoClose: 5000,
            closeButton: false,
            closeOnClick: false,
            draggable: false,
            pauseOnHover: false,
            style: { width: '400px' }
          }
        );
      } else {
        toast.error(
          <p className="mx-2 tx-16 d-flex align-items-center mb-0">
            {formatValue(error?.response?.data?.message)}
          </p>,
          {
            position: toast.POSITION.TOP_RIGHT,
            theme: "colored",
            autoClose: 5000,
            closeButton: false,
            closeOnClick: false,
            draggable: false,
            pauseOnHover: false,
            style: { width: '400px' }
          }
        );
      }
    } else {
      // Handle any other errors
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {formatValue(error?.response?.data?.message)}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          theme: "colored",
          autoClose: 5000,
          closeButton: false,
          closeOnClick: false,
          draggable: false,
          pauseOnHover: false,
          style: { width: '400px' }
        }
      );
    }

    // Ensure we return the error so that calling code can still handle it
    return Promise.reject(error);
  }
);

export default axiosInstance;
