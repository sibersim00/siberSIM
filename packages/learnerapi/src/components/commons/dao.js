const theme =
  ({ db }) =>
  async (learner_id, themeParam) => {
    try {
      // If themeParam is provided -> sanitize and update
      if (typeof themeParam !== "undefined" && themeParam !== null) {
        const t =
          String(themeParam).toLowerCase() === "dark" ? "dark" : "light";
        await db.sequelize.query(
          `UPDATE learners SET theme_preference = :_theme WHERE learner_id = :_learner_id`,
          {
            replacements: {
              _learner_id: learner_id,
              _theme: t,
            },
          }
        );
        return t;
      }

      // Otherwise fetch current theme
      const rows = await db.sequelize.query(
        `SELECT theme_preference FROM learners WHERE learner_id = :_learner_id`,
        {
          replacements: { _learner_id: learner_id },
          type: db.sequelize.QueryTypes.SELECT,  
          
        
        }
      );

      if (rows && rows.length > 0) {
      return rows[0].theme_preference || "dark";
    }
    return "dark";
    } catch (error) {
      throw error;
    }
  };

  const componentcategorylist = ({ db }) => async () => {
    try {
      let [result] = await db.sequelize.query(
        `select componentcategoryid,categoryname as componentcategory from component_categories where status = 'Active' and deletedon is NULL  ORDER by componentcategory ASC`
      );
      return result;
    } catch (error) {
      throw error;
    }
  };

  const componentsubcategorylist = ({ db, body }) => async () => {
    let componentcategoryid = body.componentcategoryid;
    try {
      let [result] = await db.sequelize.query(
        `select componentsubcategoryid,categoryname as componentsubcategory from component_subcategories where status = 'Active' and componentcategoryid="${componentcategoryid}" and  deletedon is NULL  ORDER by CASE WHEN modifiedon IS NOT NULL then modifiedon ELSE createdon END  DESC`
      );
      return result;
    } catch (error) {
      throw error;
    }
  };
const scenariocomponentcategorylist = async (db, componentcategoryid) => {
  try {
    const [rows] = await db.sequelize.query(` SELECT  componentid, network_ports, vmid, componenttype, vmid_name AS vmname, componentimage AS imageurl, storage, memory, duration FROM components WHERE status = 'Active' AND deletedon IS NULL AND componentcategoryid = :componentcategoryid ORDER BY vmname; `, {
      replacements: { componentcategoryid },
    });

    const result = [];

    for (const row of rows) {
      let parsedPorts = [];
      try {
        const rawPorts = JSON.parse(row.network_ports || '[]');
        if (Array.isArray(rawPorts)) {
          parsedPorts = rawPorts.map((val, idx) =>
            typeof val === 'object' ? val : { [`net${idx}`]: val }
          );
        } else if (typeof rawPorts === 'object') {
          parsedPorts = Object.entries(rawPorts).map(([k, v]) => ({ [k]: v }));
        }
      } catch (err) {
        console.warn(`Failed to parse network_ports for vmid ${row.vmid}`, err);
      }

      result.push({
        componentid: row.componentid || 0,
        networkport: parsedPorts,
        imageurl: row.imageurl || null,
        vmid: row.vmid || 0,
        componenttype: row.componenttype || 0,
        vmname: row.vmname || "",
        storage: row.storage || "",
        memory: row.memory || 0,
        duration: row.duration || 0
      });
    }

    return result;
  } catch (error) {
    console.error('DAO error:', error);
    throw error;
  }
};


const scenariocategorylist = ({ db }) => async () => {
  try {
    let [result] = await db.sequelize.query(
      `select scenariocategoryid, categoryname as scenariocategory from scenario_categories where categorytype = 'Private' and deletedon is NULL ORDER by categoryname`
    );
    return result;
  } catch (error) {
    throw error;
  }
};
const scenariosubcategorylist = ({ db }) => async (body) => {
  let scenariocategoryid = body.scenariocategoryid;

  try {
    let [result] = await db.sequelize
      .query(`select sc.scenariocategoryid,sc.parentscenariocategoryid,sc.categoryname as scenariocategory,scc.categoryname as parentscenariocategory from scenario_categories sc left join  scenario_categories scc on scc.scenariocategoryid= sc.parentscenariocategoryid
      where sc.status = 'Active' and sc.parentscenariocategoryid!='0' and sc.parentscenariocategoryid="${scenariocategoryid}"  and sc.deletedon is NULL ORDER by sc.categoryname`);
    return result;
  }  catch (error) {
    throw error;
  }
};

module.exports = {
  theme,
  componentcategorylist,
  componentsubcategorylist,
  scenariocomponentcategorylist,
  scenariocategorylist,
  scenariosubcategorylist
};
