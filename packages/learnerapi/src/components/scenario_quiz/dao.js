const getquestionlist = ({ db }) => async ({ scenariouuid, learnerid }) => {
    try {
      const [settings] = await db.sequelize.query(`SELECT max_questions FROM web_settings WHERE status = 1 ORDER BY id DESC LIMIT 1`);
      const maxQuestions = settings.length > 0 ? settings[0].max_questions : 25;
      const [scenarios] = await db.sequelize.query( `SELECT scenarioid, scenariotitle FROM scenarios WHERE scenariouuid = ? AND status = 'Active'`,
        {
          replacements: [scenariouuid],
        }
      );
      if (scenarios.length === 0) {
        return false;
      }
      const scenarioid = scenarios[0].scenarioid;
      const [questions] = await db.sequelize.query(`SELECT scenarioquestionid, question_text, question_type FROM scenario_questions WHERE scenarioid = ? AND status = 'Active' ORDER BY RAND() LIMIT ?`,
        {
          replacements: [scenarioid, maxQuestions],
        }
      );
      if (questions.length === 0) {
        return false;
      }
      const questionIds = questions.map((q) => q.scenarioquestionid);
      const [answers] = await db.sequelize.query(`SELECT scenarioquestionid, answer_text, is_correct FROM scenario_question_answers WHERE scenarioquestionid IN (?) AND status = 'Active'`,
        {
          replacements: [questionIds],
        }
      );
      const answerMap = {};
      questionIds.forEach((qid) => {
        let count = 1;
        answerMap[qid] = answers.filter((ans) => ans.scenarioquestionid === qid).map((ans) => ({answer_text: ans.answer_text, is_correct: ans.is_correct, answer_id: count++}));
      });
      const quizData = {
        scenarioid: scenarioid, learnerid: learnerid, scenariotitle: scenarios[0].scenariotitle, startedon: new Date().toISOString(), total_questions: questions.length, answer_questions: 0, questions: questions.map((q) => ({
          question_id: q.scenarioquestionid, question_text: q.question_text, question_type: q.question_type, answers: answerMap[q.scenarioquestionid] || []})),
      };
      return quizData;
    } catch (error) {
      console.error("Error in getquestionlist DAO:", error);
      throw error;
    }
  };

const saveScenarioQuizQuesAnsData = ({ db, validation }) => async (body) => {
    const questionData = body.questionAnsData;
    if (!questionData || questionData.length === 0) {
      throw new Error("No question data provided");
    }
      const [webSettings] = await db.sequelize.query(`SELECT max_questions FROM web_settings LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      const totalQuestions = webSettings?.max_questions || 25;
    try {
     const insertQuizQuery = `INSERT INTO scenario_learner_quiz (scenarioid, scenariolearnerid, learner_id, startedon, endedon, status, timer, total_questions, total_answers, total_correct_answers) VALUES (?, ?, ?, ?, now(), ?, ?, ?, ?, ?)`;
      const quizReplacements = [body.scenarioid || 0, body.scenariolearnerid || 0, body.learner_id || 0, body.startedon || new Date(), body.status || "Pending", body.timer, totalQuestions, body.total_answers || 0, body.total_correct_answers || 0];
      const [quizResult] = await db.sequelize.query(insertQuizQuery, {
        replacements: quizReplacements,
        type: db.sequelize.QueryTypes.INSERT,
      });
      const scenariolearnerquizid = quizResult;
      const insertDataQuery = `INSERT INTO scenario_learner_quiz_data (scenariolearnarquizid, scenarioquestionid, question_text, answer_array, correctanswerid, learneranswerids, status, createdon) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
      for (const question of questionData) {
        if (!question.answers || !Array.isArray(question.answers)) {
          throw new Error(`answers array missing in question ${question.question_id}`);
        }
        const correctAnswerIdsArray = question.answers.filter((ans) => ans.is_correct?.toLowerCase?.().trim() === "yes").map((ans) => String(ans.answer_id).trim());
        const correctAnswerIds = correctAnswerIdsArray.join(",");
        const learnerAnswerIdsArray = Array.isArray(question.learneranswerids) ? question.learneranswerids.map((id) => String(id).trim()) : (question.learneranswerids || "").split(",").map((id) => String(id).trim());
        const learnerAnswerIds = learnerAnswerIdsArray.join(",");
        const status =
          correctAnswerIdsArray.length === learnerAnswerIdsArray.length &&
          correctAnswerIdsArray.every((id) => learnerAnswerIdsArray.includes(id)) ? "Pass" : "Fail";
        const answerArrayJson = JSON.stringify(question.answers);
        const dataReplacements = [scenariolearnerquizid, question.question_id, question.question_text || "", answerArrayJson, correctAnswerIds, learnerAnswerIds, status];
        await db.sequelize.query(insertDataQuery, {
          replacements: dataReplacements,
          type: db.sequelize.QueryTypes.INSERT,
        });
      }
      return {statusCode: 200, message: validation.messages.quiz_save_success};
    } catch (error) {
      console.error("Error saving quiz answers:", error);
      throw error;
    }
  };

const getAllLearnerQuiz = ({ db }) => async (scenariouuid, learner_sessionid) => {
    try {
      const query = `SELECT slq.scenariolearnarquizid, slq.scenariolearnerid, slq.scenarioid, slq.learner_id, slq.startedon, slq.endedon, slq.status, slq.timer, slq.total_questions, COALESCE(la.total_answers, 0) AS total_answers, slq.total_correct_answers FROM scenario_learner_quiz slq INNER JOIN scenarios s ON slq.scenarioid = s.scenarioid LEFT JOIN (SELECT scenariolearnarquizid, COUNT(*) AS total_answers FROM scenario_learner_quiz_data WHERE learneranswerids IS NOT NULL AND learneranswerids != '' GROUP BY scenariolearnarquizid) la ON slq.scenariolearnarquizid = la.scenariolearnarquizid WHERE s.scenariouuid = :scenariouuid AND slq.learner_id = :learner_sessionid ORDER BY slq.startedon DESC`;
      const results = await db.sequelize.query(query, {
        replacements: { scenariouuid, learner_sessionid },
        type: db.sequelize.QueryTypes.SELECT,
      });
      return results;
    } catch (err) {
      console.error("Error in getAllLearnerQuizByScenarioUUID:", err);
      throw err;
    }
  };

module.exports = {
  getquestionlist,
  saveScenarioQuizQuesAnsData,
  getAllLearnerQuiz,
};
