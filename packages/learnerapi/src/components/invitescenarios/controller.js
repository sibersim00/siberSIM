const path = require("path");
const fs = require("fs");

const getRunningInviteLearnersController =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      let learner_sessionid = req.learneruser.learner_id;
      const result = await dao.getRunningInviteLearners({ db })(
        learner_sessionid,
      );
      res.status(200).send({
        statusCode: 200,
        message: "Running invite learners list",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).json({
        statusCode: 500,
        message: "Internal Server Error",
      });
    }
  };

const getInviteScenarioByID =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const learner_id = req.learneruser.learner_id;
      const scenariouuid = req.params.scenariouuid;
      const result = await dao.getInviteScenarioByID({ db })(
        scenariouuid,
        learner_id,
      );
      if (!result) {
        return res.status(200).send({
          statusCode: 200,
          message: "Scenario Not Found",
          data: null,
        });
      }
      return res.status(200).send({
        statusCode: 200,
        message: "Scenario Fetch Successfully",
        data: result,
      });
    } catch (err) {
      console.error("Error in getInviteScenarioByID:", err.message);
      return res.status(500).send({
        statusCode: 500,
        message: "Error in getInviteScenarioByID",
      });
    }
  };

module.exports = {
  getRunningInviteLearnersController,
  getInviteScenarioByID,
};
