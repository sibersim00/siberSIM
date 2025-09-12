const joi = require('joi');

const schema = joi.object({
     template_name: joi.required().messages({
        "any.required": `Template Name is a required.`,
      }), 
      body: joi.required().messages({
        "any.required": `Body is a required.`,
      }),   
      link: joi.required().messages({
        "any.required": `Link is a required.`,
      }),   
      status: joi.required().messages({
        "any.required": `Status is required`,
      }),
});

const notischema = joi.object({
     flag: joi.required().messages({
        "any.required": `Flag is a required.`,
      }), 
     type: joi.required().messages({
        "any.required": `Type is a required.`,
      }),   
});

module.exports = {
    schema,
    notischema
}