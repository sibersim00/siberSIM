const joi = require("joi");

const saveSchema = joi.object({
  eventname: joi.string().trim().required().messages({
      "any.required": `Event name is required.`,
      "string.empty": `Event name cannot be empty.`,
      "string.base": `Event name must be a string.`,
    }),
    
  scenarioid: joi.number().integer().required().messages({
      "any.required": `Scenario ID is required.`,
      "number.base": `Scenario ID must be a number.`,
      "number.integer": `Scenario ID must be an integer.`,
    }),

  status: joi.string().valid("Pending").optional().messages({
      "string.base": `Status must be a string.`,
      "any.only": `Status must be 'Pending' if provided.`,
    }),
});

const addParticipants = joi.object({
    username: joi.string().min(5).max(20).messages({
      "string.empty": `Username cannot be empty.`,
      "string.min": `Username must be at least 5 characters long.`,
      "string.max": `Username cannot exceed 20 characters.`,
      "string.base": `Username must be a string.`
    }),

    firstname: joi.string().pattern(/^[A-Za-z]+$/).messages({
      "string.pattern.base": `First name must contain only letters.`,
      "string.empty": `First name cannot be empty.`,
    }),
    lastname: joi.string().pattern(/^[A-Za-z]+$/).allow('').messages({
      "string.pattern.base": `Last name must contain only letters.`,
      "any.required": `Last name is required.`,
    }),
    email: joi.string().email().messages({
      "string.email": `Email must be a valid email address.`,
      "string.empty": `Email cannot be empty.`,
    }),
    mobile: joi.number().integer().allow('').messages({
      "any.required": `Mobile number is required.`,
      "string.empty": `Mobile number cannot be empty.`,
    }),
    username: joi.string().min(5).max(20).messages({
      "string.empty": `Username cannot be empty.`,
      "string.min": `Username must be at least 5 characters long.`,
      "string.max": `Username cannot exceed 20 characters.`,
    }),
    password: joi.string().min(5).max(20)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
    .messages({
      "string.empty": `Password cannot be empty.`,
      "string.base": `Password must be a string.`,
      "string.pattern.base": `Password must be between 8 and 20 characters and contain at least one letter and one number.`
    }),
});


const updateSchema = joi.object({
  eventid: joi.number().integer().required().messages({
      "any.required": `Event ID is required.`,
      "number.base": `Event ID must be a number.`,
      "number.integer": `Event ID must be an integer.`,
    }),

  eventname: joi.string().trim().required().messages({
      "any.required": `Event name is required.`,
      "string.empty": `Event name cannot be empty.`,
      "string.base": `Event name must be a string.`,
    }),

  scenarioid: joi.number().integer().required().messages({
      "any.required": `Scenario ID is required.`,
      "number.base": `Scenario ID must be a number.`,
      "number.integer": `Scenario ID must be an integer.`,
    }),

  status: joi.string().valid("Pending").optional().messages({
      "string.base": `Status must be a string.`,
      "any.only": `Status must be 'Pending' if provided.`,
    }),
});


const addLearnerEvent = joi.object({
  learner_id: joi.number().integer().messages({
    "number.base": "Learner ID must be a number.",
    "number.integer": "Learner ID must be an integer.",
  }),
  eventid: joi.number().integer().messages({
    "any.required": "Event ID is required.",
    "number.base": "Event ID must be a number.",
    "number.integer": "Event ID must be an integer.",
  }),
});

const messages = {
    'list_success' : "Events fetched successfully.",
    'save_success'    : "Event Created Successfully.",
    'update_success'  : "Event Updated Successfully.",
    'mobile_duplicate'  : "Mobile Number already exist.",
    'email_duplicate'  : "Email already exist.",
    'username_duplicate'  : "User Name already exist.",
    'eventname_exists': "Event Name already exists for the selected scenario. Please choose a different name.",
    'event_not_found' : "Event not found.",
    'server_error'    : "An error occurred. Please try again later.",
};

module.exports = {
    saveSchema,
    updateSchema,
    addParticipants,
    addLearnerEvent,
    messages
}