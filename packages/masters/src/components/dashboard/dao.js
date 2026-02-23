const getDashboardStats = ({ db }) => async ({ userid, usertype }) => {
  try {
    // 1. LEARNER STATS
    let learnerQuery = `
  SELECT
    COUNT(*) AS totalaccounts,
    SUM(CASE WHEN status = 'Active' AND isverified = 'Yes' THEN 1 ELSE 0 END) AS active_verified_accounts
  FROM learners
  WHERE deletedon IS NULL`;

    if (usertype === 'Instructor') {
      learnerQuery += ` AND instructor_id = :userid`;
    }

    const [learnerCounts = { totalaccounts: 0, active_verified_accounts: 0 }] =
      await db.sequelize.query(learnerQuery, {
        replacements: { userid },
        type: db.sequelize.QueryTypes.SELECT,
      });



    // 2. INSTRUCTOR STATS (Admin only)
    const instructorQuery = `
      SELECT
        COUNT(*) AS total_instructors,
        SUM(CASE WHEN status = 'Active' AND isverified = 'Yes' THEN 1 ELSE 0 END) AS active_verified_instructors
      FROM ad_users
      WHERE usertype = 'Instructor' AND deletedon IS NULL`;
    const [instructorCounts = { total_instructors: 0, active_verified_instructors: 0 }] =
      usertype === 'Admin'
        ? await db.sequelize.query(instructorQuery, { type: db.sequelize.QueryTypes.SELECT })
        : [{ total_instructors: 0, active_verified_instructors: 0 }];

    // 3. ADMIN STATS
    const [adminStats = { total_admins: 0, active_admins: 0 }] = await db.sequelize.query(
      `
SELECT 
  COUNT(*) AS total_admins,
  SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_admins
FROM ad_users
WHERE usertype = 'Admin'
  AND loginid != 'superadmin'
  AND deletedon IS NULL;

  `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 4. EVENT STATS
    const [eventStats = { total_events: 0, completed_events: 0 }] = await db.sequelize.query(
      `SELECT 
         COUNT(*) AS total_events,
         SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_events
       FROM events
       WHERE 1=1`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 5. COMPONENT STATS
    const [componentStats = { total_components: 0, active_components: 0 }] = await db.sequelize.query(
      `SELECT
        COUNT(*) AS total_components,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_components
       FROM components
       WHERE deletedon IS NULL`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 6. NETWORK STATS
    const [networkStats = { total_networks: 0, available_networks: 0 }] = await db.sequelize.query(
      `SELECT
        COUNT(*) AS total_networks,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_networks
       FROM networks
       WHERE deletedon IS NULL`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 7. TOP 5 PUBLISHED SCENARIOS
    let scenarioQueryDetails = ` SELECT  s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenarioidentification, s.scenariolevel, s.scenariostatus, s.status, s.publishedon, sc.categoryname AS scenariocategory FROM scenarios s LEFT JOIN scenario_categories sc  ON s.scenariocategoryid = sc.scenariocategoryid WHERE  s.scenariostatus = 'Publish'  AND s.deletedon IS NULL AND (sc.deletedon IS NULL OR s.scenariocategoryid IS NULL)`;
    if (usertype === 'Instructor') {
      scenarioQueryDetails += ` AND s.createdby = :userid`;
    }
    scenarioQueryDetails += ` ORDER BY s.publishedon DESC LIMIT 5`;
    const topScenarios = await db.sequelize.query(scenarioQueryDetails, {
      replacements: { userid },
      type: db.sequelize.QueryTypes.SELECT,
    });

    // 8. LATEST JOINED LEARNERS
    const learnerCountQuery = `
      SELECT COUNT(*) AS total_count 
      FROM learners 
      WHERE deletedon IS NULL${usertype === 'Instructor' ? ' AND createdby = :userid' : ''}`;
    const [learnerCountResult] = await db.sequelize.query(learnerCountQuery, {
      replacements: { userid },
      type: db.sequelize.QueryTypes.SELECT,
    });
    const totalLatestLearnerCount = learnerCountResult.total_count || 0;

    const learnerListQuery = ` SELECT  l.learner_id,  CONCAT(l.firstname, ' ', l.lastname) AS learner_name, l.email,  l.profile, l.createdon, l.status FROM learners l LEFT JOIN vm_request vr ON vr.requestedby_id = l.learner_id AND vr.requestedby_role = 'Learner' WHERE l.deletedon IS NULL AND l.instructor_id = :userid ORDER BY l.createdon DESC  LIMIT 5`;
    const latestLearners = await db.sequelize.query(learnerListQuery, {
      replacements: { userid },
      type: db.sequelize.QueryTypes.SELECT,
    });

    // 9. SCENARIO COUNT GROUPED BY INSTRUCTOR
    let scenarioCountQuery = `
     SELECT 
    instructor_id,
    COUNT(*) AS total_scenarios,
    CAST(SUM(CASE WHEN scenariostatus = 'Publish' THEN 1 ELSE 0 END) AS UNSIGNED) AS published_scenarios
FROM scenarios
WHERE deletedon IS NULL`;
    if (usertype === 'Instructor') {
      scenarioCountQuery += ` AND instructor_id = :userid`;
    }
    scenarioCountQuery += ` GROUP BY instructor_id`;
    const scenarioCounts = await db.sequelize.query(scenarioCountQuery, {
      replacements: { userid },
      type: db.sequelize.QueryTypes.SELECT,
    });

    let sessionQuery = `
  SELECT 
    vr.scenarioid, 
    COUNT(*) AS running_sessions 
  FROM vm_request vr
  INNER JOIN scenarios s ON vr.scenarioid = s.scenarioid
  WHERE vr.vm_steps = 'Running'
    AND vr.requestedby_role = 'Learner'
    AND s.deletedon IS NULL`;

    if (usertype === 'Instructor') {
      sessionQuery += ` AND s.createdby = :userid`;
    }

    sessionQuery += ` GROUP BY vr.scenarioid ORDER BY running_sessions DESC LIMIT 5`;

    const runningSessions = await db.sequelize.query(sessionQuery, {
      replacements: { userid },
      type: db.sequelize.QueryTypes.SELECT,
    });

    let runningSessionDetailsQuery = `
  SELECT 
    s.scenariotitle,
    CONCAT(l.firstname, ' ', l.lastname) AS learnername,
    vr.status AS scenario_status,
    vr.startedon
  FROM vm_request vr
  INNER JOIN scenarios s 
    ON s.scenarioid = vr.scenarioid
  INNER JOIN learners l 
    ON vr.requestedby_id = l.learner_id
  WHERE 
    vr.requestedby_role IN ('Learner','Admin','Instructor')
    AND vr.status IN ('Start', 'Resume')
    AND s.deletedon IS NULL
`;
    if (usertype === 'Instructor') {
      runningSessionDetailsQuery += ` AND s.createdby = :userid`;
    }
    runningSessionDetailsQuery += `
  ORDER BY vr.startedon DESC
  LIMIT 5
`;

    const runningSessionDetails = await db.sequelize.query(
      runningSessionDetailsQuery,
      {
        replacements: { userid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    const [sessionStats = { total_sessions: 0, pause_resume_count: 0, running_sessions: 0 }] =
      await db.sequelize.query(
        `SELECT 
       COUNT(*) AS total_sessions,
         SUM(
    CASE 
      WHEN vr.status IN ('Pause', 'Resume','Start')
           AND vr.vm_steps = 'Running'
      THEN 1 ELSE 0
    END
  ) AS pause_resume_count,
       SUM(
         CASE 
           WHEN vr.status IN ('Resume','Start') AND vr.vm_steps = 'Running' 
           THEN 1 ELSE 0 
         END
       ) AS running_sessions
     FROM vm_request vr
     INNER JOIN scenarios s ON vr.scenarioid = s.scenarioid
     WHERE vr.requestedby_role IN ('Learner','Instructor','Admin','Event')
       AND s.deletedon IS NULL
       ${usertype === 'Instructor' ? 'AND s.createdby = :userid' : ''}`,
        {
          replacements: { userid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );


    // 13. LATEST INSTRUCTORS
    let latestInstructors = [];
    let totalInstructorCount = 0;
    if (usertype === 'Admin') {
      const [countResult] = await db.sequelize.query(
        `SELECT COUNT(*) AS total_count
         FROM ad_users
         WHERE usertype = 'Instructor' AND deletedon IS NULL`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      totalInstructorCount = countResult.total_count || 0;

      latestInstructors = await db.sequelize.query(
        `SELECT 
           userid, 
           CONCAT(firstname, ' ', lastname) AS instructor_name,
           email, 
           createdon 
         FROM ad_users 
         WHERE usertype = 'Instructor' AND deletedon IS NULL
         ORDER BY createdon DESC 
         LIMIT 5`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
    }

    // 14. VM COMPONENT STATS
    let vmStatsTotalsQuery = `
      SELECT 
        vc.status,
        SUM(c.cores) AS total_cores,
        SUM(c.memory) AS total_memory,
        SUM(CAST(REPLACE(c.storage, 'G', '') AS UNSIGNED)) AS total_storage
      FROM vm_config vc
      INNER JOIN components c ON vc.componentid = c.componentid
      WHERE vc.status = "Running" AND c.deletedon IS NULL`;
    if (usertype === 'Instructor') {
      vmStatsTotalsQuery += ` AND c.createdby = :userid`;
    }
    vmStatsTotalsQuery += ` GROUP BY vc.status`;
    const vmStatsTotals = await db.sequelize.query(vmStatsTotalsQuery, {
      replacements: { userid },
      type: db.sequelize.QueryTypes.SELECT,
    });

    // 15. Widgets
    let widgets = [];
    try {
      const [completedStats, quizStats, nonCompletedCountStats] =
        await Promise.all([
          db.sequelize.query(
            `SELECT 
         SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
         COUNT(*) AS total
       FROM vm_request
       WHERE requestedby_id = :userid
         AND requestedby_role = 'Learner'`,
            { replacements: { userid }, type: db.sequelize.QueryTypes.SELECT }
          ),

          db.sequelize.query(
            `SELECT 
         SUM(total_questions) AS total_questions,
         SUM(total_correct_answers) AS total_correct_answers
       FROM scenario_learner_quiz
       WHERE learner_id = :userid
         AND status = 'Completed'`,
            { replacements: { userid }, type: db.sequelize.QueryTypes.SELECT }
          ),

          db.sequelize.query(
            `SELECT COUNT(*) AS count
       FROM vm_request
       WHERE requestedby_id = :userid
         AND requestedby_role = 'Learner'
         AND status IN ('Initializing', 'Failed', 'Start', 'Pause', 'Resume', 'Terminated')`,
            { replacements: { userid }, type: db.sequelize.QueryTypes.SELECT }
          ),
        ]);


      const completedData = completedStats[0];
      const quizData = quizStats[0];
      const nonCompletedCount = nonCompletedCountStats[0].count;

      const totalScenarios = completedData.total || 0;
      const userCompletedCount = completedData.completed || 0;
      const completedPercentage = totalScenarios
        ? ((userCompletedCount / totalScenarios) * 100).toFixed(2)
        : 0;

      const totalQuestions = quizData.total_questions || 0;
      const totalCorrect = quizData.total_correct_answers || 0;
      const quizScorePercent = totalQuestions
        ? (((totalQuestions - totalCorrect) / totalQuestions) * 100).toFixed(2)
        : 0;

      widgets = [
        {
          title: "Completed Scenarios",
          value: `${completedPercentage}%`,
          tooltip: `${userCompletedCount} since last month`,
        },
        {
          title: "Quiz Score",
          value: `${totalCorrect}/${totalQuestions}`,
          tooltip: `${quizScorePercent}% since last month`,
        },
        {
          title: "Active/Failed Sessions",
          value: nonCompletedCount,
          tooltip: ``,
        },
      ];
    } catch (err) {
      console.error("Error generating widgets:", err);
    }

    // 16. Web Browser Widgets
    const webBrowserWidgetsQuery = `
      SELECT webbrowserwidgetid, widget_name, widget_url, \`order\`
      FROM web_browser_widgets
      WHERE status = 'Active' AND deletedon IS NULL
      ORDER BY \`order\` ASC;
    `;
    const webBrowserWidgets = await db.sequelize.query(webBrowserWidgetsQuery, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    return {
      learnerCounts,
      instructorCounts,
      adminStats,
      eventStats,
      componentStats,
      networkStats,
      scenarioCounts,
      topScenarios: topScenarios || [],
      latestLearners: {
        learner_count: totalLatestLearnerCount,
        learner_records: latestLearners || [],
      },
      runningSessions: runningSessions || [],
      sessionStats,
      runningSessionDetails: runningSessionDetails || [],
      latestInstructors: {
        instructor_count: totalInstructorCount,
        learner_records: latestInstructors || [],
      },
      vmStatsTotals,
      widgets,
      webBrowserWidgets: webBrowserWidgets || [],
    };
  } catch (error) {
    console.error('DAO Error in getDashboardStats:', error.message);
    throw error;
  }
};

module.exports = {
  getDashboardStats,
};

