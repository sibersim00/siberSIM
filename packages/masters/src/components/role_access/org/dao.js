
const list = ({ db }) => async (id=null) => {
	try {
			const [res] = await db.sequelize.query( `SELECT orgid,orgcode,orgname, CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END AS status FROM ad_organizations  WHERE deletedon IS NULL`,
					{
							replacements: { id }
					}
			);
				return res;
	} catch (error) {
			console.error('Error fetching organization:', error);
			throw error;
	}
}

const create = ({ db, validation }) => async (body) => {
  const { orgcode, orgname, status } = body;
  const currentStatus = status === 'true' ? 'Active' : 'Inactive';

  // Check if the organization already exists
  const checkOrgQuery = `
    SELECT 1 FROM ad_organizations 
    WHERE orgname = ?;
  `;
  try {
    let [orgExists] = await db.sequelize.query(checkOrgQuery, {
      replacements: [orgname],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (orgExists) {
      return { status: false, errors: [validation.messages.duplicate_orgname] };
    }

    // Proceed with insertion if the organization doesn't exist
    const insertQuery = `
      INSERT INTO ad_organizations ( orgcode, orgname, status, createdby, createdon) VALUES (
       ?, ?, ?, ?, CURRENT_TIMESTAMP );`;
    let result = await db.sequelize.query(insertQuery, {replacements: [orgcode, orgname, currentStatus, body.userid]});
    if (result) {
      return { status: true, message: validation.messages.add_success };
    } else {
      return { status: false, errors: [validation.messages.something_wrong_try_later] };
    }
  } catch (error) {
    console.error("Create Organization error:", error);
    return { status: false, errors: [validation.messages.something_wrong_try_later] };
  }
};

const update = ({ db, validation }) => async (body) => {
  const { orgcode, orgname, status, orgid } = body;
  const currentStatus = status === 'true' ? 'Active' : 'Inactive';

  // Check if the organization exists
  const checkOrgQuery = `
    SELECT 1 FROM ad_organizations 
    WHERE orgname = ? AND orgid != ?;
  `;
  
  try {
    let [orgExists] = await db.sequelize.query(checkOrgQuery, {
      replacements: [orgname, orgid],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (orgExists) {
      return { status: false, errors: [validation.messages.duplicate_orgname] };
    }

    // Proceed with update if the organization exists
    const updateQuery = `
      UPDATE ad_organizations 
      SET 
        orgcode = ?, 
        orgname = ?, 
        status = ?, 
        modifiedby = ?, 
        modifiedon = CURRENT_TIMESTAMP 
      WHERE 
        orgid = ?;
    `;
    
    let result = await db.sequelize.query(updateQuery, {
      replacements: [orgcode, orgname, currentStatus, body.userid, orgid]
    });

    if (result) {
      return { status: true, message: validation.messages.update_success };
    } else {
      return { status: false, errors: [validation.messages.not_updated] };
    }
  } catch (error) {
    console.error("Update Organization error:", error);
    return { status: false, errors: [validation.messages.something_wrong_try_later] };
  }
};


const status = ({ db }) => async (id, body, loginId) => {
    const status = body.status == 'true' ? 'Active' : 'Inactive';
    let [res] = await db.sequelize.query(`UPDATE ad_organizations set status = '${status}',modifiedby = now(), modifiedby = '${loginId}' where orgid=:_id`, {
        replacements: {
            _id: id
        }
    });
    return res;
}
module.exports = {
    list,
    create,
    update,
    status
}