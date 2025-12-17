const getquestionlist = ({ dao, db ,validation, crypto}) => async (req, res) => {
    try {
      const { scenariouuid,scenariolearnerid } = req.body;
      const learnerid = req.learneruser?.learner_id;
      const response = await dao.getquestionlist({ db })({scenariouuid,learnerid,scenariolearnerid});
       res.status(200).json({statusCode: 200, message: validation.messages.fetch_list, data: crypto.cryptoEncrypt(response)});
    } catch (err) {
      console.error("Error in getquestionlist controller:", err);
     res.status(500).json({statusCode: 500, message: validation.messages.server_error});
    }
  };

const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    await dao.saveScenarioQuizQuesAnsData({ db, validation })(body);
    return res.status(200).json({statusCode: 200, message: validation.messages.quiz_submit});
  } catch (error) {
    console.error("Error in saveScenarioQuizQuesAnsData controller:", error);
    res.status(500).json({statusCode: 500, message: validation.messages.server_error});
  }
};

const getAllLearnerQuiz = ({ dao, db, validation }) => async (req, res) => {
    try {
      const { scenariouuid } = req.params;
      let learner_sessionid = req.learneruser.learner_id;
      if (!scenariouuid) {
        return res.status(400).json({statusCode: 400, message: "Missing scenariouuid in request params.", data: []});
      }
      const quizList = await dao.getAllLearnerQuiz({ db })(scenariouuid, learner_sessionid);
      return res.status(200).json({statusCode: 200, message: validation.messages.fetch_list, data: quizList});
    } catch (err) {
      console.error("Error fetching quiz list:", err);
      return res.status(500).json({statusCode: 500, message: validation.messages.server_error, data: []});
    }
  };

module.exports = {
  getquestionlist,
  save,
  getAllLearnerQuiz,
};