const joi = require('joi');

// Validation for single ID
const idSchema = joi.number().integer().required().messages({
  "number.base": "Invalid Request: Widget ID must be a number",
  "number.empty": "Invalid Request: Widget ID must not be empty",
  "any.required": "Invalid Request: Widget ID is required",
});

// Validation for Save (Create)
const saveSchema = joi.object({
  widget_name: joi.string().trim().required().messages({
    "string.base": "Widget name should be a string",
    "string.empty": "Widget name cannot be empty",
    "any.required": "Widget name is required",
  }),
  widget_url: joi.string().uri().required().messages({
    "string.base": "Widget URL should be a string",
    "string.uri": "Widget URL must be a valid URI",
    "string.empty": "Widget URL cannot be empty",
    "any.required": "Widget URL is required",
  }),
  order: joi.number().integer().optional().messages({
    "number.base": "Order must be an integer",
  }),
});

// Validation for Update
const updateSchema = joi.object({
  widget_name: joi.string().trim().required().messages({
    "string.base": "Widget name should be a string",
    "string.empty": "Widget name cannot be empty",
    "any.required": "Widget name is required",
  }),
  widget_url: joi.string().uri().required().messages({
    "string.base": "Widget URL should be a string",
    "string.uri": "Widget URL must be a valid URI",
    "string.empty": "Widget URL cannot be empty",
    "any.required": "Widget URL is required",
  }),
  order: joi.number().integer().optional().messages({
    "number.base": "Order must be an integer",
  }),
  status: joi.string().valid("Active", "Inactive").required().messages({
    "any.only": "Status must be either 'Active' or 'Inactive'",
    "string.base": "Status should be a string",
    "any.required": "Status is required",
  }),
});

// Validation for Delete
const deleteSchema = joi.object({
  webbrowserwidgetid: joi.number().integer().required().messages({
    "number.base": "Widget ID should be an integer",
    "number.empty": "Widget ID cannot be empty",
    "any.required": "Widget ID is required",
  }),
});

// Custom validation messages
const messages = {
  save_success: "Widget saved successfully",
  update_success: "Widget updated successfully",
  delete_success: "Widget deleted successfully",
  get_widgets_success: "Widgets fetched successfully",
  widget_name_duplicate: "This widget already exists",
  status_not_change: "Unable to change widget status",
  status_change: "Widget status changed successfully",
  something_wrong_try_later: "Something went wrong. Please try again later.",
  server_error: "Server error",
};

module.exports = {
  idSchema,
  saveSchema,
  updateSchema,
  deleteSchema,
  messages,
};
