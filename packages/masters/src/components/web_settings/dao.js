const serialLicense = require("../../middleware/serialLicense");
const checkValidate = require("../../middleware/serialLicense")

const getWebSettings =
  ({ db }) =>
    async () => {
      let [webSettings] = await db.sequelize.query(
        `select id, name, phone_number, website,max_questions,otp_verification, email, system_name, system_footer, favicon, admin_panel_logo, web_panel_logo, proxmox_alert_time, proxmox_email_sent,termination_delay,configuration_delay,cloning_delay,hibernate_delay,pause_limit,max_ports, address,component_approval,scenario_approval,is_default_web_logo, is_default_ad_logo, is_default_favicon from web_settings where company_id = 1`,
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
          `INSERT INTO web_settings (uuid, createdon, name, phone_number, website,max_questions,otp_verification, email, system_name, system_footer, is_default_favicon,component_approval,scenario_approval, is_default_ad_logo, is_default_web_logo, favicon, admin_panel_logo, web_panel_logo, proxmox_alert_time, proxmox_email_sent,termination_delay,configuration_delay,cloning_delay,hibernate_delay,pause_limit,max_ports, address, createdby, company_id) VALUES (UUID(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              body.name,
              body.phone_number,
              body.website,
              body.max_questions,
              body.otp_verification === false ? false : true,
              body.email,
              body.system_name,
              body.system_footer,
              body.is_default_favicon,
              body.component_approval,
              body.scenario_approval,
              body.is_default_ad_logo,
              body.is_default_web_logo,
              body.favicon,
              body.admin_panel_logo,
              body.web_panel_logo,
              body.proxmox_alert_time,
              body.proxmox_email_sent,
              body.termination_delay,
              body.configuration_delay,
              body.cloning_delay,
              body.hibernate_delay,
              body.pause_limit,
              body.max_ports,
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
        name = ?, phone_number = ?, website = ?,max_questions = ?,otp_verification = ?,
        email = ?, system_name = ?, system_footer = ?,
        is_default_favicon = ?, is_default_ad_logo = ?, is_default_web_logo = ?,
        favicon = ?, admin_panel_logo = ?, web_panel_logo = ?, proxmox_alert_time = ?, proxmox_email_sent = ?,termination_delay=?,component_approval=?,scenario_approval=?,configuration_delay=?,cloning_delay=?,hibernate_delay=?,pause_limit=?,max_ports=?, address = ?, 
        modifiedon = CURRENT_TIMESTAMP, modifiedby = ?
      WHERE id = ?`;

        await db.sequelize.query(updateQuery, {
          replacements: [
            body.name ?? "",
            body.phone_number ?? "",
            body.website ?? "",
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
            body.proxmox_alert_time,
            body.proxmox_email_sent ?? "",
            body.termination_delay ?? "",
            body.component_approval ?? "",
            body.scenario_approval ?? "",
            body.configuration_delay ?? "",
            body.cloning_delay ?? "",
            body.hibernate_delay ?? "",
            body.pause_limit ?? "",
            body.max_ports ?? "",
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

// const validateCustomerLicense = ({ db }) => async (hostname,license_key,userid) => {
//   const licenseStatus = serialLicense.validateLicense(hostname,license_key);
//   if (!licenseStatus) {
//     return { status: false, message: "Invalid license key. Please try again or reach out to siberSIM support." };
//   }
//   const [rows] = await db.sequelize.query(`SELECT id FROM web_settings WHERE domain_url = ? LIMIT 1`,{ replacements: [hostname], type: db.sequelize.QueryTypes.SELECT });
//   if (rows?.id) {
//     const updateQuery = `UPDATE web_settings SET domain_url = ?, license_key = ?, modifiedby = ?, modifiedon = NOW() WHERE id = ?`;
//     await db.sequelize.query(updateQuery, {replacements: [hostname,license_key,userid,rows.id],type: db.sequelize.QueryTypes.UPDATE});
//     return {status: true, message: "License updated successfully", new: false,};
//   } else {
//     const insertQuery = `INSERT INTO web_settings (uuid,domain_url,license_key,createdby,createdon)VALUES (UUID(), ?, ?, ?, NOW())`;
//     const [insertResult] = await db.sequelize.query(insertQuery, { replacements: [hostname, license_key, userid],type: db.sequelize.QueryTypes.INSERT});
//     return {status: true, message: "License subscribed successfully", new: true,};
//   }
// };

const validateCustomerLicense = ({ db }) => async (hostname, license_key,userid) => {
const license = serialLicense.checkValidate(hostname, license_key);
  if (!license || !license.isKeyValid || !license.isHost) { return { status: false, message: "Invalid license key. Please try again or reach out to siberSIM support."};}
  let status = "New";
  if (license.isExp) { status = "Expired";
  } else if (license.isStart) { status = "Active";
  }
  await db.sequelize.query(
    `INSERT INTO license_logs (license_key, status, createdby, createdon) VALUES (:license_key, :status, :userid, NOW())`,
    { replacements: { license_key, status, userid},
      type: db.sequelize.QueryTypes.INSERT
    }
  );
  if (!license.isStart) {
    return { status: true, message: "License registered successfully. It will activate on the start date.", new: false};
  }
 if (license.isExp) {
    return { status: false, message: "License has expired. Please renew your license."};
  }
  const [rows] = await db.sequelize.query(
    `SELECT id FROM web_settings WHERE domain_url = :hostname LIMIT 1`,
    {
      replacements: { hostname },
      type: db.sequelize.QueryTypes.SELECT
    }
  );
 if (rows?.id) {
    await db.sequelize.query(
      `UPDATE web_settings SET license_key = :license_key, modifiedby = :userid, modifiedon = NOW() WHERE id = :id`,
      {
        replacements: { license_key, userid, id: rows.id },
        type: db.sequelize.QueryTypes.UPDATE
      }
    );
  return {
      status: true,
      message: "License updated and activated successfully",
      new: false
    };
  }
 await db.sequelize.query(
    `INSERT INTO web_settings (uuid, domain_url, license_key, createdby, createdon) VALUES (UUID(), :hostname, :license_key, :userid, NOW())`,
    { replacements: { hostname, license_key, userid},
      type: db.sequelize.QueryTypes.INSERT
    }
  );
 return {
    status: true,
    message: "License subscribed and activated successfully",
    new: true
  };
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
  validateCustomerLicense
};
