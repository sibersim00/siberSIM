const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;
const axios = require("axios");

const setScenarioLearnerConfiguration =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { scenarioid, requestedby_id, vmrequestid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!scenarioid || !requestedby_id || !vmrequestid) {
        return res.status(400).send({
          statusCode: 400,
          message: "scenarioid,vmrequestid and requestedby_id is required.",
        });
      }

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/set-scenario-learner-config`,
          { scenarioid, requestedby_id, vmrequestid },
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
            vmrequestid,
          });

          return res.status(500).send({
            statusCode: 500,
            message:
              result?.message || "Something went wrong. Please try later",
            fallback: result,
          });
        } catch (fallbackError) {
          console.error("Fallback DAO also failed:", fallbackError);
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
      }
    } catch (err) {
      console.error("Error in setting scenario learner configuration:", err);
      next(err);
    }
  };

const updateCompleteTerminate =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;
      if (!vmrequestid || !status || !type) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmrequestid, status, and type are required.",
        });
      }
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/update-complete-terminate`,
          { vmrequestid, status, type },
        );
        return res.status(200).send({
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
        ipAddress,
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

const startScenarioLearner =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/start-scenario-learner`,
          { vmid, vmType },
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
      console.error("Error in starting event learner:", err);
      next(err);
    }
  };

const restartscenarioLearner =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/restart-scenario-learner`,
          { vmid, vmType },
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
      console.error("Error in restarting Scenario learner:", err);
      next(err);
    }
  };
const createsnapshot =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, vmstate } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/create-snapshot`,
          { vmid, vmType, vmstate },
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
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-snapshot`,
          {
            data: { vmid, vmType, snapname },
          },
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
          `${EVENTLEARNER_API_URL}/vmconfigs/restore-snapshot`,
          { vmid, vmType, snapname },
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
          `${EVENTLEARNER_API_URL}/vmconfigs/pause-scenario-learner`,
          { vmrequestid },
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
          `${EVENTLEARNER_API_URL}/vmconfigs/resume-scenario-learner`,
          { vmrequestid },
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
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-scenario-learner`,
          { vmrequestid, status, type },
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
        clone_vmid,
        learner_id,
        componentimage,
        scenarioid,
        componenttype,
      } = req.body;

      // const learner_id = req.learneruser.learner_id;

      if (!learner_id) {
        return res.status(401).json({
          statusCode: 401,
          message: "Unauthorized: learner ID not found.",
        });
      }
      if (!componentname || !componentcategoryid || !scenarioid) {
        return res.status(400).json({
          statusCode: 400,
          message: "Component Name, Category and Scenario ID are required.",
        });
      }
      const daoResult = await dao.saveCustomComponent({ db })({
        componentname,
        componentcategoryid,
        duration,
        clone_vmid,
        componentimage,
        scenarioid,
        learner_id,
        componenttype,
        createdby: learner_id,
      });

      return res.status(200).json({
        statusCode: 200,
        success: daoResult.success,
        message: daoResult.message, // Auto / Admin approval
        approvalFlag: daoResult.approvalFlag, // true / false
        clone_vmid: daoResult.clone_vmid,
        customcomponentid: daoResult.customcomponentid,
      });
    } catch (error) {
      console.error("Error saving custom component:", error);

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
  };

const getQemuConfig =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;

      if (!vmid || !vmType) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid and vmType is required.",
        });
      }

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/vm-config`,
          { vmid, vmType },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "VM config fetched successfully.",
          mustStopVM: response.data.mustStopVM || false,
          stopMessage: response.data.stopMessage || null,
          approvalFlag: response.data.approvalFlag ?? null,
          approvalMessage: response.data.approvalMessage ?? null,
        });
      } catch (error) {
        console.error("Axios request failed:");

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
      console.error("Error in snapshot:", err);
      next(err);
    }
  };
const save =
  ({}) =>
  async (req, res, next) => {
    try {
      const payload = req.body;

      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/save`,
          payload,
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data?.message,
          data: response.data,
        });
      } catch (error) {
        console.error(
          "Axios Request Failed:",
          error.response?.data || error.message,
        );

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
      console.error("Error in event learner:", err);
      next(err);
    }
  };

const stopVM =
  ({}) =>
  async (req, res, next) => {
    try {
      const payload = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/stop-vm`,
          payload,
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data?.message,
          data: response.data,
        });
      } catch (error) {
        console.error(
          "Axios Request Failed:",
          error.response?.data || error.message,
        );

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
      console.error("Error in event learner:", err);
      next(err);
    }
  };

