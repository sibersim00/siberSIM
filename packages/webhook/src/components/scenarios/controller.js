const masterRequest = require("../masterRequest");

const getScenarios = ({ keys }) => async (req, res, next) => {
  req.auditAction = "list scenarios";
  return masterRequest({
    req,
    res,
    next,
    keys,
    method: "get",
    path: "/webhook-scenarios/get",
  });
};

const importScenario = ({ keys }) => async (req, res, next) => {
  req.auditAction = "import third-party scenario diagram";
  return masterRequest({
    req,
    res,
    next,
    keys,
    method: "post",
    path: "/webhook-scenarios/import",
    data: req.body,
  });
};

module.exports = { getScenarios, importScenario };
