const axios = require("axios");
const keys = require("../../keys");
const EVENTLEARNER_API_URL = keys.EVENTLEARNER_API_URL;

const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getAll({ db })();
    res.status(200).json({
      statusCode: 200,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};


const stopDestroySingleComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/delete-single-network`,
          { vmrequestid, vmid },
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
        return res.status(500).send({
          statusCode: 500,
          message: "Something went wrong. Please try again.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in stop destroy single componnet:", err);
      next(err);
    }
  };
const stopComponent =
  ({}) =>
  async (req, res, next) => {
    try {
      const { vmrequestid, vmid } = req.body;
      try {
        const response = await axios.post(
          `${EVENTLEARNER_API_URL}/vmconfigs/stop-single-component`,
          { vmrequestid, vmid },
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
        return res.status(500).send({
          statusCode: 500,
          message: "Something went wrong. Please try again.",
          error: error.response?.data || error.message,
        });
      }
    } catch (err) {
      console.error("Error in stop destroy single componnet:", err);
      next(err);
    }
  };




 module.exports = {
    getAll,
    stopDestroySingleComponent,
    stopComponent,
  }