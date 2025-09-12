const joi = require("joi");

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

const deleteSchema = joi.object({
  component_id: joi.number().strict(true).required().messages({
    "any.required": `Component id is required.`,
    "number.base": `Component id must be a valid number.`,
    "number.empty": `Component id cannot be empty.`,
  }),
});

const statusSchema = joi.object({
  status: joi.string().strict(true).required().empty().messages({
    "any.required": `Status is required.`,
    "string.empty": `Status cannot be empty.`,
  }),
});

const getVmsSchema = joi.object({
  type: joi.string().messages({
    "any.required": "Type is required.",
    "string.empty": "Type cannot be empty.",
  }),
});

const vmDetailsSchema = joi.object({
  vmid: joi.number().messages({
    "any.required": "VMID is required.",
    "string.empty": "VMID cannot be empty.",
  }),
});

const idSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .empty(null)
  .messages({
    "number.base": `Invalid Request`,
    "number.integer": `Invalid Request`,
    "number.positive": `Invalid Request`,
    "any.required": `Invalid Request`,
    "any.only": `Invalid Request`,
    "number.unsafe": `Invalid Request`,
  });

const messages = {
  add_success: ` Component has been created successfully`,
  update_success: `Component has been updated successfully`,
  delete_success: `Component has been deleted successfully`,
  something_wrong_try_later: `Something went wrong. Please try again later`,
  component_name_duplicate: `Component name already exists`,
  not_updated: `Component not found or not updated`,
  status_change: "Status has been changed successfully",
  identification_duplicate:
    "The provided identification is already registered. Please use a different one.",
  component_list: "Get Components List",
  component_detail: "Get Components Details",
  proxmox_type:"Invalid vmType provided. Expected 'lxc' or 'qemu'.",
};

module.exports = {
  addSchema,
  updateSchema,
  idSchema,
  messages,
  deleteSchema,
  statusSchema,
  getVmsSchema,
  vmDetailsSchema,
};
