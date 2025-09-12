const componentCategorylist = ({ db }) => async () => {
  let query = `SELECT c.componentsubcategoryid,c.categoryname,mcc.categoryname as parentcategoryname,c.categoryimage,c.description, CASE  WHEN c.status = 'Active' THEN 'true'  ELSE 'false'  END AS status,DATE_FORMAT(c.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,DATE_FORMAT(c.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon,CONCAT('[', GROUP_CONCAT(CONCAT('{"id":', cl.checklistid,',"checklistname":"', cl.checklistname,'","checkliststatus":"',  CASE WHEN cl.checkliststatus = 'Active' THEN 'true' ELSE 'false' END, '"}') SEPARATOR ',' ),']') AS checklist FROM component_subcategories c LEFT JOIN component_subcategory_checklist_map cl ON c.componentsubcategoryid = cl.componentsubcategoryid LEFT JOIN component_categories mcc ON mcc.componentcategoryid= c.componentcategoryid WHERE c.deletedon is NULL GROUP BY c.componentsubcategoryid ORDER BY CASE WHEN c.modifiedon IS NOT NULL then c.modifiedon ELSE c.createdon END  DESC;`;
  try {
    let [result] = await db.sequelize.query(query);
    result = result.map(component => ({
        ...component,
        checklist: component.checklist ? JSON.parse(component.checklist) : [] 
    }));
    return result;
  } catch (error) {
    console.log("componentcategory err==>",error);
  }
};

const getComponentCategory = ({ db }) => async (id) => {
  try {
      let [result] = await db.sequelize.query('SELECT mcs.componentsubcategoryid,mcs.categoryname,mcc.categoryname as parentcategoryname,mcs.componentcategoryid,mcs.categoryimage,mcs.description, CASE WHEN mcs.status="Active" then "true" else "false" END as status,mcs.createdon,mcs.modifiedon FROM component_subcategories mcs LEFT JOIN component_categories mcc ON mcc.componentcategoryid = mcs.componentcategoryid  where  mcs.deletedon IS NULL and mcs.componentsubcategoryid=:_id;',{
        replacements:{
            _id: id
          }
        });
    let [checklistResult] = await db.sequelize.query('SELECT checklistid,componentsubcategoryid,checklistname,CASE WHEN checkliststatus="Active" then "true" ELSE "false" END as checkliststatus ,createdby,modifiedby,createdon,modifiedon FROM component_subcategory_checklist_map  where deletedon IS NULL and componentsubcategoryid=:_id ORDER BY checklistid DESC;',{      
        replacements:{
            _id: id
          }
      });

      result[0].checkilistdata = checklistResult;
      return result;
  } catch (error) {
    console.log("componentcategory err==>",error);
  }
};

const saveComponentCategory = ({ db, validation }) => async (body, session_userid) => {
  let errors = [];
  let checkSubcategoryName = await db.sequelize.query(`SELECT DISTINCT(	componentsubcategoryid) as	componentcategoryid FROM component_subcategories WHERE  deletedon IS NULL and LOWER(REPLACE(categoryname, ' ', '')) = LOWER(REPLACE(:categoryname, ' ', ''))`,
    { replacements: { categoryname: body.name },  type: db.sequelize.QueryTypes.SELECT }
  );
  if(checkSubcategoryName.length > 0){ errors.push(validation.messages.category_name_duplicate); }
  if (errors.length > 0) { return {status : false, errors : errors} } 
  try {
    const [categoryRes] = await db.sequelize.query(`INSERT INTO component_subcategories (componentsubcategoryuuid,categoryname, categoryimage, description, createdby,componentcategoryid,createdon) 
       VALUES (UUID(),:name, :image, :description, :userid,:componentcategoryid,now())`,
      {
        replacements: {
          name: body.name,
          image: body.image,
          description: body.description,
          userid: session_userid,
          componentcategoryid: body.componentcategoryid,
        },
      }
    );
    const categoryId = categoryRes;

    if(body.checklistdata.length > 0)
    {
      const checklistPromises = body.checklistdata.map(async (checklist) => {
        return db.sequelize.query(`INSERT INTO component_subcategory_checklist_map (componentsubcategoryid,checklistname,createdby,createdon) VALUES (:componentcategoryid,:name, :userid,now())`,{
            replacements: {
              componentcategoryid: categoryId,
              name: checklist.checklistname,
              userid: session_userid,
            },
          }
        );
      });
      await Promise.all(checklistPromises);
    }
    return { success: true, categoryId, message: validation.messages.add_success};
  } catch (error) {
    console.error('Error saving Sub category data:', error);
    return { success: false, error: error.message };
  }
};

