
const getEmailWorkflows = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('select getEmailWorkflows(:_id,:_action_id) as result', {
    replacements: {
      _id: id,
      _action_id: null
    }
  });
    return res;
}

const getActionTemplates = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('select getEmailWorkflows(:_id,:_action_id) as result', {
    replacements: {
      _id: null,
      _action_id: id
    }
  });
    return res;
}

const saveWorkflow = ({ db }) =>  async (body) => {
  let [res] = await db.sequelize.query('select saveEmailWorkflow(:_body) as result', {
    replacements: {
        _body: JSON.stringify(body)
    }
  });
    return res;
}
module.exports = {
  getEmailWorkflows,
  saveWorkflow,
  getActionTemplates
}