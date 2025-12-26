const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;
const axios = require("axios");

const setVMRequestConfiguration =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { scenarioid, vmrequestid, requestedby_id, requestedby_role } =
        req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      if (!scenarioid || !vmrequestid) {
        return res.status(400).send({
          statusCode: 400,
          message: "scenarioid and vmrequestid are required.",
        });
      }

      try {
        const response = await axios.post(
          `${keys.EVENTLEARNER_API_URL}/vmstart/set-scenario-start-config`,
          {
            scenarioid,
            vmrequestid,
            requestedby_id,
            requestedby_role,
          },
          {
            headers: {
              Authorization: req.headers.authorization,
            },
          }
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
        });
      } catch (error) {
        console.error("Axios request failed");

        if (error.response) {
          return res.status(error.response.status).send({
            statusCode: error.response.status,
            message:
              error.response.data?.message ||
              "Unexpected error in job service.",
            errorData: error.response.data,
          });
        }

        // fallback (generic, not learner-based)
        const result = await dao.setScenarioLearnerConfigurationOnFailure({
        db,
        ipAddress,
        scenarioid,
        vmrequestid,
        requestedby_id,
       requestedby_role,
       });


        return res.status(500).send({
          statusCode: 500,
          message: result?.message || "Something went wrong. Please try later",
        });
      }
    } catch (err) {
      console.error("Error in VM request configuration:", err);
      next(err);
    }
  };

const updateCompleteTerminate =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;

      if (!vmrequestid || !status || !type) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmrequestid, status and type are required",
        });
      }

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/update-complete-terminate`,
          { vmrequestid, status, type }
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message,
          data: response.data,
        });
      } catch (err) {
        console.error("Axios request failed");

        if (err.response) {
          return res.status(err.response.status).send({
            statusCode: err.response.status,
            message:
              err.response.data?.message ||
              "Unexpected error in job service.",
            errorData: err.response.data,
          });
        }
      }
    } catch (err) {
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
      return res.status(200).send({
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
  ({  }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/start-scenario-learner`,
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
  ({ }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/restart-scenario-learner`,
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
  ({ }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, vmstate } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/create-snapshot`,
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
      const { vmid, vmType, snapname } = req.body;
      try {
        const response = await axios.delete(
          `${EVENTLEARNER_API_URL}/vmstart/delete-snapshot`,
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
      const { vmid, vmType, snapname } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/restore-snapshot`,
          { vmid, vmType, snapname }
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

const pauseScenarioLearner =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/pause-scenario-learner`,
          { vmrequestid }
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
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/resume-scenario-learner`,
          { vmrequestid }
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
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmstart/delete-scenario-learner`,
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

const getComponentByVmid =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const vmid = req.params.vmid;
      if (!vmid) {
        return res
          .status(400)
          .json({ statusCode: 400, message: "VM ID is required." });
      }
      const result = await dao.getComponentByVmid({ db })(vmid);
      if (!result) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Component details not found." });
      }

      res.status(200).json({
        statusCode: 200,
        message: "Get component details successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching component details:", error.message);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  };

const saveCustomComponent =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const {
        componentname,
        componentcategoryid,
        duration,
        componentimage,
        clone_vmid,
      } = req.body;
      const learner_id = req?.learneruser?.learner_id || 3;

      if (!learner_id) {
        return res.status(401).json({
          statusCode: 401,
          message: "Unauthorized: learner ID not found.",
        });
      }

      if (!componentname || !componentcategoryid || !clone_vmid) {
        return res.status(400).json({
          statusCode: 400,
          message: "Component Name, Category and Clone VMID are required.",
        });
      }

      const originalVMData = await dao.getOriginalVmid({ db })(clone_vmid);

      if (!originalVMData) {
        return res.status(404).json({
          statusCode: 404,
          message: `No master VM found for clone VMID: ${clone_vmid}`,
        });
      }

      // Step 2: call DAO to insert custom component
      await dao.saveCustomComponent({ db })({
        componentname,
        componentcategoryid,
        duration,
        componentimage,
        clone_vmid,
        master_vmid: originalVMData.master_vmid,
        scenarioid: originalVMData.scenarioid,
        learner_id: originalVMData.learner_id,
        createdby: learner_id,
      });

      return res.status(200).json({
        statusCode: 200,
        message: "Custom component created successfully (Pending Approval)",
      });
    } catch (error) {
      console.error("Error saving custom component:", error);
      return res.status(500).json({
        statusCode: 500,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
module.exports = {
  setVMRequestConfiguration,
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
  resumeScenarioLearner,
  pauseScenarioLearner,
  deleteScenarioLearner,
  getComponentByVmid,
  saveCustomComponent,
};
