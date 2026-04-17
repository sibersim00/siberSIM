
const getScenarioById =
  ({ db }) =>
  async (uuid) => {
    try {
      const [scenario] = await db.sequelize.query( ` SELECT  s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenarioidentification, s.scenariodescription, s.scenariolevel, s.scenariocategoryid, s.scenariosubcategoryid, s.instructor_id, s.learner_id, s.scenario_type, s.scenarioimage, s.scenariodiagram, s.components, s.component_config, s.network_config, s.instruction_file, s.duration, s.scenariostatus, s.status, s.publishedon, s.createdby, s.createdon, s.modifiedby, s.modifiedon, s.deletedon FROM scenarios s WHERE s.deletedon IS NULL AND s.scenariouuid = :_uuid `,
        {
          replacements: { _uuid: uuid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!scenario) return null;

      // ----- FETCH COMPONENT DETAILS -----
      let componentIds = [];

      try {
        const compList = JSON.parse(scenario.components);
        componentIds = compList.map((c) => c.componentid);
      } catch (e) {
        componentIds = [];
      }

      let componentDetails = [];

      if (componentIds.length > 0) {
        componentDetails = await db.sequelize.query( ` SELECT c.componentid, c.componentuuid, c.componentcategoryid, c.componenttype, c.vmid, c.componentname, c.vmid_name, c.componentimage, c.duration, c.proxmox_json, c.network_bridge_name, c.network_ports, c.cores, c.memory, c.storage, c.status, c.createdby, c.createdon, c.modifiedby, c.modifiedon, c.deletedon FROM components c WHERE c.deletedon IS NULL AND c.componentid IN (:ids) ORDER BY c.componentid DESC `,
          {
            replacements: { ids: componentIds },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
      }

      return { ...scenario, componentDetails };
    } catch (error) {
      console.error("Error in getScenarioById:", error.message);
      throw error;
    }
  };

module.exports = { getScenarioById};

