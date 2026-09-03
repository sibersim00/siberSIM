const getIntegrations = ({ db }) => async (learnerId) =>
  db.sequelize.query(
    `SELECT integration_id, integration_name, integration_url, description, \`order\`,
            status, createdon, modifiedon
       FROM learner_third_party_integrations
      WHERE learner_id = :learnerId AND deletedon IS NULL
      ORDER BY \`order\` ASC, integration_name ASC`,
    {
      replacements: { learnerId },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

const findDuplicate = ({ db }) => async (learnerId, name, excludedId = null) => {
  const rows = await db.sequelize.query(
    `SELECT integration_id
       FROM learner_third_party_integrations
      WHERE learner_id = :learnerId
        AND LOWER(integration_name) = LOWER(:name)
        AND deletedon IS NULL
        AND (:excludedId IS NULL OR integration_id <> :excludedId)
      LIMIT 1`,
    {
      replacements: { learnerId, name, excludedId },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  return rows[0] || null;
};

const affectedRows = (result, metadata) =>
  Number(metadata?.affectedRows ?? result?.affectedRows ?? metadata ?? 0);

const saveIntegration = ({ db }) => async (learnerId, body) => {
  const result = await db.sequelize.query(
    `INSERT INTO learner_third_party_integrations
       (learner_id, integration_name, integration_url, description, \`order\`, status, createdon)
     VALUES
       (:learnerId, :integrationName, :integrationUrl, :description, :orderValue, 'Active', NOW())`,
    {
      replacements: {
        learnerId,
        integrationName: body.integration_name,
        integrationUrl: body.integration_url,
        description: body.description || "",
        orderValue: body.order,
      },
    }
  );
  return result;
};

const updateIntegration = ({ db }) => async (learnerId, body) => {
  const [result, metadata] = await db.sequelize.query(
    `UPDATE learner_third_party_integrations
        SET integration_name = :integrationName,
            integration_url = :integrationUrl,
            description = :description,
            \`order\` = :orderValue,
            modifiedon = NOW()
      WHERE integration_id = :integrationId
        AND learner_id = :learnerId
        AND deletedon IS NULL`,
    {
      replacements: {
        learnerId,
        integrationId: body.integration_id,
        integrationName: body.integration_name,
        integrationUrl: body.integration_url,
        description: body.description || "",
        orderValue: body.order,
      },
    }
  );
  return affectedRows(result, metadata);
};

const deleteIntegration = ({ db }) => async (learnerId, integrationId) => {
  const [result, metadata] = await db.sequelize.query(
    `UPDATE learner_third_party_integrations
        SET status = 'Inactive', deletedon = NOW(), modifiedon = NOW()
      WHERE integration_id = :integrationId
        AND learner_id = :learnerId
        AND deletedon IS NULL`,
    { replacements: { learnerId, integrationId } }
  );
  return affectedRows(result, metadata);
};

const changeStatus = ({ db }) => async (learnerId, integrationId, status) => {
  const [result, metadata] = await db.sequelize.query(
    `UPDATE learner_third_party_integrations
        SET status = :status, modifiedon = NOW()
      WHERE integration_id = :integrationId
        AND learner_id = :learnerId
        AND deletedon IS NULL`,
    { replacements: { learnerId, integrationId, status } }
  );
  return affectedRows(result, metadata);
};

module.exports = {
  getIntegrations,
  findDuplicate,
  saveIntegration,
  updateIntegration,
  deleteIntegration,
  changeStatus,
};
