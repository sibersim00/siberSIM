const joi = require('joi');
const schema = joi.object({
    menuname: joi.string(),
    status: joi.string(),
});

const statusschema = joi.object({
    status: joi.string(),
});

module.exports = {
    schema,
    statusschema
}