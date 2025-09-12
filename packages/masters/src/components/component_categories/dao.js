const componentCategorylist =
  ({ db }) =>
  async () => {
    try {
      let [result] = await db.sequelize.query(
        `SELECT mcc.componentcategoryid,mcc.categoryname as parentcategoryname,mcc.description,mcc.categoryimage, CASE  WHEN mcc.status = 'Active' THEN 'true'   ELSE 'false' END AS status,DATE_FORMAT(mcc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,DATE_FORMAT(mcc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon FROM component_categories mcc  where mcc.deletedon is NULL ORDER by CASE WHEN mcc.modifiedon IS NOT NULL then mcc.modifiedon ELSE mcc.createdon END  DESC;`
      );
      return result;
    } catch (error) {
      console.log("componentcategory err==>", error);
    }
  };

const getComponentCategory =
  ({ db }) =>
  async (id) => {
    try {
      let [result] = await db.sequelize.query(
        'SELECT mcc.componentcategoryid,mcc.categoryname as parentcategoryname,mcc.description,mcc.categoryimage, CASE  WHEN mcc.status = "Active" THEN "true"   ELSE "false"  END AS status,mcc.createdon,mcc.modifiedon FROM component_categories mcc  where  mcc.deletedon IS NULL and mcc.componentcategoryid=:_id;',
        {
          replacements: {
            _id: id,
          },
        }
      );
      return result;
    } catch (error) {
      console.log("componentcategory err==>", error);
    }
  };

