const joi = require('joi');
const schema = joi.object({
    orgid: joi.number().required().messages({
        "string.empty": `Organization Id cannot be an empty`,
        "number.base": `Organization Id should be numeric.`,
        "any.required": `Organization Id is a required.`,
    }),
    userid: joi.number().required().messages({
        "string.empty": `SIMUser Id cannot be an empty`,
        "number.base": `SIMUser Id should be numeric.`,
        "any.required": `SIMUser Id is a required.`,
    }),
    orgcode: joi.string().trim().required().max(20).messages({
        "string.base": `Organization code should be a type of 'number'`,
        "string.empty": `Organization code cannot be an empty`,
        "any.required": `Organization code is a required.`,
        "string.max": `Organization code cannot be longer than 20`,
    }),
    orgname: joi.string().trim().required().max(100).messages({
        "string.base": `Organization name should be a type of 'text'`,
        "string.empty": `Organization name cannot be an empty`,
        "any.required": `Organization name is a required.`,
        "string.max": `Organization name cannot be longer than 100 characters`,
    }),
    status: joi.string().trim().required(),
});
const statusschema = joi.object({
    status: joi.string().trim().required(),
});
const messages = {
    'duplicate_orgname':  `Organization name already exists`,
    'add_success':  `Organization inserted successfully`,
    'something_wrong_try_later':  `Something went wrong. Please try again later`,
    'update_success':  `Organization updated successfully`,
    'not_updated':  `Organization not found or not updated`,
    'status_change' : "Status updated successfully.",
  };
module.exports = {
    schema,
    statusschema,
    messages
}