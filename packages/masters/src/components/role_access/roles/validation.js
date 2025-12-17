const joi = require('joi');
const schema = joi.object({
    rolename: joi.string().trim().required().max(100).messages({
        "string.base": `Role name should be a type of 'text'`,
        "string.empty": `Role name cannot be an empty`,
        "any.required": `Role name is a required.`,
        "string.max": `Role name cannot be longer than 100 characters`,
    }),
    displayname: joi.string().trim().required().max(100).messages({
        "string.base": `Role display name should be a type of 'text'`,
        "string.empty": `Role display name cannot be an empty`,
        "any.required": `Role display name is a required.`,
        "string.max": `Role display name cannot be longer than 100 characters`,
    }),
    description: joi.string().trim().required().max(100).messages({
        "string.base": `Role description should be a type of 'text'`,
        "string.empty": `Role description cannot be an empty`,
        "any.required": `Role description is a required.`,
        "string.max": `Role description cannot be longer than 100 characters`,
    }),
    status: joi.string().trim().required().max(100).messages({
        "string.base": `Role status should be a type of 'text'`,
        "string.empty": `Role status cannot be an empty`,
        "any.required": `Role status is a required.`,
        "string.max": `Role status cannot be longer than 100 characters`,
    }),
});

const statusschema = joi.object({
    status: joi.string().trim().required(),
});

const rolemenuschema = joi.object({
    roleid: joi.number().required(),
    menuid : joi.array().items(joi.number()).min(1)
});

const userroleschema = joi.object({
    userid: joi.number().required(),
    roleid : joi.number().required()
});

const userrolerightschema = joi.object({
    userid: joi.number().required()
});

module.exports = {
    schema,
    statusschema,
    rolemenuschema,
    userroleschema,
    userrolerightschema
}