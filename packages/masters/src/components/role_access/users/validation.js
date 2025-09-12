const joi = require('joi');
const schema = joi.object({
    loginid: joi.string().trim().pattern(/^[a-zA-Z0-9]+$/).required().max(100).messages({
        "string.base": `Username should be a type of 'text'.`,
        "string.empty": `Username cannot be empty.`,
        "any.required": `Username is required.`,
        "string.max": `Username cannot be longer than 100 characters.`,
        "string.pattern.base": `Username must contain only alphanumeric characters.`,
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
    email: joi.string().email().trim().required().max(100).messages({
        "string.base": `Email should be a type of 'text'`,
        "string.empty": `Email cannot be an empty`,
        "any.required": `Email is a required.`
    }),


    mobile: joi.string().trim().allow('').pattern(/^[0-9]{8,10}$/) // Allows only numbers (10 to 12 digits)
    .messages({
        "string.base": "Mobile number should be a valid number.",
        "string.empty": "Mobile number cannot be empty.",
        "any.required": "Mobile number is required.",
        "string.pattern.base": "Mobile number must be between 8 and 10 digits and contain only numbers.",
    }),
    
    status: joi.string().trim().required(),

});
const updateprofileSchema = joi.object({
    profile:  joi.string().required().messages({
        "string.base": `Profile image should be a type of 'text'`,
        "string.empty": `Profile image cannot be an empty`,
        "any.required": `Profile image is a required.`,
    }),


});

const updateSchema = joi.object({
    id: joi.number().strict(true).required().messages({
        "number.empty": `Id cannot be an empty`,
        "number.base": `Id should be numeric.`,
        "any.required": `Id is a required.`,
    }),
    loginid: joi.string().trim().pattern(/^[a-zA-Z0-9]+$/).required().max(100).messages({
        "string.base": `Username should be a type of 'text'.`,
        "string.empty": `Username cannot be empty.`,
        "any.required": `Username is required.`,
        "string.max": `Username cannot be longer than 100 characters.`,
        "string.pattern.base": `Username must contain only alphanumeric characters.`,
    }),


    firstname: joi.string().pattern(/^[A-Za-z]+$/).required().empty().messages({
        "string.pattern.base": `First name must contain only letters.`,
        "any.required": `First name is required.`,
        "string.empty": `First name cannot be empty.`,
    }),

    lastname: joi.string().pattern(/^[A-Za-z]+$/).allow('').required().messages({
        "string.pattern.base": `Last name must contain only letters.`,
        "any.required": `Last name is required.`,
    }),

    email: joi.string().email().trim().required().max(100).messages({
        "string.base": `Email should be a type of 'text'`,
        "string.empty": `Email cannot be an empty`,
        "any.required": `Email is a required.`
    }),
    mobile: joi.string().trim().allow('').pattern(/^[0-9]{8,10}$/) // Allows only numbers (10 to 12 digits)
        .messages({
            "string.base": "Mobile number should be a valid number.",
            "string.empty": "Mobile number cannot be empty.",
            "any.required": "Mobile number is required.",
            "string.pattern.base": "Mobile number must be between 8 and 10 digits and contain only numbers.",
        }),

    status: joi.string().messages({
        "string.empty": `Status cannot be an empty`,
        "any.required": `Status is a required.`,
    }),
});

const statusSchema = joi.object({
    userid: joi.number().strict(true).required().messages({
        "number.base": `User id should be a integer`,
        "number.empty": `User id cannot be empty`,
        "any.required": `User id is required.`,
    }),
    status: joi.string().allow('').required().messages({
        "any.required": `Status is required.`,
    }),
});

const mailSchema = joi.object({
    userid: joi.number().strict(true).required().messages({
        "string.empty": `User Id cannot be an empty`,
        "number.base": `User Id should be numeric.`,
        "any.required": `User Id is a required.`,
    }),
})
const messages = {
    'duplicate_loginid':  `Loginid already exists.`,
    'invalid_password':  `Invalid Password`,
    'reset_success':  `A new password has been sent to your registered email ID.`,
    'add_success':  `User has been created successfully`,
    'something_wrong_try_later':  `Something went wrong. Please try again later`,
    'password_update':`Password has been updated successfully`,
    'update_success':  `User has been updated successfully`, 
    'update_profile_success':  `Profile has been updated successfully`,
    'not_updated':  `user not found or not updated`,
    'status_change' : "Status has been changed successfully",
    'resend_mail_success':  `Resend mail successfully`,
    'user_not_found': "User details not found",
    'user_mail_confirmation': "User email verification is already completed.",
    'user_mail_confirmed': "Email verification successful! The User account is now active.",
    'email_duplicate' : "Email is already registered.",
    'mobile_duplicate' : "Mobile is already registered.",
    'username_duplicate' : "Username is already registered.",
  };
module.exports = {
    schema,
    statusSchema,
    mailSchema,
    updateSchema,
    messages,
    updateprofileSchema
}