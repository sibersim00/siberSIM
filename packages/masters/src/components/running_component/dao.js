const getAll =
  ({ db }) =>
  async () => {
    try {
      const eventlist = `
        SELECT
          vc.vmconfigurationid,
          vc.scenarioid,
          vc.vmrequestid,
          vc.componentid,
          vc.nodeid,
          vc.componenttype,
          vc.\`order\`,
          vc.master_vmid,
          vc.vmid,
          vc.componentname,
          vc.duration,
          vc.network_bridge_json,
          vc.status,
          s.scenariotitle,
          DATE_FORMAT(vc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
          DATE_FORMAT(vc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
        FROM vm_config vc
        LEFT JOIN scenarios s ON s.scenarioid = vc.scenarioid
        WHERE vc.status = 'Running'
        ORDER BY vc.componentname ASC
      `;

      const [res] = await db.sequelize.query(eventlist);
      return res;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("An error occurred. Please try again later.");
    }
  };




module.exports = {
  getAll,
};