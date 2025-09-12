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
        'tutor_welcome_email': "tutor_welcome_email",
        'tutor_inquiry': "tutor_inquiry",
        'program_added_with_other_category': "program_added_with_other_category",
        'program_published_by_admin': "program_published_by_admin",
        'program_resubmitted_by_tutor': "program_resubmitted_by_tutor",
        'program_approved_by_admin': "program_approved_by_admin",
        'program_rejected_by_admin': "program_rejected_by_admin",
        'program_confirm_n_submitted_by_tutor': "program_confirm_n_submitted_by_tutor",
        'learner_welcome_email': "learner_welcome_email",
        'program_cancelled_update': "program_cancelled_update",
        'learner_finished_program': "learner_finished_program",
        'learner_finished_exam': "learner_finished_exam",
        'tutor_learner_finished_exam': "tutor_learner_finished_exam",
    };
    return obj[field];
  }
}
module.exports=MailTemplate