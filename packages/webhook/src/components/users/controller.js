const axios = require("axios");

const getHeaders = (req, keys) => ({
  authorization: `Bearer ${req.webhookToken}`,
  "x-request-source": "webhook-service",
  "x-webhook-internal-key": keys.WEBHOOK_INTERNAL_KEY,
  "x-request-id": req.webhookRequestId,
});

const sendMasterResponse = (res, response) => {
  if (response.status >= 400) {
    res.locals.errorMessage = response.data?.message || response.data?.error || "Master service request failed.";
  }
  return res.status(response.status).send(response.data);
};

const handleMasterError = (error, res, next) => {
  res.locals.errorMessage = error.code === "ECONNABORTED" ? "Master service timed out." : "Master service is unavailable.";
  if (error.code === "ECONNABORTED") {
    return res.status(504).send({ statusCode: 504, message: res.locals.errorMessage });
  }
  return next(error);
};

const getAll = ({ keys }) => async (req, res, next) => {
  try {
    req.auditAction = "list learners";
    const response = await axios.get(`${keys.MASTERS_API_URL}/learners/get`, {
      params: req.query,
      headers: getHeaders(req, keys),
      timeout: 15000,
      validateStatus: () => true,
    });
    return sendMasterResponse(res, response);
  } catch (error) {
    return handleMasterError(error, res, next);
  }
};

const save = ({ keys }) => async (req, res, next) => {
  try {
    req.auditAction = "create learner";
    const response = await axios.post(`${keys.MASTERS_API_URL}/learners/save`, req.body, {
      headers: getHeaders(req, keys),
      timeout: 15000,
      validateStatus: () => true,
    });
    return sendMasterResponse(res, response);
  } catch (error) {
    return handleMasterError(error, res, next);
  }
};

const update = ({ keys }) => async (req, res, next) => {
  try {
    req.auditAction = "update learner";
    req.auditLearnerUuid = req.body.learner_uuid;
    const response = await axios.post(`${keys.MASTERS_API_URL}/learners/update`, req.body, {
      headers: getHeaders(req, keys),
      timeout: 15000,
      validateStatus: () => true,
    });
    return sendMasterResponse(res, response);
  } catch (error) {
    return handleMasterError(error, res, next);
  }
};

const deleteById = ({ keys }) => async (req, res, next) => {
  try {
    req.auditAction = "delete learner";
    req.auditLearnerUuid = req.body.learner_uuid;
    const response = await axios.post(`${keys.MASTERS_API_URL}/learners/delete`, req.body, {
      headers: getHeaders(req, keys),
      timeout: 15000,
      validateStatus: () => true,
    });
    return sendMasterResponse(res, response);
  } catch (error) {
    return handleMasterError(error, res, next);
  }
};

module.exports = { getAll, save, update, deleteById };
