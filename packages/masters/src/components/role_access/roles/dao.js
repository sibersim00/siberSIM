const list = ({ db }) => async (id = null) => {
    try {
        let [res] = await db.sequelize.query(`SELECT roleid, rolename, displayname, description, default_role , CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END AS status FROM ad_roles ORDER BY roleid  ASC;`);
        return res;
    } catch (error) {
        console.error('Error fetching list roles:', error);
        throw error;
    }
}

const getById= ({ db }) => async (id) => {
	
    try {
        let [query] = await db.sequelize.query(`select m.menuid ,r.rolemenumapid , m.menuname , m.icon, m.parentmenuid  from ad_menus m left join ad_rolemenumap r on r.menuid = m.menuid and r.roleid = :_role_id where m.status = 'Active' and m.deletedon is null and m.parentmenuid is null order by m.menuid asc`, {
            replacements: {
                _role_id: id
            }
        }); 
        return query;
    } catch (error) {
        console.error('Error fetching selector by name:', error);
        throw error;
    }
}

const create = ({ db }) => async (body, loginId) => {
	try {
		const p_id = body.roleid;
		const p_rolename = body.rolename;
		const p_displayname = body.displayname;
		const p_description = body.description;
		const p_status = body.status === 'true' ? 'Active' : 'Inactive';

		// Check if the role already exists
		const [existingRole] = await db.sequelize.query(`SELECT 1 FROM ad_roles WHERE roleid = :p_id`, {
			replacements: { p_id },
			type: db.sequelize.QueryTypes.SELECT
		});

		if (existingRole) {
			// Update existing role
			await db.sequelize.query(
				`UPDATE ad_roles SET rolename = ?, displayname = ?, description = ?, status = ?, modifiedby = ?, modifiedon = NOW() WHERE roleid = ?`,
				{
					replacements: [p_rolename, p_displayname, p_description, p_status, loginId, p_id],
					type: db.sequelize.QueryTypes.UPDATE
				}
			);
			return { statusCode: 200, message: 'Role updated successfully' };
		} else {
			// Insert new role
			await db.sequelize.query(
				`INSERT INTO ad_roles (rolename, displayname, description, status, createdby, createdon) VALUES (?, ?, ?, ?, ?, NOW())`,
				{
					replacements: [p_rolename, p_displayname, p_description, p_status, loginId],
					type: db.sequelize.QueryTypes.INSERT
				}
			);

			return { statusCode: 200, message: 'Role inserted successfully' };
		}
	} catch (error) {
		console.error('Error in saving role:', error);
		throw error;
	}
};

const remove = ({ db }) => async (id) => {
    let [res] = await db.sequelize.query(`UPDATE ad_roles set deletedon = now() where roleid = :_id`, {
        replacements: {
            _id: id
        }
    });
    return res;
}

const status = ({ db }) => async (id, body, loginId) => {
    const status = body.status == 'true' ? 'Active' : 'Inactive';
    let [res] = await db.sequelize.query(`UPDATE ad_roles set status = '${status}',modifiedby = now(), modifiedby = '${loginId}' where roleid=:_id`, {
        replacements: {
            _id: id
        }
    });
    return res;
}

const viewRoleMenuMap = ({ db }) => async (body,loginId) => {
    const [menus] = await db.sequelize.query(`select menuid,menuname,menutype,parentmenuid from ad_menus where deletedon is null and status = 'Active' order by orderno`);
    const [rolemenu] = await db.sequelize.query(`select menuid,roleid from ad_rolemenumap where roleid='${body.roleid}'`);
    const menuHierarchy = buildMenuHierarchy(menus,rolemenu);
    return menuHierarchy;
}

function buildMenuHierarchy(data,rolemenu, parentId = null) {
    const children = data
      .filter(item => item.parentmenuid === parentId)
      .map(item => ({
        value:item.menuid.toString(),
        label:item.menuname,
        menutype:item.menutype,
        parentmenuid:item.parentmenuid,
        ischeck:rolemenu.some(mapping =>mapping.menuid === item.menuid),
        children: buildMenuHierarchy(data,rolemenu, item.menuid),
      }));
    return children.length > 0 ? children : null;
}

