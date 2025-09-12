const joi = require('joi');
const emojiRegex = /[\p{Extended_Pictographic}]/u;
const schema = joi.object({
   
    name: joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9 ]+$/).required().messages({
        "string.base": `Component subcategory should be a string`,
        "string.empty": `Component subcategory cannot be empty`,
        "any.required": `Component subcategory name is required.`,
        "string.min": `Component subcategory must be at least 5 characters long.`,
        "string.max": `Component subcategory cannot exceed 30 characters.`,
        "string.pattern.base": `Component subcategory name must contain only alphanumeric characters.`,
    }),
    description: joi.string().allow('').required() .pattern(emojiRegex, { invert: true }).messages({
        "any.required": "Description is required.",
        "string.pattern.invert.base": "Description must not contain emojis.",
    }),

    image: joi.string().allow('').required().messages({
        "any.required": `Image is required.`,
    }),
    componentcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component category id should be a integer`,
        "number.empty": `Component category id cannot be empty`,
        "any.required": `Component category id is required.`,
    }),

    checklistdata: joi.any().required().label("Checklist Data").messages({
        "any.required": "{{#label}} is required"
    })
});

const idSchema = joi.string().required().messages({
    "string.base":"Invalid Request: Component subcategory id is required",
    "string.empty": "Invalid Request: Component category id must be a valid number",
    "any.required": "Invalid Request: Component category id is required",
});


const updateSchema = joi.object({
    componentsubcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component subcategory id should be a integer`,
        "number.empty": `Component subcategory id cannot be empty`,
        "any.required": `Component subcategory id is required.`,
    }),
    name: joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9 ]+$/).required().messages({
        "string.base": `Component subcategory should be a string`,
        "string.empty": `Component subcategory cannot be empty`,
        "any.required": `Component subcategory name is required.`,
        "string.min": `Component subcategory must be at least 5 characters long.`,
        "string.max": `Component subcategory cannot exceed 30 characters.`,
        "string.pattern.base": `Component subcategory name must contain only alphanumeric characters.`,
    }),
    description: joi.string().allow('').required() .pattern(emojiRegex, { invert: true }).messages({
        "any.required": "Description is required.",
        "string.pattern.invert.base": "Description must not contain emojis.",
    }),
    image: joi.string().allow('').required().messages({
        "any.required": `Image is required.`,
    }),
    componentcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component category id should be a integer`,
        "number.empty": `Component category id cannot be empty`,
        "any.required": `Component category id is required.`,
    }),

    checklistdata: joi.any().required().label("Checklist Data").messages({
        "any.required":  `Checklist Data is required.`,
    })
});

const statusSchema = joi.object({
    componentsubcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component subcategory id should be a integer`,
        "number.empty": `Component subcategory id cannot be empty`,
        "any.required": `Component subcategory id is required.`,
    }),
    status: joi.string().allow('').required().messages({
        "any.required": `Status is required.`,
    }),
});

const deleteSchema = joi.object({
    componentsubcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component subcategory id should be a integer`,
        "number.empty": `Component subcategory id cannot be empty`,
        "any.required": `Component subcategory id is required.`,
    }),
    
});

const messages = {
    'add_success':  `Component subcategory has been created successfully.`,
    'edit_success':  `Component subcategory has been updated successfully.`,
    'something_wrong_try_later':  `Something went wrong. Please try again later.`,
    'category_name_duplicate':  `Component subcategory name already exists.`,
    'status_not_change' : "Unable to change status.",
    'status_change' : "Status has been changed successfully.",
    'server_error':"server error",
    'id_exist' : 'Unable to change status'
};

module.exports = {
    schema,
    idSchema,
    updateSchema,
    messages,
    statusSchema,
    deleteSchema
}