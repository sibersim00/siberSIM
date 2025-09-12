const listScenarios =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      // Extract logged-in user's info from the request
      const session_userid = req.user.userid;
      const usertype = req.user.usertype;

      // Fetch scenarios from DAO with filters applied based on usertype
      const scenarios = await dao.listScenarios({ db, validation })(
        usertype,
        session_userid
      );

      // Respond with the scenario data
      res
        .status(200)
        .send({
          statusCode: 200,
          message: validation.messages.list_scenarios,
          data: scenarios,
        });
    } catch (error) {
      console.error("Error fetching scenario list:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred while retrieving scenarios." });
    }
  };

const getUserSessionById =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const scenariolearneruuid = req.params.scenariolearneruuid;
      if (!scenariolearneruuid) {
        return result.status(400).json({ error: "Scenario ID is required." });
      }
      const scenario = await dao.getUserSessionById({ db })(
        scenariolearneruuid
      );
      if (!scenario || scenario.length === 0) {
        return res.status(404).json({ error: "Scenario not found." });
      }
      res.status(200).json({ statusCode: 200, data: scenario });
    } catch (error) {
      console.error("Error fetching scenario by ID:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred while retrieving the scenario." });
    }
  };
const notitermination =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const session_userid = req.user.userid;
      // Call the DAO function, not the controller itself
      const result = await dao.notitermination({ db, validation })(
        body,
        session_userid
      );

      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching termination notification:", error);
      res.status(500).json({ error: validation.messages.server_error });
    }
  };

// controller for chatbox
const getMessagesByScenario =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const { scenarioid, learner_id, instructor_id } = req.body;
      if (!scenarioid || !learner_id || !instructor_id) {
        const missingParams = {
          scenarioid: !scenarioid,
          learner_id: !learner_id,
          instructor_id: !instructor_id,
        };
        console.error("Missing parameters:", missingParams); // Log which parameters are missing
        return res.status(400).json({
          statusCode: 400,
          message: "Missing required parameters.",
          error: missingParams, // Include the missing parameters in the error response
        });
      }

      // Fetch messages
      const result = await dao.getMessagesByScenario({ db })({
        scenarioid,
        learner_id,
        instructor_id,
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

const sendMessage =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const sender_id = req.user.userid; // Instructor user id
      const result = await dao.sendMessage({ db })(req.body, sender_id);

      return res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in sendMessage:", error.message);
      return res.status(500).json({
        statusCode: 500,
        error: "An error occurred while sending the message.",
      });
    }
  };

const markMessagesSeen =
  ({ dao, db }) =>
  async (req, res) => {
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
const terminateScenario =
  ({ db, dao }) =>
  async (req, res) => {
    const { scenariolearnersessionid, remark, type } = req.body;
    const usertype = req.user.usertype;
    const session_userid = req.user.userid;

    if (!scenariolearnersessionid || !usertype) {
      return res
        .status(400)
        .json({ error: "scenariolearnersessionid and type are required." });
    }

    try {
      const result = await dao.terminateScenario({ db })(
        scenariolearnersessionid,
        usertype,
        remark,
        type,
        session_userid
      );
      return res.status(200).json({
        statusCode: 200,
        message: "Terminate Successfully",
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

const getLogs =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const session_userid = req.user.userid;
      const scenariolearneruuid = req.body.scenariolearneruuid;
      const result = await dao.getLogs({ db })(
        scenariolearneruuid,
        session_userid
      );
      return res.status(200).send({ statusCode: 200, data: result });
    } catch (err) {
      next(err);
    }
  };

module.exports = {
  listScenarios,
  getMessagesByScenario,
  sendMessage,
  markMessagesSeen,
  notitermination,
  terminateScenario,
  getUserSessionById,
  getLogs,
};
