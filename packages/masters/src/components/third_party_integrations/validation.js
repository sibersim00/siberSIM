const joi = require("joi");

const integrationFields = {
  integration_name: joi.string().trim().max(150).required(),
  integration_url: joi.string().trim().uri({ scheme: ["http", "https"] }).max(2048).required(),
  description: joi.string().trim().allow("").max(500).default(""),
  order: joi.number().integer().min(0).required(),
  target_panels: joi.array().items(joi.string().valid("SIMUser", "SIMInstructor", "SIMMaster")).min(1).unique().required(),
};

const saveSchema = joi.object(integrationFields);
const updateSchema = joi.object({ integration_id: joi.number().integer().required(), ...integrationFields });
const deleteSchema = joi.object({ integration_id: joi.number().integer().required() });
const statusSchema = joi.object({ integration_id: joi.number().integer().required(), status: joi.string().valid("true", "false").required() });
const messages = {
  get_success: "Third party integrations fetched successfully",
  save_success: "Third party integration saved successfully",
  update_success: "Third party integration updated successfully",
  delete_success: "Third party integration deleted successfully",
  duplicate: "This third party integration already exists",
  status_change: "Third party integration status changed successfully",
  invalid_target_panel: "A valid target panel is required",
  something_wrong_try_later: "Something went wrong. Please try again later.",
  server_error: "Server error",
};

module.exports = { saveSchema, updateSchema, deleteSchema, statusSchema, messages };
