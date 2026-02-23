const getWidgetsAll = ({ db }) => async (id = null) => {
  try {
    const [res] = await db.sequelize.query(` SELECT  wbw.webbrowserwidgetid, wbw.widget_name, wbw.widget_url, wbw.order, CASE  WHEN wbw.status = 'Active' THEN 'true'  ELSE 'false'  END AS status, CONCAT(au.firstname, ' ', au.lastname) AS createdby, CONCAT(mu.firstname, ' ', mu.lastname) AS modifiedby, DATE_FORMAT(wbw.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(wbw.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon FROM web_browser_widgets wbw LEFT JOIN ad_users au ON wbw.createdby = au.userid LEFT JOIN ad_users mu ON wbw.modifiedby = mu.userid WHERE wbw.deletedon IS NULL ORDER BY wbw.widget_name ASC,  CASE  WHEN wbw.modifiedon IS NOT NULL THEN wbw.modifiedon  ELSE wbw.createdon  END DESC
    `);

    return res;
  } catch (error) {
    console.error("Widget fetch error ==>", error);
    throw error;
  }
};


const saveWidget = ({ db, validation }) => async (body, userid) => {
  try {
    const { widget_name, widget_url, order } = body;
    console.log("dao body",body)


    await db.sequelize.query(
      `
      INSERT INTO web_browser_widgets 
        (widget_name, widget_url, \`order\`, status, createdby, createdon)
      VALUES 
        (?, ?, ?, 'Active', ?, NOW())
      `,
      {
        replacements: [widget_name,widget_url,order, userid],
      }
    );

    return { statusCode: 200 };
  } catch (error) {
    console.error("Widget save error ==>", error.message);
    return {
      statusCode: 400,
      errors: [validation.messages.server_error || "Insert failed"],
    };
  }
};


const updateWidget = ({ db, validation }) => async (webbrowserwidgetid, body, userid) => {
  try {
    const { widget_name, widget_url, order } = body;

    await db.sequelize.query(
      `
      UPDATE web_browser_widgets
      SET widget_name = ?, widget_url = ?, \`order\` = ?, modifiedby = ?, modifiedon = NOW()
      WHERE webbrowserwidgetid = ?
      `,
      {
        replacements: [widget_name, widget_url, order, userid, webbrowserwidgetid],
      }
    );

    return { statusCode: 200 };
  } catch (error) {
    console.error("Widget update error ==>", error.message);
    return {
      statusCode: 400,
      errors: [validation.messages.server_error || "Update failed"],
    };
  }
};


const deleteWidget = ({ db, validation }) => async (webbrowserwidgetid, userid) => {
  try {
    await db.sequelize.query(
      `
      UPDATE web_browser_widgets
      SET status = 'Inactive', modifiedby = ?, deletedon = NOW(), modifiedon = NOW()
      WHERE webbrowserwidgetid = ? AND status != 'Inactive'
      `,
      {
        replacements: [userid, webbrowserwidgetid],
      }
    );

    return { statusCode: 200 };
  } catch (error) {
    console.error("Widget delete error ==>", error.message);
    return {
      statusCode: 400,
      errors: [validation.messages.server_error || "Delete failed"],
    };
  }
};

const statusChange = ({ db, validation }) => async (body) => {
  const status = body.status === 'true' ? 'Active' : 'Inactive';
  const query = `
    UPDATE web_browser_widgets 
    SET status = :status, 
        modifiedby = :modifiedby, 
        modifiedon = NOW() 
    WHERE webbrowserwidgetid = :webbrowserwidgetid
  `;
  await db.sequelize.query(query, {
    replacements: {
      status,
      modifiedby: body.userid,
      webbrowserwidgetid: body.webbrowserwidgetid,
    },
  });
  return { statusCode: 200, message: validation.messages.status_change };
};


module.exports = {
  getWidgetsAll,
  saveWidget,
  updateWidget,
  deleteWidget,
  statusChange
};
