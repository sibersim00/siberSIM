const serialLicense = require("../middleware/serialLicense");

const checkLearnerCapacity = async ({ db, hostname, requestedCount = 1 }) => {
  let settings = await db.sequelize.query(
    `SELECT domain_url, license_key
      FROM web_settings
      WHERE domain_url = :hostname
        AND status = 1
        AND license_key IS NOT NULL
        AND license_key <> ''
      ORDER BY id DESC
      LIMIT 1`,
    {
      replacements: { hostname },
      type: db.sequelize.QueryTypes.SELECT,
    },
  );

  if (!settings.length) {
    settings = await db.sequelize.query(
      `SELECT domain_url, license_key
         FROM web_settings
        WHERE status = 1
          AND license_key IS NOT NULL
          AND license_key <> ''
        ORDER BY id DESC
        LIMIT 1`,
      { type: db.sequelize.QueryTypes.SELECT },
    );
  }

  // Preserve self-registration behavior for installations using old keys or
  // without a configured license. Auth middleware handles license validity.
  if (!settings.length) return { allowed: true, unlimited: true };

  const license = serialLicense.validateJWTLicense(
    settings[0].domain_url,
    settings[0].license_key,
  );
  if (!license) {
    return { allowed: false, invalidLicense: true };
  }
  if (license.learner_limit === null || license.learner_limit === undefined) {
    return { allowed: true, unlimited: true };
  }

  const limit = Number(license.learner_limit);
  if (!Number.isSafeInteger(limit) || limit < 0) {
    return { allowed: false, invalidLicense: true };
  }

  const rows = await db.sequelize.query(
    `SELECT COUNT(*) AS learner_count FROM learners WHERE deletedon IS NULL`,
    { type: db.sequelize.QueryTypes.SELECT },
  );
  const current = Number(rows[0]?.learner_count || 0);
  return {
    allowed: current + requestedCount <= limit,
    current,
    limit,
  };
};

module.exports = { checkLearnerCapacity };
