const NotiTemplate = require("../../utils/notiUtility")

const list = ({ db }) => async (usertype, session_userid) => {
  try {
    let whereClause = `WHERE s.deletedon IS NULL`;
    if (usertype === "Instructor") {
      whereClause += ` AND s.instructor_id = :_session_userid`;
    }

    const query = ` SELECT s.scenarioid,s.manipulation_flag, s.scenariouuid, s.scenarioidentification, s.scenario_type, s.scenariotitle, s.scenariodescription, s.scenariolevel, s.network_config, s.scenariocategoryid, s.scenariosubcategoryid, s.scenariodiagram, s.components, s.component_config, s.instruction_file, s.duration, s.scenariostatus, s.scenarioimage, CASE WHEN s.status = 'Active' THEN 'true' ELSE 'false' END AS status, vr.status AS vm_status, vr.vm_steps, vr.requestedby_role, sc.categoryname AS scenariocategory, scc.categoryname AS scenariosubcategory, CONCAT(user.firstname, ' ', user.lastname) AS instructor_name, DATE_FORMAT(s.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(s.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon FROM scenarios s INNER JOIN scenario_categories sc ON sc.scenariocategoryid = s.scenariocategoryid INNER JOIN scenario_categories scc ON scc.scenariocategoryid = s.scenariosubcategoryid LEFT JOIN ad_users user ON user.userid = s.instructor_id LEFT JOIN ( SELECT vr1.* FROM vm_request vr1 INNER JOIN ( SELECT scenarioid, MAX(createdon) AS max_createdon FROM vm_request GROUP BY scenarioid ) vr2 ON vr1.scenarioid = vr2.scenarioid AND vr1.createdon = vr2.max_createdon ) vr ON vr.scenarioid = s.scenarioid ${whereClause} GROUP BY s.scenarioid ORDER BY s.scenariotitle `;

    const res = await db.sequelize.query(query, {
      replacements: { _session_userid: session_userid },
      type: db.sequelize.QueryTypes.SELECT,
    });
    return res;
  } catch (error) {
    console.error("Error in list:", error);
    throw new Error("Failed to fetch scenario list");
  }
};

