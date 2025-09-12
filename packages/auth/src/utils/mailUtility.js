class MailTemplate {
    constructor(db,template,payload){
        this._db = db;
        this._template = template;
        this._payload = payload;
        this.MailTemplate()
    }
async MailTemplate(){
    let name=this.getTemplate(this._template);
    let template = (name !== null && name !== undefined) ? name : "";
    await this._db.sequelize.query(`INSERT INTO email_queues (action_name,payload,send_date,createdon) VALUES (:_action_name, :_payload, now(), now())`,
    {
        replacements: {
        _action_name:template,
        _payload:JSON.stringify(this._payload)
        }
    });
  }
  getTemplate(field) {    
    var obj = {
        'otp_email': "otp_email",
        'otp_email_forgot': "otp_email_forgot",
        'new_password_updated': "new_password_updated",
        'tutor_otp_email': "tutor_otp_email",
        'tutor_inquiry_otp_email': "tutor_inquiry_otp_email",
        'tutor_inquiry_otp_email_forgot': "tutor_inquiry_otp_email_forgot",
        'tutor_otp_email_forgot': "tutor_otp_email_forgot",
        'tutor_new_password_updated': "tutor_new_password_updated",
        'tutor_inquiry_new_password_updated': "tutor_inquiry_new_password_updated",
        'learner_otp_email':'learner_otp_email',
        'learner_otp_email_forgot':'learner_otp_email_forgot',
        'learner_new_password_updated':'learner_new_password_updated',
        'learner_welcome_email':'learner_welcome_email',
        'instructor_welcome_mail':'instructor_welcome_mail',
        'admin_reset_password':'admin_reset_password'
    };
    return obj[field];
  }
}
module.exports=MailTemplate