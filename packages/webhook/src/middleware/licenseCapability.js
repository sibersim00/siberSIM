const crypto = require("crypto");

const shortHash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 6).toUpperCase();

const hasWebhookCapability = (hostname, licenseKey, secret) => {
  if (!licenseKey || !secret) return false;
  const parts = licenseKey.split("-");
  if (parts.length !== 6) return false;

  const start = parts[0].match(/^S(\d{8})$/);
  const user = parts[1].match(/^UL(\d+)M([01])$/);
  const capability = parts[2].match(/^CM(RR|LL|WT|TH)W([01])LL(\d+)$/);
  const expiry = parts[3].match(/^E(\d{8})$/);
  const hostnameHash = parts[4];
  const sentHash = parts[5];
  if (!start || !user || !capability || !expiry || capability[2] !== "1") {
    return false;
  }

  const raw = `${start[1]}|${user[1]}|${user[2]}|${parts[2]}|${expiry[1]}|${hostnameHash}|${secret}`;
  if (shortHash(raw) !== sentHash) return false;
  if (shortHash(`${hostname}|${expiry[1]}`) !== hostnameHash) return false;

  const startDate = new Date(
    Date.UTC(start[1].slice(0, 4), Number(start[1].slice(4, 6)) - 1, start[1].slice(6, 8)),
  );
  const expiryDate = new Date(
    Date.UTC(expiry[1].slice(0, 4), Number(expiry[1].slice(4, 6)) - 1, expiry[1].slice(6, 8)),
  );
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return (
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(expiryDate.getTime()) &&
    startDate <= today &&
    expiryDate >= today
  );
};

module.exports = ({ db, keys }) => async (req, res, next) => {
  try {
    const hostname = req.hostname;
    const [settings] = await db.sequelize.query(
      `SELECT license_key
       FROM web_settings
       WHERE domain_url = :hostname
       LIMIT 1`,
      {
        replacements: { hostname },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (
      !hasWebhookCapability(
        hostname,
        settings?.license_key,
        keys.CRYPTO_SECURITY_KEY,
      )
    ) {
      return res.status(403).send({
        statusCode: 403,
        message: "Webhook access is not enabled for this license.",
      });
    }
    next();
  } catch (error) {
    console.error("Webhook license validation error:", error);
    return res.status(500).send({
      statusCode: 500,
      message: "Unable to validate webhook license access.",
    });
  }
};
