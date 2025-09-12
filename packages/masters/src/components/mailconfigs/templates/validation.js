const joi = require('joi'); 
const templateSchema = joi.object({ 
    template_name:joi.required(),
    subject:joi.required(),
    body:joi.required(),
    action_id:joi.required(),
    payloads:joi.required(),
    to_email_ids:joi.required(),
    status:joi.required()
});
module.exports = {
    templateSchema
}