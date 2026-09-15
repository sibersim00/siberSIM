module.exports = {
  WEBHOOK_PORT: process.env.WEBHOOK_PORT || 4008,
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_DB: process.env.MYSQL_DB,
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
  MYSQL_PORT: process.env.MYSQL_PORT || 3306,
  WEBHOOK_JWT_SECRET: process.env.WEBHOOK_JWT_SECRET,
  WEBHOOK_JWT_EXPIRES_IN: process.env.WEBHOOK_JWT_EXPIRES_IN || "15m",
  WEBHOOK_INTERNAL_KEY: process.env.WEBHOOK_INTERNAL_KEY,
  CRYPTO_SECURITY_KEY:
    process.env.CRYPTO_SECURITY_KEY ||
    "jds9327nmf48cm48cmvbvtqpz984510nmcvrwi206cn",
  MASTERS_API_URL: process.env.MASTERS_API_URL || `http://localhost:${process.env.MASTERS_PORT || 4003}/masterapi`,
  WEB_ORIGIN: process.env.WEB_ORIGIN || "",
};
