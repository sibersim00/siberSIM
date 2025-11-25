const { generateDecryptedString } = require('../../middleware/customer_license');

const validateCustomerLicense = ({ db }) => async (body) => {
  const generatedString = generateDecryptedString({str : body.license_key});

  if (!generatedString.expiry_date) {
    return {status : false , message : "Please Enter Valid License Key"}
  } else if (new Date(generatedString.expiry_date) < new Date()) {
    return {status : false , message : "You License Key is Expired. Please Generate New License key"}
  } else {
    
    if(body.id){
      let success = await updateWebSettings({ db })(req.body);
      if(success.status){
        return {status : true , data : {...generatedString, license_key : body.license_key} , message : "Web Setting Updated Successfully", new : false}
      }
    }else{


      return {status : true , data : {...generatedString, license_key : body.license_key}  , message : "",  new : true }
    }
  }
};

const addWebSettings = ({ db }) => async (body) => {
  try {
    await db.sequelize.query(
      `INSERT INTO web_settings (uuid, createdon, name, phone_number, website,proxmox_base_url,qemu_url,lxc_url,max_questions,otp_verification, email, system_name, system_footer, is_default_favicon, is_default_ad_logo, is_default_web_logo, favicon, admin_panel_logo, web_panel_logo, proxmox_alert_time, proxmox_email_sent,termination_delay,configuration_delay,cloning_delay,pause_limit, address, createdby, company_id, domain_url, expiry_date, license_key) VALUES (UUID(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          body.cloning_delay,
          body.pause_limit,
          body.address,
          null,
          1,
          body.domain_url, 
          body.expiry_date, 
          body.license_key
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

const updateWebSettings = ({ db }) => async (body) => {
  try {
    const updateQuery = `
    UPDATE web_settings SET 
      modifiedon = CURRENT_TIMESTAMP, modifiedby = ?, body.license_key = ?
    WHERE id = ?`;

    await db.sequelize.query(updateQuery, {
      replacements: [
        null,
        body.license_key,
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

module.exports = {
  validateCustomerLicense,
  addWebSettings
}