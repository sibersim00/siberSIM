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
        'admin_reset_password': "admin_reset_password",
        'instructor_reset_password': "instructor_reset_password",
        'learner_welcome_email': "learner_welcome_email",
        'instructor_account_verification': "instructor_account_verification",
        'instructor_welcome_mail': "instructor_welcome_mail",
        'learner_reset_password': "learner_reset_password",
        'learner_account_confirmation_success':"learner_account_confirmation_success",
        'proxmox_down_alert':"proxmox_down_alert",
        'customer_license_mail': "customer_license_mail"
    };
    
    return obj[field];
}
}
module.exports=MailTemplate