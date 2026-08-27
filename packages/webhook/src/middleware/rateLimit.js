const attempts = new Map();

module.exports = ({ windowMs = 15 * 60 * 1000, max = 10 } = {}) => (req, res, next) => {
  const now = Date.now();
  if (attempts.size > 10000) {
    for (const [attemptKey, value] of attempts) if (value.resetAt <= now) attempts.delete(attemptKey);
  }
  const key = req.ip;
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  current.count += 1;
  if (current.count > max) {
    res.set("Retry-After", Math.ceil((current.resetAt - now) / 1000));
    return res.status(429).send({ statusCode: 429, message: "Too many authentication attempts. Please try again later." });
  }
  next();
};
