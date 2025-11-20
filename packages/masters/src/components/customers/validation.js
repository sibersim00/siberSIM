const joi = require("joi");

const addSchema = joi.object({
  firstname: joi
    .string()
    .pattern(/^[A-Za-z ]+$/)
    .required()
    .messages({
      "string.pattern.base": `First name must contain only letters.`,
      "any.required": `First name is required.`,
      "string.empty": `First name cannot be empty.`,
    }),

  lastname: joi
    .string()
    .pattern(/^[A-Za-z ]+$/)
    .allow("")
    .messages({
      "string.pattern.base": `Last name must contain only letters.`,
    }),

  email: joi.string().email().required().empty().messages({
    "any.required": `Email is required.`,
    "string.email": `Email must be a valid email address.`,
    "string.empty": `Email cannot be empty.`,
  }),
  mobile: joi
    .string()
    .trim()
    .allow("")
    .pattern(/^[0-9]{8,10}$/) // Allows only numbers (10 to 12 digits)
    .messages({
      "string.base": "Mobile number should be a valid number.",
      "string.pattern.base":
        "Mobile number must be between 8 and 10 digits and contain only numbers.",
    }),
  

});

const updateSchema = joi.object({
   customer_id: joi.number().strict(true).required().messages({
    "number.base": `customer id Id should be a integer`,
    "number.empty": `customer id Id cannot be empty`,
    "any.required": `customer id Id is required.`,
  }),

   firstname: joi
    .string()
    .pattern(/^[A-Za-z ]+$/)
    .required()
    .messages({
      "string.pattern.base": `First name must contain only letters.`,
      "any.required": `First name is required.`,
      "string.empty": `First name cannot be empty.`,
    }),

  lastname: joi
    .string()
    .pattern(/^[A-Za-z ]+$/)
    .allow("")
    .messages({
      "string.pattern.base": `Last name must contain only letters.`,
    }),
  email: joi.string().email().required().empty().messages({
    "any.required": `Email is required.`,
    "string.email": `Email must be a valid email address.`,
    "string.empty": `Email cannot be empty.`,
  }),
  mobile: joi
    .string()
    .trim()
    .allow("")
    .pattern(/^[0-9]{8,10}$/) // Allows only numbers (10 to 12 digits)
    .messages({
      "string.base": "Mobile number should be a valid number.",
      "string.pattern.base":
        "Mobile number must be between 8 and 10 digits and contain only numbers.",
    }),

});
const licenseAddSchema =  joi.object({
  customer_id: joi.number().required().messages({
    "number.base": `customer Id should be a integer`,
    "number.empty": `customer Id cannot be empty`,
    "any.required": `customer Id is required.`,
  }),
  sim_user_count: joi.number().required().messages({
    "number.base": `SIMuser should be a integer`,
    "number.empty": `SIMuser cannot be empty`,
    "any.required": `SIMuser is required.`,
  }),
  sim_mst_count: joi.number().required().messages({
    "number.base": `SIMMaster should be a integer`,
    "number.empty": `SIMMaster cannot be empty`,
    "any.required": `SIMMaster is required.`,
  }),
  sim_investor_count: joi.number().required().messages({
    "number.base": `SIMInvestor should be a integer`,
    "number.empty": `SIMInvestor cannot be empty`,
    "any.required": `SIMInvestor is required.`,
  }),
  start_date: joi.date().allow(null),
  expiry_date: joi.date().allow(null),
  domain_url: joi.string().allow(null, ''),
});

const licenseUpdateSchema = joi.object({
  customer_license_id: joi.number().required(),
  customer_license_id: joi.number().required().messages({
    "number.base": `Customer license Id should be a integer`,
    "number.empty": `Customer license Id cannot be empty`,
    "any.required": `Customer license Id is required.`,
  }),
  sim_user_count: joi.number().required().messages({
    "number.base": `SIMuser should be a integer`,
    "number.empty": `SIMuser cannot be empty`,
    "any.required": `SIMuser is required.`,
  }),
  sim_mst_count: joi.number().required().messages({
    "number.base": `SIMMaster should be a integer`,
    "number.empty": `SIMMaster cannot be empty`,
    "any.required": `SIMMaster is required.`,
  }),
  sim_investor_count: joi.number().required().messages({
    "number.base": `SIMInvestor should be a integer`,
    "number.empty": `SIMInvestor cannot be empty`,
    "any.required": `SIMInvestor is required.`,
  }),
  start_date: joi.date().allow(null),
  expiry_date: joi.date().allow(null),
  domain_url: joi.string().allow(null, ''),
});

const messages = {
    add_success: "Customer added successfully.",
    email_duplicate: "Email already exists.",
    mobile_duplicate: "Mobile number already exists.",
    update_success: "Customer updated successfully.",
    status_change: "Customer status updated successfully.",
};

const idSchema = joi.required().empty(null).messages({
  "any.required": `Invalid Request`,
  "any.only": `Invalid Request`,
});

module.exports = {
  addSchema,
  updateSchema,
  licenseAddSchema,
  licenseUpdateSchema,
  messages,
  idSchema,
};
