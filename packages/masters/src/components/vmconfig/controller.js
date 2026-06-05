const axios = require("axios");
const keys = require("../../keys");
const FormData = require("form-data");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;

const updateCompleteTerminate =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/update-complete-terminate`,
          { vmrequestid, status, type },
        );
        return res
          .status(200)
          .send({
            statusCode: 200,
            message: response.data.message || "Job Updated successfully.",
            data: response.data,
          });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
          console.error("Headers:", error.response.headers);
        } else if (error.request) {
          console.error("No Response:");
          console.error(error.request);
        } else {
          console.error("Request Setup Error:", error.message);
        }
      }
    } catch (err) {
      console.error("Error in setting scenario learner configuration:", err);
      next(err);
    }
  };

const stopAndDestroyFailedScenarios =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.stopAndDestroyFailedScenarios({
        db,
        ipAddress,
      })();

      if (!result.success) {
        return res
          .status(500)
          .send({ statusCode: 500, message: result.message });
      }

      return res.status(200).send({ statusCode: 200, message: result.message });
    } catch (err) {
      console.error("Error in stopAndDestroyFailedScenarios:", err);
      next(err);
    }
  };

const stopAndDestroyFailedEvents =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.stopAndDestroyFailedEvents({ db, ipAddress })();

      if (!result.success) {
        return res
          .status(500)
          .send({ statusCode: 500, message: result.message });
      }

      return res.status(200).send({ statusCode: 200, message: result.message });
    } catch (err) {
      console.error("Error in stopAndDestroyFailedEvents:", err);
      next(err);
    }
  };

const generateProxmoxAccessToken =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const payload = req.body;
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const result = await dao.generateProxmoxAccessToken({ db, payload })(
        ipAddress,
      );

      res.status(result.statusCode || 500).json(result);
    } catch (err) {
      console.error("Error generating siberSIM token:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

const getOperationFailedLogs =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const result = await dao.getOperationFailedLogs({ db })();

      return res.status(200).send({
        statusCode: 200,
        message: "Logs Fetched Successfully",
        data: result,
      });
    } catch (err) {
      console.error("Error in getOperationFailedLogs:", err.message);
      return res.status(500).send({
        statusCode: 500,
        message: "Error in Fetching Logs",
      });
    }
  };

const getEventOperationFailedLogs =
  ({ dao, db, validation }) =>
  async (req, res, next) => {
    try {
      const result = await dao.getEventOperationFailedLogs({ db })();

      return res.status(200).send({
        statusCode: 200,
        message: "Event Logs Fetched Successfully",
        data: result,
      });
    } catch (err) {
      console.error("Error in getEventOperationFailedLogs:", err.message);
      return res.status(500).send({
        statusCode: 500,
        message: "Error in Fetching Event Logs",
      });
    }
  };

const getSnapshotsByVmid =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { vmid } = req.body;
      if (!vmid) {
        return res.status(400).send({
          statusCode: 400,
          message: "vmid is required.",
        });
      }
      const result = await dao.getSnapshotsByVmid({ db })(vmid);
      return res.status(200).send({
        statusCode: 200,
        message: "Snapshots fetched successfully.",
        data: result,
      });
    } catch (err) {
      console.error("Error fetching snapshots:", err);
      next(err);
    }
  };

const triggerExport = () => async (req, res) => {
  try {
    const { scenarioid, exportid } = req.body;
    const file_name = `scenario_${scenarioid}.zip`;
    const response = await axios.post(
      `${EVENTLEARNER_API_URL}/vmconfigs/trigger-export`,
      { scenarioid, exportid, file_name },
      { responseType: "stream" }, // <--- important
    );

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=scenario_${scenarioid}.zip`,
    );

    response.data.pipe(res); // stream ZIP to frontend
  } catch (err) {
    console.error("Export Scenario Error:", err);
    res
      .status(500)
      .json({ message: "Failed to export scenario", error: err.message });
  }
};


const save =
  ({}) =>
  async (req, res, next) => {
    try {
      const payload = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/save`,
          payload,
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data?.message,
          data: response.data,
        });
      } catch (error) {
        console.error(
          "Axios Request Failed:",
          error.response?.data || error.message,
        );

        return res.status(error.response?.status || 500).send({
          statusCode: error.response?.data?.statusCode || 500,
          message: error.response?.data?.message || "Something went wrong.",
          error: error.response?.data?.error,
        });
      }
    } catch (err) {
      console.error("Error in event learner:", err);
      next(err);
    }
  };

const deleteScenarioLearner =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, status, type } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-scenario-learner`,
          { vmrequestid, status, type },
        );
        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in starting event learner:", err);
      next(err);
    }
  };
const addScenarioVmNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/add-vm-network`,
          { vmid, vmType, netKey },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in add scenario network:", err);
      next(err);
    }
  };
const deleteScenarioVmNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmid, vmType, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-vm-network`,
          { vmid, vmType, netKey },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in delete scenario network:", err);
      next(err);
    }
  };
const ModifyScenarioVmNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const {
            vmid,
            Targetvmid,
            netKey,
            mode,
            source,
            sourceHandle,
            target,
            targetHandle,
            label,
            staticVmbr
      } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/modify-vm-network`,
          {
            vmid,
            Targetvmid,
            netKey,
            mode,
            source,
            sourceHandle,
            target,
            targetHandle,
            label,
            staticVmbr
          },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in modify scenario network:", err);
      next(err);
    }
  };
const addRuntimeComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, scenarioid, newNode } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/add-single-component`,
          { vmrequestid, scenarioid, newNode },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in add runtime component:", err);
      next(err);
    }
  };
const stopDestroySingleComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid,vmbrList } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-single-network`,
          { vmrequestid, vmid,vmbrList },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in stop destroy single componnet:", err);
      next(err);
    }
  };
const disconnectRuntimeNetworks =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/disconnect-single-network`,
          { vmrequestid, vmid, netKey },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in disconnect runtime network:", err);
      next(err);
    }
  };
const connectRuntimeNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/connect-single-network`,
          { vmrequestid, vmid, netKey },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in connect runtime networkr:", err);
      next(err);
    }
  };
const plugRuntimeNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/plug-single-network`,
          { vmrequestid, vmid, netKey },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in plug runtime network:", err);
      next(err);
    }
  };
const unplugRuntimeNetwork =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid, netKey } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/unplug-single-network`,
          { vmrequestid, vmid, netKey },
        );

        return res.status(200).send({
          statusCode: 200,
          message: response.data.message || "Job started successfully.",
          data: response.data,
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";

        return res.status(statusCode).send({
          statusCode,
          message,
        });
      }
    } catch (err) {
      console.error("Error in unplug runtime network:", err);
      next(err);
    }
  };

const triggerImport =
  ({}) =>
  async (req, res, next) => {
    try {
      const FormData = require("form-data");

      const form = new FormData();
      form.append("zipfile", req.file.buffer, {
        filename:    req.file.originalname,
        contentType: "application/zip",
      });
      form.append("userid", req.body.userid || "2");
      if (req.body.customIdentification) {
        form.append("customIdentification", req.body.customIdentification);
      }

      const response = await axios.post(
        `${EVENTLEARNER_API_URL}/vmconfigs/trigger-import`,
        form,
        {
          headers:          form.getHeaders(),   // ← fixed: was formData.getHeaders()
          maxBodyLength:    Infinity,             // ← now in the right place
          maxContentLength: Infinity,
        }
      );

      return res.status(200).send({
        statusCode: 200,
        message: response.data.message || "Import started successfully.",
        data:    response.data,
      });

    } catch (err) {
      const statusCode = err.response?.status  || 500;
      const message    = err.response?.data?.message || err.message || "Something went wrong";
      console.error("Error in triggerImport:", message);
      return res.status(statusCode).send({ statusCode, message });
    }
  };

const getImportList =
  ({}) =>
  async (req, res, next) => {
    try {
      try {
        const response = await axios.get(
          `${EVENTLEARNER_API_URL}/vmconfigs/import-list`,
          { params: { userid: req.query.userid || 2 } },
        );

        return res.status(200).send({
          statusCode: 200,
          message: "Import list fetched successfully.",
          data: response.data?.data || [],
        });
      } catch (error) {
        console.error("Axios request failed:");
        if (error.response) {
          console.error("Response Error:");
        } else {
          console.error("Request Setup Error:", error.message);
        }
        const statusCode = error.response?.status || 500;
        const message    = error.response?.data?.message || error.message || "Something went wrong";

        return res.status(statusCode).send({ statusCode, message });
      }
    } catch (err) {
      console.error("Error in get import list:", err);
      next(err);
    }
  };

const checkScenarioIdentification = ({}) => async (req, res, next) => {
  try {
    const FormData = require("form-data");
    const formData = new FormData();

    formData.append("zipfile", req.file.buffer, {
      filename:    req.file.originalname,
      contentType: req.file.mimetype || "application/zip",
    });

    if (req.body.customIdentification) {
      formData.append("customIdentification", req.body.customIdentification);
    }

    const response = await axios.post(
      `${EVENTLEARNER_API_URL}/vmconfigs/check-import`,
      formData,
      {
        headers:          formData.getHeaders(),
        maxBodyLength:    Infinity,
        maxContentLength: Infinity,
      }
    );

    return res.status(200).send({
      statusCode: 200,
      message: "Scenario identification checked successfully.",
      ...response.data,
    });

  } catch (error) {
    const statusCode = error.response?.status || 500;
    const message    = error.response?.data?.message || error.message || "Something went wrong";
    return res.status(statusCode).send({ statusCode, message });
  }
};
const getImportStatus = ({}) => async (req, res, next) => {
  try {
    const { importid } = req.params;

    const response = await axios.get(
      `${EVENTLEARNER_API_URL}/vmconfigs/import/${importid}`,
    );

    return res.status(200).send({
      statusCode: 200,
      message:    "Import status fetched successfully.",
      ...response.data,
    });
  } catch (error) {
    const statusCode = error.response?.status  || 500;
    const message    = error.response?.data?.message || error.message || "Something went wrong";
    return res.status(statusCode).send({ statusCode, message });
  }
};

const downloadExport = () => async (req, res) => {
  try {
    const exportid  = req.body?.exportid  || req.query?.exportid;
    const scenarioid = req.body?.scenarioid || req.query?.scenarioid;

    const response = await axios.get(
      `${EVENTLEARNER_API_URL}/vmconfigs/download-export-zip`,
      {
        params:       { exportid },
        responseType: "stream",
      },
    );

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=scenario_${scenarioid}.zip`);
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.pipe(res);
  } catch (err) {
    console.error("downloadExport Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to download export", error: err.message });
    }
  }
};