const changeStatus = ({ db, validation }) => async (body, session_userid) => {
  try {
    const updateQuery = `UPDATE scenarios SET status =?, modifiedon=CURRENT_TIMESTAMP, modifiedby=? WHERE scenarioid=?`;
    const queryParams = [
      body.status == "true" ? "Active" : "Inactive",
      session_userid,
      body.scenarioid,
    ];
    await db.sequelize.query(updateQuery, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.UPDATE,
    });
    return { statusCode: 200, message: validation.messages.status_change };
  } catch (error) {
    console.error("Error Scenario Status:", error);
    throw error;
  }
};
const changeMaipulationStatus = ({ db, validation }) => async (body, session_userid) => {
  try {
    const updateQuery = `UPDATE scenarios SET manipulation_flag =?, modifiedon=CURRENT_TIMESTAMP, modifiedby=? WHERE scenarioid=?`;
    const queryParams = [
      body.status == "true" ? "true" : "false",
      session_userid,
      body.scenarioid,
    ];
    await db.sequelize.query(updateQuery, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.UPDATE,
    });
    return { statusCode: 200, message: validation.messages.status_change };
  } catch (error) {
    console.error("Error Scenario Status:", error);
    throw error;
  }
};
const getById = ({ db }) => async (uuid) => {
  try {
    const res = await db.sequelize.query( `SELECT s.scenarioid, s.scenarioidentification, s.scenariouuid, s.scenariotitle, s.scenariodescription, s.scenariolevel, s.scenariocategoryid, s.scenariosubcategoryid, s.scenariodiagram, s.components, s.component_config, s.network_config, s.instruction_file, s.scenarioimage, s.instructor_id, s.duration, s.scenariostatus, s.publishedon, CASE WHEN s.status = 'Active' THEN 'true' ELSE 'false' END AS status, sc.categoryname AS scenariocategory, scc.categoryname AS scenariosubcategory, CONCAT(user.firstname, ' ', user.lastname) AS instructor_name, DATE_FORMAT(s.createdon , '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(s.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon FROM scenarios s INNER JOIN scenario_categories sc  ON sc.scenariocategoryid  = s.scenariocategoryid INNER JOIN scenario_categories scc ON scc.scenariocategoryid = s.scenariosubcategoryid LEFT  JOIN ad_users user ON user.userid = s.instructor_id WHERE s.deletedon IS NULL AND  s.scenariouuid = :_uuid`,
      {
        replacements: { _uuid: uuid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!res?.length) return null;

    if (res[0].network_config) {
      res[0].network_config = JSON.parse(res[0].network_config);
    }

    res[0].component_count = 0;
    res[0].virtual_cpu = 0;
    res[0].virtual_memory = 0;
    res[0].storage_size = 0;
    res[0].component_images = [];

    if (res[0].component_config) {
      let components = JSON.parse(res[0].component_config);
      res[0].component_count = components.length;

      const componentDetails = {};

      await Promise.all(
        components.map(async (element) => {
          try {
            const compId = element.componentid || element.componentId || element.id;
            if (compId) {
              let [rowData] = await db.sequelize.query(
                `SELECT cores, memory, storage, componentimage
                 FROM components
                 WHERE componentid = ?`,
                {
                  replacements: [compId],
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              if (rowData) {
                componentDetails[compId] = rowData;

                res[0].virtual_cpu += rowData.cores || 0;
                res[0].virtual_memory += rowData.memory || 0;
                res[0].storage_size += parseInt(rowData.storage) || 0;

                if (rowData.componentimage && !res[0].component_images.includes(rowData.componentimage)) {
                  res[0].component_images.push(rowData.componentimage);
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching componentid ${element.componentid}:`, err);
          }
        })
      );

      // --- Update 'components' JSON ---
      if (res[0].components) {
        try {
          let parsedComponents = JSON.parse(res[0].components);

          parsedComponents = parsedComponents.map((comp) => {
            const compId = comp.componentid || comp.componentId || comp.id;
            if (compId && componentDetails[compId]) {
              comp.imageUrl = componentDetails[compId].componentimage;
            }
            return comp;
          });

          res[0].components = JSON.stringify(parsedComponents);
        } catch (err) {
          console.error("Error parsing or updating s.components JSON:", err);
        }
      }

      // --- Update 'scenariodiagram' JSON ---
      if (res[0].scenariodiagram) {
        try {
          const diagramObj = JSON.parse(res[0].scenariodiagram);

          if (diagramObj.nodes && Array.isArray(diagramObj.nodes)) {
            diagramObj.nodes = diagramObj.nodes.map((node) => {
              const componentId =
                node.data?.componentid ||
                node.data?.componentId ||
                node.data?.id ||
                node.data?.component_id;

              if (componentId && componentDetails[componentId]) {
                node.data.image = componentDetails[componentId].componentimage;
              }
              return node;
            });
          }

          res[0].scenariodiagram = JSON.stringify(diagramObj);
        } catch (err) {
          console.error("Error parsing or updating scenariodiagram JSON:", err);
        }
      }
    }

    return res[0];
  } catch (err) {
    console.error("Error in getByUuid:", err);
    throw new Error("Failed to fetch scenario");
  }
};



const create = ({ db }) => async (body, session_userid) => {
  try {
    let [check_scenario] = await db.sequelize.query(`SELECT * FROM scenarios WHERE scenariotitle = :_title AND deletedon IS NULL`,
      {
        replacements: { _title: body.title },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (check_scenario) {
      return { statusCode: 400, message: "The provided title is already registered. Please use a different one.", };
    }
    const insertQuery = `INSERT INTO scenarios (scenarioidentification,scenariotitle, scenariodescription, scenariolevel, scenariocategoryid, scenariosubcategoryid, instruction_file, scenariostatus, duration, scenarioimage, instructor_id, createdby, createdon, publishedon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP,Now()) 
        `;
    const queryParams = [
      body.identification,
      body.title,
      body.description,
      body.level,
      body.scenariocategoryid,
      body.scenariosubcategoryid,
      body.instruction_file,
      body.scenariostatus,
      body.duration,
      body.scenarioimage,
      body.instructor_id,
      session_userid,
    ];
    await db.sequelize.query(insertQuery, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.INSERT,
    });
    const [uuidResult] = await db.sequelize.query(
      `
  SELECT scenariouuid
  FROM scenarios
  WHERE scenarioid = LAST_INSERT_ID();
  `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    return {
      statusCode: 200,
      message: "Scenario created successfully.",
      scenariouuid: uuidResult?.scenariouuid,
    };

  } catch (error) {
    console.error("Error Save Scenario Submit:", error);
    throw error;
  }
};

const update = ({ db }) => async (body, session_userid) => {
  try {
    let [check_scenario] = await db.sequelize.query(`SELECT * FROM scenarios WHERE scenariotitle = :_title AND scenarioid !=:_scenarioid AND deletedon IS NULL`,
      {
        replacements: {
          _title: body.title,
          _scenarioid: body.scenarioid,
        },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (check_scenario) {
      return {
        statusCode: 400, message: "The provided title is already registered. Please use a different one.",
      };
    }
    const updateQuery = `UPDATE scenarios SET scenarioidentification = ?, scenariotitle = ?, scenariodescription = ?, scenariolevel = ?, scenariocategoryid = ?, scenariosubcategoryid = ?, instruction_file = ?, duration = ?, scenarioimage = ?,instructor_id = ?, modifiedby = ?, modifiedon = CURRENT_TIMESTAMP WHERE scenarioid = ?`;
    const queryParams = [ body.identification, body.title, body.description, body.level, body.scenariocategoryid, body.scenariosubcategoryid, body.instruction_file, body.duration, body.scenarioimage, body.instructor_id, session_userid, body.scenarioid,
    ];
    await db.sequelize.query(updateQuery, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.UPDATE,
    });
    return {
      statusCode: 200, message: "Scenario updated successfully.", scenarioid: body.scenarioid,
    };
  } catch (error) {
    console.error("Error Update Scenario:", error);
    throw error;
  }
};
const deleteById = ({ db }) => async (body, session_userid) => {
  try {
    const scenarioId = body.scenarioid;

    /* -------- CHECK ACTIVE VM REQUEST -------- */
    const [activeRequest] = await db.sequelize.query( ` SELECT 1 FROM vm_request WHERE scenarioid = :scenarioId AND status IN ( 'Pending', 'Initializing', 'Start', 'Running', 'Resume', 'Pause' ) LIMIT 1 `,
      {
        replacements: { scenarioId },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (activeRequest) {
      return {
        status: false,
        message:
          "Scenario is currently active or in progress and cannot be deleted.",
      };
    }
    /* -------- GET SCENARIO UUID -------- */
    const [scenario] = await db.sequelize.query( ` SELECT scenariouuid FROM scenarios WHERE scenarioid = :scenarioId AND deletedon IS NULL `,
      {
        replacements: { scenarioId },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!scenario) {
      return {
        status: false,
        message: "Scenario not found or already deleted.",
      };
    }

    /* -------- SOFT DELETE FROM SCENARIOS -------- */
    await db.sequelize.query( ` UPDATE scenarios SET deletedon = NOW(), modifiedby = :modifiedBy WHERE scenarioid = :scenarioId `,
      {
        replacements: {
          scenarioId,
          modifiedBy: session_userid,
        },
      }
    );

    /* -------- SOFT DELETE FROM CUSTOM_SCENARIOS -------- */
    await db.sequelize.query( ` UPDATE custom_scenarios SET deletedon = NOW(), modifiedby = :modifiedBy WHERE custom_scenariouuid = :scenariouuid OR scenarioid = :scenarioId `,
      {
        replacements: {
          scenariouuid: scenario.scenariouuid,
          scenarioId,
          modifiedBy: session_userid,
        },
      }
    );

    return {
      status: true,
      message: "Scenario has been deleted successfully.",
    };
  } catch (error) {
    console.error("Error in deleteById:", error);
    return {
      status: false,
      message: "Failed to delete scenario due to database error.",
    };
  }
};


const saveDiagram = ({ db, validation }) => async (body, session_userid) => {
  const updateQuery = `UPDATE scenarios SET scenariodiagram = ?, components = ?, component_config = ?, network_config = ?, scenariostatus = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ? WHERE scenariouuid = ?`;
  const updateParams = [
    JSON.stringify(body.scenariodiagram), JSON.stringify(body.components), JSON.stringify(body.component_config), JSON.stringify(body.network_config || {}), body.scenariostatus, session_userid, body.scenarioid,];
  try {
    await db.sequelize.query(updateQuery, {
      replacements: updateParams, type: db.sequelize.QueryTypes.UPDATE,
    });
    return { statusCode: 200, message: validation.messages.save_diagram };
  } catch (error) {
    console.error("Error Scenario Update:", error);
    throw error;
  }
};
const scenariodigramlist = ({ db }) => async (scenarioid) => {
  try {
    let query = ` SELECT  s.scenarioid, s.scenariotitle, s.scenarioidentification, s.scenariodiagram, s.duration FROM scenarios s WHERE s.deletedon IS NULL `;
    if (scenarioid) {
      query += ` AND s.scenarioid = :_scenarioid`;
    }

    const scenarios = await db.sequelize.query(query, {
      replacements: { _scenarioid: scenarioid },
      type: db.sequelize.QueryTypes.SELECT,
    });

    for (let scenario of scenarios) {
      // Step 1: Parse diagram
      let parsedDiagram = {};
      try {
        parsedDiagram = JSON.parse(scenario.scenariodiagram || "{}");
      } catch (e) {
        console.warn("Failed to parse scenariodiagram for scenarioid", scenario.scenarioid);
      }

      // Step 2: Get componentIds from diagram
      const componentIds = new Set();
      if (parsedDiagram?.nodes?.length) {
        parsedDiagram.nodes.forEach((node) => {
          if (node?.data?.componentId) {
            componentIds.add(node.data.componentId);
          }
        });
      }

      // Step 3: Fetch components from table
      let components = [];
      if (componentIds.size > 0) {
        const componentList = await db.sequelize.query(
          `SELECT componentid AS id, componentname AS label, componentimage AS imageUrl, network_ports AS networkport 
           FROM components 
           WHERE deletedon IS NULL AND componentid IN (:ids)`,
          {
            replacements: { ids: Array.from(componentIds) },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        // Optional: Parse networkport if stored as stringified JSON
        components = componentList.map((comp) => {
          try {
            comp.networkport = JSON.parse(comp.networkport || "[]");
          } catch (e) {
            comp.networkport = [];
          }
          return comp;
        });
      }

      // Step 4: Attach final fields to scenario object
      scenario.scenariodiagram = parsedDiagram;
      scenario.components = components;
    }

    return { success: true, data: scenarios };
  } catch (error) {
    console.error("Error fetching scenario diagrams:", error);
    return {
      success: false,
      message: "Failed to fetch scenario diagrams",
      error,
    };
  }
};


const saveComponentconfiguration = ({ db, validation }) => async (body, session_userid) => {
  console.log("bodybodybodybodybodybodybody",body);
  
  try {
    if (
      !body.scenarioid ||
      !body.component_config ||
      !Array.isArray(body.component_config) ||
      !body.network_config ||
      !Array.isArray(body.network_config) ||
      !body.scenariostatus
    ) {
      return {
        statusCode: 400, message: 'Missing or invalid required fields',
      };
    }

    const updateQuery = `UPDATE scenarios SET component_config = ?, network_config = ?, scenariostatus = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ?, publishedon = NOW() WHERE scenariouuid = ?`;
    const updateParams = [JSON.stringify(body.component_config), JSON.stringify(body.network_config), body.scenariostatus, session_userid, body.scenarioid,
    ];
    await db.sequelize.query(updateQuery, { replacements: updateParams, type: db.sequelize.QueryTypes.UPDATE, });
    if (body.scenariostatus === 'Publish') {;
      new NotiTemplate(db, 'publish_scenario', { learner_id: 0, scenarioid: body.scenarioid }, 'System', '0');
      // await noti.send();
    }
    return { statusCode: 200, message: validation.messages.save_component_configuration, };
  } catch (error) {
    console.error('Error Scenario Update:', error);
    throw error;
  }
};

const exportList = ({ db }) => async (session_userid) => {
  try {
    let query = ` SELECT  se.exportid, se.scenarioid, se.userid, se.learner_id, se.file_name, se.status, DATE_FORMAT(se.createdon, '%Y-%m-%d %H:%i:%s') AS createdon, DATE_FORMAT(se.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon, s.scenariotitle, s.scenarioidentification, s.scenario_type, CONCAT(u.firstname, ' ', u.lastname) AS exported_by FROM scenario_export se INNER JOIN scenarios s ON s.scenarioid = se.scenarioid LEFT JOIN ad_users u ON u.userid = se.userid WHERE se.deletedon IS NULL AND se.userid = :_session_userid   -- Filter only by userid ORDER BY se.exportid DESC `;

    const res = await db.sequelize.query(query, {
      replacements: { _session_userid: session_userid },
      type: db.sequelize.QueryTypes.SELECT
    });
    return res;
  } catch (error) {
    console.error("Error in exportList:", error);
    throw new Error("Failed to fetch scenario export list");
  }
};

const createExport = ({ db, validation }) => async (body, userid) => {
  if (!userid) {
    throw new Error("User ID is required.");
  }
  const generatedFileName = `scenario_${body.scenarioid}.zip`;
  const result = await db.sequelize.query(
    `INSERT INTO scenario_export
      (scenarioid, userid, learner_id, status, file_name, createdon)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    {
      replacements: [
        body.scenarioid,
        userid,
        body.learner_id ?? null,
        body.status ?? "Inprogress",
        generatedFileName,  
      ],
      type: db.sequelize.QueryTypes.INSERT,
    }
  );
  const exportid = result[0];
  return {
    statusCode: 200,
    message: "Scenario Export created successfully",
    exportid,   
    scenarioid: body.scenarioid,
    file_name: generatedFileName,
  };
};

const getTabList = ({ db }) => async () => {
  try {
    const [res] = await db.sequelize.query(`SELECT  scenariotabid, tab_name, tab_status, event_status, tab_type, widget_url, tab_ordering, createdon, modifiedon FROM scenario_tabs`);
    return res;
  } catch (error) {
    console.error("Error fetching scenario tab list:", error);
    throw error;
  }
};


module.exports = {
  list,
  update,
  deleteById,
  getById,
  changeStatus,
  changeMaipulationStatus,
  create,
  saveDiagram,
  scenariodigramlist,
  saveComponentconfiguration,
  exportList,
  createExport,
  getTabList
};