const storeRoleMenuMap = ({ db }) => async (data, roleId, loginId,removeRoleMenus = true) => {
    try {
        if(removeRoleMenus){
            //Delete records of role menu mappings
            await db.sequelize.query(`DELETE FROM ad_rolemenumap WHERE roleid = :_id`, {
                replacements: { _id : roleId }
            });
        }  
        
        for (const item of data) {
            // Check if ischeck is true and insert into ad_rolemenumap
            if (item.ischeck) {
            await db.sequelize.query(
                `INSERT INTO ad_rolemenumap (menuid, roleid, createdby, createdon) VALUES (:menuid, :roleid, :loginId, NOW())`,
                {
                replacements: { menuid: +item.value, roleid: roleId, loginId: loginId },
                }
            );
            }
    
            // Recursively store role-menu mappings for children
            if (item.children && item.children.length > 0) {
            await storeRoleMenuMap({ db })(item.children, roleId, loginId, false);
            }
        }
      return { success: true, message: 'Role Menu mappings stored successfully.' };
    } catch (error) {
      console.error('Error storing role-menu mappings:', error);
      return { success: false, message: 'Error storing role-menu mappings.' };
    }
};

const rolemenumap = ({ db }) => async (body, loginId) => {
    let roleid = body.roleid;
    let menuid = body.menuid;
    try {
        await db.sequelize.query(`DELETE FROM ad_rolemenumap WHERE roleid = :_roleid`, {
            replacements: { _roleid : roleid }
        });

        for (const element of menuid) {
            await db.sequelize.query(
              'INSERT INTO ad_rolemenumap(menuid, roleid, createdby, createdon) VALUES (:_menuid, :_roleid, :_loginId, NOW())',
              {
                replacements: { _menuid: element, _roleid : roleid, _loginId 
                : loginId }
              }
            );
        }
        return true;
    } catch (error) {
        console.error('Error updating RoleMenuMap:', error);
        throw error;
    }
}

const userrolemap = ({ db }) => async (body,loginId,orgid) => {

    // Check if userrolemap entry already exists
    const [existingUserRoleMap] = await db.sequelize.query(
        `SELECT userrolemapid FROM ad_userrolemap WHERE userid = :_userid AND roleid = :_roleid AND status = 'Active'`,
        {
          replacements: {
            _userid: body.userid,
            _roleid: body.roleid,
            _orgid:  orgid,
          }
    });
    
    if(existingUserRoleMap[0]?.userrolemapid == undefined){
        // Insert new userrolemap entry
        await db.sequelize.query(
            `INSERT INTO ad_userrolemap (userid, orgid, roleid, status, createdby, createdon) VALUES (:_userid, :_orgid, :_roleid, 'Active', :_loginId, NOW())`,
            {
                replacements: {
                    _userid: body.userid,
                    _orgid:  orgid,
                    _roleid: body.roleid,
                    _loginId: loginId,
                }
            }
        );
        return true
    }else{
        return false;
    }
}

const userrolerights= ({ db }) => async (body,orgId) => {
    try {
        const query = `
            SELECT u.userrolemapid, r.rolename
            FROM ad_userrolemap u
            INNER JOIN ad_roles r ON r.roleid = u.roleid
            WHERE u.userid = :_userid
            ORDER BY r.rolename ASC
        `;

        const userRoleRights = await db.sequelize.query(query, {
            replacements: {
                _userid: body.userid,
                _orgid: orgId,
            },
            type: db.sequelize.QueryTypes.SELECT,
        });
        return userRoleRights;
    } catch (error) {
        console.error('Error in userrolerights:', error);
        throw error;
    }
    
}

const userrolemapremove = ({ db }) => async (id) => {
    return await db.sequelize.query(`DELETE FROM ad_userrolemap WHERE userrolemapid = :_id`, {
        replacements: { _id : id }
    });
}

const userlist = ({ db }) => async (id = null) => {
    try {
        let [res] = await db.sequelize.query(`SELECT userid,concat(firstname,' ',lastname) as name,status from ad_users where status = 'Active' order by userid asc`);
        return res;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}

const rolelist = ({ db }) => async () => {
    try {
        let [res] = await db.sequelize.query(`SELECT roleid,rolename,status from ad_roles where status = 'Active' order by roleid asc`);
        return res;
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    list,
    getById,
    create,
    remove,
    status,
    rolemenumap,
    userrolemap,
    userrolerights,
    userrolemapremove,
    viewRoleMenuMap,
    storeRoleMenuMap,
    userlist,
    rolelist
}