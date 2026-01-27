// const getLicenseDashboardStats = ({ db }) => async ({ userid, usertype }) => {
//   try {
//     const [webSetting] = await db.sequelize.query(
//       `
//       SELECT license_key
//       FROM web_settings
//       WHERE status = 1
//       LIMIT 1
//       `,
//       { type: db.sequelize.QueryTypes.SELECT }
//     );

//     if (!webSetting?.license_key) {
//       return { licenseDashboard: null };
//     }

//     const licenseKey = webSetting.license_key;
//     const [customerLicense] = await db.sequelize.query(
//       `
//       SELECT customer_id
//       FROM customer_license
//       WHERE license_key = :licenseKey
//       ORDER BY created_on DESC
//       LIMIT 1
//       `,
//       {
//         replacements: { licenseKey },
//         type: db.sequelize.QueryTypes.SELECT,
//       }
//     );

//     let licenseOwnerName = "";

//     if (customerLicense?.customer_id) {
//       const [customer] = await db.sequelize.query(
//         `
//         SELECT firstname, lastname
//         FROM customers
//         WHERE customerid = :customerid
//           AND deletedon IS NULL
//         LIMIT 1
//         `,
//         {
//           replacements: { customerid: customerLicense.customer_id },
//           type: db.sequelize.QueryTypes.SELECT,
//         }
//       );

//       if (customer) {
//         licenseOwnerName = `${customer.firstname} ${customer.lastname || ""}`.trim();
//       }
//     }
//     let totalUserLicenses = 0;
//     const userMatch = licenseKey.match(/USL(\d+)/);
//     if (userMatch) {
//       totalUserLicenses = parseInt(userMatch[1], 10);
//     }
//     const [vmCount] = await db.sequelize.query(
//       `
//       SELECT COUNT(*) AS active_users
//       FROM vm_request
//       WHERE status = 'Start'
//         AND vm_steps = 'Running'
//       `,
//       { type: db.sequelize.QueryTypes.SELECT }
//     );

//     const activeConcurrentUsers = vmCount?.active_users || 0;
//     let licenseExpiryDate = null;
//     let expiryCountdownDays = null;

//     const expiryMatch = licenseKey.match(/E(\d{8})/);
//     if (expiryMatch) {
//       const dateStr = expiryMatch[1]; // YYYYMMDD

//       const year = Number(dateStr.substring(0, 4));
//       const month = Number(dateStr.substring(4, 6)) - 1;
//       const day = Number(dateStr.substring(6, 8));

//       licenseExpiryDate = new Date(Date.UTC(year, month, day));

//       const today = new Date();
//       const diffTime = licenseExpiryDate - today;
//       expiryCountdownDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     }
//     return {
//       licenseDashboard: {
//         licenseOwnerName,
//         totalUserLicenses,
//         activeConcurrentUsers: `${activeConcurrentUsers} / ${totalUserLicenses}`,
//         licenseExpiryDate: licenseExpiryDate
//           ? licenseExpiryDate.toISOString().split("T")[0]
//           : null,
//         licenseExpiryCountdown:
//           expiryCountdownDays !== null
//             ? `License expires in ${expiryCountdownDays} days`
//             : null,
//       },
//     };

//   } catch (error) {
//     console.error("DAO Error in getDashboardStats:", error.message);
//     throw error;
//   }
// };

// module.exports = {
//   getLicenseDashboardStats,
// };


