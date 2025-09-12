const getComponentByCategoryId = ({ db }) => async (id) => {
  let res = await db.sequelize.query(
    `SELECT c.componentid, c.componentidentification,c.componentcategoryid,c.componentsubcategoryid,CASE 
    WHEN c.status = 'Active' THEN 'true'  
    ELSE 'false'  
END AS status, mcc.categoryname, mcsc.categoryname AS subcategoryname,mcsc.categoryimage as subcategoryimage,c.loginid, c.url, c.createdon,c.modifiedon
     FROM components c
     LEFT JOIN component_categories mcc ON mcc.componentcategoryid = c.componentcategoryid
     LEFT JOIN component_subcategories mcsc ON mcsc.componentsubcategoryid = c.componentsubcategoryid
     WHERE c.deletedon IS NULL and  c.status = 'Active' AND c.componentcategoryid = :_id`,
    {
      replacements: {
        _id: id,
      },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  return res;
};

const getJson = ({ db, body }) => async () => {
  let jsonid = body.jsonid;
  try {
    let [result] = await db.sequelize.query(
      `select id,json from flowcharts where id="${jsonid}"`
    );
    return result;
  }catch (error) {
    throw error;
  }
};

const saveJson =({ db, body }) => async () => {
  try {
    let jsondata = JSON.stringify(body.jsondata, null, 2);
    console.log(jsondata); 

    const insertQuery = `INSERT INTO flowcharts (json) VALUES (?)`;

    const [res] = await db.sequelize.query(insertQuery, {
      replacements: [jsondata], 
      type: db.sequelize.QueryTypes.INSERT,
      RETURNING: "jsonid",
    });

    const jsonid = res[0]?.jsonid;

    return jsonid;
  } catch (error) {
    throw error;
  }
};

const instructorlist = ({ db }) => async () => {
    try {
      let [result] = await db.sequelize.query(
      `select concat(firstname," ",lastname) as name,userid as instructor_id from ad_users where status = 'Active' and usertype='Instructor' and isverified='Yes'  and deletedon is NULL ORDER by CASE WHEN modifiedon IS NOT NULL then modifiedon ELSE createdon END DESC`
    );
    return result;
  }catch (error) {
    throw error;
  }
};

const scenarioinstructorlist = ({ db }) => async (scenarioid) => {
  try {
    const result = await db.sequelize.query(`
      SELECT 
      s.scenariotitle,
        CONCAT_WS(' ', u.firstname, u.lastname) AS name,
        u.userid AS instructor_id
      FROM 
        scenarios s
      INNER JOIN 
        ad_users u ON s.instructor_id = u.userid
      WHERE 
        s.scenarioid = :scenarioid
        AND u.status = 'Active'
        AND u.isverified = 'Yes'
        AND u.usertype = 'Instructor'
        AND u.deletedon IS NULL
    `, {
      replacements: { scenarioid },
      type: db.sequelize.QueryTypes.SELECT
    });
    return result;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
};

const scenariocategorylist = ({ db }) => async () => {
  try {
    let [result] = await db.sequelize.query(
      `select scenariocategoryid,categoryname as scenariocategory from scenario_categories where status = 'Active' and (parentscenariocategoryid='0' OR parentscenariocategoryid is NULL) and deletedon is NULL ORDER by CASE WHEN modifiedon IS NOT NULL then modifiedon ELSE createdon END  DESC`
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const scenariosubcategorylist = ({ db, body }) => async () => {
  let scenariocategoryid = body.scenariocategoryid;
  try {
    let [result] = await db.sequelize
      .query(`select sc.scenariocategoryid,sc.parentscenariocategoryid,sc.categoryname as scenariocategory,scc.categoryname as parentscenariocategory from scenario_categories sc left join  scenario_categories scc on scc.scenariocategoryid= sc.parentscenariocategoryid
where sc.status = 'Active' and sc.parentscenariocategoryid!='0' and sc.parentscenariocategoryid="${scenariocategoryid}"  and sc.deletedon is NULL ORDER by CASE WHEN sc.modifiedon IS NOT NULL then sc.modifiedon ELSE sc.createdon END  DESC`);
    return result;
  } catch (error) {
    throw error;
  }
};

const componentcategorylist = ({ db }) => async () => {
  try {
    let [result] = await db.sequelize.query(
      `select componentcategoryid,categoryname as componentcategory from component_categories where status = 'Active' and deletedon is NULL  ORDER by CASE WHEN modifiedon IS NOT NULL then modifiedon ELSE createdon END  DESC`
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const scenariocomponentcategorylist = async (db, componentcategoryid) => {
  try {
    const [rows] = await db.sequelize.query(`
      SELECT 
        componentid,
        network_ports,
        vmid,
        vmid_name AS vmname,
        componentimage AS imageurl,
        storage,
        memory,
        duration
      FROM components
      WHERE status = 'Active'
        AND deletedon IS NULL
        AND componentcategoryid = :componentcategoryid
    `, {
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

const rolelist = ({ db }) => async () => {
  try {
    let [res] = await db.sequelize.query(
      `SELECT roleid,rolename,status from ad_roles where status = 'Active' order by roleid asc`
    );
    return res;
  } catch (error) {
    console.log(error);
  }
};



const studentlistevent = ({ db }) => async (session_userid, usertype, eventid) => {
  try {
    if (usertype == "Admin") {
      let [res] = await db.sequelize.query(
        `SELECT t.learner_id, CONCAT(t.firstname, ' ', t.lastname) AS Student_name 
         FROM learners t 
         WHERE t.status='Active' AND t.isverified='Yes' AND t.deletedon IS NULL
         AND t.learner_id NOT IN (
           SELECT learner_id FROM event_learners 
           WHERE eventid = :eventid AND deletedon IS NULL
         )
         ORDER BY Student_name ASC`,
        {
          replacements: { eventid },
        }
      );
      return res;
    } else {
      let res = await db.sequelize.query(
        `SELECT t.learner_id, CONCAT(t.firstname, ' ', t.lastname) AS Student_name, lim.instructor_id
         FROM learners t
         INNER JOIN learner_instructor_map lim 
         ON lim.learner_id = t.learner_id 
         AND lim.deletedon IS NULL 
         AND lim.instructor_id = :_userid
         WHERE t.status='Active' AND t.isverified='Yes' AND t.deletedon IS NULL
         AND t.learner_id NOT IN (
           SELECT learner_id FROM event_learners 
           WHERE eventid = :eventid AND deletedon IS NULL
         )
         GROUP BY t.learner_id
         ORDER BY Student_name ASC`,
        {
          replacements: { _userid: session_userid, eventid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return res;
    }
  } catch (error) {
    throw error;
  }
};




// const studentlist = ({ db }) => async (session_userid, usertype) => {
//   try {
//     if (usertype == "Admin") {
//       let [res] = await db.sequelize.query(
//         `select t.learner_id,CONCAT(t.firstname, ' ', t.lastname) AS Student_name from learners t  where t.status='Active' and t.isverified='Yes' and t.deletedon is null ORDER by CASE WHEN t.modifiedon IS NOT NULL then t.modifiedon ELSE t.createdon END  DESC`
//       );
//       return res;
//     } else {
//       let res = await db.sequelize.query(
//         `select t.learner_id,CONCAT(t.firstname,' ',t.lastname) AS Student_name,lim.instructor_id
//       from learners t  
//       inner join learner_instructor_map lim on lim.learner_id = t.learner_id and lim.deletedon is null and lim.instructor_id =:_userid 
//       where t.status='Active' and t.isverified='Yes' and t.deletedon is null 
//       group by t.learner_id
//       ORDER by CASE WHEN t.modifiedon IS NOT NULL then t.modifiedon ELSE t.createdon END  DESC`,
//         {
//           replacements: {
//             _userid: session_userid,
//           },
//           type: db.sequelize.QueryTypes.SELECT,
//         }
//       );
//       return res;
//     }
//   } catch (error) {
//     throw error;
//   }
// };
const studentlist = ({ db }) => async () => {
  try {
    let [res] = await db.sequelize.query(
      `SELECT learner_id, CONCAT(firstname, ' ', lastname) AS Student_name 
       FROM learners 
       ORDER BY CASE WHEN modifiedon IS NOT NULL THEN modifiedon ELSE createdon END DESC`
    );
    return res;
  } catch (error) {
    throw error;
  }
};






const batchlist = ({ db }) => async (session_userid, usertype) => {
  try {
    if (usertype === "Admin") {
      let [res] = await db.sequelize
        .query(`select b.batchid,b.batchuuid,b.batchname 
    from batches b  
    where b.status='Active' and b.deletedon is null 
    ORDER by CASE WHEN b.modifiedon IS NOT NULL then b.modifiedon ELSE b.createdon END  DESC`);
      return res;
    } else {
      let res = await db.sequelize.query(
        `select b.batchid,b.batchuuid,b.batchname from batches b
      where b.status='Active' and b.createdby=:_userid and b.deletedon is null 
      ORDER by CASE WHEN b.modifiedon IS NOT NULL then b.modifiedon ELSE b.createdon END  DESC`,
        {
          replacements: {
            _userid: session_userid,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return res;
    }
  } catch (error) {
    throw error;
  }
};

const scenariolist = ({ db }) => async (session_userid, usertype) => {
  try {
    if (usertype === "Admin") {
      let [res] = await db.sequelize
        .query(`select s.scenarioid,s.scenariotitle,s.scenarioidentification 
      from scenarios s  
      where s.status='Active' and s.deletedon is null 
      ORDER by CASE WHEN s.modifiedon IS NOT NULL then s.modifiedon ELSE s.createdon END  DESC`);
      return res;
    } else {
      let res = await db.sequelize.query(
        `select s.scenarioid,s.scenariotitle,s.scenarioidentification
        from scenarios s  
        where s.status='Active' and s.instructor_id=:_userid and s.deletedon is null 
        ORDER by CASE WHEN s.modifiedon IS NOT NULL then s.modifiedon ELSE s.createdon END  DESC`,
        {
          replacements: {
            _userid: session_userid,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return res;
    }
  } catch (error) {
    throw error;
  }
}

const scenariodiagramlist = ({ db }) => async () => {
  try {
    const result = await db.sequelize.query(
      `SELECT scenarioid, scenariodiagram, components, duration
       FROM scenarios
       WHERE status = 'Active'
         AND scenarioid
         AND deletedon IS NULL`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    return result.length ? result[0] : null;
  } catch (error) {
    throw error;
  }
}

const faqlist = ({ db }) => async (usertype) => {
  try {
    const result = await db.sequelize.query(
      `
      SELECT
        faq.question,
        faq.answer,
        faq.order_by,
        faq.type
      FROM mst_faqs faq
      WHERE faq.type = :usertype and deletedon is NULL
      ORDER BY faq.order_by ASC 
      `,
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: { usertype },
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};

const eventScenarioList = ({ db }) => async () => {
  try {
    const result = await db.sequelize.query(
      `SELECT scenarioid,scenariotitle FROM scenarios WHERE status = 'Active' AND scenariostatus = 'Publish'`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    return result;
  } catch (error) {
    throw error;
  }
};




module.exports = {
  instructorlist,
  componentcategorylist,
  scenariocomponentcategorylist,
  componentsubcategorylist,
  scenariocategorylist,
  scenariosubcategorylist,
  rolelist,
  studentlistevent,
  batchlist,
  scenariolist,
  getJson,
  saveJson,
  getComponentByCategoryId,
  scenarioinstructorlist,
  scenariodiagramlist,
  faqlist,
  eventScenarioList,
  studentlist
  
};
