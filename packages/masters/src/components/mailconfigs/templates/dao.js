const nodeMailer = require("nodemailer");

const getTemplates = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('select getEmailTemplates(:_id,:_action_id) as result', {
    replacements: {
      _id: id,
      _action_id: null
    }
  });
    return res;
}

const getActionTemplates = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('select getEmailTemplates(:_id,:_action_id) as result', {
    replacements: {
      _id: null,
      _action_id: id
    }
  });
    return res;
}

const saveTemplate = ({ db }) =>  async (body) => {
  let [res] = await db.sequelize.query('select saveEmailTemplate(:_body) as result', {
    replacements: {
        _body: JSON.stringify(body)
    }
  });
    return res;
}

// Test Email Functionality Start
const getTestEmail = ({ db }) => async ({body}) => {
  try {
    console.log(body)
      const [configuration] = await db.sequelize.query(`SELECT mailuser_id,smtp_username,smtp_password,sender_name,sender_emailid,config_values FROM sc_mailusers mu inner join sc_configurations con on con.service_type_id=mu.service_type_id WHERE mailuser_id =${body.mailuser_id}`,{ type: db.sequelize.QueryTypes.SELECT });

      const [template] = await db.sequelize.query(`SELECT subject,body,to_email_ids,cc_email_ids,bcc_email_ids FROM email_templates WHERE template_id =${body.template_id}`,{ type: db.sequelize.QueryTypes.SELECT });

      if(configuration){ 
          let config = JSON.parse(configuration.config_values); 
          const emailConfig = {
              host: config.smtp_host,
              port: config.smtp_port,
              secure: false,
              auth: {
                  user: configuration.smtp_username,
                  pass: configuration.smtp_password
              }, 
              tls: {
                  rejectUnauthorized: false
              }
          };
          const mailOptions = {
              from:  configuration.sender_name ? `${configuration.sender_name} <${configuration.sender_emailid}>` : configuration.sender_emailid,
              to: `${body.email_id}`,
              subject: template.subject,
              text: `This is a test email to test configuration of Mailing Service.`,
              html: template.body,
            };
          // Send Email
          let res = await sendEmail(emailConfig,mailOptions).then(async res => {
              // console.log("MAIL SENT",res);
              return {'statusCode':200, 'message': 'Test Email has been sended successfully.'};
          }).catch(async e => {
              // console.log("Error in MAIL SEND",e);
              return {'statusCode':400, 'message': e.response};
          });
          return res;
      }else{ return {'statusCode':400, 'message': 'Something went wrong please try again!'}; }

  } catch (error) {
      console.error('Error systemconfig Test Email:', error);
      throw error;
  } 
}

const sendEmail = (emailConfig,mailOptions)=>{
  const transporter = nodeMailer.createTransport(emailConfig);
  return transporter.sendMail(mailOptions);
}
// Test Email Functionality End

module.exports = {
  getTemplates,
  saveTemplate,
  getActionTemplates,
  getTestEmail
}