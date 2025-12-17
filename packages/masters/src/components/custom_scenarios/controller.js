const path = require("path");
const fs = require("fs");
// const archiver = require("archiver");
// const unzipper = require("unzipper"); 

const list =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      let session_userid = req.user.userid;
      const result = await dao.list({ db })(session_userid);
      res
        .status(200)
        .send({ statusCode: 200, message: "Get Scenario List", data: result });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const getById =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const id = req.params.id;
      console.log("ididididididididididididididid",id);
      
      const result = await dao.getById({ db })(id);

      if (!result) {
        return res
          .status(404)
          .send({ statusCode: 404, message: "Scenario not found" });
      }

      res.status(200).send({
        statusCode: 200,
        message: "Get Scenario Details",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const create =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const learner_id = req.user.userid;

      const result = await dao.create({ db })(body, learner_id);

      return res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
        scenarioid: result.custom_scenarioid || null,
      });
    } catch (error) {
      console.error("Error on save data:", error.message);
      return res.status(500).json({
        statusCode: 500,
        error: "An error occurred. Please try again later.",
      });
    }
  };

const update =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const body = req.body;
      let session_userid = req.user.userid;
      const result = await dao.update({ db })(body, session_userid);
      return res
        .status(result.statusCode)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error on save data:", error.message);
      return res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const changeStatus =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      let body = req.body;
      const session_userid = req.user.userid;
      const result = await dao.changeStatus({ db, validation })(
        body,
        session_userid
      );
      res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const deleteById =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const session_userid = req.user.userid;

      const result = await dao.deleteById({ db })(body, session_userid);

      // Check DAO response
      if (!result.status) {
        // Scenario cannot be deleted (running)
        return res.status(400).send({
          statusCode: 400,
          message: result.message, // Pass DAO message directly
        });
      }

      // Success response
      res.status(200).send({
        statusCode: 200,
        message: "Scenario Deleted Successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error Deleting Scenario:", error.message);
      res.status(500).json({
        error: "An error occurred. Please try again later.",
      });
    }
  };

const saveDiagram =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      let body = req.body;
      const session_userid = req.user.userid;
      const result = await dao.saveDiagram({ db, validation })(
        body,
        session_userid
      );
      return res
        .status(result.statusCode)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error Scenario Diagram save data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const scenariodigramlist =
  ({ dao, db, validation }) =>
  async (req, res) => {
    const { scenarioid } = req.query;
    try {
      const result = await dao.scenariodigramlist({ db })(scenarioid);
      if (result.success) {
        return res.status(200).json({
          message: "Scenario diagrams fetched successfully",
          data: result.data,
        });
      }
      return res.status(500).json({
        message: "Error fetching scenario diagrams",
        error: result.message,
      });
    } catch (error) {
      console.error("Controller error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  };

const saveComponentconfiguration =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      let body = req.body;
      const session_userid = req.user.userid;
      const result = await dao.saveComponentconfiguration({ db, validation })(
        body,
        session_userid
      );
      return res
        .status(result.statusCode)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error Component Configuration save data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

// const exportSelectedScenarios =
//   ({ dao, db }) =>
//   async (req, res) => {
//     try {
//       const scenarioIds = req.body.scenarioIds; // match the frontend

//       if (!scenarioIds || scenarioIds.length === 0) {
//         return res.status(400).json({ message: "No scenarios selected" });
//       }
//       let scenarios = await dao.getScenarioInstructionFiles({ db })(
//         scenarioIds
//       );
//       // fetch scenario instruction files
//       if (!Array.isArray(scenarios)) {
//         scenarios = [scenarios];
//       }

//       if (scenarios.length === 0) {
//         return res.status(404).json({ message: "No scenarios found" });
//       }

//       console.log("scenariosscenaritttttttttttt", scenarios);

//       res.setHeader("Content-Type", "application/zip");
//       res.setHeader(
//         "Content-Disposition",
//         'attachment; filename="selected_scenarios.zip"'
//       );

//       const archive = archiver("zip", { zlib: { level: 9 } });
//       archive.on("error", (err) => {
//         throw err;
//       });
//       archive.pipe(res);

//       const scenariosFolderPath = path.resolve(
//         __dirname,
//         "../../../../jobs/uploads/scenarios"
//       );

//       scenarios.forEach((scenario) => {
//         if (scenario.instruction_file) {
//           const fileName = path.basename(scenario.instruction_file);
//           const filePath = path.join(scenariosFolderPath, fileName);
//           console.log("Trying to add:", filePath);

//           if (fs.existsSync(filePath)) {
//             console.log("✅ File found, adding:", fileName);
//             archive.file(filePath, { name: fileName });
//           } else {
//             console.warn("❌ File missing:", filePath);
//           }
//         } else {
//           console.warn(
//             "⚠️ No instruction file for scenario:",
//             scenario.scenarioid
//           );
//         }
//       });

//       await archive.finalize();
//     } catch (err) {
//       console.error("Selected scenarios export failed:", err);
//       res.status(500).json({ message: "Export failed", error: err.message });
//     }
//   };



  // const importScenariosZip = ({ dao, keys }) => async (req, res) => {
  //   try {
  //     if (!req.files || req.files.length === 0) {
  //       return res.status(400).json({ message: "No file uploaded" });
  //     }
  //     let zipImported = false;
  
  //     for (const file of req.files) {
  //       const ext = path.extname(file.originalname).toLowerCase();
  
  //       if (ext === ".zip") {
  //         // ZIP import → unzip to destination folder
  //         const destFolder = path.resolve(
  //           __dirname,
  //           "../../../../jobs/uploads/scenarios"
  //         );
  
  //         if (!fs.existsSync(destFolder)) {
  //           fs.mkdirSync(destFolder, { recursive: true });
  //         }
  
  //         // unzip to destination
  //         await new Promise((resolve, reject) => {
  //           const stream = unzipper.Extract({ path: destFolder });
  //           stream.on("close", resolve);
  //           stream.on("error", reject);
  
  //           const bufferStream = new require("stream").PassThrough();
  //           bufferStream.end(file.buffer);
  //           bufferStream.pipe(stream);
  //         });
  
  //         zipImported = true;
  //       } else {
  //         console.warn(`Skipping unsupported file type: ${file.originalname}`);
  //       }
  //     }
  
  //     let message = [];
  //     if (zipImported) message.push("ZIP extracted successfully");
  
  //     res.json({
  //       message: message.join(" and "),
  //     });
  //   } catch (err) {
  //     console.error("Error importing files:", err);
  //     res.status(500).json({
  //       message: "Error importing files",
  //       error: err.message,
  //     });
  //   }
  // };
  

module.exports = {
  list,
  getById,
  create,
  update,
  deleteById,
  changeStatus,
  saveDiagram,
  scenariodigramlist,
  saveComponentconfiguration,
  // exportSelectedScenarios,
  // importScenariosZip
};
