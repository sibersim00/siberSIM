const joi = require("joi");

const addSchema = joi.object({
  bookingname: joi
    .string()
    .trim()
    .required()
    .messages({
      "any.required": "Booking name is required.",
      "string.empty": "Booking name cannot be empty.",
    }),

 reservedseats: joi
  .number()
  .integer()
  .min(1)
  .max(20)
  .required()
  .messages({
    "any.required": "Reserved seats is required.",
    "number.base": "Reserved seats must be a valid number.",
    "number.min": "Reserved seats must be at least 1.",
    "number.max": "Reserved seats cannot exceed 20.",
  }),

  // allowedusers: joi
  //   .array()
  //   .items(joi.number().integer())
  //   .max(joi.ref("reservedseats"))
  //   .messages({
  //     "array.base": "Allowed users must be an array.",
  //     "array.max": "Allowed users cannot exceed the number of reserved seats.",
  //   }),
});

const updateSchema = joi.object({
  lab_id: joi.number().integer().required().messages({
    "number.base": `Lab ID must be a number.`,
    "number.empty": `Lab ID cannot be empty.`,
    "any.required": `Lab ID is required.`,
  }),

  bookingname: joi
    .string()
    .trim()
    .required()
    .messages({
      "any.required": "Booking name is required.",
      "string.empty": "Booking name cannot be empty.",
    }),

 reservedseats: joi
  .number()
  .integer()
  .min(1)
  .max(20)
  .required()
  .messages({
    "any.required": "Reserved seats is required.",
    "number.base": "Reserved seats must be a valid number.",
    "number.min": "Reserved seats must be at least 1.",
    "number.max": "Reserved seats cannot exceed 20.",
  }),

//  allowedusers: joi
//     .array()
//     .items(joi.number().integer())
//     .max(joi.ref("reservedseats"))
//     .messages({
//       "array.base": "Allowed users must be an array.",
//       "array.max": "Allowed users cannot exceed the number of reserved seats.",
//     }),

});

const messages = {
    add_labsession: "Lab session added successfully.",
    update_labsession: "Lab session updated successfully.",
    
};

const idSchema = joi.required().empty(null).messages({
  "any.required": `Invalid Request`,
  "any.only": `Invalid Request`,
});

idWithStatusSchema = joi.object({
  lab_id: joi.number().required(),
  status: joi.string().valid("true", "false").required()
});


module.exports = {
  addSchema,
  updateSchema,
  messages,
  idSchema,
  idWithStatusSchema
};
