const axios = require("axios");
const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;

const setScenarioLearnerConfiguration =
  ({ dao, db, validation, keys }) =>
  async (req, res, next) => {
    try {
      const { scenarioid, learnerid, scenariolearnersessionid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!scenarioid || !learnerid || !scenariolearnersessionid) {
        return res.status(400).send({
          statusCode: 400,
          message:
            "scenarioid,scenariolearnersessionid and learnerid is required.",
        });
      }

      try {
        const response = await axios.post(
          `${keys.EVENTLEARNER_API_URL}/vmconfigs/set-scenario-learner-config`,
          { scenarioid, learnerid, scenariolearnersessionid }
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");

        if (error.response) {
          console.error("Response Error:");
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
          console.error("Headers:", error.response.headers);
        } else if (error.request) {
          console.error("No Response:");
          console.error(error.request);
        } else {
          console.error("Request Setup Error:", error.message);
        }

        // Fallback: Call DAO directly and mark as failed
        try {
          const result = await dao.setScenarioLearnerConfigurationOnFailure({
            db,
            ipAddress,
            scenarioid,
            learnerid,
            scenariolearnersessionid,
          });

          return res.status(500).send({
            statusCode: 500,
            message: "Job service failed. Fallback handled via DB update.",
            fallback: result,
          });
        } catch (fallbackError) {
          console.error("Fallback DAO also failed:", fallbackError);
          return res.status(500).send({
            statusCode: 500,
            message: "Job service and fallback both failed.",
            error: fallbackError.message || fallbackError,
          });
        }
      }
    } catch (err) {
      console.error("Error in setting scenario learner configuration:", err);
      next(err);
    }
  };

const updateCompleteTerminate = ({ dao, db }) => async (req, res, next) => {
    try {
      const { scenariolearnersessionid, status, type } = req.body;
      const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      if (!scenariolearnersessionid || !status || !type) {
        return res.status(400).send({statusCode: 400, message: "scenariolearnersessionid, status, and type are required."});
      }
      try {
        const response = await axios.post(`${EVENTLEARNER_API_URL}/vmconfigs/update-complete-terminate`,
          { scenariolearnersessionid, status, type }
        );
        return res.status(200).send({statusCode: 200, message: response.data.message || "Job Updated successfully.", data: response.data});
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
          console.error("Headers:", error.response.headers);
        } else if (error.request) {
          console.error("No Response:");
          console.error(error.request);
        } else {
          console.error("Request Setup Error:", error.message);
        }
             try {
          const result = await dao.updateCompleteTerminate({db, ipAddress, status, type, scenariolearnersessionid});
          return res.status(500).send({statusCode: 500, message: "Job service failed. Fallback handled via DB update.", fallback: result});
        } catch (fallbackError) {
          console.error("Fallback DAO also failed:", fallbackError);
          return res.status(500).send({statusCode: 500, message: "Job service and fallback both failed.", error: fallbackError.message || fallbackError});
        }
      }
    } catch (err) {
      console.error("Error in setting scenario learner configuration:", err);
      next(err);
    }
  };

  const stopAndDestroyFailedScenarios =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.stopAndDestroyFailedScenarios({ db, ipAddress })();

      if (!result.success) {
        return res.status(500).send({ statusCode: 500, message: result.message });
      }

      return res.status(200).send({ statusCode: 200, message: result.message });
    } catch (err) {
      console.error("Error in stopAndDestroyFailedScenarios:", err);
      next(err);
    }
  };

const stopAndDestroyFailedEvents =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.stopAndDestroyFailedEvents({ db, ipAddress })();

      if (!result.success) {
        return res.status(500).send({ statusCode: 500, message: result.message });
      }

      return res.status(200).send({ statusCode: 200, message: result.message });
    } catch (err) {
      console.error("Error in stopAndDestroyFailedEvents:", err);
      next(err);
    }
  };


const generateProxmoxAccessToken =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const payload = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.generateProxmoxAccessToken({ db, payload })(
        ipAddress
      );

      res.status(result.statusCode || 500).json(result);
    } catch (err) {
      console.error("Error generating Proxmox token:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

const getOperationFailedLogs =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const result = await dao.getOperationFailedLogs({ db })();

      return res.status(200).send({
        statusCode: 200,
        message: "Logs Fetched Successfully",
        data: result,
      });
    } catch (err) {
      console.error("Error in getOperationFailedLogs:", err.message);
      return res.status(500).send({
        statusCode: 500,
        message: "Error in Fetching Logs",
      });
    }
  };

  const getEventOperationFailedLogs =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const result = await dao.getEventOperationFailedLogs({ db })();

      return res.status(200).send({
        statusCode: 200,
        message: "Event Logs Fetched Successfully",
        data: result,
      });
    } catch (err) {
      console.error("Error in getEventOperationFailedLogs:", err.message);
      return res.status(500).send({
        statusCode: 500,
        message: "Error in Fetching Event Logs",
      });
    }
  };


module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminate,
  generateProxmoxAccessToken,
  stopAndDestroyFailedScenarios,
  getOperationFailedLogs,
  stopAndDestroyFailedEvents,
  getEventOperationFailedLogs
};