const updateComponentCategory= ({ db, validation }) =>  async (body,session_userid) => {

  let errors = [];
  let checkSubCategoryName = await db.sequelize.query( 
    `SELECT DISTINCT(	componentsubcategoryid) as	componentsubcategoryid FROM component_subcategories WHERE componentsubcategoryid !='${body.componentsubcategoryid}'  and deletedon IS NULL and LOWER(REPLACE(categoryname, ' ', '')) = LOWER(REPLACE(:categoryname, ' ', ''))`,
    { replacements: { categoryname: body.name },  type: db.sequelize.QueryTypes.SELECT }
  );

  if(checkSubCategoryName.length > 0){ errors.push(validation.messages.category_name_duplicate); }

  if (errors.length > 0) { return {status : false, errors : errors} } 

  const updateQuery = `UPDATE component_subcategories SET categoryname=?, categoryimage=?, description=?, modifiedon=CURRENT_TIMESTAMP,modifiedby=?,componentcategoryid=? WHERE componentsubcategoryid=?`;
  const updateParams = [body.name,body.image,body.description,session_userid,body.componentcategoryid,body.componentsubcategoryid];
    try {
        await db.sequelize.query(updateQuery, {
            replacements: updateParams,
            type: db.sequelize.QueryTypes.UPDATE,
        });

        if(body.checklistdata.length > 0)
        {
          const { checklistdata } = body.checklistdata; 

          const existingChecklists = await db.sequelize.query(
            `SELECT checklistid FROM component_subcategory_checklist_map WHERE componentsubcategoryid = :componentsubcategoryid`,
            {
                replacements: { componentsubcategoryid: body.componentsubcategoryid },
                type: db.sequelize.QueryTypes.SELECT,
            }
          );
          const existingChecklistIds = existingChecklists.map(item => item.checklistid);
          const incomingChecklistIds = [];

          for (let i = 0; i < body.checklistdata.length; i++) {
        
            let checklist = body.checklistdata[i];
            if (checklist.checklistid) {
                incomingChecklistIds.push(checklist.checklistid);
                const existingChecklist = await db.sequelize.query(`SELECT * FROM component_subcategory_checklist_map WHERE checklistid = :checklistid`, 
                    {
                        replacements: { checklistid: checklist.checklistid },
                        type: db.sequelize.QueryTypes.SELECT
                    }
                );
        
                if (existingChecklist && existingChecklist.length > 0) {
                    await db.sequelize.query(`UPDATE component_subcategory_checklist_map 
                        SET checklistname = :checklistname, checkliststatus = :checkliststatus,modifiedby= :modifiedby,modifiedon=CURRENT_TIMESTAMP WHERE checklistid = :checklistid`,
                        {
                            replacements: {
                                checklistname: checklist.checklistname,
                                checkliststatus: checklist.checkliststatus === "true" ? "Active" : "Inactive",
                                modifiedby: session_userid,
                                checklistid: checklist.checklistid
                            }
                        }
                    );
                } else {
                    await db.sequelize.query(`INSERT INTO component_subcategory_checklist_map (checklistname, checkliststatus, componentsubcategoryid,createdon,createdby) VALUES (:checklistname, :checkliststatus, :componentsubcategoryid,now(),createdby)`,
                        {
                            replacements: {
                                checklistname: checklist.checklistname,
                                checkliststatus: checklist.checkliststatus === "true" ? "Active" : "Inactive",
                                componentsubcategoryid: body.componentsubcategoryid,
                                createdby: session_userid
                            }
                        }
                    );
                }
            } else {
                await db.sequelize.query(`INSERT INTO component_subcategory_checklist_map (checklistname, checkliststatus, componentsubcategoryid,createdby,createdon) VALUES (:checklistname, :checkliststatus, :componentsubcategoryid, :createdby, now())`,
                    {
                        replacements: {
                            checklistname: checklist.checklistname,
                            checkliststatus: checklist.checkliststatus === "true" ? "Active" : "Inactive",
                            componentsubcategoryid: body.componentsubcategoryid,
                            createdby: session_userid
                        }
                    }
                );
            }
          }
          const checklistsToDeactivate = existingChecklistIds.map(id => Number(id)).filter(id => !incomingChecklistIds.map(id => Number(id)).includes(id));
          if (checklistsToDeactivate.length > 0) {
               await db.sequelize.query(`UPDATE component_subcategory_checklist_map
                   SET deletedon = CURRENT_TIMESTAMP, modifiedon = CURRENT_TIMESTAMP,modifiedby= '${session_userid}'
                   WHERE checklistid IN (:checklistsToDeactivate)`,
                   {
                       replacements: { checklistsToDeactivate },
                   }
               );
          }
        }
        return {success: true, message: validation.messages.edit_success};
    } catch (error) {
          console.error('Error System Config Submit:', error);
          throw error;
    }  
}


const changeStatus = ({ db }) => async (body, session_userid) => {
  const status = body.status == 'true' ? 'Active' : 'Inactive';
  let [res] = await db.sequelize.query(`UPDATE component_subcategories set status = '${status}',modifiedon = now(), modifiedby = '${session_userid}' where componentsubcategoryid=:_id`, {
      replacements: {
          _id: body.componentsubcategoryid
      }
  });
  return res;
};

const deleteCategory = ({ db }) =>  async (body, session_userid) => {
  let [res] = await db.sequelize.query('UPDATE component_subcategories set deletedon=now(), modifiedby=:_userid where 	componentsubcategoryid=:_id', {
    replacements: {
        _id: body.componentsubcategoryid,
        _userid : session_userid
    }
  });

  let [resCat] = await db.sequelize.query('UPDATE component_subcategory_checklist_map set deletedon=now() where componentsubcategoryid=:_id', {
    replacements: {
        _id: body.componentsubcategoryid
    }
  });

  return res;
};

module.exports = {
  componentCategorylist,
  getComponentCategory,
  saveComponentCategory,
  updateComponentCategory,
  changeStatus,
  deleteCategory
}