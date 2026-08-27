const joi = require("joi");
module.exports = { loginSchema: joi.object({ username: joi.string().trim().min(5).max(100).required(), password: joi.string().min(8).max(72).required() }) };
