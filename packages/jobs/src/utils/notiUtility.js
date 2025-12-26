
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

    const name = this.getTemplate(this._template);
    const template = name !== null && name !== undefined ? name : "";

    await this._db.sequelize.query(
      `INSERT INTO noti_logs (template_action, payload, type, type_id, createdon)
       VALUES (:_action_name, :_payload, :_type, :_type_id, NOW())`,
      {
        replacements: {
          _action_name: template,
          _payload: JSON.stringify(this._payload),
          _type: this._type,
          _type_id: this._type_id,
        },
      }
    );
  }

  getTemplate(field) {
    const obj = {
      proxmox_down: "proxmox_down",
      proxmox_terminate: "proxmox_terminate", //  Added this line
      component_approval: "component_approval",
    };
    return obj[field];
  }

  async getProxmoxAlertIntervalInMinutes() {
    const [res] = await this._db.sequelize.query(
      `SELECT proxmox_alert_time FROM web_settings ORDER BY id LIMIT 1`
    );
    return res[0]?.proxmox_alert_time ?? 2;
  }

  async shouldSendProxmoxDownNotification() {
    const intervalMinutes = await this.getProxmoxAlertIntervalInMinutes();

    const [res] = await this._db.sequelize.query(
      `SELECT createdon FROM noti_logs
       WHERE template_action = 'proxmox_down'
       ORDER BY createdon DESC LIMIT 1`
    );

    if (!res.length) return true;

    const lastCreatedOn = new Date(res[0].createdon);
    const now = new Date();
    const diffInMs = now - lastCreatedOn;
    const diffInMinutes = diffInMs / (1000 * 60);

    return diffInMinutes >= intervalMinutes;
  }
}

module.exports = NotiTemplate;
