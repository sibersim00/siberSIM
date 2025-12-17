const MailTemplate = require("../../utils/mailUtility");
const serialLicense = require("../../middleware/serialLicense");
const customerList =
  ({ db }) =>
  async () => {
    const [res] = await db.sequelize.query(`
        SELECT 
          customerid AS customer_id,
          customeruuid,
          firstname,
          lastname,
          email,
          mobile,
          CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END AS status,
          DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
          DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
        FROM customers
        WHERE deletedon IS NULL
        ORDER BY firstname ASC;
      `);
    return res;
  };

const getById =
  ({ db }) =>
  async (customeruuid) => {
    try {
      //  Get customer details
      const customerQuery = `
          SELECT 
            customerid AS customer_id,
            customeruuid,
            firstname,
            lastname,
            CONCAT(firstname, ' ', lastname) AS customer_name,
            email,
            mobile,
            CASE WHEN status = 'Active' THEN 'true' ELSE 'false' END AS status,
            DATE_FORMAT(createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
            DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
          FROM customers
          WHERE customeruuid = ? AND deletedon IS NULL
          LIMIT 1;
        `;

      const [customerResult] = await db.sequelize.query(customerQuery, {
        replacements: [customeruuid],
      });

      if (!customerResult.length) return null;
      const customer = customerResult[0];

      // Return formatted final response
      return {
        ...customer,
      };
    } catch (error) {
      console.error("Error fetching customer by ID:", error.message);
      throw error;
    }
  };

const save =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const errors = [];

      // Duplicate check: Mobile
      if (body.mobile && body.mobile.trim() !== "") {
        const [existingMobile] = await db.sequelize.query(
          `SELECT customerid FROM customers WHERE mobile = :_mobile AND deletedon IS NULL`,
          {
            replacements: { _mobile: body.mobile.trim() },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (existingMobile) {
          errors.push(validation.messages.mobile_duplicate);
        }
      }

      // Duplicate check: Email
      if (body.email && body.email.trim() !== "") {
        const [existingEmail] = await db.sequelize.query(
          `SELECT customerid FROM customers WHERE email = :_email AND deletedon IS NULL`,
          {
            replacements: { _email: body.email.trim() },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (existingEmail) {
          errors.push(validation.messages.email_duplicate);
        }
      }

      //  If duplicates found → return
      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "" };
      }

      //  Insert Customer
      const insertQuery = `
      INSERT INTO customers (
        customeruuid, firstname, lastname, email, mobile, status, createdby, createdon
      ) VALUES (
        UUID(), :firstname, :lastname, :email, :mobile, 'Active', :createdby, CURRENT_TIMESTAMP
      )
    `;

      await db.sequelize.query(insertQuery, {
        replacements: {
          firstname: body.firstname?.trim() || null,
          lastname: body.lastname?.trim() || null,
          email: body.email?.trim() || null,
          mobile: body.mobile?.trim() || null,
          createdby: session_userid,
        },
      });

      return { statusCode: 200, message: validation.messages.add_success };
    } catch (error) {
      console.error("Error saving customer:", error.message);
      throw error;
    }
  };

