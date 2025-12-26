const { componentSetupJob } = require("../../vmstartjob/componentSetupJob");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const setVMRequestConfiguration =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { scenarioid, vmrequestid,requestedby_id,
            requestedby_role,} = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!scenarioid || !vmrequestid) {
        return res.status(400).send({
          statusCode: 400,
          message: "scenarioid and vmrequestid are required.",
        });
      }

      const result = await dao.setVMRequestConfiguration({ db })(
        scenarioid,
        vmrequestid,
        requestedby_id,
            requestedby_role,
      );

      if (result.success) {
        componentSetupJob(db, ipAddress, {
          scenarioid,
          vmrequestid,
          requestedby_id,
            requestedby_role,
        });

        return res.status(200).send({
          statusCode: 200,
          message: result.message,
        });
      }

      return res.status(500).send({
        statusCode: 500,
        message: result.message,
      });
    } catch (err) {
      console.error("Error in VM request configuration:", err);
      next(err);
    }
  };



const updateCompleteTerminateVMRequest =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;
      console.log("vmrequestidvmrequestid",vmrequestid);
      

      if (!vmrequestid  || !status || !type) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmrequestid, status and type are required",
        });
      }

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.updateCompleteTerminateVMRequest({ db, ipAddress })(
        vmrequestid,
        status,
        type
      );

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
      console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", req.body);

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
      const { vmrequestid } = req.body;
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
 


module.exports = {
  setVMRequestConfiguration,
  updateCompleteTerminateVMRequest,
  generateProxmoxAccessToken,
  autoTerminateFailedScenarios,
  restartscenarioLearner,
  startScenarioLearner,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  resumeScenarioLearner,
  pauseScenarioLearner,
  deleteScenarioLearner
};
