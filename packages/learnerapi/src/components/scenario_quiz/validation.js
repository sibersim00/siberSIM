const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * @param {Object} req - Express request object
 * @throws {Error} if validation fails
 */
const validateScenarioQuestionsInput = (req) => {
  const { scenariouuid } = req.params;
  if (!scenariouuid) {
    throw new Error("Scenario UUID is required.");
  }
  if (!isValidUUID(scenariouuid)) {
    throw new Error("Scenario UUID must be a valid UUID.");
  }
};

const messages = {
  fetch_list: "Scenario question list fetched successfully.",
  validation_failed: "Validation failed.",
  quiz_submit: "Quiz submitted successfully.",
  quiz_save_success: "Quiz answers saved with Pass/Fail status.",
  server_error: "Internal server error.",
  invalid_quiz_id: "scenariolearnarquizid is required in request body.",
};
module.exports = {
  validateScenarioQuestionsInput,
  isValidUUID,
  messages,
};
