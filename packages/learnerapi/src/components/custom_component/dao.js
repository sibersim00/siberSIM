const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

const getAll =
  ({ db }) =>
    async (learnerId) => {
      try {
        const query = `
        SELECT 
    cc.customcomponentid,
    cc.customcomponentuuid,
    cc.componentname,
    cc.componentcategoryid,
    cc.master_vmid,
    cc.clone_vmid,
    cc.vmid,
    cc.componenttype,
    cc.duration,
    cc.componentimage,
    cc.status,
    mcc.categoryname,
    DATE_FORMAT(cc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
    DATE_FORMAT(cc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon,

    comp.componentid AS main_componentid,
    comp.componentname AS main_componentname,
    comp.network_ports AS main_network_ports,
    comp.cores AS main_cores,
    comp.memory AS main_memory,
    comp.storage AS main_storage

FROM custom_component cc
LEFT JOIN component_categories mcc 
    ON mcc.componentcategoryid = cc.componentcategoryid
LEFT JOIN components comp 
    ON comp.vmid = cc.master_vmid
   AND comp.deletedon IS NULL
WHERE cc.learner_id = :learnerId
ORDER BY cc.customcomponentid DESC
`;


        const rows = await db.sequelize.query(query, {
          replacements: { learnerId },
          type: db.sequelize.QueryTypes.SELECT,
        });

        return rows;
      } catch (error) {
        console.error(" Error fetching learner-wise custom components:", error);
        throw new Error("Failed to fetch custom component list");
      }
    };

const getById =
  ({ db }) =>
    async (customUUID) => {
      try {
        let result = await db.sequelize.query(
          `SELECT 
            cc.customcomponentid,
            cc.customcomponentuuid,
            cc.componentname,
            cc.componentcategoryid,
            cc.clone_vmid,
            cc.vmid,
            cc.master_vmid,
            cc.componenttype,
            cc.duration,
            cc.componentimage,
            cc.status,
             mcc.categoryname,
            DATE_FORMAT(cc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
            DATE_FORMAT(cc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon,

            -- Main Component details
            comp.componentid AS main_componentid,
              comp.componentname AS vmid_name,
            comp.componenttype AS main_componenttype,
            comp.network_ports AS main_network_ports,
            comp.componentimage As main_componentimage,
            comp.cores AS main_cores,
            comp.memory AS main_memory,
            comp.storage AS main_storage

        FROM custom_component cc
            LEFT JOIN component_categories mcc 
        ON mcc.componentcategoryid = cc.componentcategoryid
        LEFT JOIN components comp ON comp.vmid = cc.master_vmid
        WHERE cc.customcomponentuuid = :uuid
        LIMIT 1`,
          {
            replacements: { uuid: customUUID },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (!result || result.length === 0) return null;

        let record = result[0];

        // Convert JSON ports to readable format
        if (record.main_network_ports) {
          try {
            const portsObj = JSON.parse(record.main_network_ports);
            record.main_network_ports = Object.entries(portsObj)
              .map(([key, val]) => `${key} - ${val}`)
              .join("\n");
          } catch (err) {
            console.warn("Invalid JSON in network_ports");
          }
        }

        return record;
      } catch (error) {
        console.error("Error fetching custom component by ID:", error);
        throw error;
      }
    };

const updateStatus =
  ({ db }) =>
    async ({ customcomponentuuid, status }) => {
      try {
        const [result] = await db.sequelize.query(
          `
        UPDATE custom_component
        SET 
            status = :status,
            modifiedon = NOW()
        WHERE customcomponentuuid = :customcomponentuuid
        `,
          {
            replacements: {
              status,
              customcomponentuuid,
            },
          }
        );

        return result;
      } catch (error) {
        console.error("Error updating custom component:", error);
        throw error;
      }
    };


module.exports = {
  getAll,
  getById,
  updateStatus

};
