const { checkLearnerCapacity, learnerLimitMessage } = require("../../utils/learnerLicenseLimit");

const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const params = req.param;
    const result = await dao.getAll({ db,validation })(params);
    res.status(200).json({
      statusCode: 200,
      message: validation.messages.list_success,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ message: validation.messages.server_error, });
  }
};


const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    let userid = req.user.userid;
    const result = await dao.save({ db })(body, userid);
    let response = { statusCode: result.statusCode };
    if (result.statusCode === 200) {
      response.message = validation.messages.save_success; 
    } else if (result.statusCode === 400) {
      response.message = validation.messages.eventname_exists; 
    }
    return res.status(result.statusCode).json(response);
  } catch (error) {
    console.error('Error in createEvent controller:', error);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};

const update = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const userid = req.user.userid;
    const result = await dao.update({ db })(body, userid);
    let response = { statusCode: result.statusCode };
    if (result.statusCode === 200) {
      response.message = validation.messages.update_success; 
    } else if (result.statusCode === 404) {
      response.message = validation.messages.event_not_found; 
    } else if (result.statusCode === 400) {
      response.message = validation.messages.eventname_exists;
    }
    return res.status(result.statusCode).json(response);
  } catch (error) {
    console.error('Error in updateEvent controller:', error);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};


const addParticipants = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const capacity = await checkLearnerCapacity({ db, learnerLimit: req.user.learner_limit });
    if (!capacity.allowed) {
      return res.status(400).send({
        statusCode: 400,
        message: learnerLimitMessage(capacity),
        errors: [],
      });
    }
    const session_userid = req.user.userid;
    const result = await dao.addParticipants({ db, validation })(body, session_userid);
    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors || [],
    });
  } catch (error) {
    console.error("Error saving data:", error.message);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};

const addLearnerEvent = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user.userid;
    const result = await dao.addLearnerEvent({ db, validation })(body, session_userid);
    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors || [],
    });
  } catch (error) {
    console.error("Error saving learner_event_mapping:", error.message);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};


const getLearnersByEvent = ({ dao, db }) => async (req, res) => {
  try {
    const { eventid } = req.params;
    if (!eventid) {
      return res.status(400).send({
        statusCode: 400,
        message: "Event ID is required.",
        errors: ["Missing eventid"],
      });
    }
    const result = await dao.getLearnersByEvent({ db })(eventid);
    return res.status(result.statusCode).send(result);
  } catch (error) {
    console.error("Error in fetchLearnersByEvent:", error);
    return res.status(500).send({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};

const deleteLearnerFromEvent = ({ dao, db }) => async (req, res) => {
  try {
    const { eventlearnerid } = req.body;
    if (!eventlearnerid) {
      return res.status(400).send({
        statusCode: 400,
        message: "eventlearnerid is required.",
      });
    }
    const result = await dao.deleteLearnerFromEvent({ db })({ eventlearnerid });
    return res.status(result.statusCode).send(result);
  } catch (error) {
    console.error("Error in deleteLearnerFromEvent Controller:", error);
    return res.status(500).send({
      statusCode: 500,
      message: "An error occurred while removing the learner from the event.",
    });
  }
};

const updateParticipant = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user.userid;
    const result = await dao.updateParticipant({ db, validation })(body, session_userid);
    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors || [],
    });
  } catch (error) {
    console.error("Error updating participant:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while updating the participant.",
    });
  }
};

 module.exports = {
    getAll,
    save,
    update,
    addParticipants,
    addLearnerEvent,
    getLearnersByEvent,
    deleteLearnerFromEvent,
    updateParticipant
  }
