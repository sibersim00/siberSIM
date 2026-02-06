// const getLearnerStatistics =
//   ({ db }) =>
//   async (learner_id = [], scenario_id = []) => {
//     try {
//       const replacements = {};
//       let whereClause = `WHERE s.deletedon IS NULL AND l.deletedon IS NULL`;
//       if (learner_id.length) {
//         whereClause += ` AND sls.learner_id IN (:learner_id)`;
//         replacements.learner_id = learner_id;
//       }
//       if (scenario_id.length) {
//         whereClause += ` AND sls.scenarioid IN (:scenario_id)`;
//         replacements.scenario_id = scenario_id;
//       }
//       const query = `
//       SELECT 
//         sls.learner_id,
//         CONCAT(l.firstname, ' ', l.lastname) AS learner_name,

//         -- Total attempted scenarios (any status)
//         COUNT(sls.scenarioid) AS total_attempted_scenarios,

//         -- Total completed scenarios count
//         SUM(CASE WHEN sls.status = 'Completed' THEN 1 ELSE 0 END) AS total_completed_scenarios,

//         -- Counts of completed scenarios by difficulty
//         SUM(CASE WHEN sls.status = 'Completed' AND s.scenariolevel = 'Easy' THEN 1 ELSE 0 END) AS completed_easy_count,
//         SUM(CASE WHEN sls.status = 'Completed' AND s.scenariolevel = 'Medium' THEN 1 ELSE 0 END) AS completed_medium_count,
//         SUM(CASE WHEN sls.status = 'Completed' AND s.scenariolevel = 'Hard' THEN 1 ELSE 0 END) AS completed_hard_count,

//         -- Quiz stats aggregated by learner only (across all scenarios)
//         COALESCE(sq.total_quiz_taken, 0) AS total_quiz_taken,
//         COALESCE(sq.total_correct_answers, 0) AS total_correct_answers,
//         COALESCE(sq.total_answers, 0) AS total_answers,
//         COALESCE(sq.total_questions, 0) AS total_questions

//       FROM scenario_learner_session sls
//       LEFT JOIN scenarios s ON s.scenarioid = sls.scenarioid

//        -- Join with learners to check deletedon IS NULL
//       LEFT JOIN learners l ON l.learner_id = sls.learner_id

//       -- Join quiz stats aggregated only by learner (no scenario)
//       LEFT JOIN (
//         SELECT 
//           learner_id,
//           COUNT(*) AS total_quiz_taken,
//           SUM(total_answers) AS total_answers,
//           SUM(total_correct_answers) AS total_correct_answers,
//           SUM(total_questions) AS total_questions
//         FROM scenario_learner_quiz
//         GROUP BY learner_id
//       ) sq ON sq.learner_id = sls.learner_id

//       ${whereClause}

//       GROUP BY sls.learner_id
//     `;

//       const results = await db.sequelize.query(query, {
//         replacements,
//         type: db.sequelize.QueryTypes.SELECT,
//       });

//       // Process and calculate formatted output
//       const finalResults = results.map((row) => {
//         const totalAttempted = parseInt(row.total_attempted_scenarios || 0);
//         const totalCompleted = parseInt(row.total_completed_scenarios || 0);

//         const scenario_level_stats = {
//           Easy: {
//             completed: parseInt(row.completed_easy_count || 0),
//             total: totalCompleted,
//           },
//           Medium: {
//             completed: parseInt(row.completed_medium_count || 0),
//             total: totalCompleted,
//           },
//           Hard: {
//             completed: parseInt(row.completed_hard_count || 0),
//             total: totalCompleted,
//           },
//         };

//         const scenario_completion_data = totalAttempted
//           ? ((totalCompleted / totalAttempted) * 100).toFixed(2)
//           : "0.00";
//         const totalAnswers = parseInt(row.total_answers || 0);
//         const totalQuestions = parseInt(row.total_questions || 0);
//         const quiz_answer_data =
//           totalQuestions > 0
//             ? ((totalAnswers / totalQuestions) * 100).toFixed(2)
//             : "0.00";

//         return {
//           learner_id: row.learner_id,
//           name:row.learner_name,
//           total_attempted_scenarios: totalAttempted,
//           total_completed_scenarios: totalCompleted,
//           scenario_level_stats,
//           scenario_completion_data,
//           // quiz_success_data,
//           quiz_answer_data,
//         };
//       });

