const list = ({ db }) =>  async () => {
    try {
        let [res] = await db.sequelize.query(`SELECT m.menuid, m.menuname, m.displaymenuname, m.singularmenuname, m.icon, m.menupath, m.menutype, m.source, m.parentmenuid, m.orderno, mm.menuname AS parentmenuname, CASE WHEN m.status = 'Active' THEN 'true' ELSE 'false' END AS status FROM ad_menus m LEFT JOIN ad_menus mm ON m.parentmenuid = mm.menuid WHERE m.deletedon IS NULL  ORDER BY m.menuid ASC;`);
          return res;
    } catch (error) {
        console.error('Error fetching menus list:', error);
        throw error;
    }
}


const parentlist = ({ db }) => async () => {
    try {
        let [res] = await db.sequelize.query(`select m.menuid, m.menuname, case when m.status = 'Active' then 'true' else 'false' end as status from ad_menus m where m.menutype != 'Menu' order by m.menuid asc`);
        
        return res;
    } catch (error) {
        console.error('Error fetching selector by name:', error);
        throw error;
    }
}

const getById= ({ db }) => async (id) => {
    try {
        let [res] = await db.sequelize.query(`SELECT m.menuid, m.menuname, m.displaymenuname, m.singularmenuname, m.icon, m.menupath, m.menutype, m.source, m.parentmenuid, m.orderno, mm.menuname AS parentmenuname, CASE WHEN m.status = 'Active' THEN 'true' ELSE 'false' END AS status FROM ad_menus m LEFT JOIN ad_menus mm ON m.parentmenuid = mm.menuid WHERE m.deletedon IS NULL AND m.menuid = :_id ORDER BY m.menuid ASC;`, {
            replacements: {
                _id: id
            },
            type: db.sequelize.QueryTypes.SELECT
          });
          return res;
    } catch (error) {
        console.log(error);
    }
}

const create = ({ db }) => async (body, loginId) => {
	try {
		const p_id = body.menuid;
		const p_parentmenuid = body.parentmenuid ? body.parentmenuid : null;
		const p_menuname = body.menuname;
		const p_displaymenuname = body.displaymenuname;
		const p_singularmenuname = body.singularmenuname;
		const p_path = body.menupath;
		const p_source = body.source;
		const p_icon = body.icon;
		const p_orderno = body.orderno;
		const p_type = body.menutype;
		const p_status = body.status === 'true' ? 'Active' : 'Inactive';

		const [existingMenu] = await db.sequelize.query(`SELECT 1 FROM ad_menus WHERE menuid = :p_id`, {
			replacements: { p_id },
			type: db.sequelize.QueryTypes.SELECT
		});

		if (existingMenu) {
			await db.sequelize.query(
				`UPDATE ad_menus SET parentmenuid = ?, menuname = ?, displaymenuname = ?, singularmenuname = ?, menupath = ?, source = ?, icon = ?, orderno = ?, menutype = ?, status = ?, modifiedby = ?, modifiedon = NOW() WHERE menuid = ?`,
				{
					replacements: [p_parentmenuid, p_menuname, p_displaymenuname, p_singularmenuname, p_path, p_source, p_icon, p_orderno, p_type, p_status, loginId, p_id],
					type: db.sequelize.QueryTypes.UPDATE
				}
			);
			return  { statusCode: 200, message: 'Menu updated successfully' };
		} else {
			await db.sequelize.query(
				`INSERT INTO ad_menus (menuname, displaymenuname, singularmenuname, icon, menupath, source, parentmenuid, orderno, menutype, status, createdby, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
				{
					replacements: [p_menuname, p_displaymenuname, p_singularmenuname, p_icon, p_path, p_source,
                         p_parentmenuid, p_orderno, p_type, p_status,loginId],type: db.sequelize.QueryTypes.INSERT
				}
			);

			return  { statusCode: 200, message: 'Menu inserted successfully' };

		}
	} catch (error) {
		console.error('Error in saving menu:', error);
		throw error;
	}
};

const update = ({ db }) => async (id, body, loginId) => {
    if(body.role){
        let roleid = body.role;
        let menuid = id;
        await db.any(`delete from rolemenumap where menuid = ${menuid}`);
        roleid.forEach(element => {
            db.oneOrNone(`insert into rolemenumap(menuid, roleid, isactive, createdby, createddate) values('${menuid}', '${element.value}', 'true', '${loginId}','now()') returning *`);
        });
    }
    const parentmenuid = typeof (body.parentmenuid) == 'undefined'?'0':body.parentmenuid;
    let query = `update menumaster set menuname = '${body.menuname}' , icon = '${body.icon}' ,orderno = '${body.orderno}', parentmenuid = '${parentmenuid}', path = '${body.path}' , source = '${body.source}' , type = '${body.type}', isactive = ${body.isactive},modifiedby = '${loginId}',modifieddate = 'now()'  where menuid = ${id} returning *`;
    if(query!='')
    return await db.oneOrNone(query);
}

const remove = ({ db }) => async (id) => {
    let [res] = await db.sequelize.query('UPDATE ad_menus set deletedon=now() where menuid=:_id', {
        replacements: {
            _id: id
        }
      });
    return res;
}

const status = ({ db }) => async (id, body, loginId) => {
    const status = body.status == 'true' ? 'Active' : 'Inactive';
    let [res] = await db.sequelize.query(`UPDATE ad_menus set status = '${status}', modifiedby = '${loginId}' where menuid=:_id`, {
        replacements: {
            _id: id
        }
    });
    return res;
}

module.exports = {
    list,
    getById,
    parentlist,
    create,
    update,
    remove,
    status
}