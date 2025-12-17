const getList = ({ db }) => async () => {
  try {
    const [res] = await db.sequelize.query(`SELECT 
        scenariotabid,
        tab_name,
        tab_status,
        event_status,
        tab_type,
        widget_url,
        tab_ordering,
        createdon,
        modifiedon
      FROM scenario_tabs`);
    return res;
  } catch (error) {
    console.error("Error fetching scenario tab list:", error);
    throw error;
  }
};

const save = ({ db, validation }) => async (body, userid, payloadArray = []) => {
  const errors = [];
  if (!userid) throw new Error("User ID is required");
  const existingTab = body.scenariotabid
    ? await db.sequelize.query(
        `SELECT * FROM scenario_tabs WHERE scenariotabid = :id AND deletedon IS NULL`,
        {
          replacements: { id: body.scenariotabid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      )
    : [];

  const isUpdate = existingTab.length > 0;
  const current = existingTab[0];
  if (isUpdate && current.tab_type === "Fixed" && current.tab_name !== body.tab_name) {
    errors.push(validation.messages.fixed_tab_name_edit);
  }
  const sameOrderInPayload = payloadArray.filter(
    (t) => t.tab_ordering === body.tab_ordering && t.scenariotabid !== body.scenariotabid
  );
  if (sameOrderInPayload.length > 0) {
    errors.push(validation.messages.order_duplicate);
  }
  const payloadIds = payloadArray.map((t) => t.scenariotabid).filter(Boolean);

  const duplicateOrder = await db.sequelize.query(
    `SELECT scenariotabid FROM scenario_tabs 
     WHERE deletedon IS NULL 
     AND tab_ordering = :tab_ordering
     AND scenariotabid NOT IN (:payloadIds)`,
    {
      replacements: {
        tab_ordering: body.tab_ordering || null,
        payloadIds: payloadIds.length ? payloadIds : [0],
      },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (duplicateOrder.length > 0) {
    errors.push(validation.messages.order_duplicate);
  }

  
  if (errors.length > 0) return { status: false, errors };

  try {
    if (isUpdate) {
      await db.sequelize.query(
        `UPDATE scenario_tabs 
         SET tab_name = :tab_name,
             tab_status = :tab_status,
             event_status = :event_status,
             tab_type = :tab_type,
             widget_url = :widget_url,
             tab_ordering = :tab_ordering,
             modifiedon = CURRENT_TIMESTAMP
         WHERE scenariotabid = :id`,
        {
          replacements: {
            id: body.scenariotabid,
            tab_name: body.tab_name,
            tab_status: body.tab_status || "True",
            event_status: body.event_status || "True",
            tab_type: body.tab_type || "Fixed",
            widget_url: body.widget_url || null,
            tab_ordering: body.tab_ordering || null,
          },
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      return {
        statusCode: 200,
        message: "Scenario tab updated successfully",
      };
    } else {
      await db.sequelize.query(
        `INSERT INTO scenario_tabs 
        (tab_name, tab_status,event_status, tab_type, widget_url, tab_ordering, createdon)
        VALUES (:tab_name, :tab_status, :event_status, :tab_type, :widget_url, :tab_ordering, CURRENT_TIMESTAMP)`,
        {
          replacements: {
            tab_name: body.tab_name,
            tab_status: body.tab_status || "True",
            event_status: body.event_status || "True",
            tab_type: body.tab_type || "Fixed",
            widget_url: body.widget_url || null,
            tab_ordering: body.tab_ordering || null,
          },
          type: db.sequelize.QueryTypes.INSERT,
        }
      );

      return {
        statusCode: 200,
        message: "Scenario tab added successfully",
      };
    }
  } catch (err) {
    console.error("Error saving tab:", err);
    throw err;
  }
};

const getWidgetList = ({ db }) => async () => {
  try {
    const [result] = await db.sequelize.query(`   SELECT 
        webbrowserwidgetid,
        widget_name AS label,
        widget_url AS value
      FROM web_browser_widgets
      WHERE deletedon IS NULL
        AND status = 'Active'
      ORDER BY \`order\` ASC`);
      console.log("result=====",result)
   
    return result;
  } catch (error) {
    console.error("Error fetching widgets:", error);
    throw error;
  }
};

module.exports = { save, getList, getWidgetList };

