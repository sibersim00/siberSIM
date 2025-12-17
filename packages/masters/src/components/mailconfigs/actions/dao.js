
const getActions = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('select getEmailActions(:_id) as result', {
    replacements: {
        _id: id
    }
  });
    return res;
}

const saveAction = ({ db }) =>  async (body) => {
  let [res] = await db.sequelize.query('select saveEmailActions(:_body) as result', {
    replacements: {
        _body: JSON.stringify(body)
    }
  });
    return res;
}

const deleteQualification = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('UPDATE mst_qualifications set deletedon=now() where id=:_id', {
    replacements: {
        _id: id
    }
  });
    return res;
}

module.exports = {
  getActions,
  saveAction,
  deleteQualification
}