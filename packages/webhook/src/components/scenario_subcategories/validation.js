const joi = require("joi");
const emojiRegex = /[\p{Extended_Pictographic}]/u;
const categoryname = joi.string().trim().required().pattern(emojiRegex, { invert: true }).messages({
  "any.required": "Scenario subcategory name is required.",
  "string.empty": "Scenario subcategory name cannot be empty.",
  "string.pattern.invert.base": "Scenario subcategory name cannot contain emojis.",
});
const parentscenariocategoryid = joi.number().integer().positive().required();

module.exports = {
  idSchema: joi.object({ id: joi.number().integer().positive().required() }),
  createSchema: joi.object({ categoryname, parentscenariocategoryid }),
  updateSchema: joi.object({ scenariocategoryid: joi.number().integer().positive().required(), categoryname, parentscenariocategoryid }),
  deleteSchema: joi.object({ scenariocategoryid: joi.number().integer().positive().required() }),
};
