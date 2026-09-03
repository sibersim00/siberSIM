const jwt = require("jsonwebtoken");
const serialLicense = require("./serialLicense");

const authenticateWebhook = ({ db, keys }) => async (req, res, next) => {
  if (!keys.WEBHOOK_JWT_SECRET || !keys.WEBHOOK_INTERNAL_KEY) {
    return res.status(503).send({ statusCode: 503, message: "Webhook integration is not configured." });
  }
  const source = req.get("x-request-source");
  const internalKey = req.get("x-webhook-internal-key");
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (source !== "webhook-service" || internalKey !== keys.WEBHOOK_INTERNAL_KEY) {
    return res.status(403).send({ statusCode: 403, message: "Webhook service authentication failed." });
  }
  if (!token) {
    return res.status(401).send({ statusCode: 401, message: "Webhook access token is required." });
  }

  try {
    const payload = jwt.verify(token, keys.WEBHOOK_JWT_SECRET);
    if (payload.type !== "webhook" || !payload.sub || !payload.jti) {
      return res.status(401).send({ statusCode: 401, message: "Invalid webhook access token." });
    }

    const [rows] = await db.sequelize.query(
      `SELECT au.userid, au.useruuid, au.loginid, au.orgid, au.usertype, au.status
       FROM ad_users au
       INNER JOIN webhook_access_tokens wat ON wat.webhook_user_id = au.userid
       WHERE au.useruuid = :useruuid AND au.usertype = 'WebhookUser'
         AND au.status = 'Active' AND au.deletedon IS NULL
         AND wat.jti = :jti AND wat.revokedon IS NULL AND wat.expireson > NOW()
       LIMIT 1`,
      { replacements: { useruuid: payload.sub, jti: payload.jti }, type: db.sequelize.QueryTypes.SELECT }
    );
    if (!rows) {
      return res.status(401).send({ statusCode: 401, message: "Webhook token is expired or revoked." });
    }

    const [settings] = await db.sequelize.query(
      `SELECT domain_url, license_key
       FROM web_settings
       WHERE status = 1 AND license_key IS NOT NULL AND license_key <> ''
       ORDER BY id DESC
       LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    const licenseStatus = settings
      ? serialLicense.validateJWTLicense(settings.domain_url, settings.license_key)
      : null;
    if (!licenseStatus) {
      return res.status(503).send({
        statusCode: 503,
        message: "The installed license could not be validated.",
      });
    }

    req.user = {
      ...rows,
      username: rows.loginid,
      webhook_request_id: req.get("x-request-id") || null,
      learner_limit:
        licenseStatus.learner_limit === null || licenseStatus.learner_limit === undefined
          ? null
          : Number(licenseStatus.learner_limit),
    };
    req.webhook = true;
    next();
  } catch (error) {
    const message = error.name === "TokenExpiredError" ? "Webhook access token has expired." : "Invalid webhook access token.";
    return res.status(401).send({ statusCode: 401, message });
  }
};

module.exports = { authenticateWebhook };
