
const getSelectors = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('select getEmailSelectors(:_id) as result', {
    replacements: {
        _id: id
    }
  });
    return res;
}

const saveSelector = ({ db }) =>  async (body) => {
  let [res] = await db.sequelize.query('select saveEmailSelector(:_body) as result', {
    replacements: {
        _body: JSON.stringify(body)
    }
  });
    return res;
}

const deleteCategory = ({ db }) =>  async (id=null) => {
  let [res] = await db.sequelize.query('UPDATE mst_categories set deletedon=now() where id=:_id', {
    replacements: {
        _id: id
    }
  });
    return res;
}

module.exports = {
  getSelectors,
  saveSelector,
  deleteCategory
}