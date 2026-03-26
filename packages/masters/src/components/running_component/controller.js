const axios = require("axios");
const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;

  const getLearners = ({ dao,db }) => async (req, res) => {
  try {
    const result = await dao.getLearners({db})();
    res.status(200).send({
      statusCode: 200,
      message: "Learners fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
const getRunningComponents = ({ dao, db }) => async (req, res) => {
  try {
    const { vmrequestid } = req.body;
    const result = await dao.getRunningComponents({ db })(vmrequestid);
    res.status(200).send({
      statusCode: 200,
      message: "Running components fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching running components:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Something went wrong",
    });
  }
};


const getRunningScenarios = ({ dao, validation,db }) => async (req, res) => {
  try {
    const result = await dao.getRunningScenarios({db})();
    res.status(200).json({
      statusCode: 200,
      data: result
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error
    });
  }
};

const stopComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/stop-single-component`,
          { vmrequestid, vmid },
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
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in stop destroy single componnet:", err);
      next(err);
    }
  };
const startComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/start-single-component`,
          { vmrequestid, vmid },
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
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in stop destroy single componnet:", err);
      next(err);
    }
  };
const restartComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/restart-single-component`,
          { vmrequestid, vmid },
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
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in stop destroy single componnet:", err);
      next(err);
    }
  };

const listRunningComponent =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const result = await dao.listRunningComponent({ db })(req);

      res.status(200).send({
        statusCode: 200,
        message: "Running scenarios fetched successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Failed to fetch running scenarios",
      });
    }
  };

const listAllExceptRunning =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const result = await dao.listAllExceptRunning({ db })(req);

      res.status(200).send({
        statusCode: 200,
        message: "All scenarios except running fetched successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: "Failed to fetch scenarios",
      });
    }
  };

 module.exports = {
    stopComponent,
    getLearners,
    getRunningComponents,
    getRunningScenarios,
    startComponent,
    restartComponent,
    listRunningComponent,
    listAllExceptRunning,
  }