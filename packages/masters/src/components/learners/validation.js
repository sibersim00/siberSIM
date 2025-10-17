const joi = require('joi');

const addSchema = joi.object({
    username: joi.string().min(5).max(20).required().empty().messages({
      "any.required": `Username is required.`,
      "string.empty": `Username cannot be empty.`,
      "string.min": `Username must be at least 5 characters long.`,
      "string.max": `Username cannot exceed 20 characters.`,
      "string.base": `Username must be a string.`
    }),

    firstname: joi.string().pattern(/^[A-Za-z]+$/).required().empty().messages({
      "string.pattern.base": `First name must contain only letters.`,
      "any.required": `First name is required.`,
      "string.empty": `First name cannot be empty.`,
    }),
    lastname: joi.string().pattern(/^[A-Za-z]+$/).allow('').messages({
      "string.pattern.base": `Last name must contain only letters.`,
      "any.required": `Last name is required.`,
    }),
    email: joi.string().email().required().empty().messages({
      "any.required": `Email is required.`,
      "string.email": `Email must be a valid email address.`,
      "string.empty": `Email cannot be empty.`,
    }),
    mobile: joi.number().integer().allow('').empty().messages({
      "any.required": `Mobile number is required.`,
      "string.empty": `Mobile number cannot be empty.`,
    }),
    username: joi.string().min(5).max(20).required().empty().messages({
      "any.required": `Username is required.`,
      "string.empty": `Username cannot be empty.`,
      "string.min": `Username must be at least 5 characters long.`,
      "string.max": `Username cannot exceed 20 characters.`,
    }),
    password: joi.string().required().empty()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
    .messages({
      "any.required": `Password is required.`,
      "string.empty": `Password cannot be empty.`,
      "string.base": `Password must be a string.`,
      "string.pattern.base": `Password must be between 8 and 20 characters and contain at least one letter and one number.`
    }),
});

const updateSchema = joi.object({
  firstname: joi.string().pattern(/^[A-Za-z]+$/).required().empty().messages({
    "string.pattern.base": `First name must contain only letters.`,
    "any.required": `First name is required.`,
    "string.empty": `First name cannot be empty.`,
  }),
  lastname: joi.string().pattern(/^[A-Za-z]+$/).allow('').required().messages({
    "string.pattern.base": `Last name must contain only letters.`,
    "any.required": `Last name is required.`,
  }),
  email: joi.string().email().required().empty().messages({
    "any.required": `Email is required.`,
    "string.email": `Email must be a valid email address.`,
    "string.empty": `Email cannot be empty.`,
  }),
  mobile: joi.number().integer().allow("").messages({
    "number.base": "Mobile number must be a valid number."
  }),
  learner_uuid: joi.required().empty().messages({
    "any.required": `SIMUser is required.`,
    "number.base": `SIMUser must be a valid number.`,
    "number.empty": `SIMUser cannot be empty.`,
  }),
});

const idSchema = joi.required().empty(null).messages({
  "any.required": `Invalid Request`,
  "any.only": `Invalid Request`
});

const mailSchema = joi.object({
  learner_id: joi.number().required().messages({
      "string.base": `SIMUser id should be a string`,
      "string.empty": `SIMUser id cannot be empty`,
      "any.required": `SIMUser id is required.`,
  }),
})


const messages = {
  'add_success':  `SIMUser has been created successfully`,
  'update_success':  `SIMUser has been updated successfully`,
  'delete_success':  `SIMUser has been deleted successfully`,
  'something_wrong_try_later':  `Something went wrong. Please try again later`,
  'not_updated':  `SIMUser not found or not updated`,
  'status_change' : "SIMUser Status Updated Successfully",
  'email_mobile_duplicate' : "The provided email, mobile or user name is already registered. Please use a different one.",
  'email_duplicate' : "Email is already registered.",
  'mobile_duplicate' : "Mobile is already registered.",
  'username_duplicate' : "Username is already registered.",
  'student_list' : "Get Students List",
  'mapped_instructor_list' : "Get Mapped SIMManager List",
  'student_detail': "Get SIMUser Details",
  'student_not_found': "SIMUser details not found",
  'student_mail_confirmation': "SIMUser email verification is already completed.",
  'student_mail_confirmed': "Email verification successfull! The SIMUser's account is now active.",
  'reset_password_success' : "Your password has been reset successfully..",
  'update_instructor_mapping_success' : "SIMManager mapping updated successfully",
  'verification_email': "Verification mail send successfully",
  'verification_success_email': "Your account has been verified successfully",
  'already_verification_email': "Account already verified",
  'learner_not_found': "No data found"
};

const statusUpdateSchema = joi.object({
  status: joi.required().messages({
    "any.required": `SIMUser status is required`,
  }),
  learner_uuid: joi.string().required().empty().messages({
    "any.required": `SIMUser is required.`,
    "string.empty": `SIMUser cannot be empty.`,
  }),
});

const deleteSchema = joi.object({
  learner_uuid: joi.string().required().empty().messages({
    "any.required": `SIMUser is required.`,
    "string.empty": `SIMUser cannot be empty.`,
  }),
});

const resetPasswordSchema = joi.object({
  learner_id: joi.number().strict(true).required().messages({
        "number.base": `SIMUser id should be a integer`,
        "number.empty": `SIMUser id cannot be empty`,
        "any.required": `SIMUser id is required.`,
    }),
});
const instructormappedSchema = joi.object({
  learner_id: joi.number().strict(true).required().messages({
        "number.base": `SIMUser id should be a integer`,
        "number.empty": `SIMUser id cannot be empty`,
        "any.required": `SIMUser id is required.`,
    }),
});
const saveinstructormappedSchema = joi.object({
  learner_id: joi.number().strict(true).required().messages({
        "number.base": `SIMUser id should be a integer`,
        "number.empty": `SIMUser id cannot be empty`,
        "any.required": `SIMUser id is required.`,
    }),
});

module.exports = {
  addSchema,
  updateSchema,
  idSchema,
  deleteSchema,
  resetPasswordSchema,
  mailSchema,
  statusUpdateSchema,
  instructormappedSchema,
  saveinstructormappedSchema,
  messages
}