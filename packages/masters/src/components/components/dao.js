const ProxMoxService = require("../../services/proxmox/ProxMoxService");
const NotiTemplate = require("../../utils/notiUtility");
const MailTemplate = require("../../utils/mailUtility");

const getAll =
  ({ db }) =>
  async (id = null, ipAddress = null) => {
    try {
      let [components] = await db.sequelize.query(`
        SELECT 
          c.componentid,
          c.componentuuid,
          c.vmid,
          c.vmid_name,
          c.componentname,
          c.componentimage,
          c.componentcategoryid,
          c.componenttype,
          c.duration,
          c.memory,
          c.cores,
          c.storage,
          c.network_ports,
          mcc.categoryname,
          CASE 
            WHEN c.status = 'Active' THEN 'true'  
            ELSE 'false'  
          END AS status,
          DATE_FORMAT(c.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
         
          DATE_FORMAT(c.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
        FROM 
          components c
         JOIN component_categories mcc ON mcc.componentcategoryid = c.componentcategoryid
        WHERE 
          c.deletedon IS NULL
        GROUP BY c.componentid
        ORDER BY c.componentname ASC
      `);
      return components;
    } catch (error) {
      console.error("Error fetching all components:", error);
      throw error;
    }
  };

const statusChange =
  ({ db }) =>
  async (body) => {
    try {
      const updateQuery = ` UPDATE components SET status =?, modifiedon=CURRENT_TIMESTAMP,modifiedby=? WHERE componentid=?`;
      const queryParams = [
        body.status == "true" ? "Active" : "Inactive",
        body.userid,
        body.id,
      ];

      let [res] = await db.sequelize.query(updateQuery, {
        replacements: queryParams,
        type: db.sequelize.QueryTypes.UPDATE,
      });

      return {
        statusCode: 200,
        message: "Component Status Updated Successfully",
      };
    } catch (error) {
      console.error("Error System Config Submit:", error);
      throw error;
    }
  };

