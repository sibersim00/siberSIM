const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class NotiTemplate {
  constructor(db, templateAction, payload, type, type_id) {
    this._db = db;
    this._templateAction = templateAction;

    // Clone payload so the original object is not modified.
    this._payload =
      payload && typeof payload === "object"
        ? { ...payload }
        : {};

    this._type = type;
    this._type_id = type_id;

    this.init().catch((error) => {
      console.error("NotiTemplate INSERT FAILED:", error);
    });
  }

  async init() {
    if (this._templateAction === "proxmox_down") {
      const shouldSend =
        await this.shouldSendProxmoxDownNotification();

      if (!shouldSend) {
        return;
      }
    }

    let finalBody = "";

    if (this._templateAction === "publish_scenario") {
      const scenarioUuid = String(
        this._payload.scenarioid || ""
      ).trim();

      // UUID validation is only required for publish_scenario.
      if (!UUID_REGEX.test(scenarioUuid)) {
        throw new Error(
          `[NotiTemplate] Invalid scenario UUID: "${scenarioUuid}"`
        );
      }

      const [scenario] = await this._db.sequelize.query(
        `SELECT scenariotitle
         FROM scenarios
         WHERE scenariouuid = :scenarioUuid
           AND deletedon IS NULL
         LIMIT 1`,
        {
          replacements: {
            scenarioUuid,
          },
          type: this._db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!scenario) {
        throw new Error(
          `[NotiTemplate] Scenario not found for UUID: "${scenarioUuid}"`
        );
      }

      const scenariotitle =
        String(scenario.scenariotitle || "").trim() ||
        "Scenario";

      /*
       * Important fix:
       *
       * The notification job rebuilds the notification body from
       * noti_templates. When scenariotitle is present in the payload,
       * the job uses it directly instead of running the selector query
       * with the UUID against the numeric scenarios.scenarioid column.
       */
      this._payload.scenarioid = scenarioUuid;
      this._payload.scenariotitle = scenariotitle;

      const [templateData] =
        await this._db.sequelize.query(
          `SELECT body
           FROM noti_templates
           WHERE template_action = :templateAction
             AND status = 'Active'
             AND deletedon IS NULL
           LIMIT 1`,
          {
            replacements: {
              templateAction: this._templateAction,
            },
            type: this._db.sequelize.QueryTypes.SELECT,
          }
        );

      finalBody = String(templateData?.body || "").replaceAll(
        "$$scenariotitle$$",
        scenariotitle
      );
    } else {
      const [templateData] =
        await this._db.sequelize.query(
          `SELECT body
           FROM noti_templates
           WHERE template_action = :templateAction
             AND status = 'Active'
             AND deletedon IS NULL
           LIMIT 1`,
          {
            replacements: {
              templateAction: this._templateAction,
            },
            type: this._db.sequelize.QueryTypes.SELECT,
          }
        );

      finalBody = String(templateData?.body || "");

      // Replace all values already supplied in the payload.
      for (const [key, value] of Object.entries(this._payload)) {
        const placeholder = `$$${key}$$`;

        finalBody = finalBody.replaceAll(
          placeholder,
          value === null || value === undefined
            ? ""
            : String(value)
        );
      }
    }

    const payloadJson = JSON.stringify(this._payload);

    await this._db.sequelize.query(
      `INSERT INTO noti_logs
        (
          template_action,
          body,
          payload,
          type,
          type_id,
          createdon
        )
       VALUES
        (
          :actionName,
          :body,
          :payload,
          :type,
          :typeId,
          NOW()
        )`,
      {
        replacements: {
          actionName: this._templateAction,
          body: finalBody,
          payload: payloadJson,
          type: this._type,
          typeId: this._type_id,
        },
      }
    );
  }

  async getProxmoxAlertIntervalInMinutes() {
    const [res] = await this._db.sequelize.query(
      `SELECT proxmox_alert_time
       FROM web_settings
       ORDER BY id
       LIMIT 1`
    );

    return res[0]?.proxmox_alert_time ?? 1;
  }

  async shouldSendProxmoxDownNotification() {
    const intervalMinutes =
      await this.getProxmoxAlertIntervalInMinutes();

    const [res] = await this._db.sequelize.query(
      `SELECT createdon
       FROM noti_logs
       WHERE template_action = 'proxmox_down'
       ORDER BY createdon DESC
       LIMIT 1`
    );

    if (!res.length) {
      return true;
    }

    const lastCreatedOn = new Date(res[0].createdon);
    const now = new Date();
    const diffInMilliseconds = now - lastCreatedOn;
    const diffInMinutes =
      diffInMilliseconds / (1000 * 60);

    return diffInMinutes >= intervalMinutes;
  }
}

module.exports = NotiTemplate;