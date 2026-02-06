const CryptoJS = require("crypto-js");
const keys = require('./../keys');
const SECRET = keys.CRYPTO_SECURITY_KEY;

const generateLicense = ({ start_date, user_count, expiry_date, domain_name }) => {
  const parsedExp = new Date(expiry_date);
  if (isNaN(parsedExp.getTime())) { throw new Error("Invalid expiry date"); }
  const formattedExp = parsedExp.toISOString().slice(0, 10).replace(/-/g, "");
  const parsedStr = new Date(start_date);
  if (isNaN(parsedStr.getTime())) { throw new Error("Invalid start date"); }
  const formattedStr = parsedStr.toISOString().slice(0, 10).replace(/-/g, "");
  const domainRaw = `${domain_name}|${formattedExp}`;
  const encryptedDomain = CryptoJS.SHA256(domainRaw).toString().substring(0, 6).toUpperCase();
  const raw = `${formattedStr}|${user_count}|${formattedExp}|${encryptedDomain}|${SECRET}`;
  const shortHash = CryptoJS.SHA256(raw).toString().substring(0, 6).toUpperCase();
  const licenseKey = `S${formattedStr}-USL${user_count}-E${formattedExp}-${encryptedDomain}-${shortHash}`;
  return licenseKey;
}

function validateLicense(hostname, licenseKey) {
  try {
    const parts = licenseKey.split("-");
    if (parts.length !== 5) { throw new Error("Invalid License"); }

    const startStr = parts[0].replace("S", ""); // e.g., 20250101
    const user_count = parts[1].replace("USL", "");                 // e.g., U10M5I2
    const expiryStr = parts[2].replace("E", ""); // e.g., 20251230
    const hostnameStr = parts[3];          // e.g., A1B2C3
    const sentHash = parts[4];                 // e.g., 9F3A2D
console.log("qqqqqqqqqqqqqqqqqqqqqqqqq",user_count);

    // Build RAW — must match generator EXACTLY
    const raw = `${startStr}|${user_count}|${expiryStr}|${hostnameStr}|${SECRET}`;
    const calculatedHash = CryptoJS.SHA256(raw).toString().substring(0, 6).toUpperCase();
    if (calculatedHash !== sentHash) { throw new Error("Invalid License"); }
    //Hostname Check
    const domainRaw = `${hostname}|${expiryStr}`;
    const encryptedDomain = CryptoJS.SHA256(domainRaw).toString().substring(0, 6).toUpperCase();
    if (encryptedDomain !== hostnameStr) { throw new Error("Invalid License"); }
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    // Expiry Date check
    let expDate = new Date(Date.UTC(expiryStr.substring(0, 4), expiryStr.substring(4, 6) - 1, expiryStr.substring(6, 8)));
    if (isNaN(expDate.getTime())) { throw new Error("Invalid License"); }
    if (expDate < todayUTC) { throw new Error("Invalid License"); }
    // Start Date check
     let strDate = new Date(Date.UTC(startStr.substring(0, 4), startStr.substring(4, 6) - 1, startStr.substring(6, 8)));
    if (isNaN(strDate.getTime())) { throw new Error("Invalid License"); }
console.log("user_countuser_countuser_count",user_count);

    return true;

  } catch (e) {
    return false;
  }
}

function validateJWTLicense(hostname, licenseKey) {
  try {
    const parts = licenseKey.split("-");
    if (parts.length !== 5) { throw new Error("Invalid License"); }

    const startStr = parts[0].replace("S", ""); // e.g., 20250101
    const user_count = parts[1].replace("USL", "");;                 // e.g., U10M5I2
    const expiryStr = parts[2].replace("E", ""); // e.g., 20251230
    const hostnameStr = parts[3];          // e.g., A1B2C3
    const sentHash = parts[4];                 // e.g., 9F3A2D

    // Build RAW — must match generator EXACTLY
    const raw = `${startStr}|${user_count}|${expiryStr}|${hostnameStr}|${SECRET}`;
    const calculatedHash = CryptoJS.SHA256(raw).toString().substring(0, 6).toUpperCase();
    if (calculatedHash !== sentHash) { throw new Error("Invalid License"); }
    //Hostname Check
    const domainRaw = `${hostname}|${expiryStr}`;
    const encryptedDomain = CryptoJS.SHA256(domainRaw).toString().substring(0, 6).toUpperCase();
    if (encryptedDomain !== hostnameStr) { throw new Error("Invalid License"); }

    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    // Expiry Date check
    let expDate = new Date(Date.UTC(expiryStr.substring(0, 4), expiryStr.substring(4, 6) - 1, expiryStr.substring(6, 8)));
    if (isNaN(expDate.getTime())) { throw new Error("Invalid License"); }
    if (expDate < todayUTC) { throw new Error("Invalid License"); }

    // Start Date check
    let strDate = new Date(Date.UTC(startStr.substring(0, 4), startStr.substring(4, 6) - 1, startStr.substring(6, 8)));
    if (isNaN(strDate.getTime())) { throw new Error("Invalid License"); }
    if (strDate > todayUTC) { throw new Error("Invalid License"); }
    return{
      success:true,
      user_count:user_count,
    };
  } catch (e) {
    return false;
  }
}

function checkValidate(hostname, licenseKey) {
  try {
    let isKeyValid = true;
    let isHost = true;
    let isStart = true;
    let isExp = false;

    const parts = licenseKey.split("-");
    if (parts.length !== 5) { isKeyValid = false; }
    const startStr = parts[0].replace("S", ""); // e.g., 20250101
    const user_count = parts[1].replace("USL", "");;                 // e.g., U10M5I2
    const expiryStr = parts[2].replace("E", ""); // e.g., 20251230
    const hostnameStr = parts[3];          // e.g., A1B2C3
    const sentHash = parts[4];                 // e.g., 9F3A2D

    // Build RAW — must match generator EXACTLY
    const raw = `${startStr}|${user_count}|${expiryStr}|${hostnameStr}|${SECRET}`;
    const calculatedHash = CryptoJS.SHA256(raw).toString().substring(0, 6).toUpperCase();
    if (calculatedHash !== sentHash) { isKeyValid = false; }
    //Hostname Check
    const domainRaw = `${hostname}|${expiryStr}`;
    const encryptedDomain = CryptoJS.SHA256(domainRaw).toString().substring(0, 6).toUpperCase();
    if (encryptedDomain !== hostnameStr) { isHost = false; }

    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    // Start Date Check
    let strDate = new Date(Date.UTC(startStr.substring(0, 4), startStr.substring(4, 6) - 1, startStr.substring(6, 8)));
    if (isNaN(strDate.getTime())) { isKeyValid = false; }
    if (strDate > todayUTC) { isStart = false; }
    // Expiry Date check
    let expDate = new Date(Date.UTC(expiryStr.substring(0, 4), expiryStr.substring(4, 6) - 1, expiryStr.substring(6, 8)));
    if (isNaN(expDate.getTime())) { isKeyValid = false; }
    if (expDate < todayUTC) { isExp = true; }
    console.log("data====>", { start_date: strDate, user_count: user_count, expiry_date: expDate, domain_name: hostnameStr });
    return { isKeyValid: isKeyValid, isHost: isHost, isStart: isStart, isExp: isExp, start_date: strDate, expiry_date: expDate };
  } catch (e) {
    console.log("error========>", e);
    return false;
  }
}


const serialLicense = {
  generateLicense,
  validateLicense,
  validateJWTLicense,
  checkValidate
};
module.exports = serialLicense;