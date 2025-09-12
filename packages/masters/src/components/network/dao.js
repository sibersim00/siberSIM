const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

 

const fetchAndStoreOVSNetworks =
  ({ db }) =>
  async (body, ipAddress) => {
    try {
      const proxmoxService = ProxMoxService(db, body, ipAddress);

      // Step 1: Try generating access token
      try {
        const tokenResult = await proxmoxService.generateAccessTicket();
        if (!tokenResult || !tokenResult.status) {
          // Notification when token generation fails
          new NotiTemplate(
            db,
            'proxmox_down',
            { learner_id: 0, userid: 0 },
            'System',
            0,
            'Proxmox Service is down. Please try again later.'
          );
           new MailTemplate(db, "proxmox_down_alert", {
          downdatetime: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });

          return {
            statusCode: 500,
            message: "Unable to connect to the server. Please check the Proxmox login credentials or network connection.",
          };
        }
      } catch (tokenError) {
        console.error("Token generation failed:", tokenError);

        // Notification when Proxmox is unreachable
        new NotiTemplate(
          db,
          'proxmox_down',
          { learner_id: 0, userid: 0 },
          'System',
          0,
          'Proxmox Service is down. Please try again later.'
        );
         new MailTemplate(db, "proxmox_down_alert", {
          downdatetime: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });

        return {
          statusCode: 500,
          message: "Unable to reach the Proxmox server. Please ensure the server is online and accessible.",
          error: tokenError.toString(),
        };
      }

      // Step 2: Get node network info
      const response = await proxmoxService.GetNodeNetworkInfo();
      if (!response || !response.data) {
        return {
          statusCode: 500,
          message: "Failed to fetch network details from the Proxmox server. Please try again later.",
        };
      }

      // Step 3: Process and sync networks
      const ovsBridges = response.data.filter((net) => net.type === "OVSBridge");
      await db.sequelize.query(
        `UPDATE networks SET issync = 'No' WHERE deletedon IS NULL AND status != 'Destroyed' AND issync = 'Yes';`
      );

      for (const net of ovsBridges) {
        const { iface } = net;

        const [existingRows] = await db.sequelize.query(
          `SELECT networkid FROM networks WHERE networkname = :networkname AND deletedon IS NULL AND status != 'Destroyed'`,
          {
            replacements: { networkname: iface },
          }
        );

        if (!existingRows.length) {
          await db.sequelize.query(
            `INSERT INTO networks (networkname, networkjson, issync, status, createdon)
             VALUES (:networkname, :networkjson, 'Yes', 'Available', CURRENT_TIMESTAMP)`,
            {
              replacements: {
                networkname: iface,
                networkjson: JSON.stringify(net),
              },
            }
          );
        } else {
          await db.sequelize.query(
            `UPDATE networks 
             SET networkjson = :networkjson, issync = 'Yes', modifiedon = CURRENT_TIMESTAMP 
             WHERE networkname = :networkname AND deletedon IS NULL AND status != 'Destroyed'`,
            {
              replacements: {
                networkname: iface,
                networkjson: JSON.stringify(net),
              },
            }
          );
        }
      }

      // Step 4: Mark unsynced networks as Destroyed
      await db.sequelize.query(
        `UPDATE networks SET status = 'Destroyed', deletedon = CURRENT_TIMESTAMP 
         WHERE issync = 'No' AND deletedon IS NULL AND status != 'Destroyed'`
      );

      // Step 5: Return updated list
      const [allNetworks] = await db.sequelize.query(
        `SELECT networkid, networkname, networkjson, issync, status, createdon 
         FROM networks 
         WHERE deletedon IS NULL 
         ORDER BY createdon DESC`
      );

      return allNetworks;
    } catch (error) {
      console.error("Error in fetchAndStoreOVSNetworks DAO:", error);
      new NotiTemplate(
        db,
        'proxmox_down',
        { learner_id: 0, userid: 0 },
        'System',
        0,
        'Proxmox Service is down. Please try again later.'
      );
       new MailTemplate(db, "proxmox_down_alert", {
          downdatetime: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });

      return {
        statusCode: 500,
        message: "An unexpected error occurred while syncing network data. Please try again or contact support.",
        error: error.toString(),
      };
    }
  };


const list =
  ({ db }) =>
  async () => {
    try {
      const [allNetworks] = await db.sequelize.query(
        `SELECT networkid, networkname, networkjson, issync, status, createdon, modifiedon
         FROM networks 
         WHERE deletedon IS NULL 
         ORDER BY createdon DESC`
      );

      return allNetworks;
    } catch (error) {
      console.error("Error on network list", error);
      throw error;
    }
  };


module.exports = {
  fetchAndStoreOVSNetworks,
  list,
};
