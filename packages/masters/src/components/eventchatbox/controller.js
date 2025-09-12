const getMessagesByEventLearner = ({ dao, db }) => async (req, res) => {
  try {
    const { eventlearnerid } = req.body;
    const result = await dao.getMessagesByEventLearner({ db })({ eventlearnerid });
    return res.status(200).json({ statusCode: 200, data: result });
  } catch (error) {
    console.error("Error in getMessagesByEventLearner:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while fetching messages.",
    });
  }
};

const refreshByEventLearner = ({ dao, db }) => async (req, res) => {
  try {
    const { eventlearnerid, eventlearnerchatid } = req.body;
    const result = await dao.refreshByEventLearner({ db })({
      eventlearnerid,
      eventlearnerchatid,
    });
    return res.status(200).json({ statusCode: 200, data: result });
  } catch (error) {
    console.error("Error in refreshByEventLearner:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while fetching messages.",
    });
  }
};

const sendMessage = ({ dao, db }) => async (req, res) => {
  try {
    const body = req.body;

    // Assuming req.user is populated with authenticated user info
    body.instructor_id = req.user.userid; 
    body.sender_type = req.user.usertype;

    // learner_id should be passed in req.body or set here if available from req.user
    const result = await dao.sendMessage({ db })(body);

    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while sending the message.",
    });
  }
};

const markMessagesSeen = ({ dao, db }) => async (req, res) => {
  try {
    const viewer_type = "instructor"; // or dynamically set based on request

    const { eventid, learner_id, instructor_id } = req.body;

    const result = await dao.markMessagesSeen({ db })({
      eventid,
      learner_id,
      instructor_id,
      viewer_type,
    });

    return res.status(200).json({
      statusCode: 200,
      message: "Messages marked as seen",
      updatedRows: result,
    });
  } catch (error) {
    console.error("Error in markMessagesSeen:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while marking messages as seen.",
    });
  }
};

module.exports = {
  getMessagesByEventLearner,
  refreshByEventLearner,
  sendMessage,
  markMessagesSeen,
};
