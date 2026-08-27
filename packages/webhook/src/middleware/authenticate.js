const jwt = require("jsonwebtoken");

module.exports = ({ db, keys }) => async (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return res.status(401).send({ statusCode: 401, message: "Bearer token is required." });
  try {
    const payload = jwt.verify(token, keys.WEBHOOK_JWT_SECRET);
    if (payload.type !== "webhook") throw new Error("Invalid token type");
    const [user] = await db.sequelize.query(
      `SELECT au.userid, au.useruuid, au.loginid, au.orgid
       FROM ad_users au INNER JOIN webhook_access_tokens wat ON wat.webhook_user_id=au.userid
       WHERE au.useruuid=:useruuid AND au.usertype='WebhookUser' AND au.status='Active'
         AND au.deletedon IS NULL AND wat.jti=:jti AND wat.revokedon IS NULL AND wat.expireson > NOW() LIMIT 1`,
      { replacements: { useruuid: payload.sub, jti: payload.jti }, type: db.sequelize.QueryTypes.SELECT }
    );
    if (!user) return res.status(401).send({ statusCode: 401, message: "Token is expired, revoked, or the webhook user is inactive." });
    req.webhookUser = user;
    req.webhookToken = token;
    next();
  } catch (error) {
    return res.status(401).send({ statusCode: 401, message: error.name === "TokenExpiredError" ? "Access token has expired." : "Invalid access token." });
  }
};
