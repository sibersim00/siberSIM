  const { JSONPath } = require("jsonpath-plus");
  // const dao = require("../dao/notification");

  async function replaceAsync(str, regex, asyncFn) {
      const promises = [];
      str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
      });
      const data = await Promise.all(promises);
      return str.replace(regex, () => data.shift());
    }

  class NotiJob {
    constructor(db) {
      this._db = db;
    }
    async getSelectorByName(name) {
      let [res] = await this._db.sequelize.query(
        `SELECT * FROM email_selectors where selector_name =:_name`,
        {
          replacements: {
            _name: name,
          },
        },
      );
      return res[0];
    }
    async getTemplateById(action) {
      let [res] = await this._db.sequelize.query(
        `SELECT * FROM noti_templates WHERE template_action =:_template_action`,
        {
          replacements: {
            _template_action: action,
          },
        },
      );
      return res[0];
    }
    async getUnprocessedNotifications() {
      let [res] = await this._db.sequelize.query(
        `select * from noti_logs  where is_processing = 'N'  and processon is null;`,
      );
      return res;
    }

    async UpdateNotiLog(notiobject, log_id) {
      let link = notiobject.link ? notiobject.link : "";
      let [res] = await this._db.sequelize.query(
        `update noti_logs set body = :_body, link=:_link, is_processing = "Y", processon = now() where log_id =:_log_id AND is_processing = "N"`,
        {
          replacements: {
            _body: notiobject.body,
            _link: link,
            _log_id: log_id,
          },
        },
      );
      return res;
    }

    async markAsProcessedNotifications(id) {
      let [res] = await this._db.sequelize.query(
        `update noti_logs set is_processing='Y', processon = now() where log_id =:_log_id`,
        {
          replacements: {
            _log_id: id,
          },
        },
      );
      return res;
    }

    async parser(str, payload) {
      const payloadRegex = /\#\#([^\#\#]+)\#\#/g;
      const selectorRegex = /\$\$([^\$\$]+)\$\$/g;
      const parsedPayload = str.replace(payloadRegex, (_, path) =>
        JSONPath({ path, json: payload })
          ? JSONPath({ path, json: payload })
          : "",
      );
      return replaceAsync(parsedPayload, selectorRegex, async (_, selector) => {
        const db = this._db;
        // ------------------------------if
        if (payload[selector] !== undefined) {
          return payload[selector];
        }
        // ---------------------------
        const result = await this.getSelectorByName(selector);
        console.log("resultresultresultresult", result);
        // -------------------------if
        if (!result) {
          console.log("Selector not found:", selector);
          return "";
        }
        // -----------------------------
        if (result.selector_query) {
          let queryResult = [];
          if (result.selector_keys == "") {
            queryResult = await this._db.sequelize.query(
              result.selector_query,
              { type: this._db.sequelize.QueryTypes.SELECT },
            );
          } else {
            queryResult = await this._db.sequelize.query(
              result.selector_query,
              {
                replacements: [payload[result.selector_keys]],
                type: this._db.sequelize.QueryTypes.SELECT,
              },
            );
          }
          // return queryResult[0].value;
          return queryResult[0]?.value || "";
        } else {
          return "";
        }
      });
    }

    async triggerNoti(NotiLogObject) {
      try {
        let payload = JSON.parse(NotiLogObject.payload);
        let template_action = NotiLogObject.template_action;
        let log_id = NotiLogObject.log_id;
        const fields = ["link", "body"];
        const db = this._db;
        const notiConfig = await this.getTemplateById(template_action);
        const notiObject = {};
        for (const field of fields) {
          if (
            notiConfig[field] &&
            notiConfig[field] != "" &&
            notiConfig[field] != null
          ) {
            notiObject[field] = await this.parser(notiConfig[field], payload);
          }
        }
        console.log("LOG ====", notiObject);
        await this.UpdateNotiLog(notiObject, log_id);
        return true;
      } catch (e) {
        console.log(e);
        // Make entry in error log table
        return false;
      }
    }
  }

  module.exports = NotiJob;
