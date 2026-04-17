const { componentSetupJob } = require("../../jobs/componentSetupJob");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

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

const exportScenario =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const { scenarioid, exportid } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const scenario = await dao.getScenarioById({ db, ipAddress })(
        scenarioid,
        exportid,
      );

      if (!scenario) {
        return res.status(404).json({
          statusCode: 404,
          message: "Scenario not found",
        });
      }

      console.log("[Export] Scenario Loaded Successfully");

      const baseRoot = path.join(__dirname, "../../..");

      const exportDir = path.join(baseRoot, `exports/scenario_${scenarioid}`);
      const assetsDir = path.join(exportDir, "assets");
      const tempZipDir = path.join(baseRoot, "temp_zip");
      const uploadsBase = path.join(baseRoot, "uploads");

      // Create folders
      fs.mkdirSync(exportDir, { recursive: true });
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.mkdirSync(tempZipDir, { recursive: true });

      const scenariosFolder = path.join(assetsDir, "scenarios");
      const componentsFolder = path.join(assetsDir, "components");
      const backupFolder = path.join(assetsDir, "component_backups");

      fs.mkdirSync(scenariosFolder, { recursive: true });
      fs.mkdirSync(componentsFolder, { recursive: true });
      fs.mkdirSync(backupFolder, { recursive: true });

      // Store JSON
      const jsonPath = path.join(exportDir, "scenario_data.json");
      fs.writeFileSync(jsonPath, JSON.stringify(scenario, null, 2));
      console.log("[Export] JSON Stored:", jsonPath);

      // Safe copy function
      const copyFileSafe = (srcRelPath, targetFolder = assetsDir) => {
        if (!srcRelPath) return;

        const cleanPath = srcRelPath.replace(/^\/?uploads[\\/]/, "");
        const srcPath = path.join(uploadsBase, cleanPath);

        console.log(`[Copy] Src: ${srcPath}`);

        if (fs.existsSync(srcPath)) {
          const fileName = path.basename(srcPath);
          const destPath = path.join(targetFolder, fileName);
          console.log(`[Copy] To: ${destPath}`);
          fs.copyFileSync(srcPath, destPath);
        } else {
          console.warn("[Warning] File Missing:", srcPath);
        }
      };

      const scenarioData = scenario.scenario;

      // Scenario images and instruction
      copyFileSafe(scenarioData.scenarioimage, scenariosFolder);
      copyFileSafe(scenarioData.instruction_file, scenariosFolder);

      let componentImages = [];
      try {
        componentImages = JSON.parse(scenarioData.components || "[]");
      } catch (err) {
        console.log("[Component Parse Error]:", err);
      }

      const imagesToCopy = componentImages
        .map((c) => {
          const parts = c.imageUrl?.split("/");
          return parts
            ? `/uploads/components/${parts[parts.length - 1]}`
            : null;
        })
        .filter(Boolean);

      imagesToCopy.forEach((file) => copyFileSafe(file, componentsFolder));

      // -----------------------------
      // FETCH BACKUP .zst FILE NAMES
      // -----------------------------

      console.log("scenarioId", scenarioid);
      const backupFiles = await db.sequelize.query(
        `SELECT file_name FROM component_export
       WHERE scenarioid = :scenarioid AND status = 'Completed' AND file_name IS NOT NULL`,
        {
          replacements: { scenarioid: scenarioid },
          type: db.sequelize.QueryTypes.SELECT,
        },
      );

      console.log("[Backup Files Found]", backupFiles);

      // REAL Proxmox Backup location
      // const backupSourceDir = "/dump";  // <-- update if required

      // COPY .ZST FILES
      backupFiles.forEach((fileObj) => {
        const fileName = fileObj.file_name;
        const srcPath = path.join(fileName);
        const destPath = path.join(backupFolder, fileName);

        console.log(`[Backup Copy] ${srcPath} -> ${destPath}`);

        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        } else {
          console.warn(
            `[Backup File Missing] ${fileName} Not Found in`,
            srcPath,
          );
        }
      });

      // ZIP PREPARATION
      const zipPath = path.join(tempZipDir, `scenario_${scenarioid}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      // output.on("close", () => {
      //   console.log(`[ZIP] Created Successfully: ${zipPath}`);

      //   const fileBuffer = fs.readFileSync(zipPath);
      //   res.setHeader("Content-Type", "application/zip");
      //   res.setHeader(
      //     "Content-Disposition",
      //     `attachment; filename=scenario_${scenarioid}.zip`
      //   );
      //   res.send(fileBuffer);

      //   setTimeout(() => {
      //     try {
      //       fs.rmSync(exportDir, { recursive: true, force: true });
      //       fs.unlinkSync(zipPath);
      //       console.log("[Cleanup] Removed temp files");
      //     } catch (err) {
      //       console.error("Cleanup error:", err);
      //     }
      //   }, 5000);
      // });

      output.on("close", async () => {
        console.log(`[ZIP] Created Successfully: ${zipPath}`);

        const fileName = `scenario_${scenarioid}.zip`;

        await db.sequelize.query(
          `UPDATE scenario_export
     SET file_name = :fileName, status = 'Completed'
     WHERE exportid = :exportid`,
          {
            replacements: { fileName, exportid },
            type: db.sequelize.QueryTypes.UPDATE,
          },
        );

        return res.status(200).json({
          statusCode: 200,
          message: "ZIP generated and saved successfully",
          file_name: fileName,
        });
      });

      archive.on("error", (err) => {
        console.error("Archiver error:", err);
        throw err;
      });

      archive.pipe(output);
      archive.directory(exportDir, false);
      archive.finalize();
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
      console.log("PAYLOAD ===>", payload);

      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.save({ db, ipAddress })(payload);
      console.log("RESULT*****", result);

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
      console.log("req.bodyreq.body", req.body);

      console.log("vmid vmType", vmid, vmType);
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
  exportScenario,
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
  startComponent
};
