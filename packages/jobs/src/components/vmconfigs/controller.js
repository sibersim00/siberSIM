const { componentSetupJob } = require("../../jobs/componentSetupJob");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { NodeSSH } = require("node-ssh");
const multer  = require("multer");

// ── Multer: ZIP upload (JSON assets only — ZSTs are handled separately) ──
const zipUpload = multer({
  dest: "/tmp/scenario_imports/",
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB — safe for JSON-only ZIPs
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.endsWith(".zip")) {
      return cb(new Error("Only .zip files are accepted for the scenario package."));
    }
    cb(null, true);
  },
});

// ── Multer: ZST upload — kept in memory (stream to Proxmox, never written to disk)
const zstUpload = multer({
  storage: multer.memoryStorage(),            // buffer in RAM, NOT disk
  limits: { fileSize: 30 * 1024 * 1024 * 1024 }, // 30 GB safety cap
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.endsWith(".zst")) {
      return cb(new Error("Only .zst backup files are accepted here."));
    }
    cb(null, true);
  },
});

const setScenarioLearnerConfiguration =
  ({ dao, db, validation }) =>
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
      const result = await dao.setScenarioLearnerConfiguration({
        db,
        ipAddress,
        validation,
      })(scenarioid, requestedby_id, vmrequestid);
      if (result.success) {
        componentSetupJob(db, ipAddress, {
          scenarioid,
          requestedby_id,
          vmrequestid,
        });
        return res
          .status(200)
          .send({ statusCode: 200, message: result.message });
      } else {
        return res
          .status(500)
          .send({ statusCode: 500, message: result.message });
      }
    } catch (err) {
      console.error("Error in setting scenario learner configuration:", err);
      next(err);
    }
  };

const updateCompleteTerminatelearner =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!vmrequestid || !status || !type) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmrequestid, status, and type are required.",
        });
      }
      const result = await dao.updateCompleteTerminatelearner({
        db,
        ipAddress,
      })(vmrequestid, status, type);

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message,
        });
      }
      return res.status(200).send({
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      console.error("Error in updating session status:", err);
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

const autoTerminateFailedScenarios =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.autoTerminateFailedScenarios({
        db,
        ipAddress,
        updateCompleteTerminatelearner: dao.updateCompleteTerminatelearner,
      })();

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message,
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      console.error("Error in auto-terminating expired scenarios:", err);
      next(err);
    }
  };

const startScenarioLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!vmid || !vmType) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid and vmType are required.",
        });
      }

      const result = await dao.startScenarioLearner({
        db,
        ipAddress,
        validation,
      })(vmid, vmType);

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } else {
        return res.status(500).send({
          statusCode: 500,
          message: result.message,
        });
      }
    } catch (err) {
      console.error("Error in starting VM:", err);
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

      if (!vmid || !vmType) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid and vmType are required.",
        });
      }

      const result = await dao.restartscenarioLearner({
        db,
        ipAddress,
        validation,
      })(vmid, vmType);

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } else {
        return res.status(500).send({
          statusCode: 500,
          message: result.message,
        });
      }
    } catch (err) {
      console.error("Error in restarting scenario learner:", err);
      next(err);
    }
  };

const createSnapshot =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, vmstate } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!vmid || !vmType) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid, vmType are required.",
        });
      }
      const result = await dao.createSnapshot({
        db,
        ipAddress,
        validation,
      })(vmid, vmType, vmstate);

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } else {
        return res.status(500).send({
          statusCode: 500,
          message: result.message,
        });
      }
    } catch (err) {
      console.error("Error in creating snapshot:", err);
      next(err);
    }
  };

const deleteSnapshot =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, snapname } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!vmid || !vmType || !snapname) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid, vmType and snapname are required.",
        });
      }

      const result = await dao.deleteSnapshot({
        db,
        ipAddress,
        validation,
      })(vmid, vmType, snapname);

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } else {
        return res.status(500).send({
          statusCode: 500,
          message: result.message,
        });
      }
    } catch (err) {
      console.error("Error in deleting snapshot:", err);
      next(err);
    }
  };

const restoreSnapshot =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, snapname, start } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!vmid || !vmType || !snapname) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid, vmType and snapname are required.",
        });
      }

      // start must be 0 or 1
      const startValue = Number(start) === 1 ? 1 : 0;

      const result = await dao.restoreSnapshot({
        db,
        ipAddress,
        validation,
      })(vmid, vmType, snapname, startValue);

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } else {
        return res.status(500).send({
          statusCode: 500,
          message: result.message,
        });
      }
    } catch (err) {
      console.error("Error in restoring snapshot:", err);
      next(err);
    }
  };

const pauseScenarioLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, learner_id } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      // if (!vmid || !vmType) {
      //   return res.status(400).send({
      //     statusCode: 400,
      //     message: "vmid and vmType are required.",
      //   });
      // }
      const result = await dao.pauseScenarioLearner({
        db,
        ipAddress,
        validation,
      })(vmrequestid, learner_id);

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } else {
        return res.status(500).send({
          statusCode: 500,
          message: result.message,
        });
      }
    } catch (err) {
      console.error("Error in Pause:", err);
      next(err);
    }
  };
const resumeScenarioLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.resumeScenarioLearner({
        db,
        ipAddress,
        validation,
      })(vmrequestid);

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } else {
        return res.status(500).send({
          statusCode: 500,
          message: result.message,
        });
      }
    } catch (err) {
      console.error("Error in Resume:", err);
      next(err);
    }
  };


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


const deleteScenarioLearner =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!vmrequestid || !status || !type) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmrequestid, status, and type are required.",
        });
      }

      const result = await dao.deleteScenarioLearner({
        db,
        ipAddress,
      })(vmrequestid, status, type);

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message,
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      console.error("Error in updating session status:", err);
      next(err);
    }
  };

const save =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const payload = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.save({ db, ipAddress })(payload);
      if (!result.success) {
        return res.status(result.statusCode || 500).send({
          statusCode: result.statusCode || 500,
          message: "Failed to call Jobs service.",
          error: result.message, // Only message string
        });
      }
      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: { newCloneVMID: result.newCloneVMID },
      });
    } catch (err) {
      console.error("Error in updating session status:", err);
      return res.status(500).send({
        statusCode: 500,
        message: "Unexpected server error",
        error: err.message,
      });
    }
  };

const vmDetails =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.vmDetails({ db, validation })(body, ipAddress);
      res.status(200).json(result);
    } catch (err) {
      console.error("Error fetching VM detail:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

const getVmConfig =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      if (!vmid || !vmType) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid and vmType are required.",
        });
      }

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.getVmConfig({
        db,
        ipAddress,
        validation,
      })({
        vmid,
        vmType,
      });

      if (result.success) {
        return res.status(200).send({
          statusCode: 200,
          message: result.message,
          vmType,
          mustStopVM: result.mustStopVM || false,
          stopMessage: result.stopMessage || null,
          approvalFlag: result.approvalFlag,
          approvalMessage: result.approvalMessage,
        });
      }

      return res.status(500).send({
        statusCode: 500,
        message: result.message,
        error: result.error,
      });
    } catch (err) {
      console.error("Error fetching VM config:", err);
      next(err);
    }
  };
const stopScenarioVM =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType } = req.body;
      const normalizedVmType = vmType?.toLowerCase();

      if (!vmid || !normalizedVmType) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid and vmType are required.",
        });
      }

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.stopScenarioVM({ ipAddress, db })(
        vmid,
        normalizedVmType,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to stop the VM.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      console.error("Error in stopScenarioVM:", err);
      next(err);
    }
  };

const addScenarioVmNetwork =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, netKey } = req.body;
      const normalizedVmType = vmType?.toLowerCase();

      if (!vmid || !normalizedVmType || !netKey) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid, vmType and netKey are required.",
        });
      }

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.addScenarioVmNetwork({ ipAddress, db })(
        vmid,
        normalizedVmType,
        netKey,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to add network interface.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data, // updated bridge JSON (optional)
      });
    } catch (err) {
      console.error("Error in addScenarioVmNetwork controller:", err);
      next(err);
    }
  };
const deleteScenarioVmNetwork =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, netKey } = req.body;
      const normalizedVmType = vmType?.toLowerCase();

      if (!vmid || !normalizedVmType || !netKey) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid, vmType and netKey are required.",
        });
      }

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.deleteScenarioVmNetwork({ ipAddress, db })(
        vmid,
        normalizedVmType,
        netKey,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to delete network interface.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data, // updated bridge JSON (optional)
      });
    } catch (err) {
      console.error("Error in addScenarioVmNetwork controller:", err);
      next(err);
    }
  };
const ModifyScenarioVmNetwork =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const {
        vmid,
        Targetvmid,
        netKey,
        mode,
        source,
        sourceHandle,
        target,
        targetHandle,
        label,
        staticVmbr
      } = req.body;
      if (!vmid || !netKey) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid and netKey are required.",
        });
      }

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.ModifyScenarioVmNetwork({ ipAddress, db })(
        vmid,
        Targetvmid,
        netKey,
        mode,
        source,
        sourceHandle,
        target,
        targetHandle,
        label,
        staticVmbr 
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to modify the network interface.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data, // updated bridge JSON (optional)
      });
    } catch (err) {
      console.error("Error in addScenarioVmNetwork controller:", err);
      next(err);
    }
  };
