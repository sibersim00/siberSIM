const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learner_id = req.learneruser.learner_id;
    const eventid = req.learneruser.eventid;
    const data = await dao.getAll({ db })({ learner_id, eventid });
    if (!data || data.length === 0) {
      return res.status(400).json({ statusCode: 400, message: validation.messages.scenarios_not_found });
    }
    return res.status(200).json({ statusCode: 200, message: validation.messages.success, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};


const startEvent = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = {
      ...req.body,
      learner_id: req.learneruser.learner_id,
      instructor_id: req.learneruser.instructor_id,
      user_count_limit: req.learneruser.user_count_limit,
    }
    const result = await dao.startEvent({ db, validation })(body);
    res.status(result.statusCode).json({ statusCode: result.statusCode, message: result.message, eventlearnerid: result.eventlearnerid, vmrequestid: result.vmrequestid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};

const updateEventLearnerStatus = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.updateEventLearnerStatus({ db, validation })(req.body);
    res.status(result.statusCode).json({ statusCode: result.statusCode, message: result.message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};

const getEventStatus = ({ dao, db, validation }) => async (req, res) => {
  try {
    const data = await dao.getEventStatus({ db })(req.params.vmrequestid);
    if (!data) {
      return res.status(404).json({ statusCode: 404, message: validation.messages.event_status_not_found });
    }
    res.status(200).json({ statusCode: 200, message: validation.messages.event_status_fetched, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};

const getLogs = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getLogs({ db, validation })(req.body.eventlearnerid);
    res.status(result.statusCode).json({ statusCode: result.statusCode, message: result.message, data: result.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};

const canResumeScenario = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
      const user_count_limit = req.learneruser.user_count_limit;
      console.log("tttttttttttttttttttt",user_count_limit)
    const result = await dao.canResumeScenario({ db, validation })(body,user_count_limit);

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
  startEvent,
  updateEventLearnerStatus,
  getEventStatus,
  getLogs,
  canResumeScenario
};
