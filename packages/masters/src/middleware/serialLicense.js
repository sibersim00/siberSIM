const CryptoJS = require("crypto-js");
const keys = require("./../keys");

const SECRET = keys.CRYPTO_SECURITY_KEY;
const CLUSTER_CODES = {
  RoundRobin: "RR",
  LeastLoaded: "LL",
  Weighted: "WT",
  Threshold: "TH",
};
const CLUSTER_NAMES = Object.entries(CLUSTER_CODES).reduce(
  (result, [name, code]) => ({ ...result, [code]: name }),
  {},
);

const isEnabled = (value) =>
  value === true || value === "True" || value === "true" || value === 1 || value === "1";

const parseLicense = (licenseKey) => {
  const parts = typeof licenseKey === "string" ? licenseKey.split("-") : [];
  if (parts.length !== 5 && parts.length !== 6) throw new Error("Invalid License");

  const startMatch = parts[0].match(/^S(\d{8})$/);
  const userMatch = parts[1].match(/^UL(\d+)M([01])$/);
  const legacyUserMatch = parts[1].match(/^USL(\d+)$/);
  const hasCapabilities = parts.length === 6;
  const capabilityPart = hasCapabilities ? parts[2] : null;
  const capabilityMatch = capabilityPart?.match(/^CM(RR|LL|WT|TH)W([01])LL(\d+)$/);
  const expiryIndex = hasCapabilities ? 3 : 2;
  const expiryMatch = parts[expiryIndex]?.match(/^E(\d{8})$/);

  if (
    !startMatch ||
    (!userMatch && !legacyUserMatch) ||
    (hasCapabilities && !capabilityMatch) ||
    !expiryMatch ||
    !/^[A-F0-9]{6}$/.test(parts[expiryIndex + 1] || "") ||
    !/^[A-F0-9]{6}$/.test(parts[expiryIndex + 2] || "")
  ) {
    throw new Error("Invalid License");
  }

  const userCount = userMatch ? userMatch[1] : legacyUserMatch[1];
  const manipulation = userMatch ? userMatch[2] : null;
  const startStr = startMatch[1];
  const expiryStr = expiryMatch[1];
  const hostnameStr = parts[expiryIndex + 1];
  const sentHash = parts[expiryIndex + 2];
  const raw = hasCapabilities
    ? `${startStr}|${userCount}|${manipulation}|${capabilityPart}|${expiryStr}|${hostnameStr}|${SECRET}`
    : userMatch
      ? `${startStr}|${userCount}|${manipulation}|${expiryStr}|${hostnameStr}|${SECRET}`
      : `${startStr}|${userCount}|${expiryStr}|${hostnameStr}|${SECRET}`;

  return {
    startStr,
    userCount,
    manipulation,
    clusterMethodCode: capabilityMatch?.[1] || null,
    clusterMethod: capabilityMatch ? CLUSTER_NAMES[capabilityMatch[1]] : null,
    webhook: capabilityMatch?.[2] || null,
    learnerLimit: capabilityMatch?.[3] || null,
    expiryStr,
    hostnameStr,
    sentHash,
    raw,
  };
};

const dateFromKey = (value) =>
  new Date(Date.UTC(value.substring(0, 4), Number(value.substring(4, 6)) - 1, value.substring(6, 8)));

const inspectLicense = (hostname, licenseKey) => {
  const parsed = parseLicense(licenseKey);
  const calculatedHash = CryptoJS.SHA256(parsed.raw).toString().substring(0, 6).toUpperCase();
  const encryptedDomain = CryptoJS.SHA256(`${hostname}|${parsed.expiryStr}`)
    .toString()
    .substring(0, 6)
    .toUpperCase();
  const startDate = dateFromKey(parsed.startStr);
  const expiryDate = dateFromKey(parsed.expiryStr);
  return {
    ...parsed,
    isKeyValid:
      calculatedHash === parsed.sentHash &&
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(expiryDate.getTime()),
    isHost: encryptedDomain === parsed.hostnameStr,
    startDate,
    expiryDate,
  };
};

