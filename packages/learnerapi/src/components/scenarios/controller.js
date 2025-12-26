const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learner_id = req.learneruser.learner_id;
    const result = await dao.getAll({ db })(learner_id);
    return res.status(200).send({ statusCode: 200, message: validation.messages.GET_ALL_SUCCESS, data: result });
  } catch (err) {
    console.error("Error in getAll:", err.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.GET_ALL_ERROR });
  }
};

const getByID = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learner_id = req.learneruser.learner_id;
    const scenariouuid = req.params.scenariouuid;
    const result = await dao.getByID({ db })(scenariouuid, learner_id);
    if (!result) {
      return res.status(404).send({ statusCode: 404, message: validation.messages.NOT_FOUND });
    }
    return res.status(200).send({ statusCode: 200, message: validation.messages.GET_BY_ID_SUCCESS, data: result });
  } catch (err) {
    console.error("Error in getByID:", err.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.GET_BY_ID_ERROR });
  }
};

const startScenario = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.learner_id = req.learneruser.learner_id;
    console.log("req.learneruser", req.learneruser)
    body.instructor_id = req.learneruser.instructor_id;
    const user_count_limit = req.learneruser.user_count_limit;
    const result = await dao.startScenario({ db, validation })(body, user_count_limit);
    return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message, scenariolearnerid: result.scenariolearnerid || null, scenariolearnersessionid: result.scenariolearnersessionid || null, scenariolearnersessionuuid: result.scenariolearnersessionuuid || null });
  } catch (error) {
    console.error("Error saving scenario learner:", error.message);
    return res.status(500).json({ statusCode: 500, message: validation.messages.SERVER_ERROR });
  }
};

const updateSessionStatus = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.learner_id = req.learneruser.learner_id;
    body.instructor_id = req.learneruser.instructor_id;
    const result = await dao.updateSessionStatus({ db, validation })(body);
    return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message, scenariolearnerid: result.scenariolearnerid || null, scenariolearnersessionid: result.scenariolearnersessionid || null });
  } catch (error) {
    console.error("Error saving scenario learner status:", error.message);
    return res.status(500).json({ statusCode: 500, message: validation.messages.SERVER_ERROR });
  }
};

const getSessionStatus = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    const session_uuid = req.params.session_uuid;
    const result = await dao.getSessionStatus({ db, validation })(session_uuid);
    if (!result) {
      return res.status(404).json({ statusCode: 404, message: validation.messages.SESSION_NOT_FOUND });
    }
    return res.status(200).json({ statusCode: 200, message: validation.messages.SESSION_STATUS_SUCCESS, data: result, });
  } catch (error) {
    console.error("Error in getSessionStatus:", error.message);
    return res.status(500).json({ statusCode: 500, message: validation.messages.SESSION_STATUS_ERROR });
  }
};

const getMessagesByScenario = ({ dao, db }) => async (req, res) => {
  try {
    const { scenariolearnerid } = req.body;
    const result = await dao.getMessagesByScenario({ db })({
      scenariolearnerid,
    });
    return res.status(200).json({ statusCode: 200, data: result });
  } catch (error) {
    console.error("Error in getMessagesByScenario:", error.message);
    return res.status(500).json({ statusCode: 500, error: "An error occurred while fetching messages." });
  }
};

const sendMessage = ({ dao, db, validation }) => async (req, res) => {
  try {
    let body = req.body;
    body.instructor_id = req.user.userid;
    body.sender_type = req.user.usertype;
    const result = await dao.sendMessage({ db, validation })(body);
    return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message, data: result.data });
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    return res.status(500).json({ statusCode: 500, error: "An error occurred while sending the message." });
  }
};

const markMessagesSeen = ({ dao, db, validation }) => async (req, res) => {
  try {
    const viewer_type = req.learneruser ? 'learner' : 'instructor';
    const viewer_id = req.learneruser?.learner_id || req.instructoruser?.userid;
    const { scenarioid, learner_id, instructor_id } = req.body;
    const result = await dao.markMessagesSeen({ db, validation })({ scenarioid, learner_id, instructor_id, viewer_type, viewer_id, });
    return res.status(200).json({ statusCode: 200, message: validation.messages.MARK_SEEN, updatedRows: result });
  } catch (err) {
    console.error("Mark seen error:", err.message);
    res.status(500).json({ statusCode: 500, message: validation.messages.SERVER_ERROR });
  }
};

const getLogs = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learner_id = req.learneruser.learner_id;
    const scenariouuid = req.body.scenariouuid;
    const result = await dao.getLogs({ db })(scenariouuid, learner_id);
    return res.status(200).send({ statusCode: 200, message: validation.messages.LOGS_FETCH_SUCCESS, data: result });
  } catch (err) {
    console.error("Error in getLogs:", err.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.LOGS_FETCH_ERROR });
  }
};


const getTabList = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getTabList({ db })(null);

    if (result && result.length > 0) {
      return res.status(200).send({
        statusCode: 200,
        message: "Scenario Tab List fetched successfully",
        data: result,
      });
    }

    return res.status(200).send({
      statusCode: 200,
      message: "No records found",
      data: [],
    });
  } catch (error) {
    console.error("Error fetching scenario tab list:", error);
    return res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error,
    });
  }
};



const getPaused = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learner_id = req.learneruser.learner_id;
    const result = await dao.getPaused({ db })(learner_id);
    return res.status(200).send({
      statusCode: 200,
      // message: validation.messages.GET_ALL_SUCCESS,
      data: result
    });
  } catch (err) {
    console.error("Error in Paused:", err.message);
    return res.status(500).send({
      statusCode: 500,
      message: validation.messages.GET_ALL_ERROR
    });
  }
};

const canResumeScenario = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const result = await dao.canResumeScenario({ db, validation })(body);

    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in canResumeScenario:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while checking scenario resume status.",
    });
  }
};



module.exports = {
  getAll,
  getByID,
  startScenario,
  getMessagesByScenario,
  sendMessage,
  markMessagesSeen,
  updateSessionStatus,
  getSessionStatus,
  getLogs,
  getTabList,
  getPaused,
  canResumeScenario
};