const bcrypt = require("bcryptjs");

const list = ({ db }) => async (orgid) => {
  const [rows] = await db.sequelize.query(
    `SELECT userid AS webhook_user_id, useruuid AS webhook_user_uuid, loginid, firstname, lastname,
            email, mobile, organization, status,
            CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END AS status_boolean,
            DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
            DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
     FROM ad_users WHERE usertype = 'WebhookUser' AND deletedon IS NULL AND orgid = :orgid
     ORDER BY firstname ASC`,
    { replacements: { orgid } }
  );
  return rows;
};

const duplicateErrors = async (db, body, excludeId) => {
  const [rows] = await db.sequelize.query(
    `SELECT loginid, email FROM ad_users
     WHERE deletedon IS NULL AND (:excludeId IS NULL OR userid <> :excludeId)
       AND (BINARY loginid = :loginid OR email = :email)`,
    { replacements: { excludeId: excludeId || null, loginid: body.loginid, email: body.email } }
  );
  const errors = [];
  if (rows.some((row) => row.loginid === body.loginid)) errors.push("Username is already registered.");
  if (rows.some((row) => row.email.toLowerCase() === body.email.toLowerCase())) errors.push("Email is already registered.");
  return errors;
};

const save = ({ db }) => async (body, actor) => {
  const errors = await duplicateErrors(db, body);
  if (errors.length) return { statusCode: 400, message: "", errors };
  const password = await bcrypt.hash(body.password, 12);
  await db.sequelize.query(
    `INSERT INTO ad_users (useruuid, orgid, loginid, firstname, lastname, email, mobile, password,
       usertype, organization, status, isverified, createdby, createdon)
     VALUES (UUID(), :orgid, :loginid, :firstname, :lastname, :email, :mobile, :password,
       'WebhookUser', :organization, :status, 'Yes', :createdby, NOW())`,
    { replacements: { ...body, lastname: body.lastname || null, mobile: body.mobile || null, organization: body.organization || null, password, orgid: actor.orgid || 1, createdby: actor.userid } }
  );
  return { statusCode: 200, message: "Webhook user has been created successfully." };
};

const update = ({ db }) => async (body, actor) => {
  const [owned] = await db.sequelize.query(
    `SELECT userid FROM ad_users WHERE userid=:id AND usertype='WebhookUser' AND orgid=:orgid AND deletedon IS NULL LIMIT 1`,
    { replacements: { id: body.webhook_user_id, orgid: actor.orgid || 1 }, type: db.sequelize.QueryTypes.SELECT }
  );
  if (!owned) return { statusCode: 404, message: "Webhook user not found." };
  const errors = await duplicateErrors(db, body, body.webhook_user_id);
  if (errors.length) return { statusCode: 400, message: "", errors };
  await db.sequelize.query(
    `UPDATE ad_users SET loginid=:loginid, firstname=:firstname, lastname=:lastname, email=:email,
       mobile=:mobile, organization=:organization, status=:status, modifiedby=:modifiedby, modifiedon=NOW()
     WHERE userid=:webhook_user_id AND usertype='WebhookUser' AND orgid=:orgid AND deletedon IS NULL`,
    { replacements: { ...body, lastname: body.lastname || null, mobile: body.mobile || null, organization: body.organization || null, modifiedby: actor.userid, orgid: actor.orgid || 1 } }
  );
  if (body.status === "Inactive") await revokeTokens(db, body.webhook_user_id);
  return { statusCode: 200, message: "Webhook user has been updated successfully." };
};

const revokeTokens = (db, id) => db.sequelize.query(
  `UPDATE webhook_access_tokens SET revokedon=NOW() WHERE webhook_user_id=:id AND revokedon IS NULL`,
  { replacements: { id } }
);

const changeStatus = ({ db }) => async (body, actor) => {
  const [owned] = await db.sequelize.query(
    `SELECT userid FROM ad_users WHERE userid=:id AND usertype='WebhookUser' AND orgid=:orgid AND deletedon IS NULL LIMIT 1`,
    { replacements: { id: body.webhook_user_id, orgid: actor.orgid || 1 }, type: db.sequelize.QueryTypes.SELECT }
  );
  if (!owned) return { statusCode: 404, message: "Webhook user not found." };
  await db.sequelize.query(
    `UPDATE ad_users SET status=:status, modifiedby=:actor, modifiedon=NOW()
     WHERE userid=:id AND usertype='WebhookUser' AND orgid=:orgid AND deletedon IS NULL`,
    { replacements: { status: body.status, actor: actor.userid, id: body.webhook_user_id, orgid: actor.orgid || 1 } }
  );
  if (body.status === "Inactive") await revokeTokens(db, body.webhook_user_id);
  return { statusCode: 200, message: "Webhook user status has been updated successfully." };
};

const remove = ({ db }) => async (id, actor) => {
  const [owned] = await db.sequelize.query(
    `SELECT userid FROM ad_users WHERE userid=:id AND usertype='WebhookUser' AND orgid=:orgid AND deletedon IS NULL LIMIT 1`,
    { replacements: { id, orgid: actor.orgid || 1 }, type: db.sequelize.QueryTypes.SELECT }
  );
  if (!owned) return { statusCode: 404, message: "Webhook user not found." };
  await db.sequelize.query(
    `UPDATE ad_users SET status='Inactive', deletedon=NOW(), modifiedby=:actor, modifiedon=NOW()
     WHERE userid=:id AND usertype='WebhookUser' AND orgid=:orgid AND deletedon IS NULL`,
    { replacements: { actor: actor.userid, id, orgid: actor.orgid || 1 } }
  );
  await revokeTokens(db, id);
  return { statusCode: 200, message: "Webhook user has been deleted successfully." };
};

module.exports = { list, save, update, changeStatus, remove };
