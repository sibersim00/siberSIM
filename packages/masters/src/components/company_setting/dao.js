const mysql = require("mysql2/promise");
const mysqldump = require("mysqldump");

// -------- EXPORT --------
const exportMasters = async () => {
  try {
    const result = await mysqldump({
      connection: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
      },
      dump: {
        tables: [
          "components",
          "component_categories",
          "scenarios",
          "scenario_categories",
        ],
      },
    });

    // return SQL dump as string (schema + data)
    return result.dump.schema + result.dump.data;
  } catch (err) {
    console.error("Export error:", err);
    throw err;
  }
};

// -------- IMPORT --------
const importMasters = async (sqlString) => {
  let sql = sqlString;
  // Prevent duplicate key errors
  sql = sql.replace(/\bINSERT\b/gi, "INSERT IGNORE");

  const dbName = process.env.MYSQL_DB;
  console.log("DAO → Importing into DB:", dbName);

  // Ensure DB exists
  const rootConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
  });
  await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await rootConnection.end();

  // Connect to target DB
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: dbName,
    multipleStatements: true,
  });

  await connection.query(sql);
  await connection.end();

  return `Import successful into database ${dbName}`;
};

module.exports = {
  exportMasters,
  importMasters,
};
