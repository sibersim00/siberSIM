const getAll =
  ({ db }) =>
  async (userid, usertype) => {
    try {
      let query = `SELECT mb.batchid, mb.batchuuid, mb.batchname, 
      CASE WHEN mb.status = 'Active' THEN 'true' ELSE 'false' END AS status,
      CONCAT('[', GROUP_CONCAT(
        CONCAT('{"learner_id":', lbm.learner_id, 
        ',"firstname":"', l.firstname,
        '","lastname":"', l.lastname,
        '","email":"', l.email, 
        '","mobile":"', l.mobile, 
        '","batchlearnerid":"', lbm.batchlearnerid,'"}')
      SEPARATOR ','), ']') AS learner_data,
      COUNT(lbm.learner_id) AS learner_count,
      CONCAT(u.firstname, ' ', u.lastname) AS createdby_username,
      DATE(mb.createdon) AS createdon_date,     
      TIME(mb.createdon) AS createdon_time,      
      DATE(mb.modifiedon) AS modifiedon_date,    
      TIME(mb.modifiedon) AS modifiedon_time  
      FROM batches AS mb
      LEFT JOIN batch_learner_map AS lbm ON lbm.batchid = mb.batchid
      LEFT JOIN learners AS l ON l.learner_id = lbm.learner_id
      LEFT JOIN ad_users AS u ON u.userid = mb.createdby
      WHERE mb.deletedon IS NULL `;

      if (usertype === "Instructor") {
        query += ` AND mb.createdby = ${db.sequelize.escape(userid)}`;
      }

      query += `
      GROUP BY mb.batchid
ORDER BY CASE WHEN mb.modifiedon IS NOT NULL THEN mb.modifiedon ELSE mb.createdon END DESC;
    `;

      let [res] = await db.sequelize.query(query);

      // Format the result
      res = res.map((batch) => ({
        ...batch,
        learner_data: batch.learner_data ? JSON.parse(batch.learner_data) : [],
        createdon: `${batch.createdon_date} ${batch.createdon_time}`, // Combine date and time
        modifiedon: `${batch.modifiedon_date} ${batch.modifiedon_time}`, // Combine date and time
      }));

      return res;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("An error occurred. Please try again later.");
    }
  };

const changestatus =
  ({ db }) =>
  async (body, userid) => {
    try {
      const status = body.status === "true" ? "Active" : "Inactive";
      const [res] = await db.sequelize.query(
        `UPDATE batches SET status = :status, modifiedby = :userid, modifiedon = now() WHERE batchid = :batchid`,
        {
          replacements: {
            status: status,
            batchid: body.batchid,
            userid: body.userid,
          },
        }
      );
      const [learnerbatchstatus] = await db.sequelize.query(
        `UPDATE batch_learner_map SET status = :status, modifiedon = NOW(), modifiedby = :userid WHERE batchid = :batchid`,
        {
          replacements: {
            status: status,
            userid: body.userid,
            batchid: body.batchid,
          },
        }
      );
      return {
        statusCode: 200,
        message: "Status has been changed successfully.",
      };
    } catch (error) {
      console.error("Error occurred while changing status:", error);
      throw new Error(
        "An error occurred while updating the status. Please try again later."
      );
    }
  };
