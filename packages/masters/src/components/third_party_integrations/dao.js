const getThirdPartyIntegrations = ({ db }) => async () => {
  try {
    const [result] = await db.sequelize.query(
      `SELECT integration_id, integration_name, integration_url, description, \`order\`, target_panel,
              CASE WHEN status='Active' THEN 'true' ELSE 'false' END AS status,
              DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
              DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
         FROM third_party_integrations
        WHERE deletedon IS NULL
        ORDER BY integration_name ASC, COALESCE(modifiedon, createdon) DESC`,
    );
    return result;
  } catch (error) {
    console.error("Third party integration fetch error ==>", error);
    throw error;
  }
};

const getAvailableThirdPartyIntegrations = ({ db }) => async (targetPanel) => {
  try {
    const [result] = await db.sequelize.query(
      `SELECT integration_id, integration_name, integration_url, description, \`order\`, target_panel, status
         FROM third_party_integrations
        WHERE learner_id IS NULL AND status='Active' AND deletedon IS NULL
          AND FIND_IN_SET(:targetPanel, target_panel) > 0
        ORDER BY \`order\`, integration_name`,
      { replacements: { targetPanel } },
    );
    return result;
  } catch (error) {
    console.error("Available third party integration fetch error ==>", error);
    throw error;
  }
};

const findDuplicate = ({ db }) => async (name, integrationId = null) => {
  const [rows] = await db.sequelize.query(
    `SELECT integration_id FROM third_party_integrations
      WHERE LOWER(integration_name)=LOWER(:name) AND deletedon IS NULL
        AND (:integrationId IS NULL OR integration_id<>:integrationId) LIMIT 1`,
    { replacements: { name, integrationId } },
  );
  return rows[0];
};

const saveThirdPartyIntegration = ({ db, validation }) => async (body, userid) => {
  try {
    if (await findDuplicate({ db })(body.integration_name)) return { statusCode: 400, errors: [validation.messages.duplicate] };
    await db.sequelize.query(
      `INSERT INTO third_party_integrations
        (learner_id,integration_name,integration_url,description,\`order\`,target_panel,status,createdon)
       VALUES (NULL,?,?,?,?,?,'Active',NOW())`,
      { replacements: [body.integration_name, body.integration_url, body.description, body.order, body.target_panels.join(",")] },
    );
    return { statusCode: 200 };
  } catch (error) {
    console.error("Third party integration save error ==>", error.message);
    return { statusCode: 400, errors: [validation.messages.server_error] };
  }
};

const updateThirdPartyIntegration = ({ db, validation }) => async (body, userid) => {
  try {
    if (await findDuplicate({ db })(body.integration_name, body.integration_id)) return { statusCode: 400, errors: [validation.messages.duplicate] };
    await db.sequelize.query(
      `UPDATE third_party_integrations SET learner_id=NULL,integration_name=?,integration_url=?,
        description=?,\`order\`=?,target_panel=?,modifiedon=NOW()
       WHERE integration_id=? AND deletedon IS NULL`,
      { replacements: [body.integration_name, body.integration_url, body.description, body.order, body.target_panels.join(","), body.integration_id] },
    );
    return { statusCode: 200 };
  } catch (error) {
    console.error("Third party integration update error ==>", error.message);
    return { statusCode: 400, errors: [validation.messages.server_error] };
  }
};

const deleteThirdPartyIntegration = ({ db, validation }) => async (integrationId, userid) => {
  try {
    await db.sequelize.query(
      `UPDATE third_party_integrations SET status='Inactive',deletedon=NOW(),modifiedon=NOW()
       WHERE integration_id=? AND deletedon IS NULL`,
      { replacements: [integrationId] },
    );
    return { statusCode: 200 };
  } catch (error) {
    console.error("Third party integration delete error ==>", error.message);
    return { statusCode: 400, errors: [validation.messages.server_error] };
  }
};

const changeThirdPartyIntegrationStatus = ({ db, validation }) => async (body) => {
  const status = body.status === "true" ? "Active" : "Inactive";
  await db.sequelize.query(
    `UPDATE third_party_integrations SET status=:status,modifiedon=NOW() WHERE integration_id=:integrationId`,
    { replacements: { status, integrationId: body.integration_id } },
  );
  return { statusCode: 200, message: validation.messages.status_change };
};

module.exports = { getThirdPartyIntegrations, getAvailableThirdPartyIntegrations, saveThirdPartyIntegration, updateThirdPartyIntegration, deleteThirdPartyIntegration, changeThirdPartyIntegrationStatus };
