const checkLearnerCapacity = async ({ db, learnerLimit, requestedCount = 1 }) => {
  const requested = Number(requestedCount);
  if (!Number.isSafeInteger(requested) || requested < 1) {
    throw new Error("Requested learner count must be a positive integer.");
  }

  // null is used by legacy license keys that do not contain an LL capability.
  if (learnerLimit === null || learnerLimit === undefined) {
    return { allowed: true, unlimited: true };
  }
  const limit = Number(learnerLimit);
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error("The learner limit in the installed license is invalid.");
  }

  const rows = await db.sequelize.query(
    `SELECT COUNT(*) AS learner_count
       FROM learners
      WHERE deletedon IS NULL`,
    { type: db.sequelize.QueryTypes.SELECT },
  );
  const current = Number(rows[0]?.learner_count || 0);
  const remaining = Math.max(limit - current, 0);

  return {
    allowed: current + requested <= limit,
    current,
    limit,
    requested,
    remaining,
    unlimited: false,
  };
};

const learnerLimitMessage = (capacity, isImport = false) =>
  isImport
    ? `You've reached your learner limit. To continue, either remove a learner or reach out to support for assistance.`
    : `You've reached your learner limit. To continue, either remove a learner or reach out to support for assistance.`;

module.exports = { checkLearnerCapacity, learnerLimitMessage };
