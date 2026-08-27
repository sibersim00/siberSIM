const joi = require("joi");

const common = {
  firstname: joi.string().trim().min(2).max(30).required(),
  lastname: joi.string().trim().max(30).allow("", null),
  email: joi.string().trim().lowercase().email().max(100).required(),
  mobile: joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).allow("", null),
  loginid: joi.string().trim().min(5).max(100).pattern(/^[A-Za-z0-9._-]+$/).required(),
  organization: joi.string().trim().max(255).allow("", null),
  status: joi.string().valid("Active", "Inactive").required(),
};

const addSchema = joi.object({
  ...common,
  password: joi.string().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/).required(),
});
const updateSchema = joi.object({ ...common, webhook_user_id: joi.number().integer().positive().required() });
const statusSchema = joi.object({ webhook_user_id: joi.number().integer().positive().required(), status: joi.string().valid("Active", "Inactive").required() });
const deleteSchema = joi.object({ webhook_user_id: joi.number().integer().positive().required() });

module.exports = { addSchema, updateSchema, statusSchema, deleteSchema };
