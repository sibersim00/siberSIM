
const getList = ({ db }) =>  async () => {
  let [res] = await db.sequelize.query(`select template_id,template_name,template_action,body,link,payloads,static_payloads,status FROM noti_templates where deletedon is null`);
    return res;
}
const getListById = ({ db }) =>  async (id) => {
  let [res] = await db.sequelize.query('select template_id,template_name,template_action,body,link,payloads,static_payloads,status from noti_templates where template_id=:_id', {
    replacements: {
      _id: id
    },
    type: db.sequelize.QueryTypes.SELECT
  });

    return res;
}

const savetemplate = ({ db }) => async (body) => {
  try {
    const updateQuery = 'UPDATE noti_templates SET template_name = ?, body = ?, link = ?, status = ?, modifiedby = ?, modifiedon = NOW() WHERE template_id = ?';
    const updateParams = [body.template_name, body.body, body.link, body.status, body.userid, body.id];

    await db.sequelize.query(updateQuery, {
      replacements: updateParams,
      type: db.sequelize.QueryTypes.UPDATE,
    });

    return { statusCode: 200, message: 'Notification Template Updated Successfully' };
      
    
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, message: 'Internal Server Error' };
  }
};

const getSelectors = ({ db }) =>  async (id) => {
  let [action] = await db.sequelize.query('SELECT payloads,static_payloads FROM `noti_templates` where template_id=:_id limit 1', {
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

const getNotificationAll = ({ db }) => async (flag, userid) => {
  let [res] = await db.sequelize.query(`
    SELECT 
      log_id,
      template_action,
      type_id,
      body,
      link,
      is_read,
      DATE_FORMAT(createdon, '%d-%b-%Y') AS createdon,
      CONCAT(DATE_FORMAT(createdon, '%d-%b-%Y'), ' ', DATE_FORMAT(createdon, '%h:%i %p')) AS date
    FROM noti_logs 
    WHERE 
      (
        (type = :_type AND type_id IN (:user_id, 0))
        OR (type = 'System' AND type_id = 0)
      )
      AND is_processing = "Y"
    ORDER BY log_id DESC
  `, {
    replacements: {
      _type: flag,
      user_id: userid
    }
  });
  return res;
};

const getNotification = ({ db }) => async (flag, userid) => {
  let [res] = await db.sequelize.query(`
    SELECT 
      log_id,
      template_action,
      type_id,
      body,
      link,
      is_read,
      DATE_FORMAT(createdon, '%d-%b-%Y') AS createdon,
      CONCAT(DATE_FORMAT(createdon, '%b %d'), ' ', DATE_FORMAT(createdon, '%h:%i %p')) AS date
    FROM noti_logs 
    WHERE 
      (
        (type = :_type AND type_id IN (:user_id, 0))
        OR (type = 'System' AND type_id = 0)
      )
      AND is_processing = "Y"
      AND createdon >= NOW() - INTERVAL 48 HOUR
    ORDER BY log_id DESC
  `, {
    replacements: {
      _type: flag,
      user_id: userid
    }
  });
  return res;
};

  



const UpdateReadNotification = ({ db }) => async (body) => {
  try {
    if (body.flag === 'All') {
      // Update all notifications where type matches and type_id matches
      const updateQuery = 'UPDATE noti_logs SET is_read = 1 WHERE type = ? AND type_id = ?';
      const updateParams = [body.type, body.userid];
      await db.sequelize.query(updateQuery, {
        replacements: updateParams,
        type: db.sequelize.QueryTypes.UPDATE,
      });
      return { statusCode: 200, message: 'All Notification Logs Read Successfully' };
    } else {
      // Update specific notification logs based on log ids provided, with type and type_id conditions
      const logIds = body.flag.split(',').map(id => parseInt(id))
      const updateQuery = 'UPDATE noti_logs SET is_read = 1 WHERE log_id IN (?) AND type = ? AND type_id = ?';
      const updateParams = [logIds, body.type, body.userid];
      await db.sequelize.query(updateQuery, {
        replacements: updateParams,
        type: db.sequelize.QueryTypes.UPDATE,
      });
      return { statusCode: 200, message: 'Selected Notification Logs Read Successfully' };
    }
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, message: 'Internal Server Error' };
  }
};


module.exports = {
  getList,
  getListById,
  savetemplate,
  getSelectors,
  getNotification,
  getNotificationAll,
  UpdateReadNotification,
}