const joi = require("joi");

const integrationFields = {
  integration_name: joi.string().trim().max(150).required().messages({
    "string.empty": "Application name cannot be empty.",
    "string.max": "Application name cannot exceed 150 characters.",
    "any.required": "Application name is required.",
  }),
  integration_url: joi
    .string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .max(2048)
    .required()
    .messages({
      "string.empty": "Application URL cannot be empty.",
      "string.uri": "Application URL must be a valid HTTP or HTTPS URL.",
      "string.max": "Application URL cannot exceed 2048 characters.",
      "any.required": "Application URL is required.",
    }),
  description: joi.string().trim().allow("").max(500).default("").messages({
    "string.max": "Description cannot exceed 500 characters.",
  }),
  order: joi.number().integer().min(0).default(0).messages({
    "number.base": "Order must be a number.",
    "number.integer": "Order must be an integer.",
    "number.min": "Order cannot be negative.",
  }),
};

const saveSchema = joi.object(integrationFields);
const updateSchema = joi.object({
  integration_id: joi.number().integer().positive().required(),
  ...integrationFields,
});
const deleteSchema = joi.object({
  integration_id: joi.number().integer().positive().required(),
});
const statusSchema = joi.object({
  integration_id: joi.number().integer().positive().required(),
  status: joi.string().valid("Active", "Inactive").required(),
});

const messages = {
  fetched: "Third party integrations fetched successfully.",
  saved: "Third party integration added successfully.",
  updated: "Third party integration updated successfully.",
  deleted: "Third party integration deleted successfully.",
  statusChanged: "Integration status changed successfully.",
  notFound: "Third party integration was not found.",
  duplicate: "An integration with this application name already exists.",
  serverError: "An error occurred. Please try again later.",
};

module.exports = {
  saveSchema,
  updateSchema,
  deleteSchema,
  statusSchema,
  messages,
};