const saveComponentCategory =
  ({ db, validation }) =>
  async (body, userid) => {
    let errors = [];

    const checkCategoryName = await db.sequelize.query(
      `SELECT componentcategoryid 
       FROM component_categories 
       WHERE deletedon IS NULL 
       AND LOWER(REPLACE(categoryname, ' ', '')) = LOWER(REPLACE(:categoryname, ' ', ''))`,
      {
        replacements: { categoryname: body.name },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (checkCategoryName.length > 0) {
      errors.push(validation.messages.category_name_duplicate);
      return { success: false, errors };
    }

    try {
      await db.sequelize.query(
        `INSERT INTO component_categories (categoryname, description,categoryimage, createdby, createdon) 
         VALUES (?, ?, ?, ?, NOW())`,
        {
          replacements: [body.name, body.description,body.categoryimage, userid],
        }
      );
      return { success: true };
    } catch (error) {
      console.error("Error saving category data:", error);
      return { success: false, errors: [error.message] };
    }
  };



const updateComponentCategory =
  ({ db, validation }) =>
  async (body, userid) => {
    let errors = [];

    let checkCategoryName = await db.sequelize.query(
      `SELECT DISTINCT(componentcategoryid) as componentcategoryid 
       FROM component_categories 
       WHERE componentcategoryid != :componentcategoryid 
         AND deletedon IS NULL 
         AND LOWER(REPLACE(categoryname, ' ', '')) = LOWER(REPLACE(:categoryname, ' ', ''))`,
      {
        replacements: {
          componentcategoryid: body.componentcategoryid,
          categoryname: body.name,
        },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (checkCategoryName.length > 0) {
      errors.push(validation.messages.category_name_duplicate);
    }

    if (errors.length > 0) {
      return { success: false, errors: errors };
    }

    const updateQuery = `UPDATE component_categories 
                         SET categoryname = ?, 
                             description = ?, 
                             categoryimage = ?,
                             modifiedon = CURRENT_TIMESTAMP, 
                             modifiedby = ? 
                         WHERE componentcategoryid = ?`;
    const updateParams = [
      body.name,
      body.description,
      body.categoryimage,
      userid,
      body.componentcategoryid,
    ];

    try {
      await db.sequelize.query(updateQuery, {
        replacements: updateParams,
        type: db.sequelize.QueryTypes.UPDATE,
      });

      return { success: true };
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

const changestatus =
  ({ db }) =>
  async (body, loginId) => {
    const status = body.status == "true" ? "Active" : "Inactive";
    let [res] = await db.sequelize.query(
      `UPDATE component_categories set status = '${status}',modifiedon = now(), modifiedby = '${loginId}' where componentcategoryid=:_id`,
      {
        replacements: {
          _id: body.componentcategoryid,
        },
      }
    );
    return res;
  };

const deleteCategory =
  ({ db, validation }) =>
  async (body) => {
    let errors = [];
    let checkCategoryData = await db.sequelize.query(
      `SELECT DISTINCT(	componentsubcategoryid) as	componentsubcategoryid FROM component_subcategories WHERE deletedon IS  NULL and   componentcategoryid=:_id `,
      {
        replacements: { _id: body.componentcategoryid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (checkCategoryData.length > 0) {
      errors.push(validation.messages.category_already_mapped);
    }
    if (errors.length > 0) {
      return { status: false, errors: errors };
    }
    let [res] = await db.sequelize.query(
      "UPDATE component_categories set deletedon=now() where componentcategoryid=:_id",
      {
        replacements: {
          _id: body.componentcategoryid,
        },
      }
    );
    return { status: true, message: validation.messages.delete_success };
  };

const verifyCategory =
  ({ db, validation }) =>
  async (body) => {
    const errors = [];
    const success = [];
    const ComponentIdSet = new Set();
    const CategoryNameSet = new Set();

    // Emoji regex
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}]/u;

    try {
      for (const element of body) {
        const category = {
          ...element,
          categoryname: element.categoryname?.trim(),
          description: element.description?.trim(),
        };
        const categoryErrors = [];

        // === categoryname validation ===
        if (!category.categoryname) {
          categoryErrors.push({
            field: "categoryname",
            message: "Category name cannot be empty.",
          });
        } else if (typeof category.categoryname !== "string") {
          categoryErrors.push({
            field: "categoryname",
            message: "Category name must be a string.",
          });
        } else if (emojiRegex.test(category.categoryname)) {
          categoryErrors.push({
            field: "categoryname",
            message: "Emojis are not allowed in category name.",
          });
        } else {
          if (!/^[a-zA-Z\s-]+$/.test(category.categoryname)) {
            categoryErrors.push({
              field: "categoryname",
              message:
                "Invalid: Only alphabets, hyphens, and spaces allowed in category name.",
            });
          }
          if (
            category.categoryname.length < 3 ||
            category.categoryname.length > 30
          ) {
            categoryErrors.push({
              field: "categoryname",
              message: "Category name must be between 3 and 30 characters.",
            });
          }
          if (CategoryNameSet.has(category.categoryname.toLowerCase())) {
            categoryErrors.push({
              field: "categoryname",
              message: `Duplicate category name '${category.categoryname}' found in request.`,
            });
          } else {
            CategoryNameSet.add(category.categoryname.toLowerCase());
          }

          // DB duplicate check
          let query = `SELECT categoryname FROM component_categories WHERE categoryname = ?`;
          const values = [category.categoryname];
          if (category.componentcategoryid) {
            query += ` AND componentcategoryid != ?`;
            values.push(category.componentcategoryid);
          }

          const duplicateCategories = await db.sequelize.query(query, {
            replacements: values,
            type: db.sequelize.QueryTypes.SELECT,
          });

          if (duplicateCategories.length > 0) {
            categoryErrors.push({
              field: "categoryname",
              message: `Category name '${category.categoryname}' already exists.`,
            });
          }
        }

        // === description validation (optional) ===
        if (category.description) {
          if (typeof category.description !== "string") {
            categoryErrors.push({
              field: "description",
              message: "Description must be a string.",
            });
          } else if (emojiRegex.test(category.description)) {
            categoryErrors.push({
              field: "description",
              message: "Emojis are not allowed in description.",
            });
          }
        }

        // === componentcategoryid validation (optional) ===
        if (category.componentcategoryid) {
          const idStr = category.componentcategoryid.toString();
          if (emojiRegex.test(idStr)) {
            categoryErrors.push({
              field: "componentcategoryid",
              message: "Emojis are not allowed in component category ID.",
            });
          } else if (!/^\d+$/.test(idStr)) {
            categoryErrors.push({
              field: "componentcategoryid",
              message: "Component category ID must be numeric.",
            });
          } else {
            const checkQuery = `SELECT componentcategoryid FROM component_categories WHERE componentcategoryid = ?`;
            const checkResult = await db.sequelize.query(checkQuery, {
              replacements: [category.componentcategoryid],
              type: db.sequelize.QueryTypes.SELECT,
            });

            if (checkResult.length === 0) {
              categoryErrors.push({
                field: "componentcategoryid",
                message: `Component category ID '${category.componentcategoryid}' not found.`,
              });
            }

            if (ComponentIdSet.has(category.componentcategoryid)) {
              categoryErrors.push({
                field: "componentcategoryid",
                message: `Duplicate componentcategoryid '${category.componentcategoryid}' found in request.`,
              });
            } else {
              ComponentIdSet.add(category.componentcategoryid);
            }
          }
        }

        // === Final Result Push ===
        if (categoryErrors.length > 0) {
          category.issues = categoryErrors;
          errors.push(category);
        } else {
          category.issues = [];
          success.push(category);
        }
      }

      return {
        status: true,
        errors,
        success,
      };
    } catch (error) {
      console.error("verifyCategory error:", error.message);
      return {
        status: false,
        message: validation.messages.server_error,
      };
    }
  };

const importCategory =
  ({ db, validation }) =>
  async (body, userID) => {
    let errors = [];
    for (let i = 0; i < body.length; i++) {
      const category = body[i];
      let checkCategoryName = await db.sequelize.query(
        `SELECT DISTINCT(componentcategoryid) as componentcategoryid FROM component_categories WHERE deletedon IS NULL AND LOWER(REPLACE(categoryname, ' ', '')) = LOWER(REPLACE(:categoryname, ' ', ''))`,
        {
          replacements: { categoryname: category.categoryname },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (checkCategoryName.length > 0) {
        errors.push("Component category name already exists.");
      }

      if (errors.length > 0) {
        return { success: false, errors: errors };
      }

      try {
        if (category.id) {
          await db.sequelize.query(
            `UPDATE component_categories SET categoryname = :name, description = :description, modifiedby = :userID, modifiedon = now() WHERE componentcategoryid = :id`,
            {
              replacements: {
                name: category.categoryname,
                description: category.description || null,
                userID: userID,
                id: category.id,
              },
            }
          );
        } else {
          await db.sequelize.query(
            `INSERT INTO component_categories (categoryname, description, createdby, createdon) VALUES (:name, :description, :userID, now())`,
            {
              replacements: {
                name: category.categoryname,
                description: category.description || null,
                userID: userID,
              },
            }
          );
        }
      } catch (error) {
        console.error("Error saving category data:", error);
        return {
          success: false,
          errors: ["Failed to import category. Please try again."],
        };
      }
    }
    return { success: true, message: "Record has been imported successfully." };
  };

module.exports = {
  componentCategorylist,
  getComponentCategory,
  saveComponentCategory,
  updateComponentCategory,
  changestatus,
  deleteCategory,
  verifyCategory,
  importCategory,
};
