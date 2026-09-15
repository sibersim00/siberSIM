const joi = require("joi");
const emojiRegex = /[\p{Extended_Pictographic}]/u;
const categoryname = joi.string().trim().required().pattern(emojiRegex, { invert: true }).messages({
  "any.required": "Scenario category name is required.",
  "string.empty": "Scenario category name cannot be empty.",
  "string.pattern.invert.base": "Scenario category name cannot contain emojis.",
});
const categorytype = joi.string().trim().valid("Public", "Private").required().messages({
  "any.required": "Category type is required.",
  "string.empty": "Category type cannot be empty.",
  "any.only": "Category type must be either Public or Private.",
});

module.exports = {
  idSchema: joi.object({ id: joi.number().integer().positive().required() }),
  createSchema: joi.object({ categoryname, categorytype }),
  updateSchema: joi.object({ scenariocategoryid: joi.number().integer().positive().required(), categoryname, categorytype }),
  deleteSchema: joi.object({ scenariocategoryid: joi.number().integer().positive().required() }),
};
