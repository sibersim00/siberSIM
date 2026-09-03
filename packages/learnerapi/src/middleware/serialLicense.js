const CryptoJS = require("crypto-js");
const keys = require("./../keys");

const SECRET = keys.CRYPTO_SECURITY_KEY;
const CLUSTER_NAMES = { RR: "RoundRobin", LL: "LeastLoaded", WT: "Weighted", TH: "Threshold" };

const parseLicense = (licenseKey) => {
  const parts = typeof licenseKey === "string" ? licenseKey.split("-") : [];
  if (parts.length !== 5 && parts.length !== 6) throw new Error("Invalid License");
  const start = parts[0]?.match(/^S(\d{8})$/);
  const user = parts[1]?.match(/^UL(\d+)M([01])$/);
  const legacyUser = parts[1]?.match(/^USL(\d+)$/);
  const hasCapabilities = parts.length === 6;
  const capabilityPart = hasCapabilities ? parts[2] : null;
  const capability = capabilityPart?.match(/^CM(RR|LL|WT|TH)W([01])LL(\d+)$/);
  const expiryIndex = hasCapabilities ? 3 : 2;
  const expiry = parts[expiryIndex]?.match(/^E(\d{8})$/);
  const hostnameHash = parts[expiryIndex + 1];
  const sentHash = parts[expiryIndex + 2];
  if (
    !start || (!user && !legacyUser) || (hasCapabilities && !capability) || !expiry ||
    !/^[A-F0-9]{6}$/.test(hostnameHash || "") || !/^[A-F0-9]{6}$/.test(sentHash || "")
  ) throw new Error("Invalid License");

  const userCount = user?.[1] || legacyUser[1];
  const manipulation = user?.[2] ?? null;
  const raw = hasCapabilities
    ? `${start[1]}|${userCount}|${manipulation}|${capabilityPart}|${expiry[1]}|${hostnameHash}|${SECRET}`
    : user
      ? `${start[1]}|${userCount}|${manipulation}|${expiry[1]}|${hostnameHash}|${SECRET}`
      : `${start[1]}|${userCount}|${expiry[1]}|${hostnameHash}|${SECRET}`;
  return {
    start: start[1], userCount, manipulation, expiry: expiry[1], hostnameHash, sentHash, raw,
    clusterMethodCode: capability?.[1] || null,
    clusterMethod: capability ? CLUSTER_NAMES[capability[1]] : null,
    webhook: capability?.[2] || null,
    learnerLimit: capability?.[3] || null,
  };
};

const toDate = (value) => new Date(Date.UTC(value.slice(0, 4), Number(value.slice(4, 6)) - 1, value.slice(6, 8)));
const inspectLicense = (hostname, licenseKey) => {
  const value = parseLicense(licenseKey);
  const calculatedHash = CryptoJS.SHA256(value.raw).toString().slice(0, 6).toUpperCase();
  const calculatedHost = CryptoJS.SHA256(`${hostname}|${value.expiry}`).toString().slice(0, 6).toUpperCase();
  const startDate = toDate(value.start);
  const expiryDate = toDate(value.expiry);
  return {
    ...value, startDate, expiryDate,
    isKeyValid: calculatedHash === value.sentHash && !Number.isNaN(startDate.getTime()) && !Number.isNaN(expiryDate.getTime()),
    isHost: calculatedHost === value.hostnameHash,
  };
};

function validateLicense(hostname, licenseKey) {
  try {
    const value = inspectLicense(hostname, licenseKey);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return value.isKeyValid && value.isHost && value.expiryDate >= today;
  } catch (error) { return false; }
}

function validateJWTLicense(hostname, licenseKey) {
  try {
    const value = inspectLicense(hostname, licenseKey);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (!value.isKeyValid || !value.isHost || value.startDate > today || value.expiryDate < today) return false;
    return {
      success: true, user_count: value.userCount, manipulation: value.manipulation,
      cluster_method: value.clusterMethod, cluster_method_code: value.clusterMethodCode,
      webhook: value.webhook, learner_limit: value.learnerLimit,
    };
  } catch (error) { return false; }
}

function checkValidate(hostname, licenseKey) {
  try {
    const value = inspectLicense(hostname, licenseKey);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return {
      isKeyValid: value.isKeyValid, isHost: value.isHost,
      isStart: value.startDate <= today, isExp: value.expiryDate < today,
      manipulation: value.manipulation,
      cluster_method: value.clusterMethod, cluster_method_code: value.clusterMethodCode,
      webhook: value.webhook, learner_limit: value.learnerLimit,
      start_date: value.startDate, expiry_date: value.expiryDate,
    };
  } catch (error) { return false; }
}

module.exports = { validateLicense, validateJWTLicense, checkValidate };
