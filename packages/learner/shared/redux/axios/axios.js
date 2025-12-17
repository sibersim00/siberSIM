import axios from "axios";
import CryptoJS from 'crypto-js';
const secretKey = process.env.CRYPTO_SECURITY_KEY;

const axiosInstance = axios.create({ baseURL: process.env.API_URL_LOGIN });
axiosInstance.interceptors.request.use((config) => {
  if (config.data) {
    const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(config.data), secretKey).toString();
    config.data = {payload:encryptedPayload};
  }
  return config;
});
axiosInstance.interceptors.response.use(
  (response) => {
    // Decrypt the response data
    if (response && response.data && typeof(response?.data?.data) == "string") {
      const decryptedBytes = CryptoJS.AES.decrypt(response.data.data, secretKey);
      const decryptedPayload = decryptedBytes.toString(CryptoJS.enc.Utf8);
      response.data.data = JSON.parse(decryptedPayload);
    }
    return response;
  },
  (error) =>
    Promise.reject((error.response && error.response.data) || "Something went wrong")
);

export default axiosInstance;