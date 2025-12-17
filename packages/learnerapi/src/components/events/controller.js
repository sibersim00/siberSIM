const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learner_id = req.learneruser.learner_id;
    const eventid = req.learneruser.eventid;
    const data = await dao.getAll({ db })({ learner_id, eventid });
    if (!data || data.length === 0) {
      return res.status(404).json({ statusCode: 404, message: validation.messages.scenarios_not_found });
    }
    return res.status(200).json({ statusCode: 200, message: validation.messages.success, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};


const startEvent = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = { ...req.body,
      learner_id: req.learneruser.learner_id,
      instructor_id: req.learneruser.instructor_id,
    };
    const result = await dao.startEvent({ db, validation })(body);
    res.status(result.statusCode).json({ statusCode: result.statusCode, message: result.message, eventlearnerid: result.eventlearnerid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};

const updateEventLearnerStatus = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.updateEventLearnerStatus({ db, validation })(req.body);
    res.status(result.statusCode).json({ statusCode: result.statusCode, message: result.message});
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: validation.messages.server_error });
  }
};

const getEventStatus = ({ dao, db, validation }) => async (req, res) => {
  try {
    const data = await dao.getEventStatus({ db })(req.params.eventlearnerid);
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

module.exports = {
  getAll,
  startEvent,
  updateEventLearnerStatus,
  getEventStatus,
  getLogs,
};
