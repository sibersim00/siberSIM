const joi = require("joi");

const addSchema = joi.object({
  firstname: joi.string().pattern(/^[A-Za-z]+$/).required().empty().messages({
      "string.pattern.base": `First name must contain only letters.`,
      "any.required": `First name is required.`,
      "string.empty": `First name cannot be empty.`,
    }),

  lastname: joi.string().pattern(/^[A-Za-z]+$/).allow("").required().messages({
      "string.pattern.base": `Last name must contain only letters.`,
      "any.required": `Last name is required.`,
    }),
  email: joi.string().email().required().empty().messages({
    "any.required": `Email is required.`,
    "string.email": `Email must be a valid email address.`,
    "string.empty": `Email cannot be empty.`,
  }),


  mobile: joi.string().trim().allow("").required().pattern(/^[0-9]{8,10}$/) // Allows only numbers (10 to 12 digits)
    .messages({
      "string.base": "Mobile number should be a valid number.",
      "string.empty": "Mobile number cannot be empty.",
      "any.required": "Mobile number is required.",
      "string.pattern.base":
        "Mobile number must be between 8 and 10 digits and contain only numbers.",
    }),

  username: joi.string().trim().min(5).max(20).pattern(/^[a-zA-Z0-9]+$/).required().messages({
      "any.required": `Username is required.`,
      "string.empty": `Username cannot be empty.`,
      "string.min": `Username must be at least 5 characters long.`,
      "string.max": `Username cannot exceed 20 characters.`,
      "string.pattern.base": `Username must contain only alphanumeric characters.`,
    }),

  password: joi.string().required().empty().regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
    )
    .messages({
      "any.required": `Password is required.`,
      "string.empty": `Password cannot be empty.`,
      "string.base": `Password must be a string.`,
      "string.pattern.base": `Must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.`,
    }),
});

const updateSchema = joi.object({
  firstname: joi.string().required().empty().messages({
    "any.required": `First name is required.`,
    "string.empty": `First name cannot be empty.`,
  }),
  mobile: joi.number().integer().allow("").messages({
    "number.base": "Mobile number must be a valid number.",
  }),
  learner_uuid: joi.required().empty().messages({
    "any.required": `User is required.`,
    "number.base": `User must be a valid number.`,
    "number.empty": `User cannot be empty.`,
  }),
});

const idSchema = joi.required().empty(null).messages({
  "any.required": `Invalid Request`,
  "any.only": `Invalid Request`,
});

const mailSchema = joi.object({
  learner_uuid: joi.string().strict(true).required().messages({
    "string.base": `User id should be a string`,
    "string.empty": `User id cannot be empty`,
    "any.required": `User id is required.`,
  }),
});

const messages = {
  add_success: `User registered successfully.`,
  email_duplicate: "Email is already registered.",
  mobile_duplicate: "Mobile is already registered.",
  username_duplicate: "Username is already registered.",
  verification_email: "Verification mail send successfully",
  already_verification_email: "Account already verified",
  verification_done: "Account verification done successfully",
  instructor_not_found: "No data found",
  invalid_credentials: "Invalid credentials",
  account_verification_pending: "Account not verified. Check your email or contact admin to activate.",
};

const statusUpdateSchema = joi.object({
  status: joi.required().messages({
    "any.required": `User status is required`,
  }),
  learner_uuid: joi.string().required().empty().messages({
    "any.required": `User is required.`,
    "string.empty": `User cannot be empty.`,
  }),
});

const deleteSchema = joi.object({
  learner_uuid: joi.string().required().empty().messages({
    "any.required": `User is required.`,
    "string.empty": `User cannot be empty.`,
  }),
});
const verifySuccessSchema = joi.object({
  learner_uuid: joi.string().strict(true).required().messages({
    "number.base": `Invaild Request`,
    "number.empty": `Invaild Request`,
    "any.required": `Invaild Request`,
  }),
});
module.exports = {
  addSchema,
  updateSchema,
  idSchema,
  deleteSchema,
  mailSchema,
  statusUpdateSchema,
  messages,
  verifySuccessSchema,
};
