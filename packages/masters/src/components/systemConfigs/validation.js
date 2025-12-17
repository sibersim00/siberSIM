const joi = require('joi'); 
const statusSchema = joi.object({ 
    service_type_id:joi.required(),
    status:joi.required(),
});
const statusUserSchema = joi.object({ 
    mailuser_id:joi.required(),
    status:joi.required(),
});
const testEmailSchema = joi.object({ 
    service_type_id:joi.required(),
    mailuser_id:joi.required(),
    email_id:joi.required(),
});
module.exports = {
    statusSchema,
    statusUserSchema,
    testEmailSchema
}