const joi = require("joi");

const addSchema = joi.object({
  firstname: joi
    .string()
    .pattern(/^[A-Za-z]+$/)
    .required()
    .empty()
    .messages({
      "string.pattern.base": `First name must contain only letters.`,
      "any.required": `First name is required.`,
      "string.empty": `First name cannot be empty.`,
    }),
  lastname: joi
    .string()
    .pattern(/^[A-Za-z]+$/)
    .allow("")
    .messages({
      "string.pattern.base": `Last name must contain only letters.`,
      "any.required": `Last name is required.`,
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
      "string.empty": "Mobile number cannot be empty.",
      "any.required": "Mobile number is required.",
      "string.pattern.base":
        "Mobile number must be between 8 and 10 digits and contain only numbers.",
    }),
  organization: joi
    .string()
    .pattern(/^[A-Za-z ]+$/)
    .allow("")
    .required()
    .messages({
      "string.pattern.base": `Organization must contain only letters.`,
      "any.required": `Organization is required.`,
    }),
  address: joi
    .string()
    .pattern(/^[A-Za-z0-9\s,.\-#/]*$/)
    .allow("")
    .required()
    .messages({
      "string.pattern.base":
        "Address must contain only letters, numbers, spaces, and common punctuation (.,-#/).",
      "any.required": "Address is required.",
    }),
  loginid: joi
    .string()
    .trim()
    .min(5)
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required()
    .messages({
      "any.required": `Username is required.`,
      "string.empty": `Username cannot be empty.`,
      "string.min": `Username must be at least 5 characters long.`,
      "string.max": `Username cannot exceed 20 characters.`,
      "string.pattern.base": `Username must contain only alphanumeric characters.`,
    }),
  password: joi
    .string()
    .required()
    .empty()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
    )
    .messages({
      "any.required": `Password is required.`,
      "string.empty": `Password cannot be empty.`,
      "string.base": `Password must be a string.`,
      "string.pattern.base": `Password must be between 8 and 20 characters and contain at least one letter and one number.`,
    }),
  status: joi.string().required().empty().messages({
    "any.required": `Status is required.`,
    "string.empty": `Status cannot be empty.`,
  }),
});

const updateSchema = joi.object({
  instructor_id: joi.number().strict(true).required().messages({
    "number.base": `Instructor Id should be a integer`,
    "number.empty": `Instructor Id cannot be empty`,
    "any.required": `Instructor Id is required.`,
  }),

  firstname: joi
    .string()
    .pattern(/^[A-Za-z]+$/)
    .required()
    .empty()
    .messages({
      "string.pattern.base": `First name must contain only letters.`,
      "any.required": `First name is required.`,
      "string.empty": `First name cannot be empty.`,
    }),

  lastname: joi
    .string()
    .pattern(/^[A-Za-z]+$/)
    .allow("")
    .required()
    .messages({
      "string.pattern.base": `Last name must contain only letters.`,
      "any.required": `Last name is required.`,
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
      "string.empty": "Mobile number cannot be empty.",
      "any.required": "Mobile number is required.",
      "string.pattern.base":
        "Mobile number must be between 8 and 10 digits and contain only numbers.",
    }),
  organization: joi
    .string()
    .pattern(/^[A-Za-z ]+$/)
    .allow("")
    .required()
    .messages({
      "string.pattern.base": `Organization must contain only letters.`,
      "any.required": `Organization is required.`,
    }),
  address: joi
    .string()
    .pattern(/^[A-Za-z0-9\s,.\-#/]*$/)
    .allow("")
    .required()
    .messages({
      "string.pattern.base":
        "Address must contain only letters, numbers, spaces, and common punctuation (.,-#/).",
      "any.required": "Address is required.",
    }),
  loginid: joi
    .string()
    .trim()
    .min(5)
    .max(20)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required()
    .messages({
      "any.required": `Username is required.`,
      "string.empty": `Username cannot be empty.`,
      "string.min": `Username must be at least 5 characters long.`,
      "string.max": `Username cannot exceed 20 characters.`,
      "string.pattern.base": `Username must contain only alphanumeric characters.`,
    }),

  status: joi.string().required().empty().messages({
    "any.required": `Status is required.`,
    "string.empty": `Status cannot be empty.`,
  }),
});

const deleteSchema = joi.object({
  instructor_id: joi.number().strict(true).required().messages({
    "number.base": `Instructor Id should be a integer`,
    "number.empty": `Instructor Id cannot be empty`,
    "any.required": `Instructor Id is required.`,
  }),
});

const statusSchema = joi.object({
  status: joi.string().strict(true).required().empty().messages({
    "any.required": `Status is required.`,
    "string.empty": `Status cannot be empty.`,
  }),
  instructor_id: joi.number().strict(true).required().messages({
    "number.base": `Invaild Request`,
    "number.empty": `Invaild Request`,
    "any.required": `Invaild Request`,
  }),
});

const verifySchema = joi.object({
  instructor_id: joi.number().strict(true).required().messages({
    "number.base": `Invaild Request`,
    "number.empty": `Invaild Request`,
    "any.required": `Invaild Request`,
  }),
});
const verifySuccessSchema = joi.object({
  instructor_useruuid: joi.string().strict(true).required().messages({
    "number.base": `Invaild Request`,
    "number.empty": `Invaild Request`,
    "any.required": `Invaild Request`,
  }),
});

const resetpasswordSchema = joi.object({
  instructor_id: joi.number().strict(true).required().messages({
    "number.base": `Invaild Request`,
    "number.empty": `Invaild Request`,
    "any.required": `Invaild Request.`,
  }),
});

const messages = {
  add_success: `Instructor has been created successfully`,
  update_success: `Instructor has been updated successfully`,
  delete_success: `Instructor has been deleted successfully`,
  verify_success: `Instructor has been verify successfully`,
  reset_success: `A new password has been sent to your registered email ID.`,
  something_wrong_try_later: `Something went wrong. Please try again later`,
  not_updated: `Instructor not found or not updated`,
  status_change: "Instructor Status has been Updated Successfully",
  email_mobile_duplicate:
    "The provided email/mobile is already registered. Please use a different one.",
  email_duplicate: "Email is already registered.",
  mobile_duplicate: "Mobile is already registered.",
  username_duplicate: "Username is already registered.",
  intructor_list: "Get Intructors List",
  intructor_detail: "Get Instructor Details",
  duplicate_loginid: "Duplicate Username Found",
  verification_email: "Verification mail send successfully",
  verification_success_email: "Your account has been verified successfully",
  already_verification_email: "Account already verified",
  instructor_not_found: "No data found",
};

const idSchema = joi.required().empty(null).messages({
  "any.required": `Invalid Request`,
  "any.only": `Invalid Request`,
});

module.exports = {
  addSchema,
  updateSchema,
  deleteSchema,
  statusSchema,
  verifySchema,
  verifySuccessSchema,
  resetpasswordSchema,
  messages,
  idSchema,
};
