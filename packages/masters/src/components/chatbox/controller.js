// controller for chatbox
const getMessagesByScenario = ({ dao, db }) => async (req, res) => {
  try {
    const {scenariolearnerid} = req.body;
     const result = await dao.getMessagesByScenario({ db })({
      scenariolearnerid,
   });

    return res.status(200).json({ statusCode: 200, data: result });
  } catch (error) {
    console.error("Error in getMessagesByScenario:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while fetching messages.",
    });
  }
};

const refreshByScenario = ({ dao, db }) => async (req, res) => {
  try {
    const {scenariolearnerid,scenariolearnerchatid } = req.body;
     const result = await dao.refreshByScenario({ db })({
      scenariolearnerid,
      scenariolearnerchatid,
   });

    return res.status(200).json({ statusCode: 200, data: result });
  } catch (error) {
    console.error("Error in refreshByScenario:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred while fetching messages.",
    });
  }
};

const sendMessage = ({ dao, db }) => async (req, res) => {
  try {
    let body=req.body;
    body.instructor_id = req.user.userid; // Instructor user id
    body.sender_type = req.user.usertype;

    const result = await dao.sendMessage({ db })(body);

    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      data:result.data
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
    const viewer_type = "instructor"; // Since this is from instructor panel
    const { scenarioid, learner_id, instructor_id } = req.body;

    const result = await dao.markMessagesSeen({ db })({
      scenarioid,
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
  getMessagesByScenario,
  refreshByScenario,
  sendMessage,
  markMessagesSeen,
};






