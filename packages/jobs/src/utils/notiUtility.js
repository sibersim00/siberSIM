class NotiTemplate {
  constructor(db, template, payload, type, type_id) {
    this._db = db;
    this._template = template;
    this._payload = payload;
    this._type = type;
    this._type_id = type_id;
 
    this.NotiTemplate();
  }
 
  async NotiTemplate() {
    // Only proxmox_down requires cooldown check
    if (this._template === "proxmox_down") {
      const shouldSend = await this.shouldSendProxmoxDownNotification();
      if (!shouldSend) return;
    }
 
    const templateAction = this.getTemplate(this._template);
    if (!templateAction) return;
 
    // 🔹 Get body from noti_templates
    const body = await this.resolveBody(templateAction, this._payload);
 
    await this._db.sequelize.query(
      `INSERT INTO noti_logs
       (template_action, body, payload, type, type_id, createdon)
       VALUES
       (:_action_name, :_body, :_payload, :_type, :_type_id, NOW())`,
      {
        replacements: {
          _action_name: templateAction,
          _body: body,
          _payload: JSON.stringify(this._payload),
          _type: this._type,
          _type_id: this._type_id,
        },
      }
    );
  }
 
  // 🔹 Fetch template body & replace placeholders
  async resolveBody(templateAction, payload) {
    const [templateData] = await this._db.sequelize.query(
      `SELECT body
       FROM noti_templates
       WHERE template_action = :template_action
         AND status = 'Active'
       LIMIT 1`,
      {
        replacements: { template_action: templateAction },
        type: this._db.sequelize.QueryTypes.SELECT,
      }
    );
 
    let finalBody = templateData?.body || "";
 
    // Replace $$placeholders$$ with payload values
    for (const key in payload) {
      finalBody = finalBody.replaceAll(`$$${key}$$`, payload[key]);
    }
 
    return finalBody;
  }
 
  getTemplate(field) {
    const obj = {
      proxmox_down: "proxmox_down",
      proxmox_terminate: "proxmox_terminate",
      component_approval: "component_approval",
      component_status_notification: "component_status_notification", 
      Lab_Start_Reminder: "Lab_Start_Reminder",
    };
    return obj[field];
  }
 
  async getProxmoxAlertIntervalInMinutes() {
    const [res] = await this._db.sequelize.query(
      `SELECT proxmox_alert_time
       FROM web_settings
       ORDER BY id
       LIMIT 1`
    );
    return res[0]?.proxmox_alert_time ?? 2;
  }
 
  async shouldSendProxmoxDownNotification() {
    const intervalMinutes = await this.getProxmoxAlertIntervalInMinutes();
 
    const [res] = await this._db.sequelize.query(
      `SELECT createdon
       FROM noti_logs
       WHERE template_action = 'proxmox_down'
       ORDER BY createdon DESC
       LIMIT 1`
    );
 
    if (!res.length) return true;
 
    const lastCreatedOn = new Date(res[0].createdon);
    const now = new Date();
    const diffInMinutes = (now - lastCreatedOn) / (1000 * 60);
 
    return diffInMinutes >= intervalMinutes;
  }
}
 
module.exports = NotiTemplate;