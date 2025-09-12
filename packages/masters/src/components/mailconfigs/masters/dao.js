
const getActions = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('SELECT action_id,action,displayname,type,payloads,static_payloads FROM `email_actions` ORDER BY displayname');
    return res;
}

const getSelectors = ({ db }) =>  async (id) => {
  let [action] = await db.sequelize.query('SELECT payloads,static_payloads FROM `email_actions` where action_id=:_id limit 1', {
    replacements: {
        _id: id
    }
  });
  let payloads=[];
  payloads=action[0].payloads.split(',');
  let [res] = await db.sequelize.query('SELECT * FROM `email_selectors` where selector_keys IN(:_keys) OR selector_keys is null', {
    replacements: {
        _keys: payloads
    }
  });
  return res;
}
const getActivities = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('SELECT action_id,type FROM `email_actions` WHERE action_id is not null group by type ORDER BY displayname');
    return res;
}
const getActivityActions = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query(`SELECT actions.action_id,actions.type, actions.displayname, (SELECT CONCAT('[',CONVERT(GROUP_CONCAT(JSON_OBJECT('workflow_id', wf.workflow_id,'template_id', wf.template_id,'mailuser_id', wf.mailuser_id,'status', wf.status, 'sender_name', mu.sender_name, 'template_name', tp.template_name)SEPARATOR ',') USING utf8),']') FROM email_workflows wf LEFT JOIN sc_mailusers mu ON wf.mailuser_id = mu.mailuser_id LEFT JOIN email_templates tp ON wf.template_id = tp.template_id WHERE wf.action_id = actions.action_id) as workflow FROM email_actions actions INNER JOIN email_actions activies ON activies.type = actions.type WHERE activies.action_id = :_id ORDER BY actions.displayname;`,{
    replacements: {
        _id: id
    }
  });
    return res;
}
const getEmailConfigs = ({ db }) =>  async () => {
  let [res] = await db.sequelize.query(`select ss.service ,ss.form_payloads ,ss.service_icon ,ss.is_default ,sc.config_values as form_values from sc_servicetypes ss inner join sc_configurations sc on sc.service_type_id =ss.service_type_id where ss.status='Active' and ss.type ='Mail' and ss.orgid =1`);
    return res;
}
const getEmailSenders = ({ db }) =>  async () => {
  let [res] = await db.sequelize.query(`SELECT mu.mailuser_id,mu.smtp_username,mu.smtp_password,mu.sender_name,mu.sender_emailid,st.service FROM sc_servicetypes st inner join sc_mailusers mu on mu.service_type_id=st.service_type_id where st.type='Mail' and st.orgid =1`);
    return res;
}
module.exports = {
  getActions,
  getSelectors,
  getActivities,
  getActivityActions,
  getEmailConfigs,
  getEmailSenders
}