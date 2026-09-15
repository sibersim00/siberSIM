const { v4: uuidv4 } = require("uuid");

const writeLog = async (db, values) => {
  try {
    await db.sequelize.query(
      `INSERT INTO webhook_api_logs
       (request_uuid, webhook_user_id, username, ip_address, user_agent, http_method, endpoint,
        action, learner_uuid, response_status, response_time_ms, error_message, createdon)
       VALUES (:request_uuid, :webhook_user_id, :username, :ip_address, :user_agent, :http_method, :endpoint,
        :action, :learner_uuid, :response_status, :response_time_ms, :error_message, NOW())`,
      { replacements: values }
    );
  } catch (error) { console.error("Webhook audit log error:", error.message); }
};

const audit = ({ db }) => (req, res, next) => {
  const started = Date.now();
  req.webhookRequestId = uuidv4();
  res.set("x-request-id", req.webhookRequestId);
  res.on("finish", () => writeLog(db, {
    request_uuid: req.webhookRequestId,
    webhook_user_id: req.webhookUser.userid,
    username: req.webhookUser.loginid,
    ip_address: req.ip,
    user_agent: (req.get("user-agent") || "").slice(0, 500),
    http_method: req.method,
    endpoint: req.originalUrl.slice(0, 500),
    action: req.auditAction || `${req.method} webhook resource`,
    learner_uuid: req.auditLearnerUuid || null,
    response_status: res.statusCode,
    response_time_ms: Date.now() - started,
    error_message: res.locals.errorMessage || null,
  }));
  next();
};

module.exports = { audit, writeLog };
