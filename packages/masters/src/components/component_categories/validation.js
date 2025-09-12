const joi = require('joi');
const emojiRegex = /[\p{Extended_Pictographic}]/u;
const schema = joi.object({
    name: joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9 ]+$/).required().messages({
        "string.base": `Component category should be a string`,
        "string.empty": `Component category cannot be empty`,
        "any.required": `Component category name is required.`,
        "string.min": `Component category must be at least 5 characters long.`,
        "string.max": `Component category cannot exceed 30 characters.`,
        "string.pattern.base": `Component category name must contain only alphanumeric characters.`,
    }),
    description: joi.string().allow('').required() .pattern(emojiRegex, { invert: true }).messages({
        "any.required": "Description is required.",
        "string.pattern.invert.base": "Description must not contain emojis.",
    }),
});

const updateschema = joi.object({
    componentcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component category id should be a integer`,
        "number.empty": `Component category id cannot be empty`,
        "any.required": `Component category id is required.`,
    }),
    name: joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9 ]+$/).required().messages({
        "string.base": `Component category should be a string`,
        "string.empty": `Component category cannot be empty`,
        "any.required": `Component category name is required.`,
        "string.min": `Component category must be at least 5 characters long.`,
        "string.max": `Component category cannot exceed 30 characters.`,
        "string.pattern.base": `Component category name must contain only alphanumeric characters.`,
    }),
    description: joi.string().allow('').required() .pattern(emojiRegex, { invert: true }).messages({
        "any.required": "Description is required.",
        "string.pattern.invert.base": "Description must not contain emojis.",
    }),
});

const idSchema = joi.string().required().messages({
    "string.base":"Invalid Request: Component category id is required",
    "string.empty": "Invalid Request: Component category id must be a valid number",
    "any.required": "Invalid Request: Component category id is required",
});

const statusschema = joi.object({
    componentcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component category id should be a integer`,
        "number.empty": `Component category id cannot be empty`,
        "any.required": `Component category id is required.`,
    }),
    status: joi.string().trim().strict(true).required().messages({
        "string.base": `Status should be a string`,
        "string.empty": `Status cannot be empty`,
        "any.required": `Status is required.`
    }),
});

const deleteIdSchema = joi.object({
    componentcategoryid: joi.number().strict(true).required().messages({
        "number.base": `Component category id should be a integer`,
        "number.empty": `Component category id cannot be empty`,
        "any.required": `Component category id is required.`,
    }),
});

const messages = {
    'list_success':`Get Component Category List Successfully.`,
    'single_data':`Get Component Category Details Successfully.`,
    'add_success':  `Component Category Saved Successfully.`,
    'edit_success':  `Component Category Updated Successfully.`,
    'something_wrong_try_later':  `Something went wrong. Please try again later.`,
    'category_name_duplicate':  `Component Category already exists.`,
    'status_not_change' : "Unable to change status.",
    'status_change' : "Status changed successfully.",
    'server_error':"server error",
    'id_exist' : 'Unable to change status',
    'category_already_mapped' : 'Category already mapped with subcategories',
    'delete_success' : 'Component Category Deleted Successfully',
    'import_success' : 'Component Category Imported Successfully',
};

module.exports = {
    schema,
    messages,
    updateschema,
    statusschema,
    idSchema,
    deleteIdSchema,
}