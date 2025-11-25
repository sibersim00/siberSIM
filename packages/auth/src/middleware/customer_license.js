const fakeEncrypt = (data) => {
  const json = JSON.stringify(data);
  const b64 = btoa(json);         // Encode to base64
  const reversed = b64.split("").reverse().join(""); // Light obfuscation
  return reversed;
};

const fakeDecrypt = (text) => {
  const unreversed = text.split("").reverse().join("");
  const json = atob(unreversed);
  return JSON.parse(json);
};


const generateEncryptedString = ({ user_count, master_count, investor_count, expiry_date, domain_name }) => {
  const encryptedDomain = fakeEncrypt(domain_name);

  // Step 1: try to parse the date
  const parsed = new Date(expiry_date);

  // Step 2: check if the date itself is valid
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid expiry date");
  }

  // Step 3: convert to correct format YYYYMMDD
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");

  const formattedExpiry = `${yyyy}${mm}${dd}`;

  return `~u${user_count}-m${master_count}-i${investor_count}-e${formattedExpiry}~${encryptedDomain}`;
};


// const generateEncryptedString = ({ user_count, master_count, investor_count, expiry_date, domain_name}) => {
//   const encryptedDomain = fakeEncrypt(domain_name);
//   const expiry = expiry_date.replace(/-/g, "");
//   return `~u${user_count}-m${master_count}-i${investor_count}-e${expiry}~${encryptedDomain}`;
// };

const generateDecryptedString = ({ str }) => {
  str = str.slice(1);
  const [meta, encryptedDomain] = str.split("~");
  const match = meta.match(/u(\d+)-m(\d+)-i(\d+)-e(\d{8})/);
  if (!match) return false;
  const [, u, m, i, expiry] = match;
  const expiry_date =
    expiry.slice(0, 4) +
    "-" +
    expiry.slice(4, 6) +
    "-" +
    expiry.slice(6);

  return {
    user_count: Number(u),
    master_count: Number(m),
    investor_count: Number(i),
    expiry_date,
    domain_name: fakeDecrypt(encryptedDomain)
  };
};

const authJwt = {
  generateDecryptedString,
  generateEncryptedString
};
module.exports = authJwt;