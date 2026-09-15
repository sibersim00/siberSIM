const getscenariosubcategoryAll =
  ({ db }) =>
  async (id = null) => {
    try {
      let [res] = await db.sequelize
        .query(`SELECT scc.categoryname, sc.categoryname as subcategoryname, sc.parentscenariocategoryid, sc.categoryimage AS categoryimage, sc.scenariocategoryid,
    CASE WHEN sc.status = 'Active' THEN 'true' ELSE 'false' END AS status, 
    CONCAT(au.firstname, ' ', au.lastname) AS createdby,
    CONCAT(a.firstname, ' ', a.lastname) AS modifiedby,
    DATE_FORMAT(sc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
        DATE_FORMAT(sc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
    FROM scenario_categories sc
    LEFT JOIN scenario_categories scc ON sc.parentscenariocategoryid = scc.scenariocategoryid
    LEFT JOIN ad_users au ON sc.createdby = au.userid
    LEFT JOIN ad_users a ON sc.modifiedby = a.userid
    WHERE sc.deletedon IS NULL AND sc.parentscenariocategoryid IS NOT NULL  ORDER BY subcategoryname ASC`);
      return res;
    } catch (error) {
      console.log("scenariocategory err==>", error);
    }
  };

const statusChange =
  ({ db }) =>
  async (body) => {
    const status = body.status == "true" ? "Active" : "Inactive";
     await db.sequelize.query(
      `UPDATE scenario_categories set status = '${status}', modifiedby = '${body.loginId}', modifiedon = now() where scenariocategoryid = :_id`,
      {
        replacements: { _id: body.scenariocategoryid },
      }
    );
    return { statusCode: 200, message: "Status changed Successfully" };
  };

