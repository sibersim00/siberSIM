const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { writeLog } = require("../../middleware/audit");
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-webhook-password", 12);

module.exports = ({ db, keys }) => async (req, res, next) => {
  const started = Date.now();
  const requestId = uuidv4();
  res.set("x-request-id", requestId);
  let user = null;
  let status = 401;
  let message = "Invalid credentials.";
  try {
    [user] = await db.sequelize.query(
      `SELECT userid, useruuid, loginid, password, orgid FROM ad_users
       WHERE BINARY loginid=:username AND usertype='WebhookUser' AND status='Active' AND deletedon IS NULL LIMIT 1`,
      { replacements: { username: req.body.username }, type: db.sequelize.QueryTypes.SELECT }
    );
    const valid = await bcrypt.compare(req.body.password, user?.password || DUMMY_PASSWORD_HASH);
    if (!valid) return res.status(status).send({ statusCode: status, message });

    const jti = uuidv4();
    const token = jwt.sign({ sub: user.useruuid, userId: user.userid, username: user.loginid, type: "webhook", jti }, keys.WEBHOOK_JWT_SECRET, { expiresIn: keys.WEBHOOK_JWT_EXPIRES_IN });
    const decoded = jwt.decode(token);
    await db.sequelize.query(
      `INSERT INTO webhook_access_tokens (webhook_user_id, jti, issuedon, expireson)
       VALUES (:userid, :jti, NOW(), FROM_UNIXTIME(:expires))`,
      { replacements: { userid: user.userid, jti, expires: decoded.exp } }
    );
    status = 200;
    message = "Authentication successful.";
    return res.send({ statusCode: 200, message, data: { access_token: token, token_type: "Bearer", expires_in: decoded.exp - decoded.iat } });
  } catch (error) { next(error); }
  finally {
    writeLog(db, { request_uuid: requestId, webhook_user_id: user?.userid || null, username: req.body.username, ip_address: req.ip, user_agent: (req.get("user-agent") || "").slice(0, 500), http_method: req.method, endpoint: req.originalUrl.slice(0, 500), action: "authenticate", learner_uuid: null, response_status: status, response_time_ms: Date.now() - started, error_message: status === 200 ? null : message });
  }
};
