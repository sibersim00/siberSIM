const joi = require("joi");

const startScenarioSchema = joi.object({
  scenarioid: joi.number().integer().required().messages({
    "any.required": "Scenario ID is required.",
    "number.base": "Scenario ID must be a number.",
  }),

});

const updateSessionStatusSchema = joi.object({
});

const getMessagesSchema = joi.object({
  scenariolearnerid: joi.number().integer().required().messages({
    "any.required": "Scenario Learner ID is required.",
    "number.base": "Scenario Learner ID must be a number.",
  }),
});

const sendMessageSchema = joi.object({
  scenariolearnerid: joi.number().integer().required().messages({
    "any.required": "Scenario Learner ID is required.",
  }),
  scenarioid: joi.number().integer().required().messages({
    "any.required": "Scenario ID is required.",
  }),
  learner_id: joi.number().integer().required().messages({
    "any.required": "Learner ID is required.",
  }),
  instructor_id: joi.number().integer().required().messages({
    "any.required": "SIMManager ID is required.",
  }),
  sender_type: joi
    .string()
    .valid("Instructor", "Admin", "Learner")
    .required()
    .messages({
      "any.required": "Sender type is required.",
      "any.only": "Sender type must be Instructor, Admin, or Learner.",
    }),
  message: joi.string().trim().required().messages({
    "any.required": "Message content is required.",
    "string.empty": "Message cannot be empty.",
  }),
  attachment: joi.string().uri().allow(null, "").messages({
    "string.uri": "Attachment must be a valid URL if provided.",
  }),
});

const markSeenSchema = joi.object({
  scenarioid: joi.number().integer().required().messages({
    "any.required": "Scenario ID is required.",
  }),
  learner_id: joi.number().integer().required().messages({
    "any.required": "Learner ID is required.",
  }),
  instructor_id: joi.number().integer().required().messages({
    "any.required": "SIMManager ID is required.",
  }),
});

const messages = {
  SERVER_ERROR: "Server error. Please try again later.",
  ONE_ACTIVE_SCENARIO:
    "You already have an active running scenario. Please terminate or complete it before starting a new one.",
  CONFIGURATION_STARTED: "Scenario configuration initiated successfully.",
  NOT_FOUND: "Scenario not found.",
  MESSAGE_SENT: "Message sent successfully.",
  MARK_SEEN_FAILED: "Failed to mark messages as seen.",
  MARK_SEEN: "Success to mark messages as seen.",
  FETCH_ERROR: "Error fetching messages.",
  MISSING_SCENARIOLEARNERID: "Missing required parameter: scenariolearnerid.",
  INTERNAL_SERVER_ERROR:
    "An error occurred while processing your request. Please try again later.",
  GET_ALL_SUCCESS: "Fetched all scenarios successfully.",
  GET_ALL_ERROR: "Failed to fetch all scenarios.",
  GET_BY_ID_SUCCESS: "Scenario retrieved successfully.",
  GET_BY_ID_ERROR: "Failed to retrieve scenario.",
  SESSION_STATUS_SUCCESS: "Session status fetched successfully.",
  SESSION_NOT_FOUND: "Session not found.",
  SESSION_STATUS_ERROR: "Error fetching session status.",
  LOGS_FETCH_SUCCESS: "Scenario logs fetched successfully.",
  LOGS_FETCH_ERROR: "Failed to fetch scenario logs.",
  save_success: "Scenario tab saved successfully",
  server_error: "Server error, please try again later.",
  order_duplicate: "Tab ordering already exists.",
  fixed_tab_name_edit: "Cannot rename a Fixed type tab.",
};

const saveSchema = joi.object({
  scenariotabid: joi.number().optional(),
  tab_name: joi.string().max(100).required(),
  tab_status: joi.string().valid("True", "False").default("True"),
  tab_type: joi.string().valid("Fixed", "Flexible").default("Fixed"),
  widget_url: joi.string().max(255).allow(null, ""),
  tab_ordering: joi.number().integer().allow(null),
});

module.exports = {
  startScenarioSchema,
  updateSessionStatusSchema,
  getMessagesSchema,
  sendMessageSchema,
  markSeenSchema,
  messages,
  saveSchema,
};
