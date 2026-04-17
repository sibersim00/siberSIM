const getLearners =
  ({ db }) =>
  async () => {

    let res = await db.sequelize.query(
      `SELECT DISTINCT 
        l.learner_id,
        l.firstname,
        l.lastname
      FROM vm_request vr
      INNER JOIN learners l 
        ON l.learner_id = vr.requestedby_id
      WHERE vr.requestedby_role IN( 'Learner', 'Instructor','Admin','Event')
      AND vr.status IN ('Resume','Start')
      AND vr.vm_steps IN ('Running')
      ORDER BY l.firstname ASC`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    return res;
  };

const getRunningComponents =
  ({ db }) =>
  async (vmrequestid) => {

    if (!vmrequestid) {
      return [];
    }

    const res = await db.sequelize.query(
      `SELECT 
        vc.vmconfigurationid,
        vc.componentname,
        vc.vmid,
        vc.nodeid,
        vc.componenttype,
        vc.status,
        vr.vmrequestid,
        s.scenariotitle,
        s.scenariolevel,
        s.scenarioidentification
      FROM vm_config vc
      INNER JOIN vm_request vr
        ON vr.vmrequestid = vc.vmrequestid
      INNER JOIN scenarios s
        ON s.scenarioid = vr.scenarioid
      WHERE vc.vmrequestid = :vmrequestid
      AND vc.status IN ('Running','Stopped')
      ORDER BY vc.componentname ASC`,
      {
        replacements: { vmrequestid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    return res;
  };



const getRunningScenarios =
  ({ db }) =>
  async () => {
    try {

      const query = `
        SELECT 
            vr.vmrequestid,
            vr.scenarioid,
            s.scenariotitle AS scenarioname,
            s.scenariolevel,
            s.scenarioidentification,
            s.scenarioimage,
            vr.requestedby_id AS learner_id,
            CONCAT(l.firstname,' ',l.lastname) AS learnername,
            vr.status,
            vr.vm_steps,
            DATE_FORMAT(vr.createdon,'%Y-%m-%d %H:%i:%s') AS createdon
            FROM vm_request vr
            LEFT JOIN scenarios s
            ON s.scenarioid = vr.scenarioid
            LEFT JOIN learners l
            ON l.learner_id = vr.requestedby_id
            WHERE vr.status IN ('Start','Resume')
            AND vr.vm_steps = 'Running'
            ORDER BY vr.createdon DESC
            `;

      const [result] = await db.sequelize.query(query);

      return result;

    } catch (error) {
      console.error("Error fetching running scenarios:", error);
      throw new Error("An error occurred. Please try again later.");
    }
  };

// const listRunningComponent =
//   ({ db }) =>
//   async (req) => {
//     try {
//       const limit = parseInt(req.query.limit) || 10;
//       const page = parseInt(req.query.page) || 1;
//       const offset = (page - 1) * limit;

//       const query = `
//         SELECT  vc.vmconfigurationid, vc.scenarioid, s.scenariotitle, s.scenariolevel ,     s.scenarioidentification,   vc.vmrequestid, vc.componentid, vc.master_vmid, vc.componentname, vc.componenttype,  vc.vmid, vc.status FROM vm_config vc
//         LEFT JOIN scenarios s ON vc.scenarioid = s.scenarioid   
//         WHERE vc.status = 'Running'
//         ORDER BY vc.createdon DESC
//         LIMIT :limit OFFSET :offset
//       `;
//       const [result] = await db.sequelize.query(query, {
//         replacements: { limit, offset },
//       });
//       // COUNT
//       const [[{ totalCount }]] = await db.sequelize.query(`
//         SELECT COUNT(*) as totalCount
//         FROM vm_config
//         WHERE status = 'Running'
//       `);
//       return {
//         records: result,
//         totalCount,
//       };
//     } catch (error) {
//       console.error("Error fetching running scenarios:", error);
//       throw error;
//     }
//   };

const listRunningComponent =
  ({ db }) =>
  async (req) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const search = req.query.search || "";

      const query = `
        SELECT vc.vmconfigurationid, vc.scenarioid, s.scenariotitle, s.scenariolevel,
               s.scenarioidentification, vc.vmrequestid, vc.componentid,
               vc.master_vmid, vc.componentname, vc.componenttype,
               vc.vmid, vc.status
        FROM vm_config vc
        LEFT JOIN scenarios s ON vc.scenarioid = s.scenarioid
        WHERE vc.status = 'Running'
        ${
          search
            ? `AND (
              LOWER(s.scenariotitle) LIKE :search OR
              LOWER(vc.componentname) LIKE :search OR
              LOWER(s.scenarioidentification) LIKE :search OR
              LOWER(s.scenariolevel) LIKE :search OR
              LOWER(vc.componenttype) LIKE :search OR
              LOWER(vc.vmid) LIKE :search OR
              LOWER(vc.status) LIKE :search
            )`
            : ""
        }
        ORDER BY vc.createdon DESC
        LIMIT :limit OFFSET :offset
      `;

      const [result] = await db.sequelize.query(query, {
        replacements: {
          limit,
          offset,
          search: `%${search.toLowerCase()}%`,
        },
      });

      // COUNT QUERY
      const countQuery = `
        SELECT COUNT(*) as totalCount
        FROM vm_config vc
        LEFT JOIN scenarios s ON vc.scenarioid = s.scenarioid
        WHERE vc.status = 'Running'
        ${
          search
            ? `AND (
              LOWER(s.scenariotitle) LIKE :search OR
              LOWER(vc.componentname) LIKE :search OR
              LOWER(s.scenarioidentification) LIKE :search OR
              LOWER(s.scenariolevel) LIKE :search OR
              LOWER(vc.componenttype) LIKE :search OR
              LOWER(vc.vmid) LIKE :search OR
              LOWER(vc.status) LIKE :search
            )`
            : ""
        }
      `;

      const [[{ totalCount }]] = await db.sequelize.query(countQuery, {
        replacements: {
          search: `%${search.toLowerCase()}%`,
        },
      });

      return {
        records: result,
        totalCount,
      };
    } catch (error) {
      console.error("Error fetching running scenarios:", error);
      throw error;
    }
  };

// const listAllExceptRunning =
//   ({ db }) =>
//   async (req) => {
//     try {
//       const limit = parseInt(req.query.limit) || 10;
//       const page = parseInt(req.query.page) || 1;
//       const offset = (page - 1) * limit;

//       const query = `
//         SELECT  vc.vmconfigurationid, vc.scenarioid, s.scenariotitle, s.scenariolevel ,s.scenarioidentification,    vc.vmrequestid, vc.componentid, vc.master_vmid, vc.componentname, vc.componenttype, vc.vmid, vc.status FROM vm_config vc LEFT JOIN scenarios s ON vc.scenarioid = s.scenarioid    WHERE vc.status <> 'Running' ORDER BY vc.createdon DESC LIMIT :limit OFFSET :offset
//       `;
//       const [result] = await db.sequelize.query(query, {
//         replacements: { limit, offset },
//       });
//       const [[{ totalCount }]] = await db.sequelize.query(`
//         SELECT COUNT(*) as totalCount
//         FROM vm_config
//         WHERE status <> 'Running'
//       `);
//       return {
//         records: result,
//         totalCount,
//       };
//     } catch (error) {
//       console.error("Error fetching scenarios:", error);
//       throw error;
//     }
//   };

const listAllExceptRunning =
  ({ db }) =>
  async (req) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const search = req.query.search || "";

      const query = `
        SELECT vc.vmconfigurationid, vc.scenarioid, s.scenariotitle, s.scenariolevel,
               s.scenarioidentification, vc.vmrequestid, vc.componentid,
               vc.master_vmid, vc.componentname, vc.componenttype,
               vc.vmid, vc.status
        FROM vm_config vc
        LEFT JOIN scenarios s ON vc.scenarioid = s.scenarioid
        WHERE vc.status <> 'Running'
        ${
          search
            ? `AND (
              LOWER(s.scenariotitle) LIKE :search OR
              LOWER(vc.componentname) LIKE :search OR
              LOWER(s.scenarioidentification) LIKE :search OR
              LOWER(s.scenariolevel) LIKE :search OR
              LOWER(vc.componenttype) LIKE :search OR
              LOWER(vc.vmid) LIKE :search OR
              LOWER(vc.status) LIKE :search
            )`
            : ""
        }
        ORDER BY vc.createdon DESC
        LIMIT :limit OFFSET :offset
      `;

      const [result] = await db.sequelize.query(query, {
        replacements: {
          limit,
          offset,
          search: `%${search.toLowerCase()}%`,
        },
      });

      const countQuery = `
        SELECT COUNT(*) as totalCount
        FROM vm_config vc
        LEFT JOIN scenarios s ON vc.scenarioid = s.scenarioid
        WHERE vc.status <> 'Running'
        ${
          search
            ? `AND (
              LOWER(s.scenariotitle) LIKE :search OR
              LOWER(vc.componentname) LIKE :search OR
              LOWER(s.scenarioidentification) LIKE :search OR
              LOWER(s.scenariolevel) LIKE :search OR
              LOWER(vc.componenttype) LIKE :search OR
              LOWER(vc.vmid) LIKE :search OR
              LOWER(vc.status) LIKE :search
            )`
            : ""
        }
      `;

      const [[{ totalCount }]] = await db.sequelize.query(countQuery, {
        replacements: {
          search: `%${search.toLowerCase()}%`,
        },
      });

      return {
        records: result,
        totalCount,
      };
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      throw error;
    }
  };

module.exports = {
  getLearners,
  getRunningComponents,
  getRunningScenarios,
  listRunningComponent,
  listAllExceptRunning,
};