const joi = require("joi");
const noEmoji = /[\p{Extended_Pictographic}]/u;
const name = joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9 ]+$/).required();
const description = joi.string().allow("").required().pattern(noEmoji, { invert: true });

module.exports = {
  idSchema: joi.object({ id: joi.number().integer().positive().required() }),
  createSchema: joi.object({ name, description }),
  updateSchema: joi.object({ componentcategoryid: joi.number().integer().positive().required(), name, description }),
  deleteSchema: joi.object({ componentcategoryid: joi.number().integer().positive().required() }),
};
