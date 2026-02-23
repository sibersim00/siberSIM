
const exportMasters = ({ dao }) => async (req, res) => {
  try {
    const sqlString = await dao.exportMasters();
    const buffer = Buffer.from(sqlString, 'utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="masters_export.sql"');
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("Error exporting data:", err);
    res.status(500).json({ message: "Error exporting data", error: err.message });
  }
};

// -------- IMPORT --------
const importMasters = ({ dao, keys }) => async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const sqlBuffer = req.file.buffer;
    const sqlString = sqlBuffer.toString("utf8");
    console.log("Controller → Target DB (from env):", keys.MYSQL_DB);
    await dao.importMasters(sqlString);
    res.json({
      message: `Database import completed successfully into ${keys.MYSQL_DB}`,
    });
  } catch (err) {
    console.error("Error importing database:", err);
    res.status(500).json({
      message: "Error importing database",
      error: err.message,
    });
  }
};

module.exports = {
  exportMasters,
  importMasters,
};


