const { checkLearnerCapacity, learnerLimitMessage } = require("../../utils/learnerLicenseLimit");
const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    let session_userid = req.user.userid;
    let usertype = req.user.usertype;
    // Get page & limit from query params (default to 1 and 12)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const result = await dao.getAll({ db })(session_userid, usertype, page, limit);
    res.status(200).send({
      statusCode: 200,
      message: validation.messages.student_list,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    if (!body.learner_id) {
      const capacity = await checkLearnerCapacity({ db, learnerLimit: req.user.learner_limit });
      if (!capacity.allowed) {
        return res.status(400).send({
          statusCode: 400,
          message: learnerLimitMessage(capacity),
          errors: [],
        });
      }
    }
    const session_userid = req.user.userid;
    const usertype = req.user.usertype;
    const result = await dao.save({ db, validation })(body, session_userid, usertype);
    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors || [],
    });
  } catch (error) {
    console.error("Error saving data:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred. Please try again later.",
    });
  }
};

const update = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    let session_userid=req.user.userid;
    let usertype=req.user.usertype;
    const result = await dao.update({ db,validation })(body,session_userid,usertype);
    return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message, errors: result.errors});
  } catch (error) {
    console.error("Error updating data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const statusChange = ({ dao, db,validation}) => async (req, res) => {
  try {
    let body=req.body
   body.userid=req.user.userid;
    const result = await dao.statusChange({ db,validation })(body,body.userid);
    res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message,data:result.data});
  } catch (error) {
    console.error("Status Change Error:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const mailConfirmation = ({ dao, db, validation}) => async (req, res) => {
  const learner_id = req.body.learner_id;
  if (!learner_id) {
    console.error("Error: learner_id is missing from the request body.");
    return res.status(400).json({ error: "learner_id is required." });
  }
  try {
    const result = await dao.mailConfirmation({ db, validation })(learner_id);
    res.status(200).send({ statusCode: result.statusCode, message: result.message });
  } catch (error) {
    console.error("Mail confirmation error:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const resetPassword = ({ dao, db, validation}) => async (req, res) => {
  try {
    const learner_id=req.body.learner_id;
    const result = await dao.resetpassword({ db })(learner_id);
    res.status(200).send({statusCode: 200, message: validation.messages.reset_password_success,data:result});
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const getMappedInstructor =  ({ dao, db, validation }) => async (req, res) => {
    try {
      const session_userid = req.body.learner_id;
      const usertype  = req.user.usertype;
      const instructorId = await dao.getMappedInstructor({ db })(session_userid, usertype);

      res.status(200).send({
        statusCode: 200,
        message: validation.messages.mapped_instructor_list,
        data: instructorId,          
      });
    } catch (error) {
      console.error("Error while retrieving data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
    }
  };


const saveMappedInstructor = ({ db, dao, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user.userid;

    if (!body.instructorlist || !Array.isArray(body.instructorlist) || body.instructorlist.length === 0) {
      return res.status(400).send({ statusCode: 400, message: "SIMManager list is required." });
    }

    const { learner_id, instructorlist } = body;

    await dao.saveMappedInstructors({ db })(learner_id, instructorlist, session_userid);

    return res.status(200).send({
      statusCode: 200,
      message: validation.messages.update_instructor_mapping_success || "SIMManager mapping updated successfully.",
    });
  } catch (error) {
    console.error("An error occurred while saving the instructor mapping:", error);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const deleteById = ({ dao, db, validation}) => async (req, res) => {
  try {
    const session_userid=req.body.learner_uuid;
    await dao.deleteById({ db,validation })(session_userid);
    return res.status(200).send({statusCode: 200, message: validation.messages.delete_success});
  } catch (error) {
    console.error("Error occurred while deleting data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getById = ({db, dao, validation }) => async (req, res) => {
  try {
    const learner_uuid = req.params.id;
    const result = await dao.getById({ db })(learner_uuid);

    if (!result) {
      return res.status(404).send({ statusCode: 404, message: "student_not_found" });
    }

    res.status(200).send({ statusCode: 200, message: "Learner found", data: result });
  } catch (error) {
    console.error("Error fetching learner:", error);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const verifyLearnerImport = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    if (!Array.isArray(req.body) || !req.body.length || req.body.length > 1000) {
      return res.status(400).send({ statusCode: 400, message: 'Import must contain between 1 and 1000 learner rows.' });
    }
    const capacity = await checkLearnerCapacity({
      db,
      learnerLimit: req.user.learner_limit,
      requestedCount: req.body.length,
    });
    if (!capacity.allowed) {
      return res.status(400).send({
        statusCode: 400,
        message: learnerLimitMessage(capacity, true),
        data: { success: [], errors: [] },
      });
    }
    const result = await dao.verifyLearnerImport({ db, validation })(req.body);
    return res.status(200).send({ statusCode: 200, message: 'Learner import file verified.', data: result });
  } catch (err) { next(err); }
};

const learnerImport = ({ dao, db, validation }) =>  async (req, res, next) => {
  try {
    if (!Array.isArray(req.body) || !req.body.length || req.body.length > 1000) {
      return res.status(400).send({ statusCode: 400, message: 'Import must contain between 1 and 1000 learner rows.' });
    }
    // Always recheck during the real import. The learner count may have
    // changed after the file was verified.
    const capacity = await checkLearnerCapacity({
      db,
      learnerLimit: req.user.learner_limit,
      requestedCount: req.body.length,
    });
    if (!capacity.allowed) {
      return res.status(400).send({
        statusCode: 400,
        message: learnerLimitMessage(capacity, true),
        successCount: 0,
        errorCount: req.body.length,
        errors: [],
      });
    }
    const result = await dao.learnerImport({ db, validation })({ body: req.body, session_userid: req.user.userid });
    return res.status(result.statusCode).send(result);
  }
  catch (err) { next(err) }
}

module.exports = {
  getAll,
  save,
  update,
  statusChange,
  mailConfirmation,
  resetPassword,
  getMappedInstructor,
  saveMappedInstructor,
  deleteById,
  getById,
  verifyLearnerImport,
  learnerImport,
}
