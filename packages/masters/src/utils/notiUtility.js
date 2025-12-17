
class NotiTemplate {
  constructor(db, templateAction, payload, type, type_id) {
    this._db = db;
    this._templateAction = templateAction;
    this._payload = payload;
    this._type = type;
    this._type_id = type_id;

    this.init(); // Kick off the flow
  }

  async init() {
    // Handle proxmox_down cooldown logic
    if (this._templateAction === "proxmox_down") {
      const shouldSend = await this.shouldSendProxmoxDownNotification();
      if (!shouldSend) return; // Skip insertion
    }

    let finalBody = "";

    if (this._templateAction === "publish_scenario") {
      // Special logic for publish_scenario
      const [scenario] = await this._db.sequelize.query(
        `SELECT component_config
         FROM scenarios
         WHERE scenarioid = :scenarioid LIMIT 1`,
        {
          replacements: { scenarioid: this._payload.scenarioid },
          type: this._db.sequelize.QueryTypes.SELECT,
        }
      );

      const config = JSON.parse(scenario?.component_config || "[]");
      const title =
        config.find((item) => item.key === "scenariotitle")?.value || "Scenario";
      finalBody = title;

    } else if (this._templateAction === "scenario_status_notification") {
      // Special logic for scenario status (approved/rejected)
      const [templateData] = await this._db.sequelize.query(
        `SELECT body FROM noti_templates
         WHERE template_action = :template_action AND status = 'Active' LIMIT 1`,
        {
          replacements: { template_action: this._templateAction },
          type: this._db.sequelize.QueryTypes.SELECT,
        }
      );

      let rawTemplate = templateData?.body || "";
      finalBody = rawTemplate;

      // Replace placeholders (learner_name, scenariotitle, status)
      for (const key in this._payload) {
        const placeholder = `$$${key}$$`;
        finalBody = finalBody.replaceAll(placeholder, this._payload[key]);
      }

    } else {
      // Handles proxmox_terminate and all normal templates
      const [templateData] = await this._db.sequelize.query(
        `SELECT body FROM noti_templates
         WHERE template_action = :template_action AND status = 'Active' LIMIT 1`,
        {
          replacements: { template_action: this._templateAction },
          type: this._db.sequelize.QueryTypes.SELECT,
        }
      );

      let rawTemplate = templateData?.body || "";
      finalBody = rawTemplate;

      // Replace placeholders
      for (const key in this._payload) {
        const placeholder = `$$${key}$$`;
        finalBody = finalBody.replaceAll(placeholder, this._payload[key]);
      }
    }

    const payloadJson = JSON.stringify(this._payload);

    await this._db.sequelize.query(
      `INSERT INTO noti_logs
        (template_action, body, payload, type, type_id, createdon)
       VALUES
        (:actionName, :body, :payload, :type, :type_id, NOW())`,
      {
        replacements: {
          actionName: this._templateAction,
          body: finalBody,
          payload: payloadJson,
          type: this._type,
          type_id: this._type_id,
        },
      }
    );
  }

  async getProxmoxAlertIntervalInMinutes() {
    const [res] = await this._db.sequelize.query(
      `SELECT proxmox_alert_time FROM web_settings ORDER BY id LIMIT 1`
    );
    return res[0]?.proxmox_alert_time ?? 1;
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