const addRuntimeComponent =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, scenarioid, newNode } = req.body;

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.addRuntimeComponent({ ipAddress, db })(
        vmrequestid,
        scenarioid,
        newNode,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to add component.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data, // updated bridge JSON (optional)
      });
    } catch (err) {
      console.error("Error in add runtime component controller:", err);
      next(err);
    }
  };

const stopDestroySingleComponent =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid,vmbrList } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.stopDestroySingleComponent({ ipAddress, db })(
        vmrequestid,
        vmid,
        vmbrList
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to stop and destroy the single component.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data, // updated bridge JSON (optional)
      });
    } catch (err) {
      console.error("Error in stop destroy single controller:", err);
      next(err);
    }
  };

const disconnectRuntimeNetworks =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.disconnectRuntimeNetworks({ ipAddress, db })(
        vmrequestid,
        vmid,
        netKey,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to disconnect network interface.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in disconnect runtime networks controller:", err);
      next(err);
    }
  };
const connectRuntimeNetwork =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.connectRuntimeNetwork({ ipAddress, db })(
        vmrequestid,
        vmid,
        netKey,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to connect network interface.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in connect runtime network controller:", err);
      next(err);
    }
  };
const plugRuntimeNetwork =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.plugRuntimeNetwork({ ipAddress, db })(
        vmrequestid,
        vmid,
        netKey,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to plug network interface.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in plug runtime network controller:", err);
      next(err);
    }
  };
const unplugRuntimeNetwork =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.unplugRuntimeNetwork({ ipAddress, db })(
        vmrequestid,
        vmid,
        netKey,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to unplug the network.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in run time network controller:", err);
      next(err);
    }
  };

const stopComponent =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.stopComponent({ ipAddress, db })(
        vmrequestid,
        vmid,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to stop the component.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data, // updated bridge JSON (optional)
      });
    } catch (err) {
      console.error("Error in stop destroy single controller:", err);
      next(err);
    }
  };

  const startComponent =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.startComponent({ ipAddress, db })(
        vmrequestid,
        vmid,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to start component.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in start component controller:", err);
      next(err);
    }
  };


