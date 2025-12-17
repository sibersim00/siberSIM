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
  start_date: joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),

  expiry_date: joi.date().required().messages({
    "date.base": "Expiry date must be a valid date",
    "any.required": "Expiry date is required",
  }),

  domain_url: joi.string().required().messages({
    "string.base": "Domain URL must be a string",
    "string.empty": "Domain URL cannot be empty",
    "any.required": "Domain URL is required",
  }),
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
  start_date: joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),

  expiry_date: joi.date().required().messages({
    "date.base": "Expiry date must be a valid date",
    "any.required": "Expiry date is required",
  }),

  domain_url: joi.string().required().messages({
    "string.base": "Domain URL must be a string",
    "string.empty": "Domain URL cannot be empty",
    "any.required": "Domain URL is required",
  }),
});

const licenseResendSchema= joi.object({
  // customer_license_id: joi.string().uuid().required().messages({
  //   "any.required": "License ID is required",
  // }),
});

const messages = {
    add_success: "Customer added successfully.",
    email_duplicate: "Email already exists.",
    mobile_duplicate: "Mobile number already exists.",
    update_success: "Customer updated successfully.",
    status_change: "Customer status updated successfully.",
    add_license: "License added successfully.",
    update_license: "License updated successfully.",
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
  licenseResendSchema
};
