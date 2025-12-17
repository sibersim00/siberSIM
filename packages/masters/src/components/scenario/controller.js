const list = ({ dao, db }) => async (req, res) => {
    try {
        let usertype = req.user.usertype;         // e.g., "Admin" or "Instructor"
        let session_userid = req.user.userid;
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
        let body = req.body
        const session_userid = req.user.userid
        const result = await dao.deleteById({ db })(body, session_userid);
        res.status(200).send({ statusCode: 200, message: "Scenario Deleted Successfully" });
    } catch (error) {
        console.error("Error Scenario Deleting data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
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

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const exportScenario = ({ dao, db }) => async (req, res) => {
    try {
        const { scenarioid } = req.params;
        const scenario = await dao.getScenarioById({ db })(scenarioid);

        if (!scenario) {
            return res
                .status(404)
                .json({ statusCode: 404, message: "Scenario not found" });
        }

        const exportDir = path.join(__dirname, `../exports/scenario_${scenarioid}`);
        console.log("__dirname", __dirname)
        const assetsDir = path.join(exportDir, "assets");
        fs.mkdirSync(assetsDir, { recursive: true });

        // Save scenario JSON file
        const jsonPath = path.join(exportDir, "scenario_data.json");
        fs.writeFileSync(jsonPath, JSON.stringify(scenario, null, 2));

        // Set base uploads directory (your real storage)
        const baseDir = path.join(__dirname, "../uploads");

        // Helper function to safely copy files
        const copyFileSafe = (srcRelPath) => {
            if (!srcRelPath) return;

            // Remove leading '/uploads/' if present
            const cleanPath = srcRelPath.replace(/^\/?uploads[\\/]/, "");
            const srcPath = path.join(baseDir, cleanPath);

            console.log("Copying from:", srcPath);

            if (fs.existsSync(srcPath)) {
                const destPath = path.join(assetsDir, path.basename(srcRelPath));
                console.log("destPath", destPath)
                fs.copyFileSync(srcPath, destPath);
                console.log("Copied:", destPath);
            } else {
                console.warn("Missing file:", srcPath);
            }
        };

        // Copy scenario main image & instruction file
        copyFileSafe(scenario.scenarioimage);
        copyFileSafe(scenario.instruction_file);

        // Copy component images (if any)
        const componentImages = JSON.parse(scenario.component_images || "[]");
        componentImages.forEach((imgPath) => copyFileSafe(imgPath));

        // Create ZIP archive
        const zipPath = path.join(__dirname, `../exports/scenario_${scenarioid}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            console.log(` ZIP created: ${zipPath} (${archive.pointer()} bytes)`);

            // Send the ZIP for download
            res.download(zipPath, `scenario_${scenarioid}.zip`, (err) => {
                if (err) console.error("Download error:", err);

                // Cleanup temporary files after sending
                fs.rmSync(exportDir, { recursive: true, force: true });
                fs.unlinkSync(zipPath);
            });
        });

        archive.on("error", (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(exportDir, false);
        archive.finalize();
    } catch (err) {
        console.error("Export Scenario Error:", err);
        res
            .status(500)
            .json({ statusCode: 500, message: "Server Error", error: err.message });
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
    createExport
}