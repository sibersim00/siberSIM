const { v4: uuidv4 } = require("uuid");

const getRunningInviteLearners =
  ({ db }) =>
  async (learner_sessionid) => {
    try {
      const result = await db.sequelize.query(
        `
      SELECT
          il.invitelearnerid,il.vmrequestid,il.invited_by_learner_id,il.learnerid,vr.status,vr.vm_steps,s.scenarioid,s.scenariotitle,s.scenariolevel,s.scenarioidentification,s.scenariouuid,
          CONCAT(l.firstname, ' ', l.lastname) AS learner_name
      FROM invite_learner il
      JOIN vm_request vr 
          ON il.vmrequestid = vr.vmrequestid
      JOIN scenarios s
          ON vr.scenarioid = s.scenarioid
        LEFT JOIN learners l 
        ON l.learner_id = il.invited_by_learner_id

      WHERE il.deletedon IS NULL
      AND il.modifiedon IS NULL
      AND il.learnerid = :learnerid
      AND vr.status IN ('Start','Pause','Resume')
      AND vr.vm_steps = 'Running'
      AND s.deletedon IS NULL
      `,
        {
          replacements: { learnerid: learner_sessionid },
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      return result;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  };

const getInviteScenarioByID =
  ({ db }) =>
  async (scenarioUUID, learner_id) => {
    try {
      let result = await db.sequelize.query(
        `
        SELECT vr.vmrequestid, vr.requestedby_id, il.invited_by_learner_id, vr.scenariodiagram, s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenarioidentification, s.scenariodescription, s.scenariolevel, s.components, s.instruction_file, s.component_config, sc.categoryname AS scenariocategory_name, ssc.categoryname AS scenariosubcategory_name, s.duration, s.manipulation_flag, vr.status, vr.vm_steps, vr.timer, vr.isnotitermination, vr.isedit, vr.edit_by,
            CASE
              WHEN vr.status = 'Start' THEN
                SEC_TO_TIME(TIMESTAMPDIFF(SECOND, vr.startedon, NOW()))
              WHEN vr.status = 'Resume'
                   AND vr.resumeon IS NOT NULL THEN
                SEC_TO_TIME(
                  TIMESTAMPDIFF(SECOND, vr.resumeon, NOW()) +
                  TIME_TO_SEC(vr.timer)
                )
              ELSE vr.timer
            END AS calculated_timer
        FROM invite_learner il
        INNER JOIN vm_request vr
          ON vr.requestedby_id = il.invited_by_learner_id
        INNER JOIN scenarios s
          ON vr.scenarioid = s.scenarioid
        INNER JOIN scenario_categories sc
          ON s.scenariocategoryid = sc.scenariocategoryid
        INNER JOIN scenario_categories ssc
          ON s.scenariosubcategoryid = ssc.scenariocategoryid
        WHERE
          il.learnerid = ?
          AND s.scenariouuid = ?
          AND vr.status IN ('Pause','Resume','Start')
          AND vr.vm_steps = 'Running'
          AND il.deletedon IS NULL
          AND s.deletedon IS NULL
        ORDER BY vr.modifiedon DESC
        LIMIT 1
        `,
        {
          replacements: [learner_id, scenarioUUID],
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      if (!result || result.length === 0) return null;

      let scenario = result[0];

      /* ---------------- COMPONENT CALCULATION ---------------- */

      let components = JSON.parse(scenario.component_config || "[]");

      scenario.component_count = components.length;
      scenario.virtual_cpu = 0;
      scenario.virtual_memory = 0;
      scenario.storage_size = 0;

      const componentDetails = {};

      await Promise.all(
        components.map(async (element) => {
          try {
            if (!element.componentid) return;

            const [rowData] = await db.sequelize.query(
              `SELECT cores, memory, storage, componentimage 
               FROM components 
               WHERE componentid = ?`,
              {
                replacements: [element.componentid],
                type: db.sequelize.QueryTypes.SELECT,
              },
            );

            if (rowData) {
              componentDetails[element.componentid] = rowData;

              scenario.virtual_cpu += rowData.cores || 0;
              scenario.virtual_memory += rowData.memory || 0;
              scenario.storage_size += parseInt(rowData.storage) || 0;
            }
          } catch (err) {
            console.error(
              `Error fetching component ${element.componentid}:`,
              err,
            );
          }
        }),
      );

      /* ---------------- DIAGRAM IMAGE UPDATE ---------------- */

      if (scenario.scenariodiagram) {
        try {
          let diagramObj = JSON.parse(scenario.scenariodiagram);

          if (diagramObj.nodes && Array.isArray(diagramObj.nodes)) {
            diagramObj.nodes = diagramObj.nodes.map((node) => {
              const compId = node.data?.componentId || node.data?.componentid;

              if (compId && componentDetails[compId]) {
                node.data.image =
                  componentDetails[compId].componentimage || node.data.image;
              }

              return node;
            });
          }

          scenario.scenariodiagram = JSON.stringify(diagramObj);
        } catch (err) {
          console.error("Error updating scenariodiagram:", err);
        }
      }

      return scenario;
    } catch (error) {
      console.error("DAO getInviteScenarioByID error:", error);
      throw error;
    }
  };

module.exports = {
  getRunningInviteLearners,
  getInviteScenarioByID,
};
