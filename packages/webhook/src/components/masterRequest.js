const axios = require("axios");

const masterRequest = async ({ req, res, next, keys, method, path, data, params }) => {
  try {
    const response = await axios({
      method,
      url: `${keys.MASTERS_API_URL}${path}`,
      data,
      params,
      headers: {
        authorization: `Bearer ${req.webhookToken}`,
        "x-request-source": "webhook-service",
        "x-webhook-internal-key": keys.WEBHOOK_INTERNAL_KEY,
        "x-request-id": req.webhookRequestId,
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      res.locals.errorMessage = response.data?.message || response.data?.error || "Master service request failed.";
    }
    return res.status(response.status).send(response.data);
  } catch (error) {
    res.locals.errorMessage = error.code === "ECONNABORTED" ? "Master service timed out." : "Master service is unavailable.";
    if (error.code === "ECONNABORTED") {
      return res.status(504).send({ statusCode: 504, message: res.locals.errorMessage });
    }
    return next(error);
  }
};

module.exports = masterRequest;