// const downloadComponent = () => async (req, res) => {
//   try {
//     const exportid  = req.body?.exportid  || req.query?.exportid;
//     const file_name = req.body?.file_name || req.query?.file_name;

//     const response = await axios.get(
//       `${EVENTLEARNER_API_URL}/vmconfigs/download-component`,
//       {
//         params:       { exportid, file_name },
//         responseType: "stream",
//       },
//     );

//     const fileName = file_name.split("/").pop();

//     res.setHeader("Content-Type", "application/octet-stream");
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     if (response.headers["content-length"]) {
//       res.setHeader("Content-Length", response.headers["content-length"]);
//     }

//     response.data.pipe(res);
//   } catch (err) {
//   const status = err?.response?.status || 500;
//   const upstreamData = err?.response?.data;

//   if (upstreamData) {
//     // upstream returned a stream (responseType: "stream") — read it first
//     const chunks = [];
//     upstreamData.on("data", (chunk) => chunks.push(chunk));
//     upstreamData.on("end", () => {
//       let body = {};
//       try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch {}
//       console.error("downloadComponent upstream error:", body);
//       if (!res.headersSent) {
//         res.status(status).json({ message: body?.message || err.message });
//       }
//     });
//     upstreamData.on("error", () => {
//       if (!res.headersSent) {
//         res.status(status).json({ message: err.message });
//       }
//     });
//   } else {
//     if (!res.headersSent) {
//       res.status(status).json({ message: err.message });
//     }
//   }
// }
// };


const downloadComponent = () => async (req, res) => {
  try {
    const exportid  = req.body?.exportid  || req.query?.exportid;
    const file_name = req.body?.file_name || req.query?.file_name;

    const response = await axios.get(
      `${EVENTLEARNER_API_URL}/vmconfigs/download-component`,
      {
        params:       { exportid, file_name },
        responseType: "stream",
      },
    );

    const fileName = file_name.split("/").pop();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.pipe(res);

  } catch (err) {
    const status = err?.response?.status || 500; // ← forwards 400 from jobs as-is
    const upstreamData = err?.response?.data;

    if (upstreamData) {
      const chunks = [];
      upstreamData.on("data", (chunk) => chunks.push(chunk));
      upstreamData.on("end", () => {
        let body = {};
        try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch {}
        console.error("downloadComponent upstream error:", body);
        if (!res.headersSent) {
          res.status(status).json({ message: body?.message || err.message }); // ← status is 400 now
        }
      });
      upstreamData.on("error", () => {
        if (!res.headersSent) {
          res.status(status).json({ message: err.message });
        }
      });
    } else {
      if (!res.headersSent) {
        res.status(status).json({ message: err.message });
      }
    }
  }
};
 
  const uploadComponentZst =
  ({}) =>
  async (req, res, next) => {
    try {
      console.log("req.body =", req.body);
      console.log("readableEnded =", req.readableEnded);
      console.log("complete =", req.complete);
      const { importid, vmFile } = req.query;

      if (!importid) return res.status(400).send({ statusCode: 400, message: "importid is required." });
      if (!vmFile)   return res.status(400).send({ statusCode: 400, message: "vmFile is required." });

      const contentLength = req.headers["content-length"];
      console.log(`[Master] Forwarding ${vmFile} | Size: ${contentLength}`);
      req.on("data", (chunk) => {
        console.log("[MASTER] chunk", chunk.length);
      });  
      const response = await axios.post(
      `${EVENTLEARNER_API_URL}/vmconfigs/upload-zst`,
      req.body,                              // ← 2nd arg: the body (pipe req stream directly)
      {                                 // ← 3rd arg: the config object
        params: { importid, vmFile },
        headers: {
          "Content-Type":   "application/octet-stream",
          "authorization":  req.headers.authorization || "",
          "content-length": req.headers["content-length"], // ← forward original size!
          "connection":     "keep-alive",
        },
        maxBodyLength:    Infinity,
        maxContentLength: Infinity,
        transformRequest: [(data) => data],
        timeout:          0,
      },
    );

      return res.status(200).send({
        statusCode: 200,
        message:    response.data.message || "File received. Transfer started.",
        data:       response.data,
      });

    } catch (err) {
      const statusCode = err.response?.status || 500;
      const message    = err.response?.data?.message || err.message;
      console.error("[Master] uploadComponentZst error:", message);
      return res.status(statusCode).send({ statusCode, message });
    }
  };



const startRestore =
  ({}) =>
  async (req, res, next) => {
    try {
      const { importid, vmFiles ,storage} = req.body;
      if (!importid) {
        return res.status(400).send({ statusCode: 400, message: "importid is required." });
      }
      const response = await axios.post(
        `${EVENTLEARNER_API_URL}/vmconfigs/start-restore`,
        {
          importid,
          vmFiles,
          storage,
        },
        {
          headers: {
            authorization: req.headers.authorization || "",
          },
          maxBodyLength:    Infinity,
          maxContentLength: Infinity,
        },
      );

      return res.status(200).send({
        statusCode: 200,
        message: response.data.message || "Restore job started.",
        data: response.data,
      });

    } catch (err) {
      const statusCode = err.response?.status || 500;
      const message    = err.response?.data?.message || err.message || "Something went wrong";
      console.error("Error in startRestore:", message);
      return res.status(statusCode).send({ statusCode, message });
    }
  };




  const getZstUploadStatus =
  ({}) =>
  async (req, res, next) => {
    try {
      const { importid } = req.query;
      if (!importid) return res.status(400).send({ statusCode: 400, message: "importid is required." });

      const response = await axios.get(
        `${EVENTLEARNER_API_URL}/vmconfigs/zst-status`,
        {
          params:  { importid },
          headers: { authorization: req.headers.authorization || "" },
        },
      );

      return res.status(200).send({
        statusCode: 200,
        data:       response.data.data,
      });

    } catch (err) {
      const statusCode = err.response?.status || 500;
      const message    = err.response?.data?.message || err.message;
      console.error("[Master] getZstUploadStatus error:", message);
      return res.status(statusCode).send({ statusCode, message });
    }
  };

module.exports = {
  updateCompleteTerminate,
  generateProxmoxAccessToken,
  stopAndDestroyFailedScenarios,
  getOperationFailedLogs,
  stopAndDestroyFailedEvents,
  getEventOperationFailedLogs,
  getSnapshotsByVmid,
  save,
  deleteScenarioLearner,
  addScenarioVmNetwork,
  deleteScenarioVmNetwork,
  ModifyScenarioVmNetwork,
  addRuntimeComponent,
  stopDestroySingleComponent,
  disconnectRuntimeNetworks,
  connectRuntimeNetwork,
  plugRuntimeNetwork,
  unplugRuntimeNetwork,
  triggerExport,
  downloadExport,
  triggerImport,
  getImportList,
  checkScenarioIdentification,
  getImportStatus,
  downloadComponent,
  uploadComponentZst,
  startRestore,
  getZstUploadStatus,
};
