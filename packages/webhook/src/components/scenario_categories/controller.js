const masterRequest = require("../masterRequest");

const getAll = ({ keys }) => async (req, res, next) => {
  req.auditAction = "list scenario categories";
  return masterRequest({ req, res, next, keys, method: "get", path: "/scenario-categories/get" });
};

const getById = ({ keys }) => async (req, res, next) => {
  req.auditAction = "get scenario category";
  return masterRequest({ req, res, next, keys, method: "get", path: `/scenario-categories/get/${encodeURIComponent(req.params.id)}` });
};

const save = ({ keys }) => async (req, res, next) => {
  req.auditAction = "create scenario category";
  return masterRequest({ req, res, next, keys, method: "post", path: "/scenario-categories/save", data: req.body });
};

const update = ({ keys }) => async (req, res, next) => {
  req.auditAction = "update scenario category";
  return masterRequest({ req, res, next, keys, method: "post", path: "/scenario-categories/update", data: req.body });
};

const deleteById = ({ keys }) => async (req, res, next) => {
  req.auditAction = "delete scenario category";
  return masterRequest({ req, res, next, keys, method: "post", path: "/scenario-categories/delete", data: req.body });
};

module.exports = { getAll, getById, save, update, deleteById };
