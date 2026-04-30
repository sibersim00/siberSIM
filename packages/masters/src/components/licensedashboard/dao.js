const getLicenseDashboardStats =
  ({ db }) =>
  async ({ userid, usertype, range = "today" }) => {
    try {
      const [webSetting] = await db.sequelize.query(
        `SELECT license_key FROM web_settings WHERE status = 1 LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      if (!webSetting?.license_key) return {};

      const licenseKey = webSetting.license_key;

      /* -------- LICENSE OWNER -------- */
      const [customerLicense] = await db.sequelize.query(
        `SELECT customer_id FROM customer_license WHERE license_key = :licenseKey ORDER BY created_on DESC LIMIT 1`,
        { replacements: { licenseKey }, type: db.sequelize.QueryTypes.SELECT },
      );

      let licenseOwnerName = "";
      let ownerStatus = "";
      if (customerLicense?.customer_id) {
        const [customer] = await db.sequelize.query(
          `SELECT firstname, lastname,status FROM customers WHERE customerid = :customerid AND deletedon IS NULL`,
          {
            replacements: { customerid: customerLicense.customer_id },
            type: db.sequelize.QueryTypes.SELECT,
          },
        );
        if (customer) {
          licenseOwnerName =
            `${customer.firstname} ${customer.lastname || ""}`.trim();
            ownerStatus=`${customer.status}`;
        }
        
      }

      /* -------- USER LICENSE COUNT -------- */
      const userMatch = licenseKey.match(/UL(\d+)/);
      const totalUserLicenses = userMatch ? parseInt(userMatch[1], 10) : 0;

      /* -------- ACTIVE CONCURRENT USERS -------- */

      const [vmCount] = await db.sequelize.query(
        `SELECT COUNT(*) AS active_users 
   FROM vm_request 
   WHERE vm_steps = 'Running'
     AND status IN ('Start', 'Resume')`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      /* -------- EXPIRY -------- */
      let licenseExpiryDate = null;
      let expiryCountdownDays = null;
      const expiryMatch = licenseKey.match(/E(\d{8})/);
      if (expiryMatch) {
        const d = expiryMatch[1];
        licenseExpiryDate = new Date(
          Date.UTC(d.substr(0, 4), d.substr(4, 2) - 1, d.substr(6, 2)),
        );
        expiryCountdownDays = Math.ceil(
          (licenseExpiryDate - new Date()) / (1000 * 60 * 60 * 24),
        );
      }

      /* ================================================
         ALWAYS FETCH ALL THREE — today / week / month
         Count: status='Start' OR status='Resume' OR vm_steps='Running'
      ================================================ */

      // ---------- TODAY (Status-wise breakdown) ----------
      const todayLabels = [
        "Start",
        "Resume",
        "Running",
        "Completed",
        "Failed",
        "Terminated",
        "Operation Failed",
        "Pause",
      ];

      const todayRows = await db.sequelize.query(
        `
  SELECT status, COUNT(*) AS count
  FROM vm_request
  WHERE DATE(startedon) = CURDATE()
  GROUP BY status
  `,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      const todayValues = Array(todayLabels.length).fill(0);

      todayRows.forEach((r) => {
        const index = todayLabels.indexOf(r.status);
        if (index !== -1) {
          todayValues[index] = Number(r.count);
        }
      });
      // ---------- WEEK (Mon–Sun of current week) ----------
      const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      const weekRows = await db.sequelize.query(
        `SELECT MOD(DAYOFWEEK(startedon) + 5, 7) AS bucket, COUNT(*) AS count
FROM vm_request
WHERE startedon IS NOT NULL
  AND YEARWEEK(startedon, 1) = YEARWEEK(CURDATE(), 1)
GROUP BY bucket`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      const weekValues = Array(7).fill(0);
      weekRows.forEach((r) => {
        if (weekValues[r.bucket] !== undefined) weekValues[r.bucket] = r.count;
      });

      // ---------- MONTH (Jan–Dec of current year) ----------
      const monthLabels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const monthRows = await db.sequelize.query(
        `SELECT MONTH(startedon) - 1 AS bucket, COUNT(*) AS count
FROM vm_request
WHERE startedon IS NOT NULL
  AND YEAR(startedon) = YEAR(CURDATE())
GROUP BY bucket`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      const monthValues = Array(12).fill(0);
      monthRows.forEach((r) => {
        if (monthValues[r.bucket] !== undefined)
          monthValues[r.bucket] = r.count;
      });

      /* -------- AVERAGES -------- */
      const todayTotal = todayValues.reduce((a, b) => a + b, 0);
      const weekTotal = weekValues.reduce((a, b) => a + b, 0);
      const monthTotal = monthValues.reduce((a, b) => a + b, 0);

      const todayDays = 1;
      const weekDays = new Date().getDay() || 7;
      const monthDays = new Date().getDate();

      /* -------- FAILED STARTS (range-based) -------- */
      const [failedScenario] = await db.sequelize.query(
        `SELECT COUNT(*) AS failed_count
         FROM scenario_failure_log
         ${
           range === "today"
             ? "WHERE DATE(createdon) = CURDATE()"
             : range === "week"
               ? "WHERE YEARWEEK(createdon, 1) = YEARWEEK(CURDATE(), 1)"
               : "WHERE MONTH(createdon) = MONTH(CURDATE()) AND YEAR(createdon) = YEAR(CURDATE())"
         }`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      /* -------- NEXT LAB SESSION -------- */
      const labSessionRows = await db.sequelize.query(
        `SELECT bookingname, datetime, duration , allowedusers
         FROM lab_sessions
         WHERE datetime >= NOW()
           AND status = 'Active'
           AND deletedon IS NULL
         ORDER BY datetime ASC
         LIMIT 1`,
        { type: db.sequelize.QueryTypes.SELECT },
      );

      const labData = labSessionRows[0];

    let allowedUsers = [];

try {
  const parsed = JSON.parse(labData?.allowedusers || "[]");
  allowedUsers = Array.isArray(parsed)
    ? parsed
    : String(parsed).split(",");
} catch {
  allowedUsers = [];
}

/* ===== GET LEARNER NAMES ===== */
let allowedUsersWithNames = [];

if (allowedUsers.length > 0) {
  const learners = await db.sequelize.query(
    `SELECT learner_id, firstname, lastname
     FROM learners
     WHERE learner_id IN (:ids)
     AND deletedon IS NULL`,
    {
      replacements: { ids: allowedUsers },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  allowedUsersWithNames = learners.map((l) => ({
    id: l.learner_id,
    name: `${l.firstname} ${l.lastname || ""}`.trim(),
  }));
}
      const realFailureCount = Number(failedScenario?.failed_count) || 0;

      /* -------- FINAL RESPONSE -------- */
      return {
        licenseDashboard: {
          licenseOwnerName,
          ownerStatus,
          totalUserLicenses,
          activeConcurrentUsers: `${vmCount.active_users} / ${totalUserLicenses}`,
          licenseExpiryDate: licenseExpiryDate
            ? `${String(licenseExpiryDate.getDate()).padStart(2, "0")}-${String(
                licenseExpiryDate.getMonth() + 1,
              ).padStart(2, "0")}-${licenseExpiryDate.getFullYear()}`
            : null,
          licenseExpiryCountdown: `License expires in ${expiryCountdownDays} days`,
        },
        licenseStatistics: {
          // Now three separate objects instead of one flat labels/values
          peakConcurrentUsage: {
            today: {
              labels: todayLabels,
              values: todayValues,
            },
            week: {
              labels: weekLabels,
              values: weekValues,
            },
            month: {
              labels: monthLabels,
              values: monthValues,
            },
          },
          averageConcurrentUsagePerDay: {
            today:
              todayDays > 0 ? Number((todayTotal / todayDays).toFixed(2)) : 0,
            week: weekDays > 0 ? Number((weekTotal / weekDays).toFixed(2)) : 0,
            month:
              monthDays > 0 ? Number((monthTotal / monthDays).toFixed(2)) : 0,
          },
          peakToday: Math.max(...todayValues),
          peakWeek: Math.max(...weekValues),
          peakMonth: Math.max(...monthValues),
          fullUsageCount: realFailureCount,
          noSeatsCount: realFailureCount,
          failedStartScenario: realFailureCount,
          labSession: labData
            ? {
                bookingName: labData.bookingname,
                duration: labData.duration,
                datetime: labData.datetime,
                allowedUsers: allowedUsersWithNames,
              }
            : null,
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
