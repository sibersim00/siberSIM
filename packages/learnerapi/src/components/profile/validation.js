const joi = require('joi');
const schema = joi.object({
      firstname: joi.string().trim().required().messages({ 
        "string.empty": `First Name cannot be an empty`,
        "any.required": `First Name is a required.`,
      }), 
      lastname: joi.string().trim().required().messages({ 
        "string.empty": `Last Name cannot be an empty`,
        "any.required": `Last Name is a required.`,
      }),   
      email: joi.string().trim().required().messages({ 
        "string.empty": `Email cannot be an empty`,
        "any.required": `Email is a required.`,
      }), 
      mobile: joi.string().min(10).max(14).required().messages({ 
        "string.min": `Enter a valid mobile number with at least 10 characters.`,
        "any.required": `Mobile number is required.`,
    }),
      password: joi.string().required().empty()
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
          .messages({
            "any.required": `Password is required.`,
            "string.empty": `Password cannot be empty.`,
            "string.base": `Password must be a string.`,
            "string.pattern.base": `Must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.`
          }),
});

const schemaForm = joi.object({
  firstname: joi.required().messages({
    "any.required": `First Name is a required.`,
  }), 
  lastname: joi.required().messages({
    "any.required": `Last Name is a required.`,
  }),   
  email: joi.required().messages({
    "any.required": `Email is required.`,
  }), 
  mobile: joi.required().messages({
    "any.required": `Mobile is required.`,
  })
});

const updateprofileSchema = joi.object({
    profile:  joi.string().required().messages({
        "string.base": `Profile image should be a type of 'text'`,
        "string.empty": `Profile image cannot be an empty`,
        "any.required": `Profile image is a required.`,
    }),
});
const changePasswordSchema = joi.object({
  oldPassword: joi.string().min(1).max(255).required().messages({
    'string.empty': 'Current password is required.',
    'any.required': 'Current password is required.',
  }),
  password: joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
    .messages({
      'string.empty': 'New password is required.',
      'any.required': 'New password is required.',
      'string.min': 'New password must be at least 8 characters long.',
      'string.max': 'New password cannot exceed 100 characters.',
      'string.pattern.base': 'New password must include uppercase, lowercase, number, and special character.',
    }),
});
const messages = {
  'update_profile_success':  `Profile updated successfully`,
  'update_profile_image_success':  `Profile image updated successfully`,
}

module.exports = {
    schema,
    schemaForm,
    updateprofileSchema,
    changePasswordSchema,
    messages
}
