const { componentSetupJob } = require("../../jobs/componentSetupJob");
const setScenarioLearnerConfiguration =
  ({ dao, db, validation }) =>
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

      const result = await dao.setScenarioLearnerConfiguration({
        db,
        ipAddress,
        validation,
      })(scenarioid, learnerid, scenariolearnersessionid);
      if(result.success){
        componentSetupJob(db, ipAddress, {scenarioid,learnerid,scenariolearnersessionid});
        return res.status(200).send({statusCode: 200,message: result.message });
      }else{
        return res.status(500).send({statusCode: 500, message: result.message });
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
      const { scenariolearnersessionid, status, type } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      if (!scenariolearnersessionid || !status || !type) {
        return res.status(400).send({
          statusCode: 400,
          message: "scenariolearnersessionid, status, and type are required.",
        });
      }

      const result = await dao.updateCompleteTerminatelearner({ db, ipAddress })(
        scenariolearnersessionid,
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
      console.error("Error in updating session status:", err);
      next(err);
    }
  };

const generateProxmoxAccessToken =
  ({ dao, db }) => async (req, res) => {
  try {
    const payload = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const result = await dao.generateProxmoxAccessToken({ db, payload })(ipAddress);
    
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







module.exports = {
  setScenarioLearnerConfiguration,
  updateCompleteTerminatelearner,
  generateProxmoxAccessToken,
  autoTerminateFailedScenarios,
  restartscenarioLearner,
  startScenarioLearner
};
