const getscenarioAll =
  ({ db }) =>
  async (id = null) => {
    try {
      let [res] = await db.sequelize
        .query(`SELECT sc.categoryname,sc.categorytype, sc.categoryimage,sc.parentscenariocategoryid, sc.scenariocategoryid,
    CASE WHEN sc.status = 'Active' THEN 'true' ELSE 'false' END AS status, 
    CONCAT(au.firstname, ' ', au.lastname) AS createdby,
    CONCAT(a.firstname, ' ', a.lastname) AS modifiedby,
    DATE_FORMAT(sc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
        DATE_FORMAT(sc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
    FROM scenario_categories sc
    LEFT JOIN ad_users au ON sc.createdby = au.userid
    LEFT JOIN ad_users a ON sc.modifiedby = a.userid
    WHERE sc.deletedon IS NULL AND parentscenariocategoryid IS NULL ORDER BY categoryname ASC`);
      return res;
    } catch (error) {
      console.error("Error Fetching Scenario Categories List:", error);
      throw error;
    }
  };

const statusChange =
  ({ db, validation }) =>
  async (body) => {
    const status = body.status == "true" ? "Active" : "Inactive";
    await db.sequelize.query(
      `UPDATE scenario_categories set status = '${status}', modifiedby = '${body.loginId}', modifiedon = now() where scenariocategoryid = :_id`,
      {
        replacements: { _id: body.scenariocategoryid },
      }
    );
    return { statusCode: 200, message: validation.messages.status_change };
  };