const getById =
  ({ db }) =>
  async (session_userid) => {
    try {
      let res = await db.sequelize.query(
        `SELECT 
          c.componentid,
          c.componentuuid,
          c.componentcategoryid,
          c.duration,
          c.componenttype,
          c.vmid,
          c.vmid_name,
          c.componentname,
          c.componentimage,
          c.proxmox_json,
          c.network_ports,
          c.cores,
          c.storage,
          c.memory,
          CASE 
            WHEN c.status = 'Active' THEN 'true'  
            ELSE 'false'  
          END AS status,
          c.createdon,
          c.modifiedon,
          mcc.categoryname AS categoryname
        FROM components c
        JOIN component_categories mcc ON mcc.componentcategoryid = c.componentcategoryid
        WHERE c.deletedon IS NULL AND c.componentuuid = :_id`,
        {
          replacements: { _id: session_userid },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!res || res.length === 0) {
        return null;
      }

      const component = res[0];

      if (component.network_ports) {
        try {
          const portsObj = JSON.parse(component.network_ports);

          const flattenedPorts = Object.entries(portsObj)
            .map(([key, value]) => `${key} - ${value}`)
            .join("\n");
          component.network_ports = flattenedPorts;
        } catch (e) {
          console.warn("Failed to parse network_ports JSON", e);
        }
      }
      return component;
    } catch (error) {
      console.error("Error fetching component by ID:", error);
      throw error;
    }
  };

const save =
  ({ db, validation }) =>
  async (body, session_userid, ipAddress) => {
    try {
      // Infer vmType if missing
      if (!body.vmType) {
        const subType = body.subcategoryTypeid?.toLowerCase();
        if (subType === "qemu") {
          body.vmType = "qemu";
        } else if (subType === "lxc") {
          body.vmType = "lxc";
        } else {
          throw new Error(
            "vmType is missing and subcategoryTypeid could not be mapped to 'lxc' or 'qemu'"
          );
        }
      }

      // Check for duplicate VMID
      const checkDuplicateQuery = `
        SELECT COUNT(*) as count 
        FROM components 
        WHERE vmid = :vmid AND status = 'Active'
      `;
      const [duplicateResult] = await db.sequelize.query(checkDuplicateQuery, {
        replacements: { vmid: body.vmid },
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (duplicateResult.count > 0) {
        return {
          statusCode: 409,
          message: `Component with VMID ${body.vmid} already exists.`,
        };
      }

      // Fetch VM details from Proxmox
      const vmDetailResponse = await vmDetails({ db })(body, ipAddress);
      const proxmoxData = vmDetailResponse?.data?.data || {};
      const vmConfig = proxmoxData || {};
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

        if (foundKey) {
          const key = Object.keys(vmConfig).find(
            (k) => k.toLowerCase() === foundKey
          );
          const value = vmConfig[key];
          const sizeMatch = value.match(/size=(\d+)([MG])/i);
          if (sizeMatch) {
            return `${sizeMatch[1]}${sizeMatch[2].toUpperCase()}`; // Example: "8GB"
          }
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

          if (body.vmType.toLowerCase() === "qemu") {
            // Extract prefix before '='
            const typeMatch = value.match(/^(\w+)=/);
            if (typeMatch && typeMatch[1]) {
              prefix[key] = typeMatch[1]; // e.g., virtio, e1000
            }
          } else if (body.vmType.toLowerCase() === "lxc") {
            // Extract eth name from value
            const nameMatch = value.match(/name=(eth\d+)/);
            if (nameMatch && nameMatch[1]) {
              prefix[key] = `name=${nameMatch[1]}`;
            }
          }
        });
        return prefix;
      };

      await db.sequelize.query(
        `
        INSERT INTO components (
          componentuuid,
          componentcategoryid,
          componenttype,
          vmid,
          vmid_name,
          componentname,
          componentimage,
          duration,
          proxmox_json,
          network_ports,
          network_bridge_name,
          cores,
          storage,
          memory,
          createdby,
          createdon,
          status
        ) VALUES (
          UUID(),
          :componentcategoryid,
          :componenttype,
          :vmid,
          :vmid_name,
          :componentname,
          :componentimage,
          :duration,
          :proxmox_json,
          :network_ports,
          :network_bridge_name,
          :cores,
          :storage,
          :memory,
          :createdby,
          CURRENT_TIMESTAMP,
          'Active'
        )
      `,
        {
          replacements: {
            componentcategoryid: body.componentcategoryid,
            componenttype: body.subcategoryTypeid || null,
            vmid: body.vmid,
            vmid_name: body.vmid_name,
            componentname: body.componentname,
            componentimage: body.componentimage,
            duration: body.duration,
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
        message: validation.messages.add_success,
      };
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

      // Get updated Proxmox VM details
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

      const updateQuery = `
        UPDATE components 
        SET 
          vmid = :vmid,
          vmid_name = :vmid_name,
          componentimage = :componentimage,
          componentname = :componentname,
          componentcategoryid = :componentcategoryid,
          componenttype = :componenttype,
          duration = :duration,
          proxmox_json = :proxmox_json,
          network_ports = :network_ports,
          network_bridge_name = :network_bridge_name,
          cores = :cores,
          storage = :storage,
          memory = :memory,
          modifiedby = :modifiedby,
          modifiedon = CURRENT_TIMESTAMP
        WHERE componentid = :componentid
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

const deleteById =
  ({ db }) =>
  async (body, session_userid) => {
    try {
      let [res] = await db.sequelize.query(
        `UPDATE components set deletedon=now(),modifiedby=:_userid where componentid=:_id`,
        {
          replacements: {
            _id: body.component_id,
            _userid: session_userid,
          },
        }
      );
      await db.sequelize.query(
        `UPDATE component_checklist_map
        SET deletedon = CURRENT_TIMESTAMP, modifiedon = CURRENT_TIMESTAMP
        WHERE componentid=:_id`,
        {
          replacements: { _id: body.component_id },
        }
      );
      return res;
    } catch (err) {
      console.error("Error in DAO Delete:", err);
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
        console.error("Proxmox Error:", proxmoxErr);
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
        throw new Error("Proxmox is unreachable.");
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
            SELECT COUNT(*) AS cnt
            FROM components
            WHERE vmid = :vmid AND componenttype = :ctype
              AND deletedon IS NULL
              AND (:cid IS NULL OR componentid != :cid)
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
            message: validation.messages.proxmox_type,
          };
        }
      } catch (proxmoxErr) {
        console.error("Proxmox Error:", proxmoxErr);

        // Send system notification on Proxmox failure
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

        throw new Error("Proxmox is unreachable.");
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

const fetchAndStoreOVSNetworks =
  ({ db }) =>
  async (body, ipAddress) => {
    try {
      const proxmoxService = ProxMoxService(db, body, ipAddress);

      let response;

      try {
        await proxmoxService.generateAccessTicket();
        response = await proxmoxService.GetNodeNetworkInfo();
      } catch (proxmoxErr) {
        console.error("Proxmox Error:", proxmoxErr);

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

        throw new Error("Proxmox is unreachable.");
      }

      if (!response || !response.data) {
        return {
          statusCode: 500,
          message: "Failed to retrieve network data from Proxmox",
        };
      }

      const ovsBridges = response.data.filter(
        (net) => net.type === "OVSBridge"
      );
      const inserted = [];

      for (const net of ovsBridges) {
        const { iface } = net;

        const [res] = await db.sequelize.query(
          `INSERT INTO networks (networkname, networkjson, status, createdby, createdon)
           VALUES (:networkname, :networkjson, 'Active', :createdby, CURRENT_TIMESTAMP)`,
          {
            replacements: {
              networkname: iface,
              networkjson: JSON.stringify(net),
              createdby: body?.userId || null,
            },
          }
        );

        inserted.push({ networkname: iface });
      }

      return {
        statusCode: 200,
        message: "OVSBridge networks fetched and saved successfully",
        data: inserted,
      };
    } catch (error) {
      console.error("Error in fetchAndStoreOVSNetworks DAO:", error);

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

      return {
        statusCode: 500,
        message: "Failed to fetch or save networks",
        error: error.toString(),
      };
    }
  };

module.exports = {
  getAll,
  update,
  deleteById,
  getById,
  statusChange,
  save,
  getVms,
  vmDetails,
  fetchAndStoreOVSNetworks,
};
