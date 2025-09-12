const getStudentDashboardData =({ db }) => async (learner_id) => {
    try {
      const trendingQuery = `SELECT s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenariolevel, COUNT(sl.scenariolearnerid) AS learner_count FROM scenario_learner sl INNER JOIN scenarios s ON s.scenarioid = sl.scenarioid WHERE s.deletedon IS NULL GROUP BY s.scenarioid ORDER BY learner_count DESC LIMIT 5;`;

      const completedQuery = `
      SELECT s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenariolevel, COUNT(*) AS completed_count FROM scenario_learner sl INNER JOIN scenarios s ON s.scenarioid = sl.scenarioid WHERE sl.status = 'Completed' GROUP BY s.scenarioid ORDER BY completed_count DESC LIMIT 5;`;

      const publishedQuery = `
      SELECT scenarioid, scenariouuid, scenariotitle, scenariolevel, scenarioidentification, duration, DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon FROM scenarios WHERE scenariostatus = 'Publish' AND deletedon IS NULL ORDER BY createdon DESC LIMIT 4;`;

      const currentScenarioQuery =`SELECT sl.scenariolearneruuid, sl.scenariolearnerid, sl.status AS learner_status, sls.status AS session_status, s.scenarioid, s.scenariouuid, s.scenariotitle, s.scenarioidentification, s.scenariolevel, s.duration, sc.categoryname AS scenariocategory_name, scc.categoryname AS scenariosubcategory_name, s.component_config, CASE  WHEN sls.status = 'Start' THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, sls.startedon, NOW())) WHEN sls.status = 'Resume' AND sls.resumeon IS NOT NULL THEN SEC_TO_TIME(TIMESTAMPDIFF(SECOND, sls.resumeon, NOW()) + TIME_TO_SEC(sls.timer)) ELSE sls.timer END AS calculated_timer, DATE_FORMAT(sl.createdon, '%Y-%m-%d %H:%i:%s') AS startedon FROM scenario_learner sl INNER JOIN scenarios s ON s.scenarioid = sl.scenarioid INNER JOIN scenario_categories sc ON sc.scenariocategoryid = s.scenariocategoryid INNER JOIN scenario_categories scc ON scc.scenariocategoryid = s.scenariosubcategoryid LEFT JOIN scenario_learner_session sls ON sls.scenariolearnersessionid = sl.currentsession_id WHERE sl.learner_id = :learner_id AND sl.status IN ('Running', 'Initializing', 'Terminated', 'Completed') ORDER BY sl.modifiedon DESC LIMIT 1;`;

      const [completedStats, quizStats, nonCompletedCountStats] = await Promise.all([ db.sequelize.query(`SELECT SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed, COUNT(*) AS total FROM scenario_learner_session WHERE learner_id = :learner_id;`,
            {
              replacements: { learner_id },
              type: db.sequelize.QueryTypes.SELECT,
            }
          ),

      db.sequelize.query(`SELECT SUM(total_questions) AS total_questions, SUM(total_correct_answers) AS total_correct_answers FROM scenario_learner_quiz WHERE learner_id = :learner_id AND status = 'Completed';`,
            {
              replacements: { learner_id },
              type: db.sequelize.QueryTypes.SELECT,
            }
          ),

          db.sequelize.query(`SELECT COUNT(*) AS count FROM scenario_learner_session WHERE learner_id = :learner_id AND status IN ('Initializing', 'Failed', 'Start', 'Pause', 'Resume', 'Terminated');`,
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
      const completedPercentage = totalScenarios ? ((userCompletedCount / totalScenarios) * 100).toFixed(2) : 0;
      const totalQuestions = quizData.total_questions || 0;
      const totalCorrect = quizData.total_correct_answers || 0;
      const quizScorePercent = totalQuestions ? (((totalQuestions - totalCorrect) / totalQuestions) * 100).toFixed(2) : 0;
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
      const [trendingScenarios, completedScenarios, latestPublished, currentScenarioResult, webBrowserWidgets,
      ] = await Promise.all([
        db.sequelize.query(trendingQuery, {
        type: db.sequelize.QueryTypes.SELECT,
        }),
        db.sequelize.query(completedQuery, {
        type: db.sequelize.QueryTypes.SELECT,
        }),
        db.sequelize.query(publishedQuery, {
        type: db.sequelize.QueryTypes.SELECT,
        }),
        db.sequelize.query(currentScenarioQuery, {
        replacements: { learner_id },
        type: db.sequelize.QueryTypes.SELECT,
        }),
          db.sequelize.query(webBrowserWidgetsQuery, {
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
                const [rowData] = await db.sequelize.query(`SELECT cores, memory, storage FROM components WHERE componentid = ?`,
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
          console.error("Error processing component_config for currentScenario:",err);
          throw err;
        }
      }
      return {
        trendingScenarios,
        completedScenarios,
        latestPublished,
        currentScenario,
        widgets,
        webBrowserWidgets, 
      };
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      throw err;
    }
  };
module.exports = {
  getStudentDashboardData,
};
