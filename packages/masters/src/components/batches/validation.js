const joi = require('joi');
const idSchema = joi.string().required().messages({
    "string.base":"Invalid Request: Batch learner id is required",
    "string.empty": "Invalid Request: Batch learner id must be a valid number",
    "any.required": "Invalid Request: Batch learner id is required",
});

const saveschema = joi.object({
    batchname: joi.string().trim().max(30).required().messages({
        "string.base": `Batch name should be a string.`,
        "string.empty": `Batch name cannot be empty.`,
        "string.max": `Batch name must be at most 30 characters long.`,
        "any.required": `Batch name is required.`,
    }),
});

const updateschema = joi.object({
    batchid: joi.number().required().messages({
        "number.base": `Batch ID should be a number.`,
        "number.empty": `Batch ID cannot be empty.`,
        "any.required": `Batch ID is required.`,
    }),
    batchname: joi.string().trim().max(30).required().messages({
        "string.base": `Batch name should be a string.`,
        "string.empty": `Batch name cannot be empty.`,
        "string.max": `Batch name must be at most 30 characters long.`,
        "any.required": `Batch name is required.`,
    }),
    
});

const statusschema = joi.object({
    batchid: joi.string().strict(true).required().messages({
        "string.base": `Status should be a string`,
        "string.empty": `Status cannot be empty`,
        "any.required": `Status is required.`
    }),
});

const deleteSchema = joi.object({
    batchid: joi.number().required().messages({
        "number.base":  `Batch learner ID should be a number.`,
        "number.empty": `Batch learner ID cannot be empty.`,
        "any.required": `Batch learner ID is required.`,
    }),
});

const messages = {
    'add_success':  `Batch has been created successfully.`,
    'edit_success':  `Batch has been updated successfully.`,
    'something_wrong_try_later':  `Something went wrong. Please try again later.`,
    'batch_duplicate':  `Batch already exists.`,
    'status_not_change' : "Unable to change status.",
    'status_change' : "Batch status changed successfully.",
    'server_error':"Server error",
    'delete_success' : 'Batch has been deleted successfully'
};

module.exports = {
    saveschema,
    updateschema,
    deleteSchema,
    idSchema,
    statusschema,
    messages
}
