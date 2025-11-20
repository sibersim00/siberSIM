const { componentSetupJob } = require("../../jobs/componentSetupJob");
const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;
const axios = require("axios");

const setScenarioLearnerConfiguration =
  ({ dao, db }) =>
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
          `${EVENTLEARNER_API_URL}/vmconfigs/set-scenario-learner-config`,
          { scenarioid, learnerid, scenariolearnersessionid }
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");

        // If the 2nd controller returned an error with a message from DAO
        if (error.response) {
          return res.status(error.response.status).send({
            statusCode: error.response.status,
            message:
              error.response.data?.message ||
              "Unexpected error in job service.",
            errorData: error.response.data,
          });
        }

        // If no response (timeout, crash, network issue) → run fallback DAO
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
            message:
              result?.message || "Something went wrong. Please try later",
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

const updateCompleteTerminate =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { scenariolearnersessionid, status, type } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      if (!scenariolearnersessionid || !status || !type) {
        return res
          .status(400)
          .send({
            statusCode: 400,
            message: "scenariolearnersessionid, status, and type are required.",
          });
      }
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/update-complete-terminate`,
          { scenariolearnersessionid, status, type }
        );
        return res
          .status(200)
          .send({
            statusCode: 200,
            message: response.data.message || "Job Updated successfully.",
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
        try {
          const result = await dao.updateCompleteTerminate({
            db,
            ipAddress,
            status,
            type,
            scenariolearnersessionid,
          });
          return res
            .status(500)
            .send({
              statusCode: 500,
              message: "Job service failed. Fallback handled via DB update.",
              fallback: result,
            });
        } catch (fallbackError) {
          console.error("Fallback DAO also failed:", fallbackError);
          return res
            .status(500)
            .send({
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

const stopAndDestroyFailedScenarios =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const result = await dao.stopAndDestroyFailedScenarios({
        db,
        ipAddress,
      })();
      if (!result.success) {
        return res
          .status(500)
          .send({ statusCode: 500, message: result.message });
      }
      return res.status(200).send({ statusCode: 200, message: result.message });
    } catch (err) {
      console.error("Error in stopAndDestroyFailedScenarios:", err);
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
      console.error("Error generating siberSIM token:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

const getOperationFailedLogs =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const result = await dao.getOperationFailedLogs({ db })();
      return res
        .status(200)
        .send({
          statusCode: 200,
          message: "Logs Fetched Successfully",
          data: result,
        });
    } catch (err) {
      console.error("Error in getOperationFailedLogs:", err.message);
      return res
        .status(500)
        .send({ statusCode: 500, message: "Error in Fetching Logs" });
    }
  };

const vncProxyConsole =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const { vmid, vmType } = req.body;

      if (!vmid || !vmType) {
        return res.status(400).json({
          statusCode: 400,
          message: "vmid and vmType are required",
        });
      }

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.vncProxyConsole({ db, validation })(
        { vmid, vmType },
        ipAddress
      );

      res.status(result.statusCode || 200).json(result);
    } catch (err) {
      console.error("Error generating VNC Console:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

const startScenarioLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/start-scenario-learner`,
          { vmid, vmType }
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
        } else {
          console.error("Request Setup Error:", error.message);
        }
        return res.status(500).send({
          statusCode: 500,
          message: "Something went wrong. Please try again.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in starting event learner:", err);
      next(err);
    }
  };

const restartscenarioLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/restart-scenario-learner`,
          { vmid, vmType }
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
        } else if (error.request) {
          console.error("No Response:");
          console.error(error.request);
        } else {
          console.error("Request Setup Error:", error.message);
        }
        return res.status(500).send({
          statusCode: 500,
          message: "Something went wrong. Please try again.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in restarting Scenario learner:", err);
      next(err);
    }
  };
const createsnapshot =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, vmstate } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/create-snapshot`,
          { vmid, vmType, vmstate }
        );
        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else if (error.request) {
          console.error("No Response:");
          console.error(error.request);
        } else {
          console.error("Request Setup Error:", error.message);
        }
        return res.status(500).send({
          statusCode: 500,
          message: "Something went wrong. Please try again.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in snapshot:", err);
      next(err);
    }
  };
const deletesnapshot =
  ({}) =>
  async (req, res, next) => {
    try {
      const {vmid,vmType,snapname} = req.body;
      try {
        const response = await axios.delete(
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-snapshot`,
          {
            data: { vmid, vmType, snapname },
          }
        );
        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
        });
      } catch (error) {
        console.error("Axios request failed");
        if (error.response) {
          console.error("Response Error:");
        } else if (error.request) {
          console.error("No Response:");
          console.error(error.request);
        } else {
          console.error("Request Setup Error:", error.message);
        }
        return res.status(500).send({
          statusCode: 500,
          message: "Something went wrong. Please try again.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in restarting Scenario learner:", err);
      next(err);
    }
  };
const restoresnapshot =
  ({}) =>
  async (req, res, next) => {
    try {
      const {vmid,vmType,snapname  } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/restore-snapshot`,
          { vmid, vmType, snapname  }
        );
        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else if (error.request) {
          console.error("No Response:");
          console.error(error.request);
        } else {
          console.error("Request Setup Error:", error.message);
        }
        return res.status(500).send({
          statusCode: 500,
          message: "Something went wrong. Please try again.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in restarting Scenario learner:", err);
      next(err);
    }
  };


  const getSnapshotsByVmid =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmid } = req.body;
      if (!vmid) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid is required.",
        });
      }
      const result = await dao.getSnapshotsByVmid({ db })(vmid);
      return res.status(200).send({
        statusCode: 200,
        message: "Snapshots fetched successfully.",
        data: result,
      });
    } catch (err) {
      console.error("Error fetching snapshots:", err);
      next(err);
    }
  };

module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminate,
  generateProxmoxAccessToken,
  stopAndDestroyFailedScenarios,
  getOperationFailedLogs,
  startScenarioLearner,
  restartscenarioLearner,
  vncProxyConsole,
  createsnapshot,
  deletesnapshot,
  restoresnapshot,
  getSnapshotsByVmid,
};
