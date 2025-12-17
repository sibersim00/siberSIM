const joi = require('joi');
const schema = joi.object({
    scenariocategoryid: joi.number().strict().required().messages({
        "number.base": "Scenario category id must be a integer.",
        "any.required": `Scenario category id is required.`,
    }),
});

const schemasubcategory = joi.object({
    componentcategoryid: joi.number().strict().required().messages({
        "number.base": "Component Category id must be a integer.",
        "any.required": `Component Category id is required.`,
    }),
});

const schemaComponentByCategory = joi.object({
    componentcategoryid: joi.number().strict().required().messages({
        "number.base": "Component Category id must be a integer.",
        "any.required": `Component Category id is required.`,
    }),
});

const messages = {
    'save_success':  `Json data saved successfully.`
};

module.exports = {
    schema,
    schemasubcategory,
    schemaComponentByCategory,
    messages
}