const getApiLogs = ({ db }) => async () => {
    try {
      const result = await db.sequelize.query(`SELECT id, api_end_point,vm_process, ip_address, DATE_FORMAT(request_datetime, '%Y-%m-%d %H:%i:%s') AS request_datetime, DATE_FORMAT(response_datetime, '%Y-%m-%d %H:%i:%s') AS response_datetime, response_code, duration, DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon FROM vm_logs where api_end_point!="https://battlerangers.com:8006/api2/json/access/ticket" ORDER BY createdon DESC;`, 
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error fetching API logs:", error);
      throw error;
    }
  };

   const getApiLogById = ({ db }) => async (id) => {
    try {
      const result = await db.sequelize.query(`SELECT id, api_end_point, ip_address, DATE_FORMAT(request_datetime, '%Y-%m-%d %H:%i:%s') AS request_datetime, DATE_FORMAT(response_datetime, '%Y-%m-%d %H:%i:%s') AS response_datetime, response_code, response, request_payload, request_headers, duration, DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon FROM vm_logs WHERE id = ?;`,
        {
          replacements: [id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching API log by ID:", error);
      throw error;
    }
  };
  
module.exports = {
  getApiLogs,
  getApiLogById
};