const getById =
  ({ db }) =>
  async (id) => {
    let res = await db.sequelize.query(
      ` SELECT 
    mb.batchid,
    mb.batchuuid,
    mb.batchname, 
    CASE WHEN mb.status = 'Active' THEN 'true' ELSE 'false' END AS status,
    CONCAT('[', 
      GROUP_CONCAT(
        CONCAT(
          '{"learner_id":', IFNULL(lbm.learner_id, 'null'),
          ',"firstname":"', IFNULL(l.firstname, ''),
          '","lastname":"', IFNULL(l.lastname, ''),
          '","email":"', IFNULL(l.email, ''),
          '","mobile":"', IFNULL(l.mobile, ''),
          '","batchlearnerid":"', IFNULL(lbm.batchlearnerid, ''), '"}'
        ) SEPARATOR ','
      ), 
    ']') AS learner_data,
    COUNT(lbm.learner_id) AS learner_count,
    CONCAT(u.firstname, ' ', u.lastname) AS createdby_username 
  FROM batches AS mb 
  LEFT JOIN batch_learner_map AS lbm ON lbm.batchid = mb.batchid 
  LEFT JOIN learners AS l ON l.learner_id = lbm.learner_id 
  LEFT JOIN ad_users AS u ON u.userid = mb.createdby 
  WHERE mb.deletedon IS NULL AND mb.batchid = :_id 
  GROUP BY mb.batchid 
  ORDER BY mb.batchname DESC`,
      {
        replacements: {
          _id: id,
        },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    res = res.map((students) => ({
      ...students,
      learner_data: students.learner_data
        ? JSON.parse(students.learner_data)
        : [],
    }));
    if (!res || res.length === 0) {
      return null;
    }
    res = res[0];
    return res;
  };
const save =
  ({ db, validation }) =>
  async (body, userid) => {
    try {
      const [existingBatch] = await db.sequelize.query(
        `SELECT * FROM batches WHERE batchname = :batchname`,
        {
          replacements: {
            batchname: body.batchname,
          },
        }
      );
      if (existingBatch.length > 0) {
        return {
          statusCode: 400,
          message: "Batchname already exists. Please choose a different name.",
        };
      }
      const [batches] = await db.sequelize.query(
        `INSERT INTO batches (batchuuid,batchname, createdby, createdon) VALUES (uuid(),:batchname, :userid, now())`,
        {
          replacements: {
            batchname: body.batchname,
            userid: userid,
          },
        }
      );
      const batchid = batches;
      if (body.students.length > 0) {
        const studentlist = body.students.map(async (student) => {
          return db.sequelize.query(
            `INSERT INTO batch_learner_map (batchid, learner_id, createdby, createdon) VALUES (:batchid, :learner_id, :userid, now())`,
            {
              replacements: {
                batchid: batchid,
                learner_id: student.learner_id,
                userid: userid,
              },
            }
          );
        });
        await Promise.all(studentlist);
      }
      return {
        statusCode: 200,
        message: "Record has been created successfully.",
      };
    } catch (error) {
      console.error("Error saving batch learner mapping:", error);
      throw new Error(error.message);
    }
  };
const update =
  ({ db }) =>
  async (body, userid) => {
    try {
      const [existingBatch] = await db.sequelize.query(
        `SELECT * FROM batches WHERE batchname = :batchname AND batchid != :batchid`,
        {
          replacements: {
            batchname: body.batchname,
            batchid: body.batchid,
          },
        }
      );
      if (existingBatch.length > 0) {
        return {
          statusCode: 400,
          message: "Batchname already exists. Please choose a different name.",
        };
      }
      const [batch] = await db.sequelize.query(
        `SELECT * FROM batches WHERE batchid = :batchid`,
        {
          replacements: {
            batchid: body.batchid,
          },
        }
      );
      if (!batch || batch.length === 0) {
        throw new Error("Batch not found");
      }
      await db.sequelize.query(
        `UPDATE batches SET batchname = :batchname, modifiedby = :userid, modifiedon = now() WHERE batchid = :batchid`,
        {
          replacements: {
            batchname: body.batchname,
            batchid: body.batchid,
            userid: userid,
          },
        }
      );
      await db.sequelize.query(
        `DELETE FROM batch_learner_map WHERE batchid = :batchid`,
        {
          replacements: {
            batchid: body.batchid,
          },
        }
      );
      if (body.students.length > 0) {
        const studentlist = body.students.map(async (student) => {
          return db.sequelize.query(
            `INSERT INTO batch_learner_map (batchid, learner_id, createdby, createdon) VALUES (:batchid, :learner_id, :userid, now())`,
            {
              replacements: {
                batchid: body.batchid,
                learner_id: student.learner_id,
                userid: userid,
              },
            }
          );
        });
        await Promise.all(studentlist);
      }
      return {
        statusCode: 200,
        message: "Record has been updated successfully.",
      };
    } catch (error) {
      console.error("Error updating batch learner mapping:", error);
      throw new Error(error.message);
    }
  };
const deleteById =
  ({ db }) =>
  async (id) => {
    let [res] = await db.sequelize.query(
      "UPDATE batches set deletedon=now() where batchid=:_id",
      {
        replacements: {
          _id: id,
        },
      }
    );
    let [resBatch] = await db.sequelize.query(
      "DELETE FROM batch_learner_map WHERE batchid=:_id",
      {
        replacements: {
          _id: id,
        },
      }
    );
    return res;
  };
module.exports = {
  getAll,
  update,
  deleteById,
  getById,
  changestatus,
  save,
};
