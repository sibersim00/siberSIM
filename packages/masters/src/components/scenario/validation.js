const joi = require('joi');

const schema = joi.object({
  identification: joi.string().trim().strict().required().min(3).max(30).messages({
    "any.required": `Identification is a required.`,
    "string.empty": `Identification cannot be empty`,
    "string.min": `Identification must be at least 3 characters long.`, // Custom min length message
    "string.max": `Identification cannot exceed 30 characters.` // Custom max length message
  }),

  title: joi.string().trim().strict().required().messages({
    "any.required": `Title is a required.`,
    "string.empty": `Title cannot be empty`,
  }),
  level: joi.string().trim().required().messages({
    "any.required": `level is required.`,
  }),

  description: joi.string().trim().strict().required().messages({
    "any.required": `Description is required.`,
    "string.empty": `Description cannot be empty`
  }),

  scenariocategoryid: joi.number().strict(true).required().messages({
    "number.base": `Scenario category id should be a integer`,
    "number.empty": `Scenario category id cannot be empty`,
    "any.required": `Scenario category id is required.`,
  }),
  scenariosubcategoryid: joi.number().strict(true).required().messages({
    "number.base": `Scenario subcategory id should be a integer`,
    "number.empty": `Scenario subcategory id cannot be empty`,
    "any.required": `Scenario subcategory id is required.`,
  }),

  instruction_file: joi.string().trim().strict().required().messages({
    "any.required": `Instruction file is a required.`,
    "string.empty": `Instruction file cannot be empty`,
  }),

  duration: joi.number().strict(true).required().messages({
    "number.base": `Duration should be a integer`,
    "number.empty": `Duration cannot be empty`,
    "any.required": `Duration is required.`,
  }),

  instructor_id: joi.alternatives().try(
    joi.number().strict().messages({
      "number.base": `"SIMManager Id" must be a number`,
    }),
    joi.valid(null),
    joi.string().valid('').messages({
      "string.base": `"SIMManager Id" must be an empty string or a number`,
    })
  ).optional(),

  status: joi.string().trim().required().messages({
    "string.empty": `Status cannot be empty`,
    "any.required": `Status is required.`,
  }),
});

const updateSchema = joi.object({
  scenarioid: joi.number().strict(true).required().messages({
    "number.base": `Scenario id should be a integer`,
    "number.empty": `Scenario id cannot be empty`,
    "any.required": `Scenario id is required.`,
  }),

  identification: joi.string().trim().strict().required().max(30).messages({
    "any.required": `Identification is a required.`,
    "string.empty": `Identification cannot be empty`,
  }),
  title: joi.string().trim().strict().required().messages({
    "any.required": `Title is a required.`,
    "string.empty": `Title cannot be empty`,
  }),

  description: joi.string().trim().strict().required().messages({
    "any.required": `Description is required.`,
    "string.empty": `Description cannot be empty`
  }),
  level: joi.string().trim().required().messages({
    "string.empty": `Level cannot be empty`,
    "any.required": `Level is required.`,
  }),

  instructor_id: joi.alternatives().try(
    joi.number().messages({ "number.base": `"SIMManager Id" must be a number` }),   // Must be a number if provided
    joi.valid(null).messages({ "any.only": `"SIMManager Id" must be null or a number` }), // Can be null
  ),

  instruction_file: joi.string().trim().strict().required().messages({
    "any.required": `Instruction file is a required.`,
    "string.empty": `Instruction file cannot be empty`,
  }),

  duration: joi.number().strict(true).required().messages({
    "number.base": `Duration should be a integer`,
    "number.empty": `Duration cannot be empty`,
    "any.required": `Duration is required.`,
  }),

  diagram: joi.string().allow('').required().messages({
    "any.required": `Diagram is required.`,
  }),
  status: joi.string().trim().required().messages({
    "string.empty": `Status cannot be empty`,
    "any.required": `Status is required.`,
  }),

  scenariocategoryid: joi.number().strict(true).required().messages({
    "number.base": `Scenario category id should be a integer`,
    "number.empty": `Scenario category id cannot be empty`,
    "any.required": `Scenario category id is required.`,
  }),
  scenariosubcategoryid: joi.number().strict(true).required().messages({
    "number.base": `Scenario subcategory id should be a integer`,
    "number.empty": `Scenario subcategory id cannot be empty`,
    "any.required": `Scenario subcategory id is required.`,
  }),
});

const statusSchema = joi.object({
  scenarioid: joi.number().strict(true).required().messages({
    "number.base": `Scenario id should be a integer`,
    "number.empty": `Scenario id cannot be empty`,
    "any.required": `Scenario id is required.`,
  }),

  status: joi.string().trim().strict(true).required().messages({
    "string.base": `Status should be a string`,
    "string.empty": `Status cannot be empty`,
    "any.required": `Status is required.`
  })
});

const deleteSchema = joi.object({
  scenarioid: joi.number().strict(true).required().messages({
    "number.base": `Scenario id should be a integer`,
    "number.empty": `Scenario id cannot be empty`,
    "any.required": `Scenario id is required.`,
  })
});

const idSchema = joi.string().required().messages({
  "string.base": "Invalid Request: Scenario id is required",
  "string.empty": "Invalid Request: Scenario id must be a valid number",
  "any.required": "Invalid Request: Scenario id is required",
});

const componentconfigSchema = joi.object({
  scenarioid: joi.alternatives([
    joi.number(),
    joi.string().regex(/^\d+$/)
  ])
    .required()
    .messages({
      "alternatives.types": "Invalid Request: Scenario id must be a number",
      "any.required": "Invalid Request: Scenario id is required",
    }),
  
  component_config: joi.array().items(joi.object()).required().messages({
    "array.base": "Invalid Request: Component configuration must be an array",
    "any.required": "Invalid Request: Component configuration is required",
  }),

  network_config: joi.array().required().messages({
    "array.base": "Invalid Request: Network configuration must be an array",
    "any.required": "Invalid Request: Network configuration is required",
  }),

  scenariostatus: joi.string().valid("Draft", "Publish").required().messages({
    "string.base": "Invalid Request: Scenario status must be a string",
    "any.only": "Invalid Request: Scenario status must be either 'Draft' or 'Publish'",
    "any.required": "Invalid Request: Scenario status is required",
  }),
});


const messages = {
  'save_diagram':"Scenario Diagram Save Successfully",
  'add_success':"Scenario Created Successfully",
  'status_change': "Scenario Status Updated Successfully",
  'save_component_configuration' : "Component Saved Successfully",
  'scenario_publish_success': "Scenario has been published successfully.",
  'scenario_already_published': "This scenario has already been published.",
};
module.exports = {
  schema,
  updateSchema,
  statusSchema,
  deleteSchema,
  idSchema,
  componentconfigSchema,
  messages
}