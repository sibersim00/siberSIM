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
      const { scenariolearnersessionid } = req.body;
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
      })(scenariolearnersessionid);

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
      const { scenariolearnersessionid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.resumeScenarioLearner({
        db,
        ipAddress,
        validation,
      })(scenariolearnersessionid);

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

// const exportScenario = ({ dao, db }) => async (req, res) => {
//   try {
//     const { scenarioid } = req.body;
 
//     const scenario = await dao.getScenarioById({ db })(scenarioid);
//     if (!scenario) {
//       return res.status(404).json({
//         statusCode: 404,
//         message: "Scenario not found",
//       });
//     }
 
//     // Create directories
//     const exportDir = path.join(__dirname, `../exports/scenario_${scenarioid}`);
//     const assetsDir = path.join(exportDir, "assets");
//     const tempZipDir = path.join(__dirname, "../temp_zip");   // ZIP stored separately
 
//     fs.mkdirSync(assetsDir, { recursive: true });
//     fs.mkdirSync(tempZipDir, { recursive: true });
 
//     // Save core JSON file
//     const jsonPath = path.join(exportDir, "scenario_data.json");
//     fs.writeFileSync(jsonPath, JSON.stringify(scenario, null, 2));
 
//     // Base uploads directory
//     const baseDir = path.join(__dirname, "../uploads");
 
//     // Copy helper
//     const copyFileSafe = (srcRelPath) => {
//       if (!srcRelPath) return;
 
//       const cleanPath = srcRelPath.replace(/^\/?uploads[\\/]/, "");
//       const srcPath = path.join(baseDir, cleanPath);
 
//       if (fs.existsSync(srcPath)) {
//         const destPath = path.join(assetsDir, path.basename(srcRelPath));
//         fs.copyFileSync(srcPath, destPath);
//       } else {
//         console.warn("Missing file:", srcPath);
//       }
//     };
 
//     // Copy assets
//     copyFileSafe(scenario.scenarioimage);
//     copyFileSafe(scenario.instruction_file);
 
//     const componentImages = JSON.parse(scenario.component_images || "[]");
//     componentImages.forEach((img) => copyFileSafe(img));
 
//     // Create ZIP OUTSIDE of export folder
//     const zipPath = path.join(tempZipDir, `scenario_${scenarioid}.zip`);
//     const output = fs.createWriteStream(zipPath);
//     const archive = archiver("zip", { zlib: { level: 9 } });
 
//     output.on("close", () => {
//       console.log(`ZIP created successfully: ${zipPath}`);
 
//       const fileBuffer = fs.readFileSync(zipPath);
//       res.setHeader("Content-Type", "application/zip");
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=scenario_${scenarioid}.zip`
//       );
 
//       res.send(fileBuffer);
 
//       // cleanup to avoid corruption during writing
//       setTimeout(() => {
//         try {
//           fs.rmSync(exportDir, { recursive: true, force: true });
//           fs.unlinkSync(zipPath);
//         } catch (err) {
//           console.error("Cleanup error:", err);
//         }
//       }, 5000);
//     });
 
//     archive.on("error", (err) => {
//       console.error("Archiver error:", err);
//       throw err;
//     });
 
//     archive.pipe(output);
//     archive.directory(exportDir, false);
//     archive.finalize();
//   } catch (err) {
//     console.error("Export Scenario Error:", err);
//     res.status(500).json({
//       statusCode: 500,
//       message: "Server Error",
//       error: err.message,
//     });
//   }
// };


const exportScenario = ({ dao, db }) => async (req, res) => {
  try {
    const { scenarioid } = req.body;
       const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
 
    const scenario = await dao.getScenarioById({ db,ipAddress })(scenarioid);
    if (!scenario) {
      return res.status(404).json({
        statusCode: 404,
        message: "Scenario not found",
      });
    }
 
    const exportDir = path.join(__dirname, `../exports/scenario_${scenarioid}`);
    const assetsDir = path.join(exportDir, "assets");
 
    fs.mkdirSync(assetsDir, { recursive: true });
 
    const jsonPath = path.join(exportDir, "scenario_data.json");
    fs.writeFileSync(jsonPath, JSON.stringify(scenario, null, 2));
 
    const baseDir = path.join(__dirname, "../uploads");
 
    const copyFileSafe = (srcRelPath) => {
      if (!srcRelPath) return;
      const cleanPath = srcRelPath.replace(/^\/?uploads[\\/]/, "");
      const srcPath = path.join(baseDir, cleanPath);
 
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(assetsDir, path.basename(srcRelPath));
        fs.copyFileSync(srcPath, destPath);
      } else {
        console.warn("Missing file:", srcPath);
      }
    };
 
    copyFileSafe(scenario.scenarioimage);
    copyFileSafe(scenario.instruction_file);
 
    const componentImages = JSON.parse(scenario.component_images || "[]");
    componentImages.forEach(copyFileSafe);
 
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=scenario_${scenarioid}.zip`
    );
 
    const archive = archiver("zip", { zlib: { level: 9 } });
 
    archive.on("error", (err) => {
      throw err;
    });
 
    archive.pipe(res);                     // DIRECT STREAM ZIP TO RESPONSE
    archive.directory(exportDir, false);   // Add folder
    archive.finalize();                    // Create zip
 
    archive.on("end", () => {
      fs.rmSync(exportDir, { recursive: true, force: true });
    });
 
  } catch (err) {
    console.error("Export Scenario Error:", err);
    res.status(500).json({
      statusCode: 500,
      message: "Server Error",
      error: err.message,
    });
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
 

    const deleteScenarioLearner =
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

      const result = await dao.deleteScenarioLearner({
        db,
        ipAddress,
      })(scenariolearnersessionid, status, type);

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
  exportScenario,
  backupstatus,
  deleteScenarioLearner
};
