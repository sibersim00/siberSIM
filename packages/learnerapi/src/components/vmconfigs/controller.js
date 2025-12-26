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
          return res.status(400).send({
            statusCode: 400,
            message: "scenariolearnersessionid, status, and type are required.",
          });
        }
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/vmconfigs/update-complete-terminate`,
            { scenariolearnersessionid, status, type }
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
          try {
            const result = await dao.updateCompleteTerminate({
              db,
              ipAddress,
              status,
              type,
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
  ({ }) =>
    async (req, res, next) => {
      try {
        const { vmid, vmType, snapname } = req.body;
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
  ({ }) =>
    async (req, res, next) => {
      try {
        const { vmid, vmType, snapname } = req.body;
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/vmconfigs/restore-snapshot`,
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
  ({ }) =>
    async (req, res, next) => {
      try {
        const { scenariolearnersessionid } = req.body;
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/vmconfigs/pause-scenario-learner`,
            { scenariolearnersessionid }
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
        const { scenariolearnersessionid } = req.body;
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/vmconfigs/resume-scenario-learner`,
            { scenariolearnersessionid }
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
        const { scenariolearnersessionid, status, type } = req.body;
        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/vmconfigs/delete-scenario-learner`,
            { scenariolearnersessionid, status, type }
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

const getComponentByVmid = ({ dao, db, validation }) => async (req, res) => {
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

const saveCustomComponent = ({ dao, db, validation }) => async (req, res) => {
  try {
    const {
      componentname,
      componentcategoryid,
      duration,
      clone_vmid,
      learner_id,
      componentimage,
      scenarioid,
      componenttype
    } = req.body;

    // const learner_id = req.learneruser.learner_id;

    if (!learner_id) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized: learner ID not found.",
      });
    }

    // ✅ clone_vmid REMOVED from validation
    if (!componentname || !componentcategoryid || !scenarioid) {
      return res.status(400).json({
        statusCode: 400,
        message: "Component Name, Category and Scenario ID are required.",
      });
    }

    // ⭐ DAO will:
    // - generate clone_vmid
    // - decide approval
    // - insert record
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
      message: daoResult.message,           // Auto / Admin approval
      approvalFlag: daoResult.approvalFlag, // true / false
      clone_vmid: daoResult.clone_vmid,     // ✅ generated VMID
      customcomponentid: daoResult.customcomponentid,
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

const getQemuConfig =
  ({ }) =>
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
            { vmid, vmType }
          );

          return res.status(200).send({
            statusCode: 200,
            message: response.data.message || "VM config fetched successfully.",
            mustStopVM: response.data.mustStopVM || false,
            stopMessage: response.data.stopMessage || null,

            // ✅ ADD APPROVAL STATUS FROM INTERNAL API
            approvalFlag: response.data.approvalFlag ?? null,
            approvalMessage: response.data.approvalMessage ?? null,
          });

        } catch (error) {
          console.error("Axios request failed:");

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

const save =
  ({ }) =>
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

const stopVM =
  ({ }) =>
    async (req, res, next) => {
      try {
        const payload = req.body;
        console.log("payloajjjjjjjjjjjjjjjjjd", payload);

        try {
          const response = await axios.post(
            `${EVENTLEARNER_API_URL}/vmconfigs/stop-vm`,
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

        const result =
          await dao.rejectPendingCustomComponentIfVmStopped({ db })({
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
        console.error(
          "Error rejecting custom component:",
          error.message
        );

        res.status(500).send({
          statusCode: 500,
          message:
            validation?.server_error ||
            "Internal server error.",
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
  getQemuConfig,
  save,
  stopVM,
  rejectPendingCustomComponent,
};
