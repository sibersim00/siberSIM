class NotiTemplate {
  constructor(db, templateAction, payload, type, type_id) {
    this._db = db;
    this._templateAction = templateAction;
    this._payload = payload;
    this._type = type;
    this._type_id = type_id;

    this.init(); // auto start
  }

  async init() {
    try {
      // Proxmox cooldown check
      if (this._templateAction === "proxmox_down") {
        const shouldSend = await this.shouldSendProxmoxDownNotification();
        if (!shouldSend) return;
      }

      // 🔹 Resolve body from noti_templates
      const body = await this.resolveBody(
        this._templateAction,
        this._payload
      );

      // 🔹 Insert notification log
      await this._db.sequelize.query(
        `INSERT INTO noti_logs
         (template_action, body, payload, type, type_id, createdon)
         VALUES
         (:template_action, :body, :payload, :type, :type_id, NOW())`,
        {
          replacements: {
            template_action: this._templateAction,
            body,
            payload: JSON.stringify(this._payload),
            type: this._type,
            type_id: this._type_id,
          },
        }
      );
    } catch (err) {
      console.error("NotiTemplate Error:", err);
    }
  }

  // 🔹 Fetch template body & replace placeholders
  async resolveBody(templateAction, payload) {
    // Special case: publish_scenario
    if (templateAction === "publish_scenario") {
      const [scenario] = await this._db.sequelize.query(
        `SELECT component_config
         FROM scenarios
         WHERE scenarioid = :scenarioid
         LIMIT 1`,
        {
          replacements: { scenarioid: payload.scenarioid },
          type: this._db.sequelize.QueryTypes.SELECT,
        }
      );

      const config = JSON.parse(scenario?.component_config || "[]");
      const title =
        config.find((i) => i.key === "scenariotitle")?.value || "Scenario";

      return title;
    }

    // Normal templates
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

    // Replace $$placeholders$$
    for (const key in payload) {
      finalBody = finalBody.replaceAll(`$$${key}$$`, payload[key]);
    }

    return finalBody;
  }

  // 🔹 Fetch cooldown interval
  async getProxmoxAlertIntervalInMinutes() {
    const [res] = await this._db.sequelize.query(
      `SELECT proxmox_alert_time
       FROM web_settings
       ORDER BY id
       LIMIT 1`
    );
    return res[0]?.proxmox_alert_time ?? 1;
  }

  // 🔹 Cooldown logic
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
    const diffMinutes = (now - lastCreatedOn) / (1000 * 60);

    return diffMinutes >= intervalMinutes;
  }
}

module.exports = NotiTemplate;

