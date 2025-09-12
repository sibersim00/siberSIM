const axios = require("axios");
const constants = require("./constants");
const https = require("https");
const validator = require("validator");

function ProxMoxService(db, payload, ip_address) {
  let accessInfo = null;

  async function logApiRequest({
    api_end_point,
    vm_process,
    ip_address,
    request_datetime,
    response_datetime,
    response_code,
    response,
    request_payload,
    request_headers,
    duration,
  }) {
    try {
      const insertQuery = `
        INSERT INTO vm_logs
        (api_end_point,vm_process, ip_address, request_datetime, response_datetime, response_code, response, request_payload, request_headers, duration, createdon)
        VALUES (?, ?,?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await db.sequelize.query(insertQuery, {
        replacements: [
          api_end_point,
          vm_process,
          ip_address,
          request_datetime,
          response_datetime,
          response_code,
          JSON.stringify(response || {}),
          JSON.stringify(request_payload || {}),
          request_headers,
          duration,
        ],
        type: db.sequelize.QueryTypes.INSERT,
      });
    } catch (err) {
      console.error("Failed to log API request:", err);
    }
  }

  async function logApiRequestData(
    start,
    request_datetime,
    config,
    response_code,
    response,
    error = null,
    vm_process = null
  ) {
    const response_datetime = new Date();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    await logApiRequest({
      api_end_point: config.url,
      vm_process,
      ip_address,
      request_datetime,
      response_datetime,
      response_code,
      response: error ? error.toString() : response,
      request_payload: payload,
      request_headers: JSON.stringify(config.headers),
      duration,
    });
  }

  async function generateAccessTicket() {
    const start = Date.now();
    const request_datetime = new Date();

    const formData = new URLSearchParams();
    formData.append("username", constants.username);
    formData.append("password", constants.password);

    const config = {
      method: "post",
      url: `${constants.endpoint}/access/ticket`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      data: formData.toString(),
    };

    try {
      const response = await axios.request(config);
      const {
        data: { ticket, CSRFPreventionToken, username, cap },
      } = response.data;

      accessInfo = {
        ticket,
        CSRFPreventionToken,
        username,
        cookie: constants.cookie_prefix + ticket,
      };

      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.GENERATE_ACCESS_TICKET

      );

      return {
        status: "200",
        message: "Access ticket generated successfully.",
        data: { ticket, CSRFPreventionToken, username, cap },
      };
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();

      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.GENERATE_ACCESS_TICKET

      );

      return {
        status: "ERR",
        message: "Error: Unable to Generate Token",
      };
    }
  }
  async function QEMU_List() {
    if (!accessInfo?.cookie)
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/qemu`;

    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.QEMU_LIST
      );
      return response.data;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.QEMU_LIST
      );
      throw error;
    }
  }
  async function QEMU_VM_detail(vmid) {
    if (!accessInfo?.cookie) throw new Error("Access info not initialized.");

    const url = `${constants.endpoint}/nodes/${constants.current_node}/qemu/${vmid}/config`;
    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    const start = Date.now();
    const request_datetime = new Date();

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.QEMU_VM_DETAIL
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.QEMU_VM_DETAIL
      );
      throw error;
    }
  }
  async function LXC_List() {
    if (!accessInfo?.cookie) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/lxc`;

    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.LXC_LIST
      );
      return response.data;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.LXC_LIST
      );
      console.error("Error in listing LXC containers:", errorMessage);
      return null;
    }
  }
  async function LXC_Container_detail(vmid) {
    if (!accessInfo?.cookie) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/lxc/${vmid}/config`;

    const config = {
      method: "get",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null, // 👈 This is the `error` parameter
        constants.VM_PROCESSES.LXC_CONTAINER_DETAIL
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
         constants.VM_PROCESSES.LXC_CONTAINER_DETAIL
      );
      console.error(
        `Error in fetching container ${vmid} config:`,
        errorMessage
      );
      throw error;
    }
  }
  // ----------------------------VM Confugration Functions----------------------------------------

  async function cloneVM(vmType, newid, name, sourceVMID) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }
    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/${vmType}/${sourceVMID}/clone`;

    const params = new URLSearchParams();
    params.append("newid", newid);
    params.append("full", `${constants.full}`);
    if (vmType === "qemu") {
      params.append("name", name);
    } else {
      params.append("hostname", name);
    }

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: params.toString(),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.CLONE_VM
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.CLONE_VM
      );
      console.error("Error in cloning VM:", errorMessage);
      return false;
    }
  }

  async function configureVM(vmid, vmType, networkConfig = {}) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }
    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/${vmType}/${vmid}/config`;

    const params = new URLSearchParams();
    for (const [adapterKey, configStr] of Object.entries(networkConfig)) {
      params.append(adapterKey, configStr);
    }

    const config = {
      method: "put",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      data: params,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.CONFIGURE_VM
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.CONFIGURE_VM
      );
      console.error("Error in configuring VM:", errorMessage);
      return false;
    }
  }

  async function startVM(vmid, vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/${vmType}/${vmid}/status/start`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.START_VM
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.START_VM
      );
      console.error("Error in starting VM:", errorMessage);
      return false;
    }
  }

  async function stopVM(vmid, vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/${vmType}/${vmid}/status/stop`;

    const config = {
      method: "post",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.STOP_VM
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.STOP_VM
      );
      console.error("Error in stopping VM:", errorMessage);
      return null;
    }
  }

  async function destroyVM(vmid, vmType) {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }

    const start = Date.now();
    const request_datetime = new Date();
    const url = `${constants.endpoint}/nodes/${constants.current_node}/${vmType}/${vmid}`;

    const config = {
      method: "delete",
      url,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        CSRFPreventionToken: accessInfo.CSRFPreventionToken,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      data: "", // Required to prevent axios from omitting the body entirely
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.DESTROY_VM
      );
      return response;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.DESTROY_VM
      );
      console.error("Error in destroying VM:", errorMessage);
      return {
        status: errorCode,
        data: null,
        error: errorMessage,
      };
    }
  }

  async function GetNodeNetworkInfo() {
    if (!accessInfo?.cookie || !accessInfo?.CSRFPreventionToken) {
      throw new Error(
        "Access info not initialized. Call generateAccessTicket first."
      );
    }

    const start = Date.now();
    const request_datetime = new Date();

    const config = {
      method: "get",
      url: `${constants.endpoint}/nodes/${constants.current_node}/network`,
      headers: {
        Cookie: accessInfo.cookie,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    try {
      const response = await axios.request(config);
      await logApiRequestData(
        start,
        request_datetime,
        config,
        response.status.toString(),
        response.data,
        null,
        constants.VM_PROCESSES.NETWORK_INFO

      );
      return response.data;
    } catch (error) {
      const errorCode = error?.response?.status?.toString() || "ERR";
      const errorMessage = error?.response?.data || error.toString();
      await logApiRequestData(
        start,
        request_datetime,
        config,
        errorCode,
        errorMessage,
        error,
        constants.VM_PROCESSES.NETWORK_INFO

      );
      console.error(`Error fetching network info:`, errorMessage);
      return null;
    }
  }
  return {
    generateAccessTicket,
    QEMU_List,
    QEMU_VM_detail,
    LXC_List,
    LXC_Container_detail,
    cloneVM,
    configureVM,
    startVM,
    stopVM,
    destroyVM,
    GetNodeNetworkInfo,
  };
}

module.exports = ProxMoxService;