const generateLicense = ({
  start_date,
  user_count,
  expiry_date,
  domain_name,
  manipulation,
  cluster_method,
  webhook,
  learner_limit,
}) => {
  const parsedExp = new Date(expiry_date);
  if (Number.isNaN(parsedExp.getTime())) throw new Error("Invalid expiry date");
  const parsedStart = new Date(start_date);
  if (Number.isNaN(parsedStart.getTime())) throw new Error("Invalid start date");

  const formattedExp = parsedExp.toISOString().slice(0, 10).replace(/-/g, "");
  const formattedStart = parsedStart.toISOString().slice(0, 10).replace(/-/g, "");
  const manipulationBit = isEnabled(manipulation) ? 1 : 0;
  const encryptedDomain = CryptoJS.SHA256(`${domain_name}|${formattedExp}`)
    .toString()
    .substring(0, 6)
    .toUpperCase();
  const hasCapabilities =
    cluster_method !== undefined || webhook !== undefined || learner_limit !== undefined;
  let capabilityPart = "";

  if (hasCapabilities) {
    const clusterCode = CLUSTER_CODES[cluster_method || "RoundRobin"];
    const learnerLimit = Number(learner_limit ?? 0);
    if (!clusterCode) throw new Error("Invalid cluster method");
    if (!Number.isInteger(learnerLimit) || learnerLimit < 0) throw new Error("Invalid learner limit");
    capabilityPart = `CM${clusterCode}W${isEnabled(webhook) ? 1 : 0}LL${learnerLimit}`;
  }

  const raw = capabilityPart
    ? `${formattedStart}|${user_count}|${manipulationBit}|${capabilityPart}|${formattedExp}|${encryptedDomain}|${SECRET}`
    : `${formattedStart}|${user_count}|${manipulationBit}|${formattedExp}|${encryptedDomain}|${SECRET}`;
  const shortHash = CryptoJS.SHA256(raw).toString().substring(0, 6).toUpperCase();
  return `S${formattedStart}-UL${user_count}M${manipulationBit}-${capabilityPart ? `${capabilityPart}-` : ""}E${formattedExp}-${encryptedDomain}-${shortHash}`;
};

function validateLicense(hostname, licenseKey) {
  try {
    const result = inspectLicense(hostname, licenseKey);
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    return result.isKeyValid && result.isHost && result.expiryDate >= todayUTC;
  } catch (error) {
    return false;
  }
}

function validateJWTLicense(hostname, licenseKey) {
  try {
    const result = inspectLicense(hostname, licenseKey);
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    if (!result.isKeyValid || !result.isHost || result.startDate > todayUTC || result.expiryDate < todayUTC) {
      throw new Error("Invalid License");
    }
    return {
      success: true,
      user_count: result.userCount,
      manipulation: result.manipulation,
      cluster_method: result.clusterMethod,
      cluster_method_code: result.clusterMethodCode,
      webhook: result.webhook,
      learner_limit: result.learnerLimit,
    };
  } catch (error) {
    return false;
  }
}

function checkValidate(hostname, licenseKey) {
  try {
    const result = inspectLicense(hostname, licenseKey);
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    return {
      isKeyValid: result.isKeyValid,
      isHost: result.isHost,
      isStart: result.startDate <= todayUTC,
      isExp: result.expiryDate < todayUTC,
      manipulation: result.manipulation === "1",
      cluster_method: result.clusterMethod,
      cluster_method_code: result.clusterMethodCode,
      webhook: result.webhook === null ? null : result.webhook === "1",
      learner_limit: result.learnerLimit === null ? null : Number(result.learnerLimit),
      start_date: result.startDate,
      expiry_date: result.expiryDate,
    };
  } catch (error) {
    return false;
  }
}

module.exports = { generateLicense, validateLicense, validateJWTLicense, checkValidate };
