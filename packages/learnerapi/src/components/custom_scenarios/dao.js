const NotiTemplate = require("../../utils/notiUtility");
const { v4: uuidv4 } = require("uuid");

const list =
  ({ db }) =>
  async (learnerId) => {
    try {
      const query = `
      SELECT 
        s.custom_scenarioid,
        s.custom_scenariouuid,
        s.scenarioidentification,
        s.scenariotitle,
        s.scenariodescription,
        s.scenariolevel,
        s.scenariocategoryid,
        s.scenariosubcategoryid,
        s.approval_status,
        s.scenariodiagram,
        s.components,
        s.component_config,
        s.instruction_file,
        s.duration,
        s.scenariostatus,
        s.scenarioimage,
        CASE 
          WHEN s.status = 'Active' THEN 'true' 
          ELSE 'false' 
        END AS status,
        sc.categoryname AS scenariocategory,
        scc.categoryname AS scenariosubcategory,
        DATE_FORMAT(s.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
        DATE_FORMAT(s.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
      FROM custom_scenarios s
      INNER JOIN scenario_categories sc 
        ON sc.scenariocategoryid = s.scenariocategoryid
      INNER JOIN scenario_categories scc 
        ON scc.scenariocategoryid = s.scenariosubcategoryid
        WHERE s.learner_id = :learnerId
      ORDER BY s.scenariotitle;
    `;

      const res = await db.sequelize.query(query, {
        replacements: { learnerId },
        type: db.sequelize.QueryTypes.SELECT,
      });

      return res;
    } catch (error) {
      console.error("Error in list:", error);
      throw new Error("Failed to fetch scenario list");
    }
  };

const changeStatus =
  ({ db, validation }) =>
  async (body, session_userid) => {
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
const getById =
  ({ db }) =>
  async (uuid) => {
    try {
      const res = await db.sequelize.query(
        `SELECT s.custom_scenarioid, s.scenarioidentification, s.custom_scenariouuid, s.scenariotitle, s.scenariodescription,
              s.scenariolevel, s.scenariocategoryid,s.reject_reason, s.scenariosubcategoryid, s.scenariodiagram, s.components,
              s.component_config, s.network_config, s.instruction_file, s.scenarioimage, s.instructor_id,
              s.duration, s.scenariostatus, s.publishedon,
              CASE WHEN s.status = 'Active' THEN 'true' ELSE 'false' END AS status,
              sc.categoryname AS scenariocategory, scc.categoryname AS scenariosubcategory,
              CONCAT(user.firstname, ' ', user.lastname) AS instructor_name,
              DATE_FORMAT(s.createdon , '%Y-%m-%d %H:%i:%s') AS createdon,
              DATE_FORMAT(s.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
       FROM custom_scenarios s
       INNER JOIN scenario_categories sc  ON sc.scenariocategoryid  = s.scenariocategoryid
       INNER JOIN scenario_categories scc ON scc.scenariocategoryid = s.scenariosubcategoryid
       LEFT  JOIN ad_users user ON user.userid = s.instructor_id
       WHERE s.deletedon IS NULL AND s.custom_scenariouuid = :_uuid`,
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
              const compId =
                element.componentid || element.componentId || element.id;
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

                  if (
                    rowData.componentimage &&
                    !res[0].component_images.includes(rowData.componentimage)
                  ) {
                    res[0].component_images.push(rowData.componentimage);
                  }
                }
              }
            } catch (err) {
              console.error(
                `Error fetching componentid ${element.componentid}:`,
                err
              );
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
                  node.data.image =
                    componentDetails[componentId].componentimage;
                }
                return node;
              });
            }

            res[0].scenariodiagram = JSON.stringify(diagramObj);
          } catch (err) {
            console.error(
              "Error parsing or updating scenariodiagram JSON:",
              err
            );
          }
        }
      }

      return res[0];
    } catch (err) {
      console.error("Error in getByUuid:", err);
      throw new Error("Failed to fetch scenario");
    }
  };

