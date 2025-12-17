const scenarioQuestions = ({ dao, db, validation }) => async (req, res) => {
  const scenariouuid = req.params.scenariouuid; // get scenarioid from params

  try {
    const result = await dao.scenarioQuestions({ db, validation })({ scenariouuid });
    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.fetch_list,
      data: result,
    });
  } catch (err) {
    console.error("Controller error:", err);
    return res.status(500).json({
      statusCode: 500,
      message: err.message,
    });
  }
};


const scenarioQuestionSave = ({ dao, db, validation }) => async (req, res, next) => {
  const body = req.body;
  const session_userid = req.user.userid;
  const session_usertype = req.user.usertype;

  try {
    const { error } = validation.saveSchema.validate(body, { abortEarly: false, allowUnknown: true });
    if (error) {
      const errors = error.details.map(err => ({
        field: err.context.label,
        message: err.message,
      }));
      return res.status(400).json({ statusCode: 400, errors });
    }

    const result = await dao.scenarioQuestionSave({ db, validation })({ body, session_userid, session_usertype });
    return res.status(result.statusCode).json({
      statusCode: result.statusCode,
      message: result.message || validation.messages.save_success,
    });
  } catch (err) {
    next(err);
  }
};


const statusChange = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    const body = req.body;

    // Check user session
    if (!req.user || !req.user.userid) {
      return res.status(401).json({ statusCode: 401, message: "Unauthorized user" });
    }

    const session_userid = req.user.userid;
    const session_usertype = req.user.usertype;

    // Validate input
    const { error } = validation.statusSchema.validate(body, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const errors = error.details.map((err) => ({
        field: err.context.label,
        message: err.message,
      }));
      return res.status(400).json({ statusCode: 400, errors });
    }

    // Call DAO
    const result = await dao.statusChange({ db })({
      body,
      session_userid,
      session_usertype,
    });

    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.status_change || "Status updated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error in controller statusChange:", err);
    next(err);
  }
};

const deleteById = ({ dao, db, validation }) => async (req, res) => {
  const scenarioquestionid = req.params.scenarioquestionid;

  try {
    if (!scenarioquestionid) {
      return res.status(400).json({
        statusCode: 400,
        message: "scenarioquestionid is required",
      });
    }

    await dao.deleteById({ db })({ scenarioquestionid });

    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.delete_success,
    });
  } catch (err) {
    console.error("Error deleteById:", err);
    return res.status(500).json({ statusCode: 500, message: err.message });
  }
};

const importScenarioQuestion = ({ dao, db, validation }) => async (req, res) => {
  const body = req.body;
  const session_userid = req.user.userid;
  const session_usertype = req.user.usertype;

  try {

    await dao.importScenarioQuestion({ db })({ body, session_userid, session_usertype });
    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.import_success,
    });
  } catch (error) {
    console.error("Error in importScenarioQuestionsController:", error);
    return res.status(500).json({ statusCode: 500, message: error.message });
  }
};



const verifyImportScenarioQuestion = ({ dao, db, validation }) => async (req, res) => {
  const body = req.body;
  const session_userid = req.user.userid;
  const session_usertype = req.user.usertype;

  try {

    const result = await dao.verifyImportScenarioQuestion({ db })({ body, session_userid, session_usertype });
    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.verify_success,
      data: result,
    });
  } catch (err) {
    console.error("Error in verifyImportScenarioQuestion:", err);
    return res.status(500).json({ statusCode: 500, message: err.message });
  }
};

module.exports = {
  scenarioQuestions,
  scenarioQuestionSave,
  statusChange,
  deleteById,
  importScenarioQuestion,
  verifyImportScenarioQuestion,
};
