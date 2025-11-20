const MailTemplate = require("../../utils/mailUtility");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

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
              replacements: { _mobile: body.mobile.trim(), _id: body.customer_id },
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
          message: validation.messages.update_success || "Customer updated successfully.",
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
          message: validation.messages.status_change || "Customer status updated successfully.",
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
            sim_mst_count,
            sim_investor_count,
            DATE_FORMAT(start_date, '%Y-%m-%d %H:%i:%s') AS start_date,
            DATE_FORMAT(expiry_date, '%Y-%m-%d %H:%i:%s') AS expiry_date,
            license_key,
            domain_url,
            created_by,
            DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on,
            modifiedby,
            DATE_FORMAT(modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
          FROM customer_license
          WHERE customer_id = ?;
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



const fakeEncrypt = (data) => {
  const json = JSON.stringify(data);
  const b64 = btoa(json);         // Encode to base64
  const reversed = b64.split("").reverse().join(""); // Light obfuscation
  return reversed;
};

const fakeDecrypt = (text) => {
  const unreversed = text.split("").reverse().join("");
  const json = atob(unreversed);
  return JSON.parse(json);
};

const cryptoEncrypt = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, keys.CRYPTO_SECURITY_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Encryption failed');
  }
};
const cryptoDecrypt = (data) => {
  try {
    if (!data) {
      return next(); // No payload present
    }
    const jsonString = data
    const bytes = CryptoJS.AES.decrypt(jsonString, keys.CRYPTO_SECURITY_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) throw new Error('Failed to decrypt payload');
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Decryption error:', error.message);
  }

};
const generateString1 = ({ db, key }) => async ({ user_count, master_count, investor_count, expiry_date, domain_name }) =>  {
  const encryptedDomain = fakeEncrypt(domain_name);
  console.log("encryptedDomain===>",encryptedDomain)
  return `~u${user_count}m${master_count}i${investor_count}ed${expiry_date.replace(/-/g, '')}~${encryptedDomain}`;
};
const parseEncryptedString1 = ({ db, key }) => async ({ str }) => {
  // remove leading "~"
  str = str.slice(1);
  // split at the "~" separating metadata and encrypted data
  const [meta, encryptedDomain] = str.split("~");
  // extract fields using regex
  const match = meta.match(/u(\d+)m(\d+)i(\d+)ed(\d{8})/);
  if (!match) throw new Error("Invalid format");
  const [, u, m, i, expiry] = match;
  // convert expiry back to dd-mm-yyyy
  const expiry_date = expiry.slice(0, 2) + "-" + expiry.slice(2, 4) + "-" + expiry.slice(4);

  return {
    user_count: Number(u),
    master_count: Number(m),
    investor_count: Number(i),
    expiry_date,
    domain_name : fakeDecrypt(encryptedDomain),
  };
}

const generateString = ({
  user_count,
  master_count,
  investor_count,
  expiry_date,
  domain_name
}) => {
  const encryptedDomain = fakeEncrypt(domain_name);
  const expiry = expiry_date.replace(/-/g, "");
  console.log("changesssss=====>",user_count,
  master_count,
  investor_count,
  expiry_date,
  domain_name)
  // Format: ~u12-m3-i9-e02112025~<encrypted>
  return `~u${user_count}-m${master_count}-i${investor_count}-e${expiry}~${encryptedDomain}`;
};

const parseEncryptedString = ({ db, key }) => async ({ str }) => {
  str = str.slice(1);

  const [meta, encryptedDomain] = str.split("~");

  const match = meta.match(/u(\d+)-m(\d+)-i(\d+)-e(\d{8})/);
  if (!match) throw new Error("Invalid format");

  const [, u, m, i, expiry] = match;

  const expiry_date =
    expiry.slice(0, 2) +
    "-" +
    expiry.slice(2, 4) +
    "-" +
    expiry.slice(4);

  return {
    user_count: Number(u),
    master_count: Number(m),
    investor_count: Number(i),
    expiry_date,
    domain_name: fakeDecrypt(encryptedDomain)
  };
};
  
const saveLicense = ({ db, validation }) =>
    async (body, session_userid) => {
      try {
        const errors = [];

        // ---- Check if customer exists ----
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
            message: validation.messages.customer_not_found || "Customer not found.",
          };
        }

        let license_key = generateString({
          user_count : body.sim_user_count,
        master_count : body.sim_mst_count,
        investor_count : body.sim_investor_count,
        expiry_date : body.expiry_date,
        domain_name : body.domain_url
      })

      console.log("license_keylicense_keylicense_keylicense_key",license_key)

        // ---- Insert Query ----
        const insertQuery = `
          INSERT INTO customer_license (customer_license_uuid, customer_id, sim_user_count,sim_mst_count,sim_investor_count, start_date, expiry_date, license_key, domain_url, created_by, created_on
          ) VALUES ( UUID(), :customer_id, :sim_user_count, :sim_mst_count, :sim_investor_count, :start_date,:expiry_date, :license_key, :domain_url,:created_by, CURRENT_TIMESTAMP
          );
        `;

        await db.sequelize.query(insertQuery, {
          replacements: {
            customer_id: body.customer_id,
            sim_user_count: body.sim_user_count || 0,
            sim_mst_count: body.sim_mst_count || 0,
            sim_investor_count: body.sim_investor_count || 0,
            start_date: body.start_date || null,
            expiry_date: body.expiry_date || null,
            license_key: license_key || null,
            domain_url: body.domain_url || null,
            created_by: session_userid
          },
        });

        return {
          statusCode: 200,
          message: validation.messages.add_success || "License added successfully.",
        };
      } catch (error) {
        console.error("Error saving customer license:", error.message);
        throw error;
      }
    };


const updateLicense = ({ db, validation }) =>
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
        let license_key = generateString({
          user_count : body.sim_user_count,
          master_count : body.sim_mst_count,
          investor_count : body.sim_investor_count,
          expiry_date : body.expiry_date,
          domain_name : body.domain_url
        })
        // ---- Update Query ----
        const updateQuery = `
          UPDATE customer_license
          SET 
            sim_user_count = :sim_user_count,
            sim_mst_count = :sim_mst_count,
            sim_investor_count = :sim_investor_count,
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
            sim_mst_count: body.sim_mst_count || 0,
            sim_investor_count: body.sim_investor_count || 0,
            start_date: body.start_date || null,
            expiry_date: body.expiry_date || null,
            license_key: license_key || null,
            domain_url: body.domain_url || null,
            modifiedby: session_userid,
          },
        });

        return {
          statusCode: 200,
          message:
            validation.messages.update_success ||
            "Customer license updated successfully.",
        };
      } catch (error) {
        console.error("Error updating customer license:", error.message);
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

};
