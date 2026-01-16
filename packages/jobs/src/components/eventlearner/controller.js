const { componentSetupJob } = require("../../eventjob/componentSetupJob");


const setEventLearnerConfiguration =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { scenarioid, learnerid, eventlearnerid,vmrequestid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!scenarioid || !learnerid || !eventlearnerid) {
        return res.status(400).send({
          statusCode: 400,
          message: "scenarioid,eventlearnerid and learnerid is required.",
        });
      }

      const result = await dao.setEventLearnerConfiguration({
        db,
        ipAddress,
        validation,
      })(scenarioid, learnerid, eventlearnerid,vmrequestid);

      if (!result.success) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message,
        });
      }

      // Call componentSetupJob if all went well
      componentSetupJob(db, ipAddress, {
        scenarioid,
        learnerid,
        eventlearnerid,
        vmrequestid,
      });

      return res.status(200).send({
        statusCode: 200,
        message: result.message + " — Job started.",
      });
    } catch (err) {
      console.error("Error in setting scenario learner configuration:", err);
      next(err);
    }
  };

const updateCompleteTerminate =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { eventlearnerid, status, type ,vmrequestid} = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!eventlearnerid || !status || !type) {
        return res.status(400).send({
          statusCode: 400,
          message: "eventlearnerid, status, and type are required.",
        });
      }

      const result = await dao.updateCompleteTerminate({ db, ipAddress })(
        eventlearnerid,
        status,
        type,
        vmrequestid
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
      console.error("Error in updating session status:", err);
      next(err);
    }
  };

const restartEventLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const {vmrequestid } = req.body;
      console.log("Controller------------------",vmrequestid);
      
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const result = await dao.restartEventLearner({
        db,
        ipAddress,
        validation,
      })(vmrequestid);

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
      console.error("Error in restarting event learner:", err);
      next(err);
    }
  };


  const autoTerminateExpiredEvents =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.autoTerminateExpiredEvents({
        db,
        ipAddress,
        updateCompleteTerminate: dao.updateCompleteTerminate,
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
      console.error("Error in auto-terminating expired events:", err);
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

const pauseScenarioLearner =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const { eventlearnerid ,vmrequestid} = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.pauseScenarioLearner({
        db,
        ipAddress,
        validation,
      })(eventlearnerid,vmrequestid);

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
      const { eventlearnerid ,vmrequestid} = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.resumeScenarioLearner({
        db,
        ipAddress,
        validation,
      })(eventlearnerid,vmrequestid);

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
  setEventLearnerConfiguration,
  updateCompleteTerminate,
  restartEventLearner,
  autoTerminateExpiredEvents,
  generateProxmoxAccessToken,
  pauseScenarioLearner,
  resumeScenarioLearner,
  deleteScenarioLearner

};