const rejectPendingCustomComponent =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const { vmid } = req.body;

      if (!vmid) {
        return res.status(400).send({
          statusCode: 400,
          message: "VMID is required.",
        });
      }

      const result = await dao.rejectPendingCustomComponentIfVmStopped({ db })({
        vmid,
      });

      if (!result.updated) {
        let message = validation?.vm_not_stopped || "VM is not stopped.";

        if (result.reason === "VM_NOT_FOUND") {
          message = "VM not found.";
        }

        return res.status(400).send({
          statusCode: 400,
          message,
        });
      }

      res.status(200).send({
        statusCode: 200,
        message:
          "Pending component requests were automatically rejected because the VM is stopped.",
        data: {
          affectedRows: result.affectedRows,
        },
      });
    } catch (error) {
      console.error("Error rejecting custom component:", error.message);

      res.status(500).send({
        statusCode: 500,
        message: validation?.server_error || "Internal server error.",
      });
    }
  };

const addScenarioVmNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/add-vm-network`,
          { vmid, vmType, netKey },
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
      console.error("Error in add scenario network:", err);
      next(err);
    }
  };
const deleteScenarioVmNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-vm-network`,
          { vmid, vmType, netKey },
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
      console.error("Error in delete scenario network:", err);
      next(err);
    }
  };
const ModifyScenarioVmNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const {
        vmid,
        netKey,
        mode,
        source,
        sourceHandle,
        target,
        targetHandle,
        label,
      } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/modify-vm-network`,
          {
            vmid,
            netKey,
            mode,
            source,
            sourceHandle,
            target,
            targetHandle,
            label,
          },
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
      console.error("Error in modify scenario network:", err);
      next(err);
    }
  };
const addRuntimeComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, scenarioid, newNode } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/add-single-component`,
          { vmrequestid, scenarioid, newNode },
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
      console.error("Error in add runtime component:", err);
      next(err);
    }
  };
const stopDestroySingleComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-single-network`,
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
const disconnectRuntimeNetworks =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/disconnect-single-network`,
          { vmrequestid, vmid, netKey },
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
      console.error("Error in disconnect runtime network:", err);
      next(err);
    }
  };
const connectRuntimeNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/connect-single-network`,
          { vmrequestid, vmid, netKey },
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
      console.error("Error in connect runtime networkr:", err);
      next(err);
    }
  };
const plugRuntimeNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/plug-single-network`,
          { vmrequestid, vmid, netKey },
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
      console.error("Error in plug runtime network:", err);
      next(err);
    }
  };
const unplugRuntimeNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/unplug-single-network`,
          { vmrequestid, vmid, netKey },
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
      console.error("Error in unplug runtime network:", err);
      next(err);
    }
  };


  const deleteBridgeFromScenario =
  ({ dao,db }) =>
  async (req, res) => {
    try {
      const payload = req.body;


      if (!payload.vmrequestid || !payload.edgeId) {
        return res.status(400).json({
          statusCode: 400,
          message: "Required fields missing",
        });
      }

      const result = await dao.deleteBridgeFromScenario({db})(payload);

      res.status(200).json({
        statusCode: 200,
        message: "Bridge removed successfully",
        data: result,
      });
    } catch (error) {
      console.error("Delete bridge error:", error);
      res.status(500).json({
        statusCode: 500,
        message: "Internal server error",
      });
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
  createsnapshot,
  deletesnapshot,
  restoresnapshot,
  getSnapshotsByVmid,
  resumeScenarioLearner,
  pauseScenarioLearner,
  deleteScenarioLearner,
  getComponentByVmid,
  saveCustomComponent,
  getQemuConfig,
  save,
  stopVM,
  rejectPendingCustomComponent,
  addScenarioVmNetwork,
  deleteScenarioVmNetwork,
  ModifyScenarioVmNetwork,
  addRuntimeComponent,
  stopDestroySingleComponent,
  disconnectRuntimeNetworks,
  connectRuntimeNetwork,
  plugRuntimeNetwork,
  unplugRuntimeNetwork,
  deleteBridgeFromScenario
};
