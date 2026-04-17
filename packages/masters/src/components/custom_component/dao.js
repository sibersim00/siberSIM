const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

const getAll =
  ({ db }) =>
  async () => {
    try {
      let [rows] = await db.sequelize.query(`
        SELECT   cc.customcomponentid,  cc.customcomponentuuid,  cc.componentname,  cc.componentcategoryid,  cc.clone_vmid,  cc.vmid,  cc.componenttype,  cc.duration,  cc.componentimage,  cc.status,  mcc.categoryname,  DATE_FORMAT(cc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,  DATE_FORMAT(cc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon,  comp.componentid AS main_componentid,  comp.componentuuid AS main_componentuuid,  comp.componentname AS main_componentname,  comp.network_ports AS main_network_ports,  comp.cores AS main_cores,  comp.memory AS main_memory,  comp.storage AS main_storage  FROM custom_component cc  LEFT JOIN component_categories mcc   ON mcc.componentcategoryid = cc.componentcategoryid  LEFT JOIN components comp   ON comp.vmid = cc.vmid  WHERE cc.deletedon IS Null ORDER BY cc.customcomponentid DESC;
      `);

      return rows;
    } catch (error) {
      console.error("Error fetching all custom components:", error);
      throw error;
    }
  };

const getById =
  ({ db }) =>
  async (customUUID) => {
    try {
      let result = await db.sequelize.query(
        `SELECT   cc.customcomponentid,  cc.customcomponentuuid,  cc.componentname,  cc.componentcategoryid,  cc.clone_vmid,  cc.master_vmid,  cc.vmid,  cc.componenttype,  cc.duration,  cc.componentimage,  cc.status,  mcc.categoryname,  DATE_FORMAT(cc.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,  DATE_FORMAT(cc.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon,  comp.componentid AS main_componentid,  comp.componentuuid AS main_componentuuid,  comp.componentname AS vmid_name,  comp.componenttype AS main_componenttype,  comp.network_ports AS main_network_ports,  comp.componentimage As main_componentimage,  comp.cores AS main_cores,  comp.memory AS main_memory,  comp.storage AS main_storage  FROM custom_component cc  LEFT JOIN component_categories mcc   ON mcc.componentcategoryid = cc.componentcategoryid  LEFT JOIN components comp ON comp.vmid = cc.master_vmid  WHERE cc.customcomponentuuid = :uuid  LIMIT 1`,
        {
          replacements: { uuid: customUUID },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!result || result.length === 0) return null;

      let record = result[0];

      // Convert JSON ports to readable format
      if (record.main_network_ports) {
        try {
          const portsObj = JSON.parse(record.main_network_ports);
          record.main_network_ports = Object.entries(portsObj)
            .map(([key, val]) => `${key} - ${val}`)
            .join("\n");
        } catch (err) {
          console.warn("Invalid JSON in network_ports");
        }
      }

      return record;
    } catch (error) {
      console.error("Error fetching custom component by ID:", error);
      throw error;
    }
  };

const updateStatus =
  ({ db }) =>
  async ({ customcomponentuuid, status }) => {
    try {
      // 1️⃣ Update component status
      await db.sequelize.query(
        `  UPDATE custom_component  SET   status = :status,  modifiedon = NOW()  WHERE customcomponentuuid = :customcomponentuuid
        `,
        {
          replacements: {
            status,
            customcomponentuuid,
          },
        }
      );

      // 2️⃣ Fetch component + learner details
      const [componentDetails] = await db.sequelize.query(
        `
          SELECT   cc.componentname,  l.firstname AS learner_name,  l.learner_id  FROM custom_component cc  JOIN learners l ON l.learner_id = cc.learner_id  WHERE cc.customcomponentuuid = :customcomponentuuid  LIMIT 1
  `,
        {
          replacements: { customcomponentuuid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      new NotiTemplate(
        db,
        "component_status_notification",
        {
          componenttitle: componentDetails.componentname,
          learner_name: componentDetails.learner_name,
          status, // Approved / Rejected
          learner_id: componentDetails.learner_id,
          userid: componentDetails.learner_id,
        },
        "Learner",
        componentDetails.learner_id
      );

      return true;
    } catch (error) {
      console.error("Error updating custom component:", error);
      throw error;
    }
  };

const save =
  ({ db, validation }) =>
  async (body, session_userid, ipAddress) => {
    console.log("vmTypfjdghfjhgfghe:", body);
    try {
      if (body.customcomponentid) {
        // Update custom component table
        await db.sequelize.query(
          `UPDATE custom_component  SET   componentname = :componentname,  componentcategoryid = :componentcategoryid,  componenttype = :subcategoryTypeid,  componentimage = :componentimage,  duration = :duration,  status = 'approved',  modifiedby = :modifiedby,  modifiedon = CURRENT_TIMESTAMP  WHERE customcomponentid = :customcomponentid
  `,
          {
            replacements: {
              customcomponentid: body.customcomponentid,
              componentname: body.componentname,
              componentcategoryid: body.componentcategoryid,
              subcategoryTypeid: body.subcategoryTypeid,
              componentimage: body.componentimage,
              duration: body.duration,
              modifiedby: session_userid,
            },
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );

        // Fetch VM details
        const vmDetailResponse = await vmDetails({ db })(body, ipAddress);

        console.log("vmDetailResponse", vmDetailResponse);
        const proxmoxData = vmDetailResponse?.data?.data || {};
        console.log("proxmoxData", proxmoxData);
        const extractStorage = () => {
          const qemuStorageKeys = [
            "sata0",
            "scsi0",
            "ide0",
            "virtio0",
            "nvme0",
            "usb0",
          ];
          const lxcStorageKey = "rootfs";
          const allKeys = [...qemuStorageKeys, lxcStorageKey];

          const foundKey = allKeys.find((key) =>
            Object.keys(proxmoxData).some((k) => k.toLowerCase() === key)
          );

          if (foundKey) {
            const key = Object.keys(proxmoxData).find(
              (k) => k.toLowerCase() === foundKey
            );
            const value = proxmoxData[key];
            const sizeMatch = value.match(/size=(\d+)([MG])/i);
            if (sizeMatch) return `${sizeMatch[1]}${sizeMatch[2]}`;
          }

          return null;
        };

        const extractNetworkPorts = () => {
          const ports = {};
          Object.entries(proxmoxData).forEach(([key, value]) => {
            if (key.startsWith("net")) {
              ports[key] = value;
            }
          });
          return ports;
        };

        const extractPortsPrefix = () => {
          const prefix = {};
          Object.entries(proxmoxData).forEach(([key, value]) => {
            if (!key.startsWith("net")) return;

            if (body.subcategoryTypeid.toLowerCase() === "qemu") {
              const typeMatch = value.match(/^(\w+)=/);
              if (typeMatch && typeMatch[1]) prefix[key] = typeMatch[1];
            } else {
              const nameMatch = value.match(/name=(eth\d+)/);
              if (nameMatch && nameMatch[1])
                prefix[key] = `name=${nameMatch[1]}`;
            }
          });
          return prefix;
        };

        // INSERT into components table (FULL)
        await db.sequelize.query(
          `INSERT INTO components (  componentuuid,  componentcategoryid,  componenttype,  vmid,  vmid_name,  componentname,  componentimage,  duration,  proxmox_json,  network_ports,  network_bridge_name,  cores,  storage,  memory,  createdby,  createdon,  status  ) VALUES (  UUID(),  :componentcategoryid,  :componenttype,  :vmid,  :vmid_name,  :componentname,  :componentimage,  :duration,  :proxmox_json,  :network_ports,  :network_bridge_name,  :cores,  :storage,  :memory,  :createdby,  CURRENT_TIMESTAMP,  'Active'  )
    `,
          {
            replacements: {
              componentcategoryid: body.componentcategoryid,
              componenttype: body.subcategoryTypeid,
              vmid: body.vmid,
              vmid_name: body.vmid_name,
              componentname: body.componentname,
              componentimage: body.componentimage,
              duration: body.duration || null,
              proxmox_json: JSON.stringify(proxmoxData),
              network_ports: JSON.stringify(extractNetworkPorts()),
              network_bridge_name: JSON.stringify(extractPortsPrefix()),
              cores: parseInt(proxmoxData.cores) || null,
              memory: parseInt(proxmoxData.memory) || null,
              storage: extractStorage(),
              createdby: session_userid,
            },
            type: db.sequelize.QueryTypes.INSERT,
          }
        );

        return {
          statusCode: 200,
          message: "validation.messages.add_success",
        };
      }
    } catch (error) {
      console.error("Error in save component:", error.message || error);
      throw error;
    }
  };

const update =
  ({ db, validation }) =>
  async (body, session_userid, ipAddress) => {
    try {
      if (!body.vmType && body.subcategoryTypeid) {
        body.vmType = body.subcategoryTypeid.toLowerCase(); // 'QEMU' -> 'qemu'
      }

      // Get updated siberSIM VM details
      const vmDetailResponse = await vmDetails({ db })(body, ipAddress);
      const proxmoxData = vmDetailResponse?.data || {};
      const vmConfig = proxmoxData.data || {};

      // Extract storage
      const extractStorage = () => {
        if (!vmConfig || typeof vmConfig !== "object") return null;

        const qemuStorageKeys = [
          "sata0",
          "scsi0",
          "ide0",
          "virtio0",
          "nvme0",
          "usb0",
        ];
        const lxcStorageKey = "rootfs";

        const allKeys = [...qemuStorageKeys, lxcStorageKey];
        const foundKey = allKeys.find((key) =>
          Object.keys(vmConfig).some((k) => k.toLowerCase() === key)
        );

        if (foundKey && vmConfig[foundKey]) {
          const value = vmConfig[foundKey];
          const sizeMatch = value.match(/size=(\d+)([MG])/i);
          if (sizeMatch) {
            return parseInt(sizeMatch[1], 10); // return size in MB or GB as number
          }
        }

        return null;
      };
      const extractNetworkPorts = () => {
        const ports = {};
        Object.entries(vmConfig).forEach(([key, value]) => {
          if (key.startsWith("net")) {
            ports[key] = value;
          }
        });
        return ports;
      };

      // Extract ports prefix for network_bridge_name
      const extractPortsPrefix = () => {
        const prefix = {};
        Object.entries(vmConfig).forEach(([key, value]) => {
          if (!key.startsWith("net")) return;

          if (body.vmType.toLowerCase() === "qemu") {
            const typeMatch = value.match(/^(\w+)=/);
            if (typeMatch && typeMatch[1]) {
              prefix[key] = typeMatch[1]; // e.g., virtio, e1000
            }
          } else if (body.vmType.toLowerCase() === "lxc") {
            const nameMatch = value.match(/name=(eth\d+)/);
            if (nameMatch && nameMatch[1]) {
              prefix[key] = `name=${nameMatch[1]}`;
            }
          }
        });
        return prefix;
      };

      const cores = vmConfig.cores ? parseInt(vmConfig.cores, 10) : null;
      const memory = vmConfig.memory ? parseInt(vmConfig.memory, 10) : null;
      const storage = extractStorage();
      const network_ports = JSON.stringify(extractNetworkPorts());
      const network_bridge_name = JSON.stringify(extractPortsPrefix());

      const updateQuery = `  UPDATE components   SET   vmid = :vmid,  vmid_name = :vmid_name,  componentimage = :componentimage,  componentname = :componentname,  componentcategoryid = :componentcategoryid,  componenttype = :componenttype,  duration = :duration,  proxmox_json = :proxmox_json,  network_ports = :network_ports,  network_bridge_name = :network_bridge_name,  cores = :cores,  storage = :storage,  memory = :memory,  modifiedby = :modifiedby,  modifiedon = CURRENT_TIMESTAMP  WHERE customcomponentid = :customcomponentid
      `;

      await db.sequelize.query(updateQuery, {
        replacements: {
          vmid: body.vmid,
          vmid_name: body.vmid_name,
          componentimage: body.componentimage,
          componentname: body.componentname,
          componentcategoryid: body.componentcategoryid,
          componenttype: body.subcategoryTypeid || null,
          duration: body.duration,
          proxmox_json: JSON.stringify(vmConfig),
          network_ports,
          network_bridge_name,
          cores,
          memory,
          storage,
          modifiedby: session_userid,
          componentid: body.componentid,
        },
        type: db.sequelize.QueryTypes.UPDATE,
      });

      return {
        statusCode: 200,
        message: validation.messages.update_success,
      };
    } catch (error) {
      console.error("Error updating component:", error);
      throw error;
    }
  };

const vmDetails =
  ({ db, validation }) =>
  async (body, ipAddress) => {
    try {
      const { vmType, vmid } = body;
      const proxmoxService = ProxMoxService(db, body, ipAddress);

      let response;

      try {
        await proxmoxService.generateAccessTicket();

        if (vmType === "lxc") {
          response = await proxmoxService.LXC_Container_detail(vmid);
        } else if (vmType === "qemu") {
          response = await proxmoxService.QEMU_VM_detail(vmid);
        } else {
          console.error("Invalid vmType:", vmType);
          return {
            statusCode: 400,
            message: "validation.messages.proxmox_type",
          };
        }
      } catch (proxmoxErr) {
        console.error("siberSIM Error:", proxmoxErr);

        // Send system notification on siberSIM failure
        new NotiTemplate(
          db,
          "proxmox_down",
          { learner_id: 0, userid: 0 },
          "System",
          0
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

        throw new Error("siberSIM is unreachable.");
      }

      return {
        statusCode: 200,
        data: response?.data || null,
      };
    } catch (err) {
      console.error("Error in DAO vmDetails:", err);
      throw err;
    }
  };

const getVms =
  ({ db }) =>
  async (body, ipAddress) => {
    try {
      const { componenttype, componentid } = body;
      const proxmoxService = ProxMoxService(db, body, ipAddress);

      let listResponse;
      let data = [];

      try {
        await proxmoxService.generateAccessTicket();

        if (componenttype === "QEMU") {
          listResponse = await proxmoxService.QEMU_List();
        } else if (componenttype === "LXC") {
          listResponse = await proxmoxService.LXC_List();
        } else {
          console.log("Error fetching: Unknown component type");
          return;
        }

        data = listResponse?.data || [];
      } catch (proxmoxErr) {
        console.error("siberSIM Error:", proxmoxErr);
        new NotiTemplate(
          db,
          "proxmox_down",
          { learner_id: 0, userid: 0 },
          "System",
          0
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
        throw new Error("siberSIM is unreachable.");
      }

      const vmidMap = new Map();
      let currentVMID = null;
      let currentVMName = "";
      if (componentid) {
        const existing = await db.sequelize.query(
          `SELECT vmid, vmid_name FROM components WHERE componentid = :cid`,
          {
            replacements: { cid: componentid },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (existing.length) {
          currentVMID = existing[0].vmid;
          currentVMName = existing[0].vmid_name || "";
        }
      }

      // Step 2: Filter the VM list
      for (const item of data) {
        const isCurrent = currentVMID !== null && item.vmid === currentVMID;

        if (item.template === 1 || isCurrent) {
          const dupQry = `
              SELECT COUNT(*) AS cnt  FROM components  WHERE vmid = :vmid AND componenttype = :ctype  AND deletedon IS NULL  AND (:cid IS NULL OR componentid != :cid)
          `;

          const [{ cnt }] = await db.sequelize.query(dupQry, {
            replacements: {
              vmid: item.vmid,
              ctype: componenttype,
              cid: componentid || null,
            },
            type: db.sequelize.QueryTypes.SELECT,
          });

          const isDuplicate = cnt > 0;

          if (!isDuplicate || isCurrent) {
            vmidMap.set(item.vmid, {
              ...item,
              componentname: item.vmid,
              subcategoryname: `${item.vmid} - ${
                isCurrent ? currentVMName : item.name
              }`,
            });
          }
        }
      }

      return Array.from(vmidMap.values());
    } catch (err) {
      console.error("Error in DAO getVms:", err);
      throw err;
    }
  };

module.exports = {
  getAll,
  getById,
  updateStatus,
  save,
  update,
  vmDetails,
  getVms,
};
