const masterRequest = require("../masterRequest");

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

module.exports = { importScenario };