const restartComponent =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.restartComponent({ ipAddress, db })(
        vmrequestid,
        vmid,
      );

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message || "Failed to restart component.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      console.error("Error in restart component controller:", err);
      next(err);
    }
  };

  const backupstatus =
    ({ dao, db }) =>
    async (req, res, next) => {
      try {
        const ipAddress =
          req.headers["x-forwarded-for"] || req.connection.remoteAddress;

        const result = await dao.checkBackupStatus({
          db,
          ipAddress,
        })();

        if (!result.success) {
          return res.status(400).send({
            statusCode: 400,
            message: result.message,
          });
        }

        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      } catch (err) {
        console.error("Error in auto-terminating expired scenarios:", err);
        next(err);
      }
    };
  const triggerExport =
    ({ dao, db }) =>
    async (req, res) => {
      try {
        const { scenarioid, exportid } = req.body;
        const ipAddress =
          req.headers["x-forwarded-for"] || req.connection.remoteAddress;

        // Respond immediately — don't make client wait
        res.status(200).json({
          statusCode: 200,
          message: "Export started. Check export list for status updates.",
        });

        // Run full export job in background after response is sent
        runExportJob({ dao, db, scenarioid, exportid, ipAddress }).catch((err) => {
          console.error("[triggerExport] Background job error:", err);
        });
      } catch (error) {
        console.error("Error triggering export:", error.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "An error occurred. Please try again later." });
        }
      }
    };

  const downloadExport =
    ({ dao, db }) =>
    async (req, res) => {
      try {
        const exportid = req.body?.exportid || req.query?.exportid;

        if (!exportid) {
          return res.status(400).json({ message: "exportid is required." });
        }

        const result = await dao.getExportById({ db })(exportid);
        if (!result) {
          return res.status(404).json({ message: "Export record not found." });
        }
        if (result.status !== "Completed" && result.status !== "Complete") {
          return res.status(400).json({ message: "Export is not ready for download." });
        }

        //  Just serve the small zip — manifest + assets + scenario.json
        const baseRoot = path.join(__dirname, "../../..");
        const zipPath  = path.join(baseRoot, "temp_zip", result.file_name);

        if (!fs.existsSync(zipPath)) {
          return res.status(404).json({ message: "ZIP file not found on server." });
        }

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename=${result.file_name}`);
        res.setHeader("Content-Length", fs.statSync(zipPath).size);

        fs.createReadStream(zipPath).pipe(res);
        console.log(`[Download] ✓ Serving assets zip: ${result.file_name}`);

      } catch (error) {
        console.error("Error in downloadExport:", error.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "An error occurred. Please try again later." });
        }
      }
    };

  const downloadComponentzst =
    ({ dao, db }) =>
    async (req, res) => {
      const ssh = new NodeSSH();
      try {
        const exportid  = req.body?.exportid  || req.query?.exportid;
        const file_name = req.body?.file_name || req.query?.file_name; // full Proxmox path

        if (!exportid || !file_name) {
          return res.status(400).json({ message: "exportid and file_name are required." });
        }

        // Validate export exists and is complete
        const result = await dao.getExportById({ db })(exportid);
        if (!result) {
          return res.status(404).json({ message: "Export record not found." });
        }
        if (result.status !== "Completed" && result.status !== "Complete") {
          return res.status(400).json({ message: "Export is not ready for download." });
        }

        // Validate requested file belongs to this export (security check)
        const backupFiles = await dao.getCompletedBackupFiles({ db })(result.scenarioid, exportid);
        const validFile   = backupFiles.find(f => f.file_name === file_name);
        if (!validFile) {
          return res.status(403).json({ message: "File does not belong to this export." });
        }

        const fileName = path.basename(file_name);

        // SSH connect
        await ssh.connect({
          host:         "10.10.2.49",
          username:     "root",
          password:     "sysadmin",
          readyTimeout: 30000,
        });
        console.log(`[Component Download] SSH connected — streaming ${fileName}`);

        // SFTP session
        const sftp = await new Promise((resolve, reject) => {
          ssh.connection.sftp((err, s) => (err ? reject(err) : resolve(s)));
        });

        // Get file size for Content-Length header
        // const fileSize = await new Promise((resolve, reject) => {
        //   sftp.stat(file_name, (err, stats) => (err ? reject(err) : resolve(stats.size)));
        // });
      const fileSize = await new Promise((resolve, reject) => {
        sftp.stat(file_name, (err, stats) => {
          if (err) {
            const e = new Error(`File not found on Proxmox: ${file_name}`);
            e.statusCode = 400; // ← add this
            reject(e);
          } else {
            resolve(stats.size);
          }
        });
      });

        //  Stream directly Proxmox → browser, nothing written to server disk
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-Length", fileSize);

        const readStream = sftp.createReadStream(file_name, {
          highWaterMark: 1024 * 1024, // 1MB chunks
        });

        readStream.on("error", (err) => {
          console.error("[Component Download] Stream error:", err.message);
          ssh.dispose();
          if (!res.headersSent) res.status(500).json({ error: "Stream failed." });
        });

        res.on("close", () => {
          readStream.destroy();
          ssh.dispose();
          console.log(`[Component Download] Client disconnected — aborted`);
        });

        readStream.pipe(res);

        res.on("finish", () => {
          ssh.dispose();
          console.log(`[Component Download] ✓ Done: ${fileName}`);
        });

      } catch (error) {
        ssh.dispose();
        console.error("Error in downloadComponentzst:", error.message);
        if (!res.headersSent) {
          res.status(error.statusCode || 500).json({  // ← use error.statusCode
            message: error.message
          });
        }
      }
    };

    const runExportJob = async ({ dao, db, scenarioid, exportid, ipAddress }) => {
      try {
        const scenario = await dao.getScenarioById({ db, ipAddress })(scenarioid, exportid);
        if (!scenario?.success) {
          await dao.markExportFailed({ db })(exportid);
          console.error("[BG Export] Backup trigger failed:", scenario?.message);
          return;
        }

        // 2. Poll until all component backups complete
        const POLL_MS    = 8000;
        const TIMEOUT_MS = 90 * 60 * 1000;
        const started    = Date.now();

        while (true) {
          if (Date.now() - started > TIMEOUT_MS) {
            await dao.markExportFailed({ db })(exportid);
            console.error("[BG Export] Timed out.");
            return;
          }

          const pollResult = await dao.pollBackupStatus({ db })(scenarioid, exportid);

          if (pollResult.error) {
            await dao.markExportFailed({ db })(exportid);
            console.error("[BG Export] Poll error:", pollResult.error);
            return;
          }

          console.log(`[BG Poll] ${pollResult.completed}/${pollResult.total} done`);

          if (pollResult.failed > 0) {
            await dao.markExportFailed({ db })(exportid);
            console.error("[BG Export] Some backups failed.");
            return;
          }

          if (pollResult.allDone) break;
          await sleep(POLL_MS);
        }

        // 3. Build directories
        const baseRoot         = path.join(__dirname, "../../..");
        const exportDir        = path.join(baseRoot, `exports/scenario_${scenarioid}`);
        const assetsDir        = path.join(exportDir, "assets");
        const tempZipDir       = path.join(baseRoot, "temp_zip");
        const uploadsBase      = path.join(baseRoot, "uploads");
        const scenariosFolder  = path.join(assetsDir, "scenarios");
        const componentsFolder = path.join(assetsDir, "components");
        const backupFolder     = path.join(assetsDir, "class_export");

        [scenariosFolder, componentsFolder, backupFolder, tempZipDir].forEach(
          (d) => fs.mkdirSync(d, { recursive: true }),
        );

        // 4. Write scenario.json
        fs.writeFileSync(
          path.join(exportDir, "scenario.json"),
          JSON.stringify(scenario, null, 2),
        );

        // 5. Copy uploaded assets (scenario image, instruction file, component images)
        const copyFileSafe = (srcRelPath, targetFolder) => {
          if (!srcRelPath) return;
          const cleanPath = srcRelPath.replace(/^\/?uploads[\\/]/, "");
          const srcPath   = path.join(uploadsBase, cleanPath);
          try {
            const stat = fs.statSync(srcPath);
            if (!stat.isFile()) {
              console.warn(`[BG Export] Skipping non-file: ${srcPath}`);
              return;
            }
            fs.copyFileSync(srcPath, path.join(targetFolder, path.basename(srcPath)));
          } catch (err) {
            console.warn(`[BG Export] Missing asset: ${srcPath}`);
          }
        };

        const scenarioData = scenario.scenario;
        copyFileSafe(scenarioData?.scenarioimage,    scenariosFolder);
        copyFileSafe(scenarioData?.instruction_file, scenariosFolder);

        let componentImages = [];
        try { componentImages = JSON.parse(scenarioData?.components || "[]"); } catch (_) {}

        componentImages
          .map((c) => {
            const parts    = c.imageUrl?.split("/");
            const filename = parts?.[parts.length - 1];
            if (!filename || !filename.includes(".")) return null;
            return `/uploads/components/${filename}`;
          })
          .filter(Boolean)
          .forEach((f) => copyFileSafe(f, componentsFolder));

        // 6. Fetch backup file records from DB
        const backupFiles = await dao.getCompletedBackupFiles({ db })(scenarioid, exportid);
        const uniqueFiles = [...new Map(backupFiles.map(f => [f.file_name, f])).values()];

        console.log(`[BG Export] ${uniqueFiles.length} backup file(s) found — skipping SCP, will stream on download`);

        // 7. SSH connect — only to verify files exist on Proxmox
        const ssh = new NodeSSH();
        try {
          await ssh.connect({
            host:     process.env.PROXMOX_SSH_HOST,
            username: process.env.PROXMOX_SSH_USER,
            password: process.env.PROXMOX_SSH_PASSWORD,
          });
          console.log("[SSH] Connected");
        } catch (err) {
          console.error("[BG Export] SSH connect failed:", err.message);
          throw err;
        }

        // 8. Verify each .zst file exists on Proxmox before marking complete
        for (const { file_name } of uniqueFiles) {
          if (!file_name) continue;
          try {
            await ssh.execCommand(`test -f "${file_name}" && echo EXISTS || echo MISSING`).then(({ stdout }) => {
              if (stdout.trim() === "MISSING") {
                throw new Error(`Backup file not found on Proxmox: ${file_name}`);
              }
              console.log(`[SSH] ✓ Verified: ${path.basename(file_name)}`);
            });
          } catch (err) {
            ssh.dispose();
            throw err;
          }
        }

        ssh.dispose();
        console.log("[SSH] Connection closed.");

        // 9. Build class_manifest.json with Proxmox paths (used during download streaming)
        const manifest = {
          exported_at:  new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14),
          source_host:  process.env.PROXMOX_SSH_HOST,
          vms:          [],
        };

        for (const { file_name } of uniqueFiles) {
          if (!file_name) continue;
          const fileName    = path.basename(file_name);
          const vmidMatch   = fileName.match(/vzdump-(?:qemu|lxc)-(\d+)-/);
          const vmid        = vmidMatch ? vmidMatch[1] : "unknown";
          const vmType      = fileName.includes("vzdump-lxc-") ? "lxc" : "qemu";
          const matchedComp = (scenario.componentDetails || []).find(
            (c) => String(c.vmid) === String(vmid)
          );

          manifest.vms.push({
            vmid,
            name:         matchedComp?.componentname || fileName,
            type:         vmType,
            node:         process.env.PROXMOX_NODE || "sibersim",
            storage:      "local",
            file:         fileName,
            proxmox_path: file_name, //  full remote path — used when streaming download
            volid:        `local:backup/${fileName}`,
          });
        }

        fs.writeFileSync(
          path.join(backupFolder, "class_manifest.json"),
          JSON.stringify(manifest, null, 2),
        );
        console.log("[BG Export] ✓ class_manifest.json written");

        // 10. ZIP only small assets (scenario.json + images + manifest — NO .zst files)
        const zipFileName = `scenario_${scenarioid}.zip`;
        const zipPath     = path.join(tempZipDir, zipFileName);

        await new Promise((resolve, reject) => {
          const output  = fs.createWriteStream(zipPath);
          const archive = archiver("zip", { zlib: { level: 6 } });

          output.on("close", resolve);
          output.on("error", reject);
          archive.on("error", reject);

          archive.on("progress", ({ fs: { processedBytes } }) => {
            process.stdout.write(`\r[ZIP] ${(processedBytes / 1024 / 1024).toFixed(1)} MB written...`);
          });

          archive.pipe(output);
          archive.directory(exportDir, false);
          archive.finalize();
        });

        console.log(`\n[ZIP] ✓ Small assets zipped: ${zipFileName}`);

        // 11. Mark Completed in DB
        await dao.markExportCompleted({ db })(exportid, zipFileName);
        console.log(`[BG Export] ✓ Marked Completed — exportid=${exportid}`);

        // 12. Cleanup staging dir (keep small zip in temp_zip for download)
        fs.rmSync(exportDir, { recursive: true, force: true });

        console.log(`[BG Export] ✓ All done — scenarioid=${scenarioid} exportid=${exportid}`);

      } catch (err) {
        console.error("[BG Export] Unhandled error:", err);
        await dao.markExportFailed({ db })(exportid).catch(() => {});
      }
    };




  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "../../..", "temp_imports");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `import_${Date.now()}_${file.originalname}`);
    },
  });
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (!file.originalname.endsWith(".zip")) {
        return cb(new Error("Only .zip files are allowed"));
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 * 1024 },
  });


const getImportStatus =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { importid } = req.params;
      if (!importid) return res.status(400).send({ statusCode: 400, message: "importid required." });

      const record = await dao.getImportById({ db })(importid);
      if (!record)  return res.status(404).send({ statusCode: 404, message: "Import not found." });

      return res.status(200).send({
        statusCode: 200,
        data: {
          importid:   record.importid,
          status:     record.status,     // Pending | Running | Completed | Failed
          message:    record.message,
          createdon:  record.createdon,
          modifiedon: record.modifiedon,
        },
      });
    } catch (err) {
      next(err);
    }
  };

const triggerImport =
  ({ dao, db }) =>
  async (req, res, next) => {
    zipUpload.single("zipfile")(req, res, async (uploadErr) => {
      try {
        if (uploadErr) {
          return res.status(400).send({
            statusCode: 400,
            message: uploadErr.message,
          });
        }

        if (!req.file) {
          return res.status(400).send({
            statusCode: 400,
            message: "No ZIP file uploaded.",
          });
        }

        const path = require("path");
        const fs = require("fs");
        const unzipper = require("unzipper");

        const ipAddress =
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress;

        const userid = req.body.userid;

        const customIdentification =
          req.body.customIdentification || null;

        const zipPath = req.file.path;

        // ── Read ZIP ─────────────────────────────────────
        const zip = await unzipper.Open.file(zipPath);

        // Guard: reject ZIPs containing .zst
        const hasZst = zip.files.some((f) =>
          f.path.endsWith(".zst")
        );

        if (hasZst) {
          fs.unlinkSync(zipPath);

          return res.status(400).send({
            statusCode: 400,
            message:
              "This ZIP contains .zst backup files. Upload only the scenario package ZIP and upload each .zst separately.",
          });
        }

        // ── Create extraction folder ────────────────────
        const extractPath = path.join(
          path.dirname(zipPath),
          `import_staging_${Date.now()}`
        );

        fs.mkdirSync(extractPath, { recursive: true });

        // ── Extract ZIP ─────────────────────────────────
        await fs
          .createReadStream(zipPath)
          .pipe(unzipper.Extract({ path: extractPath }))
          .promise();

        console.log("[Import] ZIP extracted to:", extractPath);

        let scenariotitle = "Imported Scenario";
        let scenarioidentification = null;
        let original_scenarioid = null;
        let components = [];

        // ── Read scenario.json ──────────────────────────
        const scenarioEntry = zip.files.find(
          (f) =>
            f.path === "scenario.json" ||
            f.path.endsWith("/scenario.json")
        );

        if (scenarioEntry) {
          const content = await scenarioEntry.buffer();

          const data = JSON.parse(content.toString("utf8"));

          const scenario =
            data.scenario?.scenario ||
            data.scenario ||
            {};

          scenariotitle =
            scenario.scenariotitle ||
            "Imported Scenario";

          scenarioidentification =
            customIdentification?.trim() ||
            `${scenario.scenarioidentification}_IMP`;

          original_scenarioid =
            scenario.scenarioid || null;
        }

        // ── Read class_manifest.json ────────────────────
        const manifestEntry = zip.files.find(
          (f) =>
            f.path === "class_manifest.json" ||
            f.path.endsWith("/class_manifest.json")
        );

        if (manifestEntry) {
          const content = await manifestEntry.buffer();

          const manifest = JSON.parse(
            content.toString("utf8")
          );

          const vms =
            manifest.vms ||
            manifest.componentDetails ||
            [];

          components = vms.map((vm) => ({
            name:
              vm.name ||
              vm.vmname ||
              `VM-${vm.vmid}`,
            vmid: vm.vmid || null,
            type: vm.type || "lxc",
            file: vm.file,
            size: vm.size || null,
          }));
        }

        // ── Create import record ────────────────────────
        const importid =
          await dao.createScenarioImport({ db })({
            scenariotitle,
            scenarioidentification,
            userid,
            original_scenarioid,
            zip_path: zipPath,
            extract_path: extractPath,
            ip_address: ipAddress,
            components,
          });

        if (!importid) {
          return res.status(500).send({
            statusCode: 500,
            message: "Failed to create import record.",
          });
        }

        return res.status(200).send({
          statusCode: 200,
          message:
            "Scenario package accepted. Upload component ZST files next.",
          data: {
            importid,
            scenariotitle,
            scenarioidentification,
            components,
          },
        });

      } catch (err) {
        console.error("Error in triggerImport:", err);
        next(err);
      }
    });
  };

const uploadComponentZst =
  ({ dao, db }) =>
  async (req, res, next) => {
    const ssh = new NodeSSH();
    try {
      const { importid, vmFile } = req.query;

      if (!importid) return res.status(400).send({ statusCode: 400, message: "importid is required." });
      if (!vmFile)   return res.status(400).send({ statusCode: 400, message: "vmFile is required." });

      const importRecord = await dao.getImportById({ db })(importid);
      if (!importRecord) {
        return res.status(404).send({ statusCode: 404, message: "Import record not found." });
      }

      // ── Step 1: Save to Jobs disk ──────────────────────────────────
      const tmpDir  = path.join(__dirname, "../../..", "zst_tmp");
      fs.mkdirSync(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, `${importid}_${vmFile}`);

      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(tmpPath);
        req.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error",  reject);
        req.on("error",          reject);
      });

      console.log(`[Jobs] ✓ Saved to disk: ${tmpPath}`);

      // ── Mark as transferring in DB ─────────────────────────────────
      await dao.markComponentTransferring({ db })(importid, vmFile);

      // ── Respond immediately — don't hold the connection ────────────
      res.status(200).send({
        statusCode: 200,
        message:    "File received. Transferring to Proxmox in background.",
        data:       { received: true, transferring: true, vmFile },
      });

      // ── Step 2: Background SFTP transfer ───────────────────────────
      setImmediate(async () => {
        try {
          await ssh.connect({
            host:         process.env.PROXMOX_SSH_HOST,
            username:     process.env.PROXMOX_SSH_USER,
            password:     process.env.PROXMOX_SSH_PASSWORD,
            readyTimeout: 30000,
          });

          const sftp = await new Promise((resolve, reject) => {
            ssh.connection.sftp((err, s) => (err ? reject(err) : resolve(s)));
          });

          const remotePath  = `/var/lib/vz/dump/${vmFile}`;
          const readStream  = fs.createReadStream(tmpPath, {
            highWaterMark: 1024 * 1024, // 1MB chunks
          });
          const writeStream = sftp.createWriteStream(remotePath);

          await new Promise((resolve, reject) => {
            readStream.pipe(writeStream);
            writeStream.on("close", resolve);
            writeStream.on("error", reject);
            readStream.on("error",  reject);
          });

          ssh.dispose();
          fs.unlink(tmpPath, () => {});

          await dao.markComponentUploaded({ db })(importid, vmFile);
          console.log(`[Jobs BG] ✓ ${vmFile} → Proxmox done`);

        } catch (err) {
          ssh.dispose();
          try { fs.unlink(tmpPath, () => {}); } catch (_) {}
          await dao.markComponentFailed({ db })(importid, vmFile, err.message);
          console.error(`[Jobs BG] ✗ Transfer failed: ${err.message}`);
        }
      });

    } catch (err) {
      ssh.dispose();
      console.error("[Jobs] Error in uploadComponentZst:", err.message);
      if (!res.headersSent) {
        res.status(500).send({ statusCode: 500, message: err.message });
      }
    }
  };
const getZstUploadStatus =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { importid } = req.query;
      if (!importid) return res.status(400).send({ statusCode: 400, message: "importid is required." });

      const status = await dao.getComponentUploadStatus({ db })(importid);

      return res.status(200).send({
        statusCode: 200,
        data:       status,
      });

    } catch (err) {
      console.error("[Jobs] getZstUploadStatus error:", err.message);
      res.status(500).send({ statusCode: 500, message: err.message });
    }
  };




  

const startRestore =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { importid, vmFiles } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!importid) {
        return res.status(400).send({ statusCode: 400, message: "importid is required." });
      }

      //  vmFiles must be provided and non-empty
      if (!vmFiles || !Array.isArray(vmFiles) || vmFiles.length === 0) {
        return res.status(400).send({ statusCode: 400, message: "vmFiles array is required." });
      }

      const importRecord = await dao.getImportById({ db })(importid);
      if (!importRecord) {
        return res.status(404).send({ statusCode: 404, message: "Import record not found." });
      }

      //  Verify each vmFile in this batch is actually uploaded
      const batchAllUploaded = await dao.checkSpecificComponentsUploaded({ db })(importid, vmFiles);
      if (!batchAllUploaded) {
        return res.status(400).send({
          statusCode: 400,
          message: "One or more specified ZST files have not been uploaded yet.",
        });
      }

      //  Check if this is the final batch — all components will be restored after this
      const allWillBeRestored = await dao.checkAllComponentsUploaded({ db })(importid);

      res.status(200).send({
        statusCode: 200,
        message: "Restore job started.",
        data: { importid, vmFiles, isFinalBatch: allWillBeRestored },
      });
      //  Fire-and-forget — pass vmFiles so job restores only this batch
      dao.runImportJob({ db ,ip_address:ipAddress})({
        importid,
        stagingDir:           importRecord.extract_path,
        zipPath:              importRecord.zip_path,
        ipAddress:            importRecord.ip_address,
        userid:               importRecord.userid,
        customIdentification: importRecord.scenarioidentification,
        vmFiles,              //  only restore these files
        isFinalBatch:         allWillBeRestored, //  only insert to DB on final batch
      }).catch((err) => console.error("[startRestore] job error:", err));

    } catch (err) {
      console.error("Error in startRestore:", err);
      next(err);
    }
  };


const getImportList =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const userid = req.query.userid || req.body.userid || 2;

      const result = await dao.getImportList({ db })(userid);

      if (!result) {
        return res.status(400).send({
          statusCode: 400,
          message: "Failed to fetch import list.",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message:   "Import list fetched successfully.",
        data:      result,
      });
    } catch (err) {
      console.error("Error in get import list controller:", err);
      next(err);
    }
  };

const checkScenarioIdentification =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).send({ statusCode: 400, message: "No ZIP file provided." });
      }

      const os   = require("os");
      const path = require("path");
      const fs   = require("fs");

      const tmpPath = path.join(os.tmpdir(), `check_${Date.now()}.zip`);
      fs.writeFileSync(tmpPath, req.file.buffer);

      const customIdentification = req.body.customIdentification || null;

      try {
        const result = await dao.checkScenarioIdentification({ db })({ zipPath: tmpPath, customIdentification });

        return res.status(200).send({
          statusCode: 200,
          message: result.conflict
            ? "Identification conflict detected."
            : "Identification is available.",
          data: result,
        });
      } finally {
        try { fs.unlinkSync(tmpPath); } catch (_) {}
      }

    } catch (err) {
      console.error("Error in checkScenarioIdentification controller:", err);
      next(err);
    }
  };




module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminatelearner,
  generateProxmoxAccessToken,
  autoTerminateFailedScenarios,
  restartscenarioLearner,
  startScenarioLearner,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  resumeScenarioLearner,
  pauseScenarioLearner,
  backupstatus,
  deleteScenarioLearner,
  save,
  vmDetails,
  getVmConfig,
  stopScenarioVM,
  addScenarioVmNetwork,
  deleteScenarioVmNetwork,
  ModifyScenarioVmNetwork,
  addRuntimeComponent,
  stopDestroySingleComponent,
  disconnectRuntimeNetworks,
  connectRuntimeNetwork,
  plugRuntimeNetwork,
  unplugRuntimeNetwork,
  stopComponent,
  restartComponent,
  startComponent,
  triggerExport,
  downloadExport,
  triggerImport,
  getImportList,
  checkScenarioIdentification,
  getImportStatus,
  downloadComponentzst,
  startRestore,
  uploadComponentZst,
  getZstUploadStatus
};
