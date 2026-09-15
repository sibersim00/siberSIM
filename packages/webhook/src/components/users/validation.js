const joi = require("joi");
const fields = {
  firstname: joi.string().trim().min(2).max(100).required(),
  lastname: joi.string().trim().max(100).allow("", null),
email: joi.string()
  .trim()
  .lowercase()
  .email()
  .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  .max(100)
  .required()
  .messages({
    "string.pattern.base": "Email cannot contain emojis or special characters.",
  }),
  mobile: joi.alternatives().try(joi.string().trim().pattern(/^\+?[0-9]{7,15}$/), joi.number().integer()).allow("", null),
};
const username = joi.string()
  .trim()
  .min(5)
  .max(20)
  .pattern(/^[A-Za-z0-9._-]+$/)
  .required()
  .messages({
    "any.required": "Username is required.",
    "string.empty": "Username cannot be empty.",
    "string.min": "Username must be at least 5 characters long.",
    "string.max": "Username cannot exceed 20 characters.",
    "string.pattern.base": "Username cannot contain emojis or special characters.",
  });

module.exports = {
  createSchema: joi.object({ ...fields, username, password: joi.string().min(8).max(72).required() }),
  updateSchema: joi.object({ ...fields, learner_uuid: joi.string().guid().required() }),
  deleteSchema: joi.object({ learner_uuid: joi.string().guid().required() }),
};