const getScenarioCategorybyId =
  ({ db }) =>
  async (id) => {
    try {
      const [res] = await db.sequelize.query(
        `SELECT sc.categoryname, sc.categoryimage, sc.parentscenariocategoryid, sc.scenariocategoryid,
        CASE WHEN sc.status = 'Active' THEN 'true' ELSE 'false' END AS status, 
        CONCAT(au.firstname, ' ', au.lastname) AS createdby,
        CONCAT(a.firstname, ' ', a.lastname) AS modifiedby
      FROM scenario_categories sc
      LEFT JOIN ad_users au ON sc.createdby = au.userid
      LEFT JOIN ad_users a ON sc.modifiedby = a.userid
      WHERE sc.deletedon IS NULL 
        AND sc.parentscenariocategoryid IS NULL 
        AND sc.scenariocategoryid = :_id
      ORDER BY CASE WHEN sc.modifiedon IS NOT NULL THEN sc.modifiedon ELSE sc.createdon END DESC`,
        {
          replacements: { _id: id },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return res;
    } catch (error) {
      console.error("Error in getScenarioCategorybyId:", error.message);
      throw error;
    }
  };

const save =
  ({ db }) =>
  async (body, userid) => {
    let errors = [];

    const categoryNameCleaned = body.categoryname
      .replace(/\s/g, "")
      .toLowerCase();

    const [checkduplicate] = await db.sequelize.query(
      `SELECT scenariocategoryid
      FROM scenario_categories
      WHERE deletedon IS NULL
        AND parentscenariocategoryid IS NULL
        AND LOWER(REPLACE(categoryname, ' ', '')) = :categoryname`,
      {
        replacements: { categoryname: categoryNameCleaned },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (checkduplicate) {
      errors.push("Category name already exists");
    }

    if (errors.length > 0) {
      return { status: false, errors };
    }

    try {
      await db.sequelize.query(
        `INSERT INTO scenario_categories (
          scenariocategoryuuid, categoryname,categorytype, categoryimage,
          createdby, createdon
        ) VALUES (
          uuid(), ?, ?, ?,?, CURRENT_TIMESTAMP
        )`,
        {
          replacements: [
            body.categoryname,
            body.categorytype || "Public",
            body.categoryimage,
            userid,
          ],
          type: db.sequelize.QueryTypes.INSERT,
        }
      );

      return { status: true };
    } catch (error) {
      console.error("Error Save Scenario Categories Submit:", error);
      throw error;
    }
  };

// const update =
//   ({ db }) =>
//   async (body, userid) => {
//     let errors = [];

//     const categoryNameCleaned = body.categoryname
//       .replace(/\s/g, "")
//       .toLowerCase();

//     if (body.parentscenariocategoryid && body.parentscenariocategoryid != 0) {
//       const [checkduplicate] = await db.sequelize.query(
//         `SELECT scenariocategoryid
//        FROM scenario_categories
//        WHERE deletedon IS NULL
//          AND parentscenariocategoryid = :parentid
//          AND LOWER(REPLACE(categoryname, ' ', '')) = :subcategory
//          AND scenariocategoryid != :id`,
//         {
//           replacements: {
//             parentid: body.parentscenariocategoryid,
//             subcategory: categoryNameCleaned,
//             id: body.scenariocategoryid,
//           },
//           type: db.sequelize.QueryTypes.SELECT,
//         }
//       );

//       if (checkduplicate) {
//         errors.push("Category name already exists");
//       }
//     } else {
//       const [checkduplicate] = await db.sequelize.query(
//         `SELECT scenariocategoryid
//        FROM scenario_categories
//        WHERE deletedon IS NULL
//          AND parentscenariocategoryid IS NULL
//          AND LOWER(REPLACE(categoryname, ' ', '')) = :category
//          AND scenariocategoryid != :id`,
//         {
//           replacements: {
//             category: categoryNameCleaned,
//             id: body.scenariocategoryid,
//           },
//           type: db.sequelize.QueryTypes.SELECT,
//         }
//       );

//       if (checkduplicate) {
//         errors.push("Category name already exists");
//       }
//     }

//     if (errors.length > 0) {
//       return { status: false, errors };
//     }

//     try {
//       await db.sequelize.query(
//         `UPDATE scenario_categories
//        SET parentscenariocategoryid = ?,
//            categoryname = ?,
//            categoryimage = ?,
//            modifiedby = ?,
//            modifiedon = CURRENT_TIMESTAMP
//        WHERE scenariocategoryid = ? AND deletedon IS NULL`,
//         {
//           replacements: [
//             body.parentscenariocategoryid || null,
//             body.categoryname,
//             body.categoryimage,
//             userid,
//             body.scenariocategoryid,
//           ],
//           type: db.sequelize.QueryTypes.UPDATE,
//         }
//       );

//       return { status: true };
//     } catch (error) {
//       console.error("Error Update Scenario Category:", error);
//       throw error;
//     }
//   };
const update =
  ({ db }) =>
  async (body, userid) => {
    let errors = [];

    const categoryNameCleaned = body.categoryname
      .replace(/\s/g, "")
      .toLowerCase();

    // Check for duplicates
    if (body.parentscenariocategoryid && body.parentscenariocategoryid != 0) {
      const [checkduplicate] = await db.sequelize.query(
        `SELECT scenariocategoryid
         FROM scenario_categories
         WHERE deletedon IS NULL
           AND parentscenariocategoryid = :parentid
           AND LOWER(REPLACE(categoryname, ' ', '')) = :subcategory
           AND scenariocategoryid != :id`,
        {
          replacements: {
            parentid: body.parentscenariocategoryid,
            subcategory: categoryNameCleaned,
            id: body.scenariocategoryid,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (checkduplicate) {
        errors.push("Category name already exists");
      }
    } else {
      const [checkduplicate] = await db.sequelize.query(
        `SELECT scenariocategoryid
         FROM scenario_categories
         WHERE deletedon IS NULL
           AND parentscenariocategoryid IS NULL
           AND LOWER(REPLACE(categoryname, ' ', '')) = :category
           AND scenariocategoryid != :id`,
        {
          replacements: {
            category: categoryNameCleaned,
            id: body.scenariocategoryid,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (checkduplicate) {
        errors.push("Category name already exists");
      }
    }

    if (errors.length > 0) {
      return { status: false, errors };
    }

    try {
      await db.sequelize.query(
        `UPDATE scenario_categories
         SET parentscenariocategoryid = ?,
             categoryname = ?,
             categoryimage = ?,
             categorytype = ?,        
             modifiedby = ?,
             modifiedon = CURRENT_TIMESTAMP
         WHERE scenariocategoryid = ? AND deletedon IS NULL`,
        {
          replacements: [
            body.parentscenariocategoryid || null,
            body.categoryname,
            body.categoryimage,
            body.categorytype || 'Public', 
            userid,
            body.scenariocategoryid,
          ],
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      return { status: true };
    } catch (error) {
      console.error("Error Update Scenario Category:", error);
      throw error;
    }
  };


const deleteById =
  ({ db, validation }) =>
  async (id = null) => {
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
      "UPDATE scenario_categories set deletedon=now() where scenariocategoryid=:_id",
      {
        replacements: { _id: id },
      }
    );
    await db.sequelize.query(
      "UPDATE scenario_categories set deletedon=now() where parentscenariocategoryid=:_id",
      {
        replacements: { _id: id },
      }
    );
    return { status: true, message: "Record has been Deleted Successfully." };
  };

const scenariocategoryverify =
  ({ db, validation }) =>
  async (body) => {
    const errors = [];
    const success = [];
    const CategoryNameSet = new Set();

    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}]/u;

    try {
      for (const element of body) {
        const asset = {
          ...element,
          categoryname: element.categoryname?.trim(),
          subcategoryname: element.subcategoryname?.trim(),
        };
        const scenariocategoryerror = [];

        if (!asset.categoryname) {
          scenariocategoryerror.push({
            field: "categoryname",
            message: "Category name cannot be empty.",
          });
        } else if (typeof asset.categoryname !== "string") {
          scenariocategoryerror.push({
            field: "categoryname",
            message: "Category name must be a string.",
          });
        } else if (emojiRegex.test(asset.categoryname)) {
          scenariocategoryerror.push({
            field: "categoryname",
            message: "Emojis are not allowed in category name.",
          });
        } else {
          if (!/^[a-zA-Z\s-]+$/.test(asset.categoryname)) {
            scenariocategoryerror.push({
              field: "categoryname",
              message:
                "Invalid: Only alphabets, hyphens, and spaces allowed in category name.",
            });
          }
          if (asset.categoryname.length < 3 || asset.categoryname.length > 30) {
            scenariocategoryerror.push({
              field: "categoryname",
              message: "Category name must be between 3 and 30 characters.",
            });
          }
          if (CategoryNameSet.has(asset.categoryname.toLowerCase())) {
            scenariocategoryerror.push({
              field: "categoryname",
              message: `Duplicate category name '${asset.categoryname}' found in request.`,
            });
          } else {
            CategoryNameSet.add(asset.categoryname.toLowerCase());
          }

          let query = `SELECT categoryname FROM scenario_categories WHERE categoryname = ?`;
          const values = [asset.categoryname];
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
              message: `Category name '${asset.categoryname}' already exists.`,
            });
          }
        }

        if (asset.subcategoryname) {
          if (emojiRegex.test(asset.subcategoryname)) {
            scenariocategoryerror.push({
              field: "subcategoryname",
              message: "Emojis are not allowed in sub category name.",
            });
          } else {
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
                field: "subcategoryname",
                message: `Sub Category with name '${asset.subcategoryname}' not found.`,
              });
            }
          }
        }

        if (asset.scenariocategoryid) {
          const idStr = asset.scenariocategoryid.toString();
          if (emojiRegex.test(idStr)) {
            scenariocategoryerror.push({
              field: "scenariocategoryid",
              message: "Emojis are not allowed in scenario category ID.",
            });
          } else if (!/^\d+$/.test(idStr)) {
            scenariocategoryerror.push({
              field: "scenariocategoryid",
              message: "Scenario Category ID must be numeric.",
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
                message: `Scenario Category with ID '${asset.scenariocategoryid}' not found.`,
              });
            }
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
        errors,
        success,
      };
    } catch (error) {
      console.error("scenariocategoryverify error:", error);
      return {
        status: false,
        message: validation.messages.server_error,
      };
    }
  };

const scenariocategoryImport =
  ({ db, validation }) =>
  async (body, user) => {
    try {
      if (!Array.isArray(body) || body.length === 0) {
        return {
          status: false,
          message: "No data provided for import.",
        };
      }

      let insertedscenariosubcategory = [];

      for (const asset of body) {
        if (!asset.categoryname) {
          continue;
        }
        if (
          asset.scenariocategoryid &&
          asset.scenariocategoryid !== "" &&
          asset.scenariocategoryid !== 0
        ) {
          const updateQuery = `
          UPDATE scenario_categories 
          SET categoryname = ?, parentscenariocategoryid =?, modifiedby = ?, modifiedon = CURRENT_TIMESTAMP 
          WHERE scenariocategoryid = ?`;

          const [updatedScenariocategory] = await db.sequelize.query(
            updateQuery,
            {
              replacements: [
                asset.categoryname || "",
                asset.parentscenariocategoryid || null,
                user.userid || 0,
                asset.scenariocategoryid,
              ],
            }
          );

          if (updatedScenariocategory) {
            insertedscenariosubcategory.push(updatedScenariocategory);
          }
        } else {
          const insertQuery = `
            INSERT INTO scenario_categories (categoryname, createdby) 
            VALUES (?, ?)`;

          const parameters = [asset.categoryname || "", user.userid || 0];

          const [newScenariosubcategory] = await db.sequelize.query(
            insertQuery,
            {
              replacements: parameters,
            }
          );

          if (newScenariosubcategory) {
            insertedscenariosubcategory.push(newScenariosubcategory);
          }
        }
      }

      return {
        status: true,
        message: "Record has been imported successfully.",
        inserted_categories: insertedscenariosubcategory,
      };
    } catch (error) {
      console.error("scenariocategoryImport Error:", error);
      return {
        status: false,
        message: validation.messages.server_error,
      };
    }
  };

module.exports = {
  getscenarioAll,
  getScenarioCategorybyId,
  save,
  update,
  deleteById,
  statusChange,
  scenariocategoryverify,
  scenariocategoryImport,
};