const getscenariosubcategorybyId =
  ({ db }) =>
  async (id) => {
    let [res] = await db.sequelize.query(
      `SELECT scc.categoryname, sc.categoryname as subcategoryname, sc.parentscenariocategoryid, sc.scenariocategoryid,sc.categoryimage AS categoryimage,
    CASE WHEN sc.status = 'Active' THEN 'true' ELSE 'false' END AS status, 
    CONCAT(au.firstname, ' ', au.lastname) AS createdby,
    CONCAT(a.firstname, ' ', a.lastname) AS modifiedby
    FROM scenario_categories sc
    LEFT JOIN scenario_categories scc ON sc.parentscenariocategoryid = scc.scenariocategoryid
    LEFT JOIN ad_users au ON sc.createdby = au.userid
    LEFT JOIN ad_users a ON sc.modifiedby = a.userid
    WHERE sc.deletedon IS NULL AND sc.parentscenariocategoryid IS NOT NULL AND sc.scenariocategoryid = :_id  ORDER BY CASE WHEN sc.modifiedon IS NOT NULL THEN sc.modifiedon ELSE sc.createdon END DESC
    `,
      {
        replacements: { _id: id },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    return res;
  };

const save =
  ({ db }) =>
  async (body, userid) => {
    let errors = [];

    const categoryNameCleaned = body.categoryname
      .replace(/\s/g, "")
      .toLowerCase();

    if (body.parentscenariocategoryid && body.parentscenariocategoryid != 0) {
      const [checkduplicate] = await db.sequelize.query(
        `SELECT scenariocategoryid
       FROM scenario_categories
       WHERE deletedon IS NULL
         AND parentscenariocategoryid = :parentscenariocategoryid
         AND LOWER(REPLACE(categoryname, ' ', '')) = :subcategory`,
        {
          replacements: {
            parentscenariocategoryid: body.parentscenariocategoryid,
            subcategory: categoryNameCleaned,
          },
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (checkduplicate) {
        errors.push("Sub category name already exists");
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    try {
      await db.sequelize.query(
        `INSERT INTO scenario_categories (
        scenariocategoryuuid,
        parentscenariocategoryid,
        categoryname,
        categoryimage,
        createdby,
        createdon
      ) VALUES (
        uuid(), ?, ?, ?, ?, CURRENT_TIMESTAMP
      )`,
        {
          replacements: [
            body.parentscenariocategoryid || null,
            body.categoryname || null,
            body.categoryimage || null,
            userid,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Error Save Scenario Categories Submit:", error);
      throw error;
    }
  };

const update = ({ db }) => async (body, userid) => {
  let errors = [];

  const categoryNameCleaned = body.categoryname.replace(/\s/g, '').toLowerCase();

  if (body.parentscenariocategoryid && body.parentscenariocategoryid != 0) {
    const [checkduplicate] = await db.sequelize.query(
      `SELECT scenariocategoryid
       FROM scenario_categories
       WHERE deletedon IS NULL
         AND parentscenariocategoryid = :parentscenariocategoryid
         AND LOWER(REPLACE(categoryname, ' ', '')) = :subcategory
         AND scenariocategoryid != :id`,
      {
        replacements: {
          parentscenariocategoryid: body.parentscenariocategoryid,
          subcategory: categoryNameCleaned,
          id: body.scenariocategoryid,
        },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (checkduplicate) {
      errors.push("Sub category name already exists");
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  try {
    await db.sequelize.query(
      `UPDATE scenario_categories
       SET parentscenariocategoryid = ?,
           categoryname = ?,
           categoryimage = ?,
           modifiedby = ?,
           modifiedon = CURRENT_TIMESTAMP
       WHERE scenariocategoryid = ? AND deletedon IS NULL`,
      {
        replacements: [
          body.parentscenariocategoryid || null,
          body.categoryname || null,
          body.categoryimage || null,
          userid,
          body.scenariocategoryid || null,
        ],
        type: db.sequelize.QueryTypes.UPDATE, 
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Error Update Scenario Category:", error);
    throw error;
  }
};

const deleteById =
  ({ db }) =>
  async (id = null) => {
    // Check if subcategory is used in scenarios
    let [b] = await db.sequelize.query(
      `SELECT scenarioid FROM scenarios WHERE deletedon IS NULL AND scenariosubcategoryid = '${id}'`
    );
    if (b.length > 0) {
      return {
        status: false,
        message: "Sub-Category is already used in scenarios and cannot be deleted.",
      };
    }

    let [a] = await db.sequelize.query(
      `SELECT scenariocategoryid, parentscenariocategoryid FROM scenario_categories WHERE deletedon IS NULL and parentscenariocategoryid='${id}'`
    );
    if (a.length > 0) {
      return {
        status: false,
        message: "Scenario Category already mapped with scenario Sub-Category",
      };
    }

    await db.sequelize.query(
      "UPDATE scenario_categories set categoryimage=NULL , deletedon=now() where scenariocategoryid=:_id",
      {
        replacements: { _id: id },
      }
    );

     await db.sequelize.query(
      "UPDATE scenario_categories set categoryimage=NULL , deletedon=now() where parentscenariocategoryid=:_id",
      {
        replacements: { _id: id },
      }
    );

    return { status: true, message: "Record has been Deleted Successfully." };
  };

const scenariosubcategoryverify = ({ db, validation }) => async (body) => {
    let errors = [];
    let success = [];
    try {
      for (const element of body) {
        let asset = element;
        let scenariocategoryerror = [];

        if (
          !asset.parentscenariocategoryid ||
          typeof asset.parentscenariocategoryid !== "string"
        ) {
          scenariocategoryerror.push({
            field: "categoryname",
            message: "The category name cannot be empty. ",
          });
        }
        if (
          !asset.categoryname ||
          typeof asset.categoryname !== "string" ||
          asset.categoryname === undefined
        ) {
          scenariocategoryerror.push({
            field: "subcategoryname",
            message: "Sub category name cannot be empty",
          });
        }
        if (asset.subcategoryname) {
          const checkSubCategoryQuery = `SELECT scenariocategoryid FROM scenario_categories WHERE categoryname = ?`;
          const checkSubCategoryValues = [asset.subcategoryname];
          const checkSubCategoryResult = await db.sequelize.query(
            checkSubCategoryQuery,
            {
              replacements: checkSubCategoryValues,
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (checkSubCategoryResult.length === 0) {
            scenariocategoryerror.push({
              field: "scenariocategoryid",
              message: `Sub Category with name ${asset.subcategoryname} not found`,
            });
          }
        }

        if (asset.scenariocategoryid) {
          if (!/^\d+$/.test(asset.scenariocategoryid)) {
            scenariocategoryerror.push({
              field: "scenariocategoryid",
              message: "Scenario Category ID must be numeric",
            });
          } else {
            const checkScenarioQuery = `SELECT scenariocategoryid FROM scenario_categories WHERE scenariocategoryid = :scenariocategoryid`;
            const checkScenarioValues = {
              scenariocategoryid: asset.scenariocategoryid,
            };
            const checkScenarioResult = await db.sequelize.query(
              checkScenarioQuery,
              {
                replacements: checkScenarioValues,
                type: db.sequelize.QueryTypes.SELECT,
              }
            );

            if (checkScenarioResult.length === 0) {
              scenariocategoryerror.push({
                field: "scenariocategoryid",
                message: `Scenario Category with ID ${asset.scenariocategoryid} not found`,
              });
            }
          }
        }

        if (asset.categoryname) {
          let query = `SELECT categoryname FROM scenario_categories WHERE categoryname = ?`;
          let values = [asset.categoryname];

          if (asset.scenariocategoryid) {
            query += ` AND scenariocategoryid != ?`;
            values.push(asset.scenariocategoryid);
          }

          const duplicateCategoryCheck = await db.sequelize.query(query, {
            replacements: values,
            type: db.sequelize.QueryTypes.SELECT,
          });

          if (duplicateCategoryCheck.length > 0) {
            scenariocategoryerror.push({
              field: "categoryname",
              message: "Duplicate category name found",
            });
          }
        }

        if (scenariocategoryerror.length > 0) {
          asset.issues = scenariocategoryerror;
          errors.push(asset);
        } else {
          asset.issues = [];
          success.push(asset);
        }
      }
      return {
        status: true,
        errors: errors,
        success: success,
      };
    } catch (error) {
      console.error("scenariocategoryverify error:", error);
      return {
        status: false,
        message: validation.messages.server_error,
      };
    }
  };

const scenariosubcategoryImport =
  ({ db, validation }) =>
  async (body, user) => {
    let insertedscenariosubcategory = [];
    let errors = [];

    try {
      if (!Array.isArray(body) || body.length === 0) {
        return { status: false, errors: ["No data provided for import."] };
      }
      for (const asset of body) {

        if (!asset.categoryname) {
          errors.push({
            field: "categoryname",
            message: "Category name is required",
          });
          continue;
        }

        const parentQuery = `
        SELECT scenariocategoryid FROM scenario_categories
        WHERE categoryname = ? AND parentscenariocategoryid is NULL LIMIT 1
      `;
        const parentResult = await db.sequelize.query(parentQuery, {
          replacements: [asset.parentscenariocategoryid],
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (parentResult.length > 0) {
          asset.parentscenariocategoryid = parentResult[0].scenariocategoryid;
        } else {
          errors.push({
            field: "parentscenariocategoryid",
            message: `Parent category "${asset.parentscenariocategoryid}" not found.`,
          });
          continue;
        }

        let duplicateQuery = `SELECT categoryname FROM scenario_categories WHERE categoryname = ?`;
        let queryReplacements = [asset.categoryname];

        if (asset.scenariocategoryid) {
          duplicateQuery += ` AND scenariocategoryid != ?`;
          queryReplacements.push(asset.scenariocategoryid);
        }

        const duplicateResult = await db.sequelize.query(duplicateQuery, {
          replacements: queryReplacements,
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (duplicateResult.length > 0) {
          errors.push({
            field: "categoryname",
            message: `Duplicate category name "${asset.categoryname}" found.`,
          });
          continue;
        }

        if (asset.scenariocategoryid) {
          const updateQuery = `
          UPDATE scenario_categories 
          SET categoryname = ?, 
              parentscenariocategoryid = ?, 
              modifiedby = ?, 
              modifiedon = CURRENT_TIMESTAMP 
          WHERE scenariocategoryid = ?
        `;
          await db.sequelize.query(updateQuery, {
            replacements: [
              asset.categoryname,
              asset.parentscenariocategoryid,
              user.userid,
              asset.scenariocategoryid,
            ],
          });
        } else {
          const insertQuery = `
          INSERT INTO scenario_categories 
          (categoryname, parentscenariocategoryid, createdby) 
          VALUES (:categoryname, :parentscenariocategoryid, :createdby)
        `;
          await db.sequelize.query(insertQuery, {
            replacements: {
              categoryname: asset.categoryname,
              parentscenariocategoryid: asset.parentscenariocategoryid,
              createdby: user.userid,
            },
          });
        }

        insertedscenariosubcategory.push(asset);
      }

      if (errors.length > 0) {
        return { status: false, errors: errors };
      }

      return {
        status: true,
        message: validation.messages.import_success,
        data: insertedscenariosubcategory,
      };
    } catch (error) {
      console.error("Error during import:", error);
      return { status: false, errors: [validation.messages.server_error] };
    }
  };

module.exports = {
  getscenariosubcategoryAll,
  getscenariosubcategorybyId,
  save,
  update,
  deleteById,
  statusChange,
  scenariosubcategoryverify,
  scenariosubcategoryImport,
};
