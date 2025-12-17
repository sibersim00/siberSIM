


class NotiTemplate {
  constructor(db, template_action, payload, type, type_id) {
    this._db = db;
    this._template_action = template_action;
    this._payload = payload;
    this._type = type;
    this._type_id = type_id;
  }

  async send() {
    const name = this.getTemplate(this._template_action);
    const template_action = name ?? "";

    await this._db.sequelize.query(
      `INSERT INTO noti_logs 
       (template_action, payload, type, type_id, createdon) 
       VALUES 
       (:template_action, :payload, :type, :type_id, NOW())`,
      {
        replacements: {
          template_action,
          payload: JSON.stringify(this._payload),
          type: this._type,
          type_id: this._type_id,
        },
      }
    );
  }

  getTemplate(field) {
    const map = {
      welcome_learner: "welcome_learner",
      welcome_instructor: "welcome_instructor",
    };
    return map[field];
  }
}

module.exports = NotiTemplate;
