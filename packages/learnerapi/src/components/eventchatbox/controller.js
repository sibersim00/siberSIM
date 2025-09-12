const getMessagesByEvent =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const { eventlearnerid } = req.body;
      const result = await dao.getMessagesByEvent({ db })({ eventlearnerid });

      return res.status(200).json({
        statusCode: 200,
        message: validation.messages.fetch_messages_success,
        data: result,
      });
    } catch (error) {
      console.error("Error in getMessagesByEvent:", error.message);
      return res.status(500).json({
        statusCode: 500,
        message: validation.messages.fetch_messages_error,
      });
    }
  };

const refreshByEvent =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const { eventlearnerid, eventlearnerchatid } = req.body;
      const result = await dao.refreshByEvent({ db })({
        eventlearnerid,
        eventlearnerchatid,
      });

      return res.status(200).json({
        statusCode: 200,
        message: validation.messages.refresh_messages_success,
        data: result,
      });
    } catch (error) {
      console.error("Error in refreshByEvent:", error.message);
      return res.status(500).json({
        statusCode: 500,
        message: validation.messages.refresh_messages_error,
      });
    }
  };

const sendMessage =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const body = req.body;
      body.learner_id = req.learneruser.learner_id;
      body.instructor_id = req.learneruser.instructor_id;
      body.sender_type = req.learneruser.type;

      const data = await dao.sendMessage({ db })(body);

      return res.status(200).json({
        statusCode: 200,
        message: validation.messages.message_sent,
        data, 
      });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      return res.status(500).json({
        statusCode: 500,
        message: validation.messages.message_send_error,
      });
    }
  };


const markMessagesSeen =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const viewer_type = "instructor";
      const { eventid, learner_id, instructor_id } = req.body;

      const result = await dao.markMessagesSeen({ db })({
        eventid,
        learner_id,
        instructor_id,
        viewer_type,
      });

      return res.status(200).json({
        statusCode: 200,
        message: validation.messages.messages_seen_success,
        data: result,
      });
    } catch (error) {
      console.error("Error in markMessagesSeen:", error.message);
      return res.status(500).json({
        statusCode: 500,
        message: validation.messages.messages_seen_error,
      });
    }
  };

module.exports = {
  getMessagesByEvent,
  refreshByEvent,
  sendMessage,
  markMessagesSeen,
};