const getLicenseDashboardStats = ({ db }) => async ({ userid, usertype, range = "today" }) => {
  try {

    /* =====================================================
       LICENSE DASHBOARD (Already Working – Kept As Is)
    ===================================================== */
    const [webSetting] = await db.sequelize.query(
      `
      SELECT license_key
      FROM web_settings
      WHERE status = 1
      LIMIT 1
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (!webSetting?.license_key) {
      return {};
    }

    const licenseKey = webSetting.license_key;

    /* -------- LICENSE OWNER -------- */
    const [customerLicense] = await db.sequelize.query(
      `
      SELECT customer_id
      FROM customer_license
      WHERE license_key = :licenseKey
      ORDER BY created_on DESC
      LIMIT 1
      `,
      {
        replacements: { licenseKey },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    let licenseOwnerName = "";
    if (customerLicense?.customer_id) {
      const [customer] = await db.sequelize.query(
        `
        SELECT firstname, lastname
        FROM customers
        WHERE customerid = :customerid
          AND deletedon IS NULL
        `,
        {
          replacements: { customerid: customerLicense.customer_id },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (customer) {
        licenseOwnerName = `${customer.firstname} ${customer.lastname || ""}`.trim();
      }
    }

    /* -------- USER LICENSE COUNT -------- */
    const userMatch = licenseKey.match(/USL(\d+)/);
    const totalUserLicenses = userMatch ? parseInt(userMatch[1], 10) : 0;

    /* -------- ACTIVE CONCURRENT USERS -------- */
    const [vmCount] = await db.sequelize.query(
      `
      SELECT COUNT(*) AS active_users
      FROM vm_request
      WHERE status = 'Start'
        AND vm_steps = 'Running'
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    /* -------- EXPIRY -------- */
    let licenseExpiryDate = null;
    let expiryCountdownDays = null;

    const expiryMatch = licenseKey.match(/E(\d{8})/);
    if (expiryMatch) {
      const d = expiryMatch[1];
      licenseExpiryDate = new Date(Date.UTC(d.substr(0,4), d.substr(4,2)-1, d.substr(6,2)));
      expiryCountdownDays = Math.ceil((licenseExpiryDate - new Date()) / (1000 * 60 * 60 * 24));
    }

    /* =====================================================
       LICENSE STATISTICS (NEW)
    ===================================================== */
    let peakUsageRows = [];
    let labels = [];
    let totalStarts = 0;
    let daysCount = 1;

    /* -------- TODAY -------- */
    if (range === "today") {
      labels = ["00-02","03-05","06-08","09-11","12-14","15-17","18-20","21-23"];

      peakUsageRows = await db.sequelize.query(
        `
        SELECT FLOOR(HOUR(startedon) / 3) AS bucket, COUNT(*) AS count
        FROM vm_request
        WHERE startedon >= CURDATE()
          AND startedon <= NOW()
          AND failedon IS NULL
        GROUP BY bucket
        `,
        { type: db.sequelize.QueryTypes.SELECT }
      );

      daysCount = 1;
    }

    /* -------- WEEK -------- */
    if (range === "week") {
      labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

      peakUsageRows = await db.sequelize.query(
        `
        SELECT DAYOFWEEK(startedon) - 2 AS bucket, COUNT(*) AS count
        FROM vm_request
        WHERE YEARWEEK(startedon, 1) = YEARWEEK(CURDATE(), 1)
          AND startedon <= NOW()
          AND failedon IS NULL
        GROUP BY bucket
        `,
        { type: db.sequelize.QueryTypes.SELECT }
      );

      daysCount = new Date().getDay() || 7;
    }

    /* -------- MONTH -------- */
    if (range === "month") {
      const today = new Date();
      daysCount = today.getDate();

      labels = Array.from({ length: daysCount }, (_, i) => `${i + 1}`);

      peakUsageRows = await db.sequelize.query(
        `
        SELECT DAY(startedon) - 1 AS bucket, COUNT(*) AS count
        FROM vm_request
        WHERE YEAR(startedon) = YEAR(CURDATE())
          AND MONTH(startedon) = MONTH(CURDATE())
          AND startedon <= NOW()
          AND failedon IS NULL
        GROUP BY bucket
        `,
        { type: db.sequelize.QueryTypes.SELECT }
      );
    }

    /* -------- NORMALIZE GRAPH DATA -------- */
    const values = Array(labels.length).fill(0);
    peakUsageRows.forEach(r => {
      if (values[r.bucket] !== undefined) {
        values[r.bucket] = r.count;
      }
      totalStarts += r.count;
    });

    const averageConcurrentUsagePerDay =
      daysCount > 0 ? Number((totalStarts / daysCount).toFixed(2)) : 0;

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */
    return {
      licenseDashboard: {
        licenseOwnerName,
        totalUserLicenses,
        activeConcurrentUsers: `${vmCount.active_users} / ${totalUserLicenses}`,
        licenseExpiryDate: licenseExpiryDate?.toISOString().split("T")[0],
        licenseExpiryCountdown: `License expires in ${expiryCountdownDays} days`,
      },

      licenseStatistics: {
        peakConcurrentUsage: {
          labels,
          values,
        },
        averageConcurrentUsagePerDay,
      },
    };

  } catch (error) {
    console.error("Dashboard DAO Error:", error.message);
    throw error;
  }
};

module.exports = {
  getLicenseDashboardStats,
};