//       return finalResults;
//     } catch (err) {
//       throw err;
//     }
//   };
const getLearnerStatistics =
  ({ db }) =>
  async (learner_id = [], scenario_id = []) => {
    try {
      const replacements = {};
      let whereClause = `
        WHERE s.deletedon IS NULL
          AND l.deletedon IS NULL
          AND vr.requestedby_role = 'Learner'
      `;

      if (learner_id.length) {
        whereClause += ` AND vr.requestedby_id IN (:learner_id)`;
        replacements.learner_id = learner_id;
      }

      if (scenario_id.length) {
        whereClause += ` AND vr.scenarioid IN (:scenario_id)`;
        replacements.scenario_id = scenario_id;
      }

      const query = `
        SELECT 
          vr.requestedby_id AS learner_id,
          CONCAT(l.firstname, ' ', l.lastname) AS learner_name,

          -- Total attempted scenarios
          COUNT(DISTINCT vr.scenarioid) AS total_attempted_scenarios,

          -- Total completed scenarios
          SUM(
            CASE 
              WHEN vr.status = 'Completed' THEN 1 ELSE 0 
            END
          ) AS total_completed_scenarios,

          -- Completed by difficulty
          SUM(
            CASE 
              WHEN vr.status = 'Completed' AND s.scenariolevel = 'Easy' THEN 1 ELSE 0 
            END
          ) AS completed_easy_count,

          SUM(
            CASE 
              WHEN vr.status = 'Completed' AND s.scenariolevel = 'Medium' THEN 1 ELSE 0 
            END
          ) AS completed_medium_count,

          SUM(
            CASE 
              WHEN vr.status = 'Completed' AND s.scenariolevel = 'Hard' THEN 1 ELSE 0 
            END
          ) AS completed_hard_count,

          -- Quiz stats (aggregated only by learner)
          COALESCE(sq.total_quiz_taken, 0) AS total_quiz_taken,
          COALESCE(sq.total_correct_answers, 0) AS total_correct_answers,
          COALESCE(sq.total_answers, 0) AS total_answers,
          COALESCE(sq.total_questions, 0) AS total_questions

        FROM vm_request vr

        LEFT JOIN scenarios s 
          ON s.scenarioid = vr.scenarioid

        LEFT JOIN learners l 
          ON l.learner_id = vr.requestedby_id

        LEFT JOIN (
          SELECT 
            learner_id,
            COUNT(*) AS total_quiz_taken,
            SUM(total_answers) AS total_answers,
            SUM(total_correct_answers) AS total_correct_answers,
            SUM(total_questions) AS total_questions
          FROM scenario_learner_quiz
          GROUP BY learner_id
        ) sq 
          ON sq.learner_id = vr.requestedby_id

        ${whereClause}

        GROUP BY vr.requestedby_id
      `;

      const results = await db.sequelize.query(query, {
        replacements,
        type: db.sequelize.QueryTypes.SELECT,
      });

      const finalResults = results.map((row) => {
        const totalAttempted = parseInt(row.total_attempted_scenarios || 0);
        const totalCompleted = parseInt(row.total_completed_scenarios || 0);

        const scenario_level_stats = {
          Easy: {
            completed: parseInt(row.completed_easy_count || 0),
            total: totalCompleted,
          },
          Medium: {
            completed: parseInt(row.completed_medium_count || 0),
            total: totalCompleted,
          },
          Hard: {
            completed: parseInt(row.completed_hard_count || 0),
            total: totalCompleted,
          },
        };

        const scenario_completion_data = totalAttempted
          ? ((totalCompleted / totalAttempted) * 100).toFixed(2)
          : "0.00";

        const totalAnswers = parseInt(row.total_answers || 0);
        const totalQuestions = parseInt(row.total_questions || 0);

        const quiz_answer_data =
          totalQuestions > 0
            ? ((totalAnswers / totalQuestions) * 100).toFixed(2)
            : "0.00";

        return {
          learner_id: row.learner_id,
          name: row.learner_name,
          total_attempted_scenarios: totalAttempted,
          total_completed_scenarios: totalCompleted,
          scenario_level_stats,
          scenario_completion_data,
          quiz_answer_data,
        };
      });

      return finalResults;
    } catch (err) {
      throw err;
    }
  };


const getLearnerDetails =
  ({ db }) =>
  async (learner_id = null) => {
    try {
      let baseQuery = `
      SELECT 
        l.learner_id,
        l.username,
        l.firstname,
        l.lastname,
        l.email,
        l.mobile,
        DATE(lrt.logged_in) AS login_date,
        DATE_FORMAT(MAX(lrt.logged_in), '%Y-%m-%d %H:%i:%s') AS last_login,
        DATE_FORMAT(MAX(lrt.logged_out), '%Y-%m-%d %H:%i:%s') AS last_logout
      FROM learners AS l
      LEFT JOIN learner_refresh_tokens AS lrt
        ON l.learner_id = lrt.learner_id
    `;

      const replacements = {};

      // Apply conditional WHERE clause
      if (Array.isArray(learner_id) && learner_id.length > 0) {
        baseQuery += ` WHERE l.learner_id IN (:learner_id)`;
        replacements.learner_id = learner_id;
      } else if (learner_id) {
        baseQuery += ` WHERE l.learner_id = :learner_id`;
        replacements.learner_id = learner_id;
      }

      // Final GROUP BY and ORDER BY clause
      baseQuery += `
      GROUP BY
        l.learner_id,
        l.username,
        l.firstname,
        l.lastname,
        l.email,
        l.mobile,
        DATE(lrt.logged_in)
      ORDER BY
        login_date DESC;
    `;

      const result = await db.sequelize.query(baseQuery, {
        replacements,
        type: db.sequelize.QueryTypes.SELECT,
      });

      return result;
    } catch (err) {
      throw err;
    }
  };

module.exports = {
  getLearnerStatistics,
  getLearnerDetails,
};