const create =
  ({ db }) =>
  async (body, learner_id) => {
    console.log("vvvvvvvvvvvvvvvvvvvvvvvvvv", body);

    try {
      const [existing] = await db.sequelize.query(
        `
        SELECT custom_scenarioid 
        FROM custom_scenarios 
        WHERE scenarioidentification = ? 
          AND status = 'Active'
        LIMIT 1;
        `,
        {
          replacements: [body.identification],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (existing) {
        return {
          statusCode: 400,
          message: "Identification number already exists.",
        };
      }

      const insertQuery = `
        INSERT INTO custom_scenarios (
          custom_scenariouuid,
          scenarioidentification,
          scenariotitle,
          scenariodescription,
          scenariolevel,
          scenariocategoryid,
          scenariosubcategoryid,
          instruction_file,
          scenariostatus,
          duration,
          scenarioimage,
          approval_status,
          learner_id,
          createdby,
          createdon,
          publishedon
        )
        VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NOW()
        )
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
        "Pending",
        learner_id,
        learner_id,
      ];

      await db.sequelize.query(insertQuery, {
        replacements: queryParams,
        type: db.sequelize.QueryTypes.INSERT,
      });

      // const [idResult] = await db.sequelize.query(
      //   `SELECT LAST_INSERT_ID() AS custom_scenarioid;`,
      //   {
      //     type: db.sequelize.QueryTypes.SELECT,
      //   }
      // );

      // return {
      //   statusCode: 200,
      //   message: "Scenario created successfully.",
      //   custom_scenarioid: idResult?.custom_scenarioid,
      // };
      const [uuidResult] = await db.sequelize.query(
        `
  SELECT custom_scenariouuid
  FROM custom_scenarios
  WHERE custom_scenarioid = LAST_INSERT_ID();
  `,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      return {
        statusCode: 200,
        message: "Scenario created successfully.",
        custom_scenariouuid: uuidResult?.custom_scenariouuid,
      };
    } catch (error) {
      console.error("Error Save Scenario Submit:", error);
      throw error;
    }
  };

const update =
  ({ db }) =>
  async (body, learner_id) => {
    console.log("vvvvvvvvvvvvvvvvvvvvfffffffffvvvvvv", body);

    try {
      // CHECK DUPLICATE IDENTIFICATION (EXCEPT CURRENT SCENARIO)
      const [existing] = await db.sequelize.query(
        `
        SELECT custom_scenarioid 
        FROM custom_scenarios 
        WHERE scenarioidentification = ?
          AND custom_scenarioid != ?
          AND status = 'Active'
        LIMIT 1;
        `,
        {
          replacements: [body.identification, body.custom_scenarioid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (existing) {
        return {
          statusCode: 400,
          message: "Identification number already exists.",
        };
      }

      // UPDATE QUERY
      const updateQuery = `
        UPDATE custom_scenarios 
        SET 
          scenarioidentification = ?, 
          scenariotitle = ?, 
          scenariodescription = ?, 
          scenariolevel = ?, 
          scenariocategoryid = ?, 
          scenariosubcategoryid = ?, 
          instruction_file = ?, 
          scenariostatus = ?, 
          duration = ?, 
          scenarioimage = ?, 
          approval_status = ?, 
          modifiedby = ?, 
          modifiedon = CURRENT_TIMESTAMP 
        WHERE custom_scenarioid = ?
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
        body.approval_status || "Pending",
        learner_id,
        body.custom_scenarioid,
      ];

      await db.sequelize.query(updateQuery, {
        replacements: queryParams,
        type: db.sequelize.QueryTypes.UPDATE,
      });

      return {
        statusCode: 200,
        message: "Scenario updated successfully.",
        custom_scenarioid: body.custom_scenariouuid,
      };
    } catch (error) {
      console.error("Error Update Custom Scenario:", error);
      throw error;
    }
  };

const deleteById =
  ({ db }) =>
  async (body, session_userid) => {
    try {
      const scenarioId = body.scenarioid;

      // Check if the scenario is currently running
      const [running] = await db.sequelize.query(
        `SELECT sl.scenariolearnerid
       FROM scenario_learner sl
       WHERE sl.scenarioid = :scenarioId
       AND sl.status = 'Running'`,
        {
          replacements: { scenarioId },
        }
      );

      if (running.length > 0) {
        return {
          status: false,
          message: "Scenario is currently running and cannot be deleted.",
        };
      }

      // Soft delete scenario if not running
      await db.sequelize.query(
        `UPDATE scenarios 
       SET deletedon = NOW(), modifiedby = :modifiedBy 
       WHERE scenarioid = :scenarioId`,
        {
          replacements: {
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
      throw new Error("Failed to delete scenario due to database error.");
    }
  };

const saveDiagram =
  ({ db, validation }) =>
  async (body, session_userid) => {
    console.log("scenarioIdscenarioIdscenarioIdscenarioIdscenarioId", body);

    const updateQuery = `
  UPDATE custom_scenarios 
  SET scenariodiagram = ?, 
      components = ?, 
      component_config = ?, 
      network_config = ?, 
      scenariostatus = ?, 
      approval_status = ?,    
      modifiedon = CURRENT_TIMESTAMP, 
      modifiedby = ? 
  WHERE custom_scenariouuid = ?`;

    const updateParams = [
      JSON.stringify(body.scenariodiagram),
      JSON.stringify(body.components),
      JSON.stringify(body.component_config),
      JSON.stringify(body.network_config || {}),
      body.scenariostatus,
      body.approval_status || "Pending", // ✅ default to Pending
      session_userid,
      body.scenarioid,
    ];

    try {
      // ✅ Step 1: Update the scenario
      await db.sequelize.query(updateQuery, {
        replacements: updateParams,
        type: db.sequelize.QueryTypes.UPDATE,
      });
      const [scenarioDetails] = await db.sequelize.query(
        `SELECT 
      cs.scenariotitle,
      CONCAT(l.firstname, ' ', l.lastname) AS learner_name,
      l.learner_id
   FROM custom_scenarios cs
   JOIN learners l ON l.learner_id = cs.learner_id
   WHERE cs.custom_scenariouuid = ?`,
        {
          replacements: [body.scenarioid],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (scenarioDetails) {
        // ✅ Step 3: Fire notification after successful update
        new NotiTemplate(
          db,
          "scenario_approval",
          {
            scenariotitle: scenarioDetails.scenariotitle,
            learner_name: scenarioDetails.learner_name,
            learner_id: scenarioDetails.learner_id,
            scenarioid: body.scenarioid,
            userid: 0,
          },
          "Admin",
          "0"
        );
      }

      return { statusCode: 200, message: validation.messages.save_diagram };
    } catch (error) {
      console.error("Error Scenario Update:", error);
      throw error;
    }
  };

const scenariodigramlist =
  ({ db }) =>
  async (scenarioid) => {
    try {
      let query = `
      SELECT 
        s.custom_scenarioid,
        s.scenariotitle,
        s.scenarioidentification,
        s.scenariodiagram,
        s.duration
      FROM custom_scenarios s
      WHERE s.deletedon IS NULL
    `;
      if (scenarioid) {
        query += ` AND s.scenarioid = :_custom_scenarioid`;
      }

      const scenarios = await db.sequelize.query(query, {
        replacements: { _custom_scenarioid: scenarioid },
        type: db.sequelize.QueryTypes.SELECT,
      });

      for (let scenario of scenarios) {
        let parsedDiagram = {};
        try {
          parsedDiagram = JSON.parse(scenario.scenariodiagram || "{}");
        } catch (e) {
          console.warn(
            "Failed to parse scenariodiagram for scenarioid",
            scenario.scenarioid
          );
        }
        const componentIds = new Set();
        if (parsedDiagram?.nodes?.length) {
          parsedDiagram.nodes.forEach((node) => {
            if (node?.data?.componentId) {
              componentIds.add(node.data.componentId);
            }
          });
        }
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
          components = componentList.map((comp) => {
            try {
              comp.networkport = JSON.parse(comp.networkport || "[]");
            } catch (e) {
              comp.networkport = [];
            }
            return comp;
          });
        }
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

const saveComponentconfiguration =
  ({ db, validation }) =>
  async (body, session_userid) => {
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
          statusCode: 400,
          message: "Missing or invalid required fields",
        };
      }

      const updateQuery = `UPDATE scenarios SET component_config = ?, network_config = ?, scenariostatus = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ?, publishedon = NOW() WHERE scenarioid = ?`;
      const updateParams = [
        JSON.stringify(body.component_config),
        JSON.stringify(body.network_config),
        body.scenariostatus,
        session_userid,
        body.scenarioid,
      ];
      await db.sequelize.query(updateQuery, {
        replacements: updateParams,
        type: db.sequelize.QueryTypes.UPDATE,
      });
      if (body.scenariostatus === "Publish") {
        new NotiTemplate(
          db,
          "publish_scenario",
          { learner_id: 0, scenarioid: body.scenarioid },
          "System",
          "0"
        );
      }
      return {
        statusCode: 200,
        message: validation.messages.save_component_configuration,
      };
    } catch (error) {
      console.error("Error Scenario Update:", error);
      throw error;
    }
  };
const getScenarioInstructionFiles =
  ({ db }) =>
  async (scenarioIds) => {
    if (!Array.isArray(scenarioIds) || scenarioIds.length === 0) return [];
    const placeholders = scenarioIds.map(() => "?").join(",");
    const query = `
    SELECT scenarioid, scenariotitle, instruction_file 
    FROM scenarios 
    WHERE scenarioid IN (${placeholders})
  `;

    const rows = await db.sequelize.query(query, {
      replacements: scenarioIds,
      type: db.sequelize.QueryTypes.SELECT,
    });
    return rows;
  };

module.exports = {
  list,
  update,
  deleteById,
  getById,
  changeStatus,
  create,
  saveDiagram,
  scenariodigramlist,
  saveComponentconfiguration,
  getScenarioInstructionFiles,
};
