const joi = require("joi");

const deleteSchema = joi.object({
  customcomponentid: joi.number().integer().required().messages({
    "any.required": `Custom component id is required.`,
    "number.base": `Custom component id must be a valid number.`,
  }),
});


const addSchema = joi.object({
  componentcategoryid: joi.number().integer().required().messages({
    "any.required": `Component Category is required.`,
    "number.base": `Component Category must be a valid number.`,
  }),
  componentsubcategoryid: joi
    .number()
    .integer()
    .optional()
    .allow(null)
    .messages({
      "number.base": `Component Sub Category must be a valid number.`,
    }),
  duration: joi.number().integer().max(300).required().messages({
    "any.required": "Duration is required.",
    "number.base": "Duration must be a number.",
    "number.max": "Duration must not exceed 300 seconds (5 minutes).",
  }),
  componentsubcategoryTypeid: joi.string().allow(null, "").messages({
    "string.base": "Subcategory Type ID must be a string.",
  }),
  vmid: joi.required().messages({
    "string.base": `Component Vmid must be a string.`,
    "any.required": `Component Vmid is required.`,
    "string.empty": `Component Vmid cannot be empty.`,
  }),
  vmid_name: joi.string().allow(null, "").max(150),
  componentname: joi.string().allow(null, "").max(150),
  componentimage: joi.string().allow(null, ""),
});

const updateSchema = joi.object({
  componentid: joi.number().integer().required().messages({
    "any.required": `Component ID is required.`,
    "number.base": `Component ID must be a valid number.`,
  }),
  componentcategoryid: joi.number().integer().required().messages({
    "any.required": `Component Category is required.`,
    "number.base": `Component Category must be a valid number.`,
  }),
  componentsubcategoryid: joi
    .number()
    .integer()
    .optional()
    .allow(null)
    .messages({
      "number.base": `Component Sub Category must be a valid number.`,
    }),
  duration: joi.number().integer().max(300).required().messages({
    "any.required": "Duration is required.",
    "number.base": "Duration must be a number.",
    "number.max": "Duration must not exceed 300 seconds (5 minutes).",
  }),

  componentsubcategoryTypeid: joi.string().allow(null, "").messages({
    "string.base": "Subcategory Type ID must be a string.",
  }),
  vmid: joi.required().messages({
    "any.required": `Component VMID is required.`,
    "string.base": `Component VMID must be a string.`,
    "string.empty": `Component VMID cannot be empty.`,
  }),
  vmid_name: joi.string().allow(null, "").max(150).messages({
    "string.max": `VMID name must be at most 150 characters.`,
  }),
  componentname: joi.string().allow(null, "").max(150).messages({
    "string.max": `Component name must be at most 150 characters.`,
  }),
  componentimage: joi.string().allow(null, "").messages({
    "string.base": `Component image must be a string.`,
  }),
});

const vmDetailsSchema = joi.object({
  vmid: joi.number().messages({
    "any.required": "VMID is required.",
    "string.empty": "VMID cannot be empty.",
  }),
});

const getVmsSchema = joi.object({
  type: joi.string().messages({
    "any.required": "Type is required.",
    "string.empty": "Type cannot be empty.",
  }),
});

const messages = {
  custom_component_list: "Custom component list fetched successfully.",
  custom_component_detail: "Custom component details fetched successfully.",
  invalid_custom_uuid: "Invalid custom component UUID.",
  custom_component_not_found: "No record found for this custom component.",
  custom_component_update: "custom component reject successfully",
};

module.exports = {
  messages,
  addSchema,
  updateSchema,
  vmDetailsSchema,
  getVmsSchema,
  deleteSchema

};
