const { JSONPath } = require("jsonpath-plus");
const nodeMailer = require("nodemailer");

const sendEmail = ({
  sender_email_id: from,
  to_email_ids: to,
  cc_email_ids: cc,
  bcc_email_ids: bcc,
  subject,
  body: html,
  attachments
},emailConfig) => {
  let text = html.replace(/<style([\s\S]*?)<\/style>/gi, "");
  text = text.replace(/<script([\s\S]*?)<\/script>/gi, "");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<li>/gi, "  *  ");
  text = text.replace(/<\/ul>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<[^>]+>/gi, "");
  const email = {
    from,
    to,
    cc,
    bcc,
    replyTo: from,
    subject,
    text,
    html,
    attachments,
    socketTimeout: 10000
  };
  const transporter = nodeMailer.createTransport(emailConfig);
  return transporter.sendMail(email);
};

async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

function ul_li_html(response) {
  const resp = Object.entries(response);
  const liContent = resp.map(([key, value]) =>`<li><strong>${key}</strong>: ${value}</li>`).join("");
  return `<ul>${liContent}</ul>`;
}

class MailJob {
  constructor(db) {
    this._db = db;
  }
  async getUnprocessedEmails() {
    let [res] = await this._db.sequelize.query(`select eq.*,ea.action_id,et.template_id,ew.mailuser_id from email_queues eq inner join email_actions ea on ea.action =eq.action_name inner join email_workflows ew on ew.action_id =ea.action_id inner join email_templates et on et.template_id =ew.template_id where ew.status='Active' AND date(send_date) = CURRENT_DATE and is_processing = 'No' and processon is null and erroron is null limit 30;`);
    return res;
  }
  async getSelectorByName(name) {
    let [res] = await this._db.sequelize.query(`SELECT * FROM email_selectors where selector_name =:_name`,{
      replacements: {
          _name: name
      }
    });
      return res[0];
  }
  async getTemplateById(id) {
    let [res] = await this._db.sequelize.query(`SELECT * FROM email_templates WHERE template_id =:_id`,{
      replacements: {
          _id: id
      }
    });
      return res[0];
  }
  async getSenderById(id) {
    let [res] = await this._db.sequelize.query(`SELECT mailuser_id,smtp_username,smtp_password,sender_name,sender_emailid,config_values FROM sc_mailusers mu inner join sc_configurations con on con.service_type_id=mu.service_type_id WHERE mailuser_id =:_id`,{
      replacements: {
          _id: id
      }
    });
      return res[0];
  }
  async createEmailLog(emailObject) {
    let [res] = await this._db.sequelize.query(`INSERT INTO email_logs (action_id, sender_email_id, to_email_ids, cc_email_ids, subject, body) VALUES (:_action_id,:_sender_email_id,:_to_email_ids,:_cc_email_ids,:_subject,:_body)`,{
      replacements: {
        _action_id:emailObject.action_id,
        _sender_email_id:emailObject.sender_email_id,
        _to_email_ids:emailObject.to_email_ids,
        _cc_email_ids:emailObject.cc_email_ids,
        //_bcc_email_ids:emailObject.bcc_email_ids,
        _subject:emailObject.subject,
        _body:emailObject.body
        //_attachments:JSON.stringify(emailObject.attachments)
      },
      RETURNING:['id']
    });
    return res;
  }
  async updateErrorEmailLog(queue_id,id, obj) {
    await db.sequelize.query(`update email_queues set is_processing='Yes', erroron = now() where queue_id =:_queue_id`,{
      replacements: {
          _queue_id: queue_id
      }
    });
    await this._db.sequelize.query(`update email_logs set error = :_error where log_id = :_log_id`,{
      replacements: {
        _error:JSON.stringify(obj),
        _log_id:id
      }
    });
    return true;
  }
  async updateResponseEmailLog(queue_id,id, obj) {
    await this._db.sequelize.query(`update email_queues set is_processing='Yes', processon = now() where queue_id =:_queue_id`,{
      replacements: {
          _queue_id: queue_id
      }
    });
    await this._db.sequelize.query(`update email_logs set senton=now(),response = :_error where log_id = :_log_id`,{
      replacements: {
        _error:JSON.stringify(obj),
        _log_id:id
      }
    });
    return true;
  }
  async parser(str, payload) {
    const payloadRegex = /\#\#([^\#\#]+)\#\#/g;
    const selectorRegex = /\$\$([^\$\$]+)\$\$/g;
    const parsedPayload = str.replace(payloadRegex, (_, path) =>
      JSONPath({ path, json: payload }) ? JSONPath({ path, json: payload }) : ""
    );
    return replaceAsync(parsedPayload, selectorRegex, async (_, selector) => {
      const db=this._db;
      const result = await this.getSelectorByName(selector);
      if (result?.selector_query) {
        const queryResult = await db.sequelize.query(result.selector_query,  {  replacements: [payload[result.selector_keys]], type: db.sequelize.QueryTypes.SELECT });
        if (result.return_single_value == 'Yes') {
          return queryResult[0].value;
        } else {
          return ul_li_html(queryResult[0]);
        }
      } else {
        return "";
      }
    });
  }
  async triggerEmail(mailRow) {
    try {
      const payload =JSON.parse(mailRow.payload)
      const fields = ["sender_email_id","to_email_ids","cc_email_ids","subject","body"];
      const db=this._db;
      const emailConfig = await this.getTemplateById(mailRow.template_id);
      const emailSender = await this.getSenderById(mailRow.mailuser_id);
      const configValues=JSON.parse(emailSender.config_values);
      let  devMailConfig = {
          host: configValues.smtp_host,
          port: configValues.smtp_port,
          auth: {
            user: emailSender.smtp_username,
            pass: emailSender.smtp_password
          },
          secure: false,
          tls: {
            rejectUnauthorized: false
          }
      };
      if(emailSender['sender_emailid']!='' && emailSender['sender_emailid']!=null){
        const emailObject = { action_id: emailConfig.action_id };
        for (const field of fields) {
          if (emailConfig[field] && emailConfig[field]!='' && emailConfig[field] !=null) {
            emailObject[field] = await this.parser(emailConfig[field], payload);
          }else{
            emailObject[field]=null;
          }
        }
        emailObject["attachments"] = []
        emailObject["sender_email_id"] = emailSender['sender_emailid'];
        const emailLogInsertId = await this.createEmailLog(emailObject);
        if (process.env.EMAIL_ENABLED !== "true") {
          console.log("Email Disabled. Logged Email and Skipping to send email");
          emailObject["body"] = emailObject["body"]+"<br/> SENDER EMAIL ID: "+emailObject["sender_email_id"]+"<br/> TO EMAIL ID: "+emailObject["to_email_ids"]+"<br/> CC EMAIL ID: "+emailObject["cc_email_ids"];
          emailObject["sender_email_id"] = emailSender['sender_emailid'];
          emailObject["to_email_ids"] = "rutwik.s@technobase.in";
          emailObject["cc_email_ids"] = "suraj_surkar@technobase.in";
        }
        sendEmail(emailObject,devMailConfig).then(res => { 
            this.updateResponseEmailLog(mailRow.queue_id, emailLogInsertId, res);
            console.log("MAIL SENT",res); 
            return true;
          }).catch(async e => { 
            this.updateErrorEmailLog(mailRow.queue_id, emailLogInsertId, e);
            console.log("ERROR IN SENDING EMAIL",e); 
            return false; 
          });
      } else {
        console.log("ERROR IN SENDING EMAIL. ISSUE IN SENDER & TO EMAIL IDS.");
        //console.log('sender_email_id',emailSender['sender_email_id'],'to_email_ids',emailSender['to_email_ids']);
        return false;
      }
    } catch (e) {
      console.log(e);
      // Make entry in error log table
      return false;
    }
  }
}

module.exports = MailJob;