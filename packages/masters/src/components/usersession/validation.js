const joi = require('joi');

const schema = joi.object({
  identification: joi.string().trim().pattern(/^[a-zA-Z0-9]+$/).strict().required().min(3).max(30).messages({
    "any.required": `Identification is a required.`,
    "string.empty": `Identification cannot be empty`,
    "string.pattern.base": `Identification must contain only alphanumeric characters.`,
    "string.min": `Identification must be at least 3 characters long.`, // Custom min length message
    "string.max": `Identification cannot exceed 30 characters.` // Custom max length message
  }),

  title: joi.string().trim().pattern(/^[a-zA-Z0-9 ]+$/).strict().required().messages({
    "any.required": `Title is a required.`,
    "string.empty": `Title cannot be empty`,
    "string.pattern.base": `Title must contain only alphanumeric characters.`,
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

  identification: joi.string().trim().pattern(/^[a-zA-Z0-9]+$/).strict().required().max(30).messages({
    "any.required": `Identification is a required.`,
    "string.empty": `Identification cannot be empty`,
    "string.pattern.base": `Identification must contain only alphanumeric characters.`,
  }),
  title: joi.string().trim().pattern(/^[a-zA-Z0-9 ]+$/).strict().required().messages({
    "any.required": `Title is a required.`,
    "string.empty": `Title cannot be empty`,
    "string.pattern.base": `Title must contain only alphanumeric characters.`,
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

const messages = {
  'save_diagram':"Scenario Diagram has been save Successfully",
  'add_success':"Scenario has been created successfully",
  'status_change': "Scenario Status Updated Successfully",
  'server_error' : "An error occurred while retrieving notification termination.",
  'noti_termination' : "Termination notification sent successfully.",
  'noti_termination_msg' : "It looks like the resource has been idle for a while. To keep things efficient, we’ll automatically shut it down in 4 hours. Need more time? Just reconnect...",
  'list_scenarios' : "Scenarios fetch successfully."
};
module.exports = {
  schema,
  updateSchema,
  statusSchema,
  deleteSchema,
  idSchema,
  messages
}