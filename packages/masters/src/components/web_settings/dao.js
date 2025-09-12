const getWebSettings =
  ({ db }) =>
  async () => {
    let [webSettings] = await db.sequelize.query(
      `select id, name, phone_number, website,proxmox_base_url,qemu_url,lxc_url,max_questions,otp_verification, email, system_name, system_footer, favicon, admin_panel_logo, web_panel_logo, proxmox_alert_time, proxmox_email_sent,termination_delay,configuration_delay, address,  is_default_web_logo, is_default_ad_logo, is_default_favicon from web_settings where company_id = 1`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    return webSettings;
  };

const getWebFooter =
  ({ db }) =>
  async () => {
    let [webFooter] = await db.sequelize.query(
      `select id, title, status, value from web_footer where company_id = 1`
    );
    return webFooter;
  };

const addWebSettings =
  ({ db }) =>
  async (body, userid) => {
    try {
      await db.sequelize.query(
        `INSERT INTO web_settings (uuid, createdon, name, phone_number, website,proxmox_base_url,qemu_url,lxc_url,max_questions,otp_verification, email, system_name, system_footer, is_default_favicon, is_default_ad_logo, is_default_web_logo, favicon, admin_panel_logo, web_panel_logo, proxmox_alert_time, proxmox_email_sent,termination_delay,configuration_delay, address, createdby, company_id) VALUES (UUID(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            body.name,
            body.phone_number,
            body.website,
            body.proxmox_base_url,
            body.qemu_url,
            body.lxc_url,
            body.max_questions,
            body.otp_verification === false ? false : true, 
            body.email,
            body.system_name,
            body.system_footer,
            body.is_default_favicon,
            body.is_default_ad_logo,
            body.is_default_web_logo,
            body.favicon,
            body.admin_panel_logo,
            body.web_panel_logo,
            body.proxmox_alert_time,
            body.proxmox_email_sent,
            body.termination_delay,
            body.configuration_delay,
            body.address,
            userid,
            1,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        }
      );
      return { statusCode: 200, message: "Web Setting Added Successfully" };
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

const updateWebSettings =
  ({ db }) =>
  async (body, userid) => {
    try {
      const updateQuery = `
      UPDATE web_settings SET 
        name = ?, phone_number = ?, website = ?,
        proxmox_base_url = ?, qemu_url = ?, lxc_url = ?,max_questions = ?,otp_verification = ?,
        email = ?, system_name = ?, system_footer = ?,
        is_default_favicon = ?, is_default_ad_logo = ?, is_default_web_logo = ?,
        favicon = ?, admin_panel_logo = ?, web_panel_logo = ?, proxmox_alert_time = ?, proxmox_email_sent = ?,termination_delay=?,configuration_delay=?, address = ?, 
        modifiedon = CURRENT_TIMESTAMP, modifiedby = ?
      WHERE id = ?`;

      await db.sequelize.query(updateQuery, {
        replacements: [
          body.name ?? "",
          body.phone_number ?? "",
          body.website ?? "",
          body.proxmox_base_url,
          body.qemu_url,
          body.lxc_url,
          body.max_questions,
          body.otp_verification,
          body.email ?? "",
          body.system_name ?? "",
          body.system_footer ?? "",
          body.is_default_favicon ?? true,
          body.is_default_ad_logo ?? true,
          body.is_default_web_logo ?? true,
          body.favicon ?? "",
          body.admin_panel_logo ?? "",
          body.web_panel_logo ?? "",
          body.proxmox_alert_time ,
          body.proxmox_email_sent ?? "",
          body.termination_delay ?? "",
          body.configuration_delay ?? "",
          body.address ?? "",
          userid,
          body.id,
        ],
        type: db.sequelize.QueryTypes.UPDATE,
      });

      return { statusCode: 200, message: "Web Setting Updated Successfully" };
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

const addWebFooter =
  ({ db }) =>
  async (body, userid) => {
    try {
      let status = body.status;
      let [checkValid] = await db.sequelize.query(
        `SELECT id from web_footer where status = 'Active'`
      );
      if (checkValid.length >= 4) {
        status = "Inactive";
      }
      let addQuery = `INSERT INTO web_footer (uuid, createdon, title, value, status, createdby, company_id) VALUES (UUID(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)`;
      await db.sequelize.query(addQuery, {
        replacements: [body.title, body.value, status, userid, 1],
        type: db.sequelize.QueryTypes.INSERT,
      });
      return { statusCode: 200, message: "Web Setting Added Successfully" };
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

const updateWebFooter =
  ({ db }) =>
  async (body, userid) => {
    try {
      let status = body.status;
      let [checkValid] = await db.sequelize.query(
        `SELECT id from web_footer where status = 'Active'`
      );
      if (checkValid.length >= 4) {
        status = "Inactive";
      }
      let updateQuery = `UPDATE web_footer SET title = ?, value = ?, status = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ? where id = ?`;
      await db.sequelize.query(updateQuery, {
        replacements: [body.title, body.value, status, userid, body.id],
        type: db.sequelize.QueryTypes.UPDATE, // Use UPDATE instead of INSERT for an UPDATE query
      });
      return {
        flag: true,
        statusCode: 200,
        message: "Web Footer Updated Successfully",
      };
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

const changeStatusWebFooter =
  ({ db }) =>
  async (body, userid) => {
    try {
      let [checkValid] = await db.sequelize.query(
        `SELECT id from web_footer where status = 'Active'`
      );
      if (checkValid.length >= 4 && body.status == "Active") {
        return {
          flag: false,
          statusCode: 400,
          message: "You need Inactive one Record",
        };
      }
      let updateQuery = `UPDATE web_footer SET status = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ? where id = ?`;
      await db.sequelize.query(updateQuery, {
        replacements: [body.status, userid, body.id],
        type: db.sequelize.QueryTypes.UPDATE, // Use UPDATE instead of INSERT for an UPDATE query
      });
      return {
        flag: true,
        statusCode: 200,
        message: "Web Footer Updated Successfully",
      };
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

const uploadLogo =
  ({ db }) =>
  async (body, userid) => {
    try {
      if (body?.id == 0) {
        await db.sequelize.query(
          `INSERT INTO web_settings (uuid, createdon, favicon, admin_panel_logo, web_panel_logo, createdby, company_id, is_default_favicon, is_default_ad_logo, is_default_web_logo) VALUES (UUID(), CURRENT_TIMESTAMP, ?, ?, ?, ?,?, ?, ?,?)`,
          {
            replacements: [
              body.favicon,
              body.admin_panel_logo,
              body.web_panel_logo,
              userid,
              1,
              body.is_default_favicon,
              body.is_default_ad_logo,
              body.is_default_web_logo,
            ],
            type: db.sequelize.QueryTypes.INSERT,
          }
        );
        return {
          flag: true,
          statusCode: 200,
          message: `Logo ${body.flag} Successfully`,
        };
      } else {
        let updateQuery = `UPDATE web_settings SET favicon = ?, admin_panel_logo = ?, web_panel_logo = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ?, is_default_favicon = ?, is_default_ad_logo = ?, is_default_web_logo = ?  WHERE id = ?`;
        await db.sequelize.query(updateQuery, {
          replacements: [
            body.favicon,
            body.admin_panel_logo,
            body.web_panel_logo,
            userid,
            body.id,
            body.is_default_favicon,
            body.is_default_ad_logo,
            body.is_default_web_logo,
          ],
          type: db.sequelize.QueryTypes.UPDATE,
        });
        return {
          flag: true,
          statusCode: 200,
          message: `Logo ${body.flag} Successfully`,
        };
      }
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

module.exports = {
  getWebSettings,
  getWebFooter,
  addWebSettings,
  updateWebSettings,
  addWebFooter,
  updateWebFooter,
  changeStatusWebFooter,
  uploadLogo,
};
