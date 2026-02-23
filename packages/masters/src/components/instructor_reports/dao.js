const getInstructorDetails = ({ db }) => async (instructor_id = null) => {
  try {
    let baseQuery = ` SELECT  u.userid AS instructor_id, u.loginid AS username, u.firstname, u.lastname, u.email, u.mobile, DATE(urt.logged_in) AS login_date, DATE_FORMAT(MAX(urt.logged_in), '%Y-%m-%d %H:%i:%s') AS last_login, DATE_FORMAT(MAX(urt.logged_out), '%Y-%m-%d %H:%i:%s') AS last_logout FROM ad_users u LEFT JOIN ad_user_refresh_tokens urt  ON u.userid = urt.userid WHERE u.usertype = 'Instructor' `;

    const replacements = {};

    // Apply conditional instructor filter
    if (Array.isArray(instructor_id) && instructor_id.length > 0) {
      baseQuery += ` AND u.userid IN (:instructor_id)`;
      replacements.instructor_id = instructor_id;
    } else if (instructor_id) {
      baseQuery += ` AND u.userid = :instructor_id`;
      replacements.instructor_id = instructor_id;
    }

    // Add GROUP BY and ORDER BY
    baseQuery += ` GROUP BY  u.userid, u.loginid, u.firstname, u.lastname, u.email, u.mobile, DATE(urt.logged_in) ORDER BY login_date DESC `;

    const result = await db.sequelize.query(baseQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });

    return result;
  } catch (err) {
    throw err;
  }
};



const getInstructorStatistics = ({ db }) => async (instructor_id, scenario_id) => {
  const replacements = {};
  let baseWhere = `s.deletedon IS NULL AND u.usertype = 'Instructor'`;

  // Scenario filter
  if (Array.isArray(scenario_id) && scenario_id.length > 0) {
    baseWhere += ` AND s.scenarioid IN (:scenario_id)`;
    replacements.scenario_id = scenario_id;
  } else if (scenario_id) {
    baseWhere += ` AND s.scenarioid = :scenario_id`;
    replacements.scenario_id = scenario_id;
  }

  // Instructor filter
  if (Array.isArray(instructor_id) && instructor_id.length > 0) {
    baseWhere += ` AND s.createdby IN (:instructor_id)`;
    replacements.instructor_id = instructor_id;
  } else if (instructor_id) {
    baseWhere += ` AND s.createdby = :instructor_id`;
    replacements.instructor_id = instructor_id;
  }

  // Main instructor stats query
  const query = ` SELECT s.createdby AS instructor_id, CONCAT(u.firstname, ' ', u.lastname) AS instructor_name, COUNT(*) AS total_scenarios, SUM(s.scenariostatus = 'Publish') AS total_published, SUM(s.scenariostatus = 'Draft') AS total_draft, SUM(s.scenariolevel = 'Easy') AS cnt_easy, SUM(s.scenariolevel = 'Medium') AS cnt_medium, SUM(s.scenariolevel = 'Hard') AS cnt_hard FROM scenarios s JOIN ad_users u ON s.createdby = u.userid WHERE ${baseWhere} GROUP BY s.createdby `;

  const rows = await db.sequelize.query(query, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
  });

  // Category breakdown
  const categoryQuery = ` SELECT  s.createdby AS instructor_id, CONCAT(u.firstname, ' ', u.lastname) AS instructor_name, sc.categoryname, COUNT(*) AS category_count FROM scenarios s JOIN ad_users u ON s.createdby = u.userid JOIN scenario_categories sc ON s.scenariocategoryid = sc.scenariocategoryid WHERE ${baseWhere} GROUP BY s.createdby, sc.categoryname `;

  const categoryRows = await db.sequelize.query(categoryQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
  });

  // Quiz breakdown
  const quizQuery = ` SELECT  s.createdby AS instructor_id, c.categoryname AS category_name, COUNT(q.scenariolearnarquizid) AS quiz_count FROM scenario_learner_quiz q JOIN scenarios s ON s.scenarioid = q.scenarioid JOIN scenario_categories c ON s.scenariocategoryid = c.scenariocategoryid WHERE s.deletedon IS NULL ${replacements.instructor_id ? ' AND s.createdby IN (:instructor_id)' : ''} ${replacements.scenario_id ? ' AND s.scenarioid IN (:scenario_id)' : ''} GROUP BY s.createdby, c.categoryname `;

  const quizRows = await db.sequelize.query(quizQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
  });
  // Build maps for categories and quizzes
  const categoryMap = {};
  for (const row of categoryRows) {
    if (!categoryMap[row.instructor_id]) categoryMap[row.instructor_id] = {};
    categoryMap[row.instructor_id][row.categoryname] = Number(row.category_count);
  }

  const quizMap = {};
  for (const row of quizRows) {
    if (!quizMap[row.instructor_id]) quizMap[row.instructor_id] = {};
    quizMap[row.instructor_id][row.category_name] = Number(row.quiz_count);
  }

  // Format stats result
  const formatStats = row => {
    const total = Number(row.total_scenarios);

    // Skip if there's no data
    if (!total) {
      return null;
    }
    const instructorId = row.instructor_id;
    return {
      instructor_id: instructorId,
      instructor_name: row.instructor_name,
      total_scenarios: total,
      total_published: Number(row.total_published),
      total_draft: Number(row.total_draft),
      total_created_scenarios: total,
      by_level: {
        Easy: {
          count: Number(row.cnt_easy),
          pct: total ? ((row.cnt_easy / total) * 100).toFixed(2) : "0.00",
        },
        Medium: {
          count: Number(row.cnt_medium),
          pct: total ? ((row.cnt_medium / total) * 100).toFixed(2) : "0.00",
        },
        Hard: {
          count: Number(row.cnt_hard),
          pct: total ? ((row.cnt_hard / total) * 100).toFixed(2) : "0.00",
        },
      },
      by_category: categoryMap[instructorId] || {},
      by_category_quiz: quizMap[instructorId] || {},
    };
  };
  const formatted = Array.isArray(rows) ? rows.map(formatStats).filter(Boolean) : [];
  // Return null if no meaningful data
  if (formatted.length === 0) {
    return null;
  }
  // Determine structure of returned data
  if (
    (Array.isArray(instructor_id) && instructor_id.length > 1) ||
    (Array.isArray(scenario_id) && scenario_id.length > 1) ||
    !instructor_id
  ) {
    return formatted;
  }
  return formatted[0];
};
module.exports = {
  getInstructorDetails,
  getInstructorStatistics
};
