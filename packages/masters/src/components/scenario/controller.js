const fs = require("fs");
const path = require("path");
const archiver = require("archiver");


const list = ({ dao, db }) => async (req, res) => {
    try {
        let usertype = req.user.usertype;         // e.g., "Admin" or "Instructor"
        let session_userid = req.user.userid;
            const user_count_limit = req.user.user_count_limit; // ✅ admin user id
console.log("user_count_limituser_count_limit",user_count_limit);
        const result = await dao.list({ db })(usertype, session_userid);
        res.status(200).send({ statusCode: 200, message: "Get Scenario List", data: result });
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};


const getById = ({ dao, db }) => async (req, res) => {
    try {
        const id = req.params.id;
        console.log("iddddddddddddddddddd",id);
        
        const result = await dao.getById({ db })(id);

        if (!result) {
            return res.status(404).send({ statusCode: 404, message: "Scenario not found" });
        }

        res.status(200).send({ statusCode: 200, message: "Get Scenario Details", data: result });
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const create = ({ dao, db }) => async (req, res) => {
    try {
        const body = req.body;
        const session_userid = req.user.userid;

        const result = await dao.create({ db })(body, session_userid);

        return res.status(result.statusCode).send({
            statusCode: result.statusCode,
            message: result.message,
            scenarioid: result.scenariouuid || null,
        });
    } catch (error) {
        console.error("Error on save data:", error.message);
        return res.status(500).json({
            statusCode: 500,
            error: "An error occurred. Please try again later.",
        });
    }
};

const update = ({ dao, db }) => async (req, res) => {
    try {
        const body = req.body;
        let session_userid = req.user.userid;
        const result = await dao.update({ db })(body, session_userid);
        return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
        console.error("Error on save data:", error.message);
        return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const changeStatus = ({ dao, db, validation }) => async (req, res) => {
    try {
        let body = req.body
        const session_userid = req.user.userid
        const result = await dao.changeStatus({ db, validation })(body, session_userid);
        res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message, data: result.data });
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const deleteById = ({ dao, db }) => async (req, res) => {
  try {
    let body = req.body;
    const session_userid = req.user.userid;

    const result = await dao.deleteById({ db })(body, session_userid);
    if (result && result.status === false) {
      return res.status(400).send({
        statusCode: 400,
        message: result.message,
      });
    }

    res.status(200).send({
      statusCode: 200,
      message: "Scenario Deleted Successfully",
    });
  } catch (error) {
    console.error("Error Scenario Deleting data:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: "An error occurred. Please try again later.",
    });
  }
};


const saveDiagram = ({ dao, db, validation }) => async (req, res) => {
    try {
        let body = req.body
        const session_userid = req.user.userid
        const result = await dao.saveDiagram({ db, validation })(body, session_userid);
        return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
        console.error("Error Scenario Diagram save data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};


const scenariodigramlist = ({ dao, db, validation }) => async (req, res) => {
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

const saveComponentconfiguration = ({ dao, db, validation }) => async (req, res) => {
    try {
        let body = req.body
        const session_userid = req.user.userid
        const result = await dao.saveComponentconfiguration({ db, validation })(body, session_userid);
        return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
        console.error("Error Component Configuration save data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};


const exportList = ({ dao, db }) => async (req, res) => {
    try {
        const session_userid = req.user.userid;

        const result = await dao.exportList({ db })(session_userid);

        res.status(200).send({
            statusCode: 200,
            message: "Scenario Export List",
            data: result
        });
    } catch (error) {
        console.error("Error fetching scenario export data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const createExport = ({ dao, db, validation }) => async (req, res) => {
    try {
        const body = req.body;
        const userid = req.user.userid;

        const result = await dao.createExport({ db, validation })(body, userid);

        if (result.statusCode === 200) {
            return res.status(200).send({
                statusCode: 200,
                message: validation.messages.save_success || "Scenario Export created successfully",
                exportid :  result.exportid,
                scenarioid :result.scenarioid,
            });
        } else {
            return res.status(400).send({
                statusCode: 400,
                message: result.errors || ["Something went wrong"],
            });
        }
    } catch (error) {
        console.error("Error creating Scenario Export:", error.message);
        return res.status(500).json({
            statusCode: 500,
            error: validation.messages.server_error,
        });
    }
};



const exportScenario = ({ dao, db }) => async (req, res) => {
  try {
    const { scenarioid, exportid } = req.body;

    const scenarioData = await dao.getScenarioById({ db })(scenarioid);
    if (!scenarioData) {
      return res.status(404).json({ message: "Scenario not found" });
    }

    const baseRoot = path.join(__dirname, "../../..");
    const tempZipDir = path.join(baseRoot, "temp_zip");

    fs.mkdirSync(tempZipDir, { recursive: true });

    const exportDir = path.join(tempZipDir, `scenario_${scenarioid}_${Date.now()}`);
    const assetsDir = path.join(exportDir, "assets");

    fs.mkdirSync(exportDir, { recursive: true });
    fs.mkdirSync(assetsDir, { recursive: true });

    // Copy JSON
    const jsonPath = path.join(exportDir, "scenario.json");
    fs.writeFileSync(jsonPath, JSON.stringify(scenarioData, null, 2));

    // (optional) safe copying logic for related files similar to earlier ...

    const zipName = `scenario_${scenarioid}_${Date.now()}.zip`;
    const zipPath = path.join(tempZipDir, zipName);

    

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
      await db.sequelize.query(
        `UPDATE scenario_export
         SET file_name = :file_name, status = 'Completed'
         WHERE exportid = :exportid`,
        {
          replacements: { file_name: zipName, exportid },
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Export completed",
        file_name: zipName,
        // downloadUrl: `/download/${fileName}`  
      });
    });

    archive.on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Archive error", error: err.message });
    });

    archive.pipe(output);
    archive.directory(exportDir, false);
    archive.finalize();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const getTabList = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getTabList({ db })(null);

    if (result && result.length > 0) {
      return res.status(200).send({
        statusCode: 200,
        message: "Scenario Tab List fetched successfully",
        data: result,
      });
    }

    return res.status(200).send({
      statusCode: 200,
      message: "No records found",
      data: [],
    });
  } catch (error) {
    console.error("Error fetching scenario tab list:", error);
    return res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error,
    });
  }
};


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
    exportList,
    exportScenario,
    createExport,
    getTabList,
}