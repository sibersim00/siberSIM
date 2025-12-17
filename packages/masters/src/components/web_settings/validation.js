const joi = require('joi');

const schema = joi.object({
  name: joi.required().messages({
    "any.required": `Company Name is a required.`,
  }), 
  system_name: joi.required().messages({
    "any.required": `System Name is a required.`,
  }),   
  system_footer: joi.required().messages({
    "any.required": `System footer is required.`,
  })
});

const updateSchema = joi.object({
  name: joi.required().messages({
    "any.required": `Company Name is a required.`,
  }), 
  id: joi.required().messages({
    "any.required": `Id is a required.`,
  }), 
  system_name: joi.required().messages({
    "any.required": `System Name is a required.`,
  }),   
  system_footer: joi.required().messages({
    "any.required": `System footer is required.`,
  })
});

module.exports = {
    schema,
    updateSchema
}