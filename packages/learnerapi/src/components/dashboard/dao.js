const getStudentDashboardData =
  ({ db }) =>
  async (learner_id) => {
    try {

      const completedQuery = `SELECT s.scenarioid,s.scenariouuid,s.scenariotitle,s.scenariolevel,COUNT( DISTINCT vr.vmrequestid) AS completed_count FROM vm_request vr INNER JOIN scenarios s ON s.scenarioid = vr.scenarioid WHERE vr.status = 'Completed' AND vr.requestedby_role = 'Learner' GROUP BY s.scenarioid,s.scenariouuid,s.scenariotitle,s.scenariolevel ORDER BY completed_count DESC LIMIT 5; `;

      const currentScenarioQuery = `SELECT vr.vmrequestid, vr.status AS learner_status, vr.status AS session_status,s.scenarioid,s.scenariouuid,s.scenariotitle,s.scenarioidentification,s.scenariolevel,s.duration, sc.categoryname AS scenariocategory_name, scc.categoryname AS scenariosubcategory_name, s.component_config, CASE WHEN vr.status = 'Start' THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, vr.startedon, NOW())) WHEN vr.status = 'Resume' AND vr.resumeon IS NOT NULL THEN SEC_TO_TIME( TIMESTAMPDIFF(SECOND, vr.resumeon, NOW()) + IFNULL(TIME_TO_SEC(vr.timer), 0) ) ELSE vr.timer END AS calculated_timer, DATE_FORMAT(vr.createdon, '%Y-%m-%d %H:%i:%s') AS startedon FROM vm_request vr INNER JOIN scenarios s  ON s.scenarioid = vr.scenarioid INNER JOIN scenario_categories sc  ON sc.scenariocategoryid = s.scenariocategoryid INNER JOIN scenario_categories scc  ON scc.scenariocategoryid = s.scenariosubcategoryid WHERE vr.requestedby_id = :learner_id AND vr.requestedby_role = 'Learner' AND vr.status IN ( 'Running', 'Initializing', 'Terminated', 'Completed', 'Pause', 'Resume', 'Start' ) ORDER BY  CASE vr.status WHEN 'Start' THEN 1 WHEN 'Resume' THEN 2 WHEN 'Running' THEN 3 WHEN 'Pause' THEN 4 ELSE 5 END, vr.modifiedon DESC LIMIT 1;`;

      const [completedStats, quizStats, nonCompletedCountStats] =
        await Promise.all([
          db.sequelize.query(
            `SELECT SUM(DISTINCT CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed, COUNT(DISTINCT scenarioid) AS total FROM vm_request WHERE requestedby_id = :learner_id AND requestedby_role = 'Learner';`,
            {
              replacements: { learner_id },
              type: db.sequelize.QueryTypes.SELECT,
            }
          ),

          db.sequelize.query(
            `SELECT SUM(total_questions) AS total_questions, SUM(total_correct_answers) AS total_correct_answers FROM scenario_learner_quiz WHERE learner_id = :learner_id AND status = 'Completed';`,
            {
              replacements: { learner_id },
              type: db.sequelize.QueryTypes.SELECT,
            }
          ),

          db.sequelize.query(
            `SELECT COUNT(*) AS count FROM vm_request WHERE requestedby_id = :learner_id  AND requestedby_role = 'Learner' AND status IN ('Initializing', 'Failed', 'Start', 'Pause', 'Resume', 'Terminated','Completed');`,
            {
              replacements: { learner_id },
              type: db.sequelize.QueryTypes.SELECT,
            }
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
      const widgets = [
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

      const webBrowserWidgetsQuery = `SELECT webbrowserwidgetid, widget_name, widget_url, \`order\` FROM web_browser_widgets WHERE status = 'Active' AND deletedon IS NULL ORDER BY \`order\` ASC;`;

// ==========================================
// UPCOMING SCENARIOS
// ==========================================

const upcomingScenariosQuery = `
SELECT 
    s.scenarioid,
    s.scenariouuid,
    s.scenariotitle,
    s.scenariolevel,
    s.duration,
    sc.categoryname AS category_name
FROM scenarios s
INNER JOIN scenario_categories sc 
    ON sc.scenariocategoryid = s.scenariocategoryid
WHERE s.scenariostatus = 'Draft'
AND s.status = 'Active'
AND s.deletedon IS NULL
ORDER BY s.createdon DESC
LIMIT 5;
`;


// ==========================================
// SKILL PROFICIENCY
// ==========================================

const skillProficiencyQuery = `
SELECT 
    sc.scenariocategoryid,
    sc.categoryname,

    COUNT(vr.vmrequestid) AS total_sessions,

    SUM(
        CASE 
            WHEN vr.status = 'Completed' 
            THEN 1 
            ELSE 0 
        END
    ) AS completed_sessions,

    ROUND(
        (
            SUM(
                CASE 
                    WHEN vr.status = 'Completed' 
                    THEN 1 
                    ELSE 0 
                END
            ) / COUNT(vr.vmrequestid)
        ) * 100
    ) AS proficiency_percentage

FROM vm_request vr

INNER JOIN scenarios s
    ON s.scenarioid = vr.scenarioid

INNER JOIN scenario_categories sc
    ON sc.scenariocategoryid = s.scenariocategoryid

WHERE vr.requestedby_id = :learner_id
AND vr.requestedby_role = 'Learner'

GROUP BY sc.scenariocategoryid, sc.categoryname

HAVING COUNT(vr.vmrequestid) > 0

ORDER BY proficiency_percentage DESC

LIMIT 5;
`;


// ==========================================
// RECENT ACTIVITY
// ==========================================

const recentActivityQuery = `
SELECT 
    vr.vmrequestid,
    vr.status,
    vr.createdon,
    s.scenariotitle,
    s.scenariolevel

FROM vm_request vr

INNER JOIN scenarios s
    ON s.scenarioid = vr.scenarioid

WHERE vr.requestedby_id = :learner_id
AND vr.requestedby_role = 'Learner'

ORDER BY vr.createdon DESC

LIMIT 3;
`;


const weeklySessionsQuery = `
SELECT 
  d.day_num,
  d.day_name,
  COALESCE(COUNT(vr.vmrequestid), 0) AS total
FROM (
  SELECT 2 AS day_num, 'Mon' AS day_name UNION ALL
  SELECT 3, 'Tue' UNION ALL
  SELECT 4, 'Wed' UNION ALL
  SELECT 5, 'Thu' UNION ALL
  SELECT 6, 'Fri' UNION ALL
  SELECT 7, 'Sat' UNION ALL
  SELECT 1, 'Sun'
) d
LEFT JOIN vm_request vr 
  ON DAYOFWEEK(vr.createdon) = d.day_num
  AND vr.requestedby_id = :learner_id
  AND vr.requestedby_role = 'Learner'
  AND YEARWEEK(vr.createdon, 1) = YEARWEEK(CURDATE(), 1)
GROUP BY d.day_num, d.day_name
ORDER BY FIELD(d.day_num, 2, 3, 4, 5, 6, 7, 1);
`;

      const [completedScenarios, currentScenarioResult, webBrowserWidgets, upcomingScenarios,skillProficiency,recentActivity,weeklySessions] =
        await Promise.all([
          db.sequelize.query(completedQuery, {
            type: db.sequelize.QueryTypes.SELECT,
          }),
          db.sequelize.query(currentScenarioQuery, {
            replacements: { learner_id },
            type: db.sequelize.QueryTypes.SELECT,
          }),
          db.sequelize.query(webBrowserWidgetsQuery, {
            type: db.sequelize.QueryTypes.SELECT,
          }),
          db.sequelize.query(upcomingScenariosQuery, {
            type: db.sequelize.QueryTypes.SELECT,
          }),

          db.sequelize.query(skillProficiencyQuery, {
            replacements: { learner_id },
            type: db.sequelize.QueryTypes.SELECT,
          }),

          db.sequelize.query(recentActivityQuery, {
            replacements: { learner_id },
            type: db.sequelize.QueryTypes.SELECT,
          }),
          db.sequelize.query(weeklySessionsQuery, {
            replacements: { learner_id },
            type: db.sequelize.QueryTypes.SELECT,
          }),


        ]);
      let currentScenario = currentScenarioResult[0] || null;
      if (currentScenario) {
        try {
          const components = JSON.parse(currentScenario.component_config);
          currentScenario.component_count = components.length;
          currentScenario.virtual_cpu = 0;
          currentScenario.virtual_memory = 0;
          currentScenario.storage_size = 0;
          await Promise.all(
            components.map(async (element) => {
              if (element.componentid) {
                const [rowData] = await db.sequelize.query(
                  `SELECT cores, memory, storage FROM components WHERE componentid = ?`,
                  {
                    replacements: [element.componentid],
                    type: db.sequelize.QueryTypes.SELECT,
                  }
                );
                if (rowData) {
                  currentScenario.virtual_cpu += rowData.cores || 0;
                  currentScenario.virtual_memory += rowData.memory || 0;
                  currentScenario.storage_size +=
                    parseInt(rowData.storage) || 0;
                }
              }
            })
          );
        } catch (err) {
          console.error(
            "Error processing component_config for currentScenario:",
            err
          );
          throw err;
        }
      }










      return {
        completedScenarios,
        currentScenario,
        widgets,
        webBrowserWidgets,
        upcomingScenarios,
        skillProficiency,
        recentActivity,
        weeklySessions,
      };
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      throw err;
    }
  };
module.exports = {
  getStudentDashboardData,
};
