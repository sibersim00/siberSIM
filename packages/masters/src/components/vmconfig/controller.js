const axios = require("axios");
const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;

const updateCompleteTerminate = ({ dao, db }) => async (req, res, next) => {
  try {
    const { vmrequestid, status, type } = req.body;
    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    try {
      const response = await axios.post(`${EVENTLEARNER_API_URL}/vmconfigs/update-complete-terminate`,
        { vmrequestid, status, type }
      );
      return res.status(200).send({ statusCode: 200, message: response.data.message || "Job Updated successfully.", data: response.data });
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
        console.error("Error generating siberSIM token:", err);
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


const exportScenario = () => async (req, res) => {
  try {
    const { scenarioid, exportid } = req.body;
    const file_name = `scenario_${scenarioid}.zip`; 
    const response = await axios.post(
      `${EVENTLEARNER_API_URL}/vmconfigs/exports`,
      { scenarioid, exportid,file_name },
      { responseType: "stream" } // <--- important
    );

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=scenario_${scenarioid}.zip`);

    response.data.pipe(res); // stream ZIP to frontend
  } catch (err) {
    console.error("Export Scenario Error:", err);
    res.status(500).json({ message: "Failed to export scenario", error: err.message });
  }
};

const save =
  ({}) =>
  async (req, res, next) => {
    try {
      const payload = req.body;
      console.log("payloajjjjjjjjjjjjjjjjjd", payload);

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/save`,
          payload
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data?.message,
          data: response.data,
        });
      } catch (error) {
        console.error("Axios Request Failed:", error.response?.data || error.message);

        return res.status(error.response?.status || 500).send({
          statusCode: error.response?.data?.statusCode || 500,
          message: error.response?.data?.message || "Something went wrong.",
          error: error.response?.data?.error,
        });
      }
    } catch (err) {
      console.error("Error in event learner:", err);
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
              `${EVENTLEARNER_API_URL}/vmconfigs/delete-scenario-learner`,
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
  updateCompleteTerminate,
  generateProxmoxAccessToken,
  stopAndDestroyFailedScenarios,
  getOperationFailedLogs,
  stopAndDestroyFailedEvents,
  getEventOperationFailedLogs,
  getSnapshotsByVmid,
  exportScenario,
  save,
  deleteScenarioLearner,
};
