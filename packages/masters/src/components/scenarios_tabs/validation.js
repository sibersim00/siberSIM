const Joi = require("joi");
const singleTabSchema = Joi.object({
  scenariotabid: Joi.number().optional(),
  tab_name: Joi.string().max(100).required(),
  tab_status: Joi.string().valid("True", "False").default("True"),
  tab_type: Joi.string().valid("Fixed", "Flexible").default("Fixed"),
  widget_url: Joi.string().max(255).allow(null, ""),
  tab_ordering: Joi.number().integer().allow(null),
});
const saveSchema = Joi.alternatives().try(
  singleTabSchema,
  Joi.array().items(singleTabSchema)
);
const messages = {
  save_success: "Scenario tab saved successfully",
  server_error: "Server error, please try again later.",
  order_duplicate: "Tab ordering already exists.",
  fixed_tab_name_edit: "Cannot rename a Fixed type tab.",
};

module.exports = {
  saveSchema,
  messages,
};