const update =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const errors = [];

      // --- Check if customer exists ---
      const [existingCustomer] = await db.sequelize.query(
        `SELECT customerid FROM customers WHERE customerid = :_id AND deletedon IS NULL`,
        {
          replacements: { _id: body.customer_id },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existingCustomer) {
        return {
          statusCode: 404,
          message: validation.messages.data_not_found || "Customer not found.",
        };
      }

      // --- Duplicate check: Mobile ---
      if (body.mobile && body.mobile.trim() !== "") {
        const [existingMobile] = await db.sequelize.query(
          `SELECT customerid FROM customers 
             WHERE mobile = :_mobile 
             AND deletedon IS NULL 
             AND customerid != :_id`,
          {
            replacements: {
              _mobile: body.mobile.trim(),
              _id: body.customer_id,
            },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (existingMobile) {
          errors.push(validation.messages.mobile_duplicate);
        }
      }

      // --- Duplicate check: Email ---
      if (body.email && body.email.trim() !== "") {
        const [existingEmail] = await db.sequelize.query(
          `SELECT customerid FROM customers 
             WHERE email = :_email 
             AND deletedon IS NULL 
             AND customerid != :_id`,
          {
            replacements: { _email: body.email.trim(), _id: body.customer_id },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (existingEmail) {
          errors.push(validation.messages.email_duplicate);
        }
      }

      // --- Return errors if any ---
      if (errors.length > 0) {
        return { statusCode: 400, errors, message: "" };
      }

      // --- Update Query ---
      const updateQuery = `
          UPDATE customers
          SET firstname = :firstname,
              lastname = :lastname,
              email = :email,
              mobile = :mobile,
              status = :status,
              modifiedby = :modifiedby,
              modifiedon = CURRENT_TIMESTAMP
          WHERE customerid = :customer_id
        `;

      await db.sequelize.query(updateQuery, {
        replacements: {
          customer_id: body.customer_id,
          firstname: body.firstname?.trim() || null,
          lastname: body.lastname?.trim() || null,
          email: body.email?.trim() || null,
          mobile: body.mobile?.trim() || null,
          status: body.status?.trim() || "Active",
          modifiedby: session_userid,
        },
      });

      return {
        statusCode: 200,
        message:
          validation.messages.update_success ||
          "Customer updated successfully.",
      };
    } catch (error) {
      console.error("Error updating customer:", error.message);
      throw error;
    }
  };

const statusChange =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const status = body.status === "true" ? "Active" : "Inactive";

      // --- Check if the customer exists ---
      const [existingCustomer] = await db.sequelize.query(
        `SELECT customerid FROM customers WHERE customerid = ? AND deletedon IS NULL`,
        {
          replacements: [body.customer_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existingCustomer) {
        return {
          statusCode: 404,
          message: validation.messages.data_not_found || "Customer not found.",
        };
      }
      // --- Update customer status ---
      const updateQuery = `
          UPDATE customers 
          SET status = ?, 
              modifiedby = ?, 
              modifiedon = CURRENT_TIMESTAMP
          WHERE customerid = ?
        `;

      await db.sequelize.query(updateQuery, {
        replacements: [status, session_userid, body.customer_id],
        type: db.sequelize.QueryTypes.UPDATE,
      });

      return {
        statusCode: 200,
        message:
          validation.messages.status_change ||
          "Customer status updated successfully.",
      };
    } catch (error) {
      console.error("Error updating customer status:", error);
      throw error;
    }
  };

const getLicenseByCustomerId =
  ({ db }) =>
  async (customer_id) => {
    try {
      const query = `
          SELECT 
            customer_license_id,
            customer_license_uuid,
            customer_id,
            sim_user_count,
            DATE_FORMAT(start_date, '%Y-%m-%d %H:%i:%s') AS start_date,
            DATE_FORMAT(expiry_date, '%Y-%m-%d %H:%i:%s') AS expiry_date,
            license_key,
            domain_url,
            created_by,
            DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on,
            modifiedby,
            DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
          FROM customer_license
          WHERE customer_id = ?
          ORDER BY created_on DESC;
        `;

      const [result] = await db.sequelize.query(query, {
        replacements: [customer_id],
      });

      return result;
    } catch (error) {
      console.error("Error fetching customer license:", error.message);
      throw error;
    }
  };

const saveLicense =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      let license_key = serialLicense.generateLicense({
        start_date: body.start_date,
        user_count: body.sim_user_count,
        expiry_date: body.expiry_date,
        domain_name: body.domain_url,
      });

      const insertQuery = `
      INSERT INTO customer_license 
      (customer_license_uuid, customer_id, sim_user_count, start_date, expiry_date, license_key, domain_url, created_by, created_on) 
      VALUES 
      (UUID(), :customer_id, :sim_user_count, :start_date, :expiry_date, :license_key, :domain_url, :created_by, CURRENT_TIMESTAMP);
    `;

      await db.sequelize.query(insertQuery, {
        replacements: {
          customer_id: body.customer_id,
          sim_user_count: body.sim_user_count || 0,
          start_date: body.start_date || null,
          expiry_date: body.expiry_date || null,
          license_key: license_key,
          domain_url: body.domain_url || null,
          created_by: session_userid,
        },
      });

      const insertLogQuery = `
      INSERT INTO license_logs (license_key, createdby, createdon) 
      VALUES (:license_key, :createdby, CURRENT_TIMESTAMP);
    `;

      await db.sequelize.query(insertLogQuery, {
        replacements: {
          license_key: license_key,
          createdby: session_userid,
        },
      });
      const [formattedDates] = await db.sequelize.query(
        `SELECT 
            DATE_FORMAT(:start_date, '%d-%m-%Y') AS start_date,
            DATE_FORMAT(:expiry_date, '%d-%m-%Y') AS expiry_date`,
        {
          replacements: {
            start_date: body.start_date,
            expiry_date: body.expiry_date,
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      
      let payload = {
        customerid: body.customer_id,
        start_date: formattedDates.start_date,
        expiry_date: formattedDates.expiry_date,
        license_key: license_key,
        sim_user_count: body.sim_user_count,
      };
      
      new MailTemplate(db, "customer_license_mail", payload);

      return {
        statusCode: 200,
        message:
          validation.messages.add_license || "License added successfully.",
      };
    } catch (error) {
      console.error("Error saving customer license:", error.message);
      throw error;
    }
  };

const updateLicense =
  ({ db, validation }) =>
  async (body, session_userid) => {
    try {
      const errors = [];

      // ---- Check if license exists ----
      const [existingLicense] = await db.sequelize.query(
        `SELECT customer_license_id FROM customer_license WHERE customer_license_id = ?`,
        {
          replacements: [body.customer_license_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existingLicense) {
        return {
          statusCode: 404,
          message: validation.messages.data_not_found || "License not found.",
        };
      }

      let license_key = serialLicense.generateLicense({
        start_date: body.start_date,
        user_count: body.sim_user_count,
        expiry_date: body.expiry_date,
        domain_name: body.domain_url,
      });

      const updateQuery = `
      UPDATE customer_license
      SET 
        sim_user_count = :sim_user_count,
        start_date = :start_date,
        expiry_date = :expiry_date,
        license_key = :license_key,
        domain_url = :domain_url,
        modifiedby = :modifiedby,
        modifiedon = CURRENT_TIMESTAMP
      WHERE customer_license_id = :customer_license_id
    `;

      await db.sequelize.query(updateQuery, {
        replacements: {
          customer_license_id: body.customer_license_id,
          sim_user_count: body.sim_user_count || 0,
          start_date: body.start_date || null,
          expiry_date: body.expiry_date || null,
          license_key: license_key,
          domain_url: body.domain_url || null,
          modifiedby: session_userid,
        },
      });

      const insertLogQuery = `
      INSERT INTO license_logs (license_key, createdby, createdon) 
      VALUES (:license_key, :createdby, CURRENT_TIMESTAMP);
    `;

      await db.sequelize.query(insertLogQuery, {
        replacements: {
          license_key: license_key,
          createdby: session_userid,
        },
      });

      return {
        statusCode: 200,
        message:
          validation.messages.update_license ||
          "Customer license updated successfully.",
      };
    } catch (error) {
      console.error("Error updating customer license:", error.message);
      throw error;
    }
  };

const dashboardData =
  ({ db }) =>
  async () => {
    // 1. Total Customers
    const [total] = await db.sequelize.query(`
      SELECT COUNT(*) AS total_customers
      FROM customers
      WHERE deletedon IS NULL;
    `);

    // 2. Total Active Customers
    const [active] = await db.sequelize.query(`
      SELECT COUNT(*) AS total_active_customers
      FROM customers
      WHERE status = 'Active' AND deletedon IS NULL;
    `);

    // 3. Pending Customers
    const [pending] = await db.sequelize.query(`
      SELECT COUNT(*) AS pending_customers
      FROM customers c
      LEFT JOIN customer_license cl
        ON c.customerid = cl.customer_id
      WHERE cl.customer_id IS NULL
        AND c.deletedon IS NULL;
    `);

    // Always get latest license per customer
    const latestLicenseQuery = `
      SELECT
        c.customerid,
        CONCAT_WS(' ', c.firstname, c.lastname) AS customer_name,
        cl.start_date,
        cl.expiry_date,
        cl.domain_url,
        cl.license_key
      FROM customers c
      INNER JOIN (
        SELECT customer_id, MAX(expiry_date) AS latest_expiry
        FROM customer_license
        GROUP BY customer_id
      ) x ON x.customer_id = c.customerid
      INNER JOIN customer_license cl 
        ON cl.customer_id = x.customer_id 
       AND cl.expiry_date = x.latest_expiry
      WHERE c.deletedon IS NULL
    `;

    // 4. Expired Customers Count (based on LATEST expiry)
    const [expired] = await db.sequelize.query(`
      SELECT COUNT(*) AS expired_customers
      FROM (${latestLicenseQuery}) ll
      WHERE ll.expiry_date < CURDATE();
    `);

    // 5. Next 10 Days Expiring (based on LATEST expiry)
    const [nextExpiring] = await db.sequelize.query(`
      SELECT *
      FROM (${latestLicenseQuery}) ll
      WHERE ll.expiry_date >= CURDATE()
        AND ll.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 10 DAY)
      ORDER BY ll.expiry_date ASC;
    `);

    // 6. Expired List (based on LATEST expiry)
    const [expiredList] = await db.sequelize.query(`
      SELECT *
      FROM (${latestLicenseQuery}) ll
      WHERE ll.expiry_date < CURDATE()
      ORDER BY ll.expiry_date DESC;
    `);

    return {
      counts: {
        ...total[0],
        ...active[0],
        ...pending[0],
        ...expired[0],
      },
      next_expiring_list: nextExpiring,
      expired_list: expiredList,
    };
  };

const resendLicenseEmail =
  ({ db }) =>
  async (customer_license_id) => {
    try {
      // 1. Fetch license details
      const [licenseData] = await db.sequelize.query(
        `SELECT 
            customer_id,
            license_key,
            DATE_FORMAT(start_date, '%d-%m-%Y') AS start_date,
            DATE_FORMAT(expiry_date, '%d-%m-%Y') AS expiry_date, 
            sim_user_count
         FROM customer_license
         WHERE customer_license_id = ?`,
        {
          replacements: [customer_license_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      
      // 2. Prepare payload for mail
      const payload = {
        customerid: licenseData.customer_id,
        start_date: licenseData.start_date,
        expiry_date: licenseData.expiry_date,
        license_key: licenseData.license_key,
        sim_user_count: licenseData.sim_user_count,
      };
      
      // 3. Send mail
      new MailTemplate(db, "customer_license_mail", payload);

      return { success: true };
    } catch (error) {
      console.error("Error resending license email:", error.message);
      throw error;
    }
  };

module.exports = {
  customerList,
  getById,
  save,
  update,
  statusChange,
  getLicenseByCustomerId,
  saveLicense,
  updateLicense,
  dashboardData,
  resendLicenseEmail,
};
