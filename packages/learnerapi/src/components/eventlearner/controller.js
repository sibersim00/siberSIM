const axios = require("axios");
const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;

const setEventLearnerConfiguration =
  ({}) =>
  async (req, res, next) => {
    try {
      const { scenarioid, learnerid, eventlearnerid,vmrequestid } = req.body;
      console.log("vvvvvvvvvvvvvvvvvvvvvvvvvvvvv");
      
      
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      if (!scenarioid || !learnerid || !eventlearnerid) {
        return res
          .status(400)
          .send({
            statusCode: 400,
            message: "scenarioid,eventlearnerid and learnerid is required.",
          });
      }
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/eventlearner/set-event-learner-config`,
          { scenarioid, learnerid, eventlearnerid,vmrequestid }
        );
        return res
          .status(200)
          .send({
            statusCode: 200,
            message: response.data.message || "Job started successfully.",
            data: response.data,
          });
      } catch (error) {
         if (error.response) {
          return res.status(error.response.status).send({
            statusCode: error.response.status,
            message: error.response.data?.message || "Unexpected error in job service.",
            errorData: error.response.data
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
      const { eventlearnerid, status, type,vmrequestid } = req.body;
      if (!eventlearnerid || !status || !type) {
        return res
          .status(400)
          .send({
            statusCode: 400,
            message: "eventlearnerid, status, and type are required.",
          });
      }
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/eventlearner/update-complete-event`,
          { eventlearnerid, status, type,vmrequestid }
        );
        return res
          .status(200)
          .send({
            statusCode: 200,
            message: response.data.message || "Job updated successfully.",
            data: response.data,
          });
      } catch (error) {
        console.error("Axios request to job service failed:");
        if (error.response) {
          console.error(
            "Response Error:",
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          console.error(
            "No response received from job service:",
            error.request
          );
        } else {
          console.error("Request setup error:", error.message);
        }
        return res
          .status(503)
          .send({
            statusCode: 503,
            message:
              "Service is currently unavailable. Please try again after some time.",
            error: error.message || "Job service not reachable.",
          });
      }
    } catch (err) {
      console.error("Error in updating session status:", err);
      next(err);
    }
  };

const restartEventLearner =
  ({  }) =>
  async (req, res, next) => {
    try {
      const {vmrequestid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/eventlearner/restart-event-learner`,
          {vmrequestid}
        );
        return res
          .status(200)
          .send({
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
        return res
          .status(500)
          .send({
            statusCode: 500,
            message: "Failed to call Jobs service.",
            error: error.response?.data || error.message,
          });
      }
    } catch (err) {
      console.error("Error in restarting event learner:", err);
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


  const startEventLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { scenarioid, learnerid, eventlearnerid,vmrequestid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!scenarioid || !learnerid || !eventlearnerid) {
        return res.status(400).send({
          statusCode: 400,
          message: "scenarioid, learnerid, and eventlearnerid are required.",
        });
      }

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/eventlearner/start-event-learner`,
          { scenarioid, learnerid, eventlearnerid,vmrequestid }
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
        return res.status(500).send({
          statusCode: 500,
          message: "Failed to call Jobs service.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in starting event learner:", err);
      next(err);
    }
  };




  const pauseScenarioLearner =
    ({}) =>
    async (req, res, next) => {
      try {
        const { eventlearnerid,vmrequestid } = req.body;
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/eventlearner/pause-scenario-learner`,
            { eventlearnerid ,vmrequestid}
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
            message: "Failed to call Jobs service.",
            error: error.response?.data || error.message,
          });
        }
      } catch (err) {
        console.error("Error in starting event learner:", err);
        next(err);
      }
    };
  
  const resumeScenarioLearner =
    ({ }) =>
    async (req, res, next) => {
      try {
        const { eventlearnerid,vmrequestid } = req.body;
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/eventlearner/resume-scenario-learner`,
            {eventlearnerid,vmrequestid }
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
            message: "Failed to call Jobs service.",
            error: error.response?.data || error.message,
          });
        }
      } catch (err) {
        console.error("Error in starting event learner:", err);
        next(err);
      }
    };
    
const deleteScenarioLearner =
  ({ }) =>
    async (req, res, next) => {
      try {
        const { vmrequestid, status, type } = req.body;
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/eventlearner/delete-scenario-learner`,
            { vmrequestid, status, type }
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
            message: "Failed to call Jobs service.",
            error: error.response?.data || error.message,
          });
        }
      } catch (err) {
        console.error("Error in starting event learner:", err);
        next(err);
      }
    };

module.exports = {
  setEventLearnerConfiguration,
  updateCompleteTerminate,
  restartEventLearner,
  startEventLearner,
  generateProxmoxAccessToken,
  resumeScenarioLearner,
  pauseScenarioLearner,
  deleteScenarioLearner
};
