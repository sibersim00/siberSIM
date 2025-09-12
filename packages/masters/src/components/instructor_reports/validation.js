const joi = require('joi');


const learnerIdSchema = joi.object({
  learner_id: joi.number().required().messages({
    "any.required": "learner_id is required",
    "number.base": "learner_id must be a number",
  }),
});


module.exports = {
  learnerIdSchema,
};
