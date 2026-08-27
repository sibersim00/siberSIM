const masterRequest = require("../masterRequest");

const getAll = ({ keys }) => async (req, res, next) => {
  req.auditAction = "list component categories";
  return masterRequest({ req, res, next, keys, method: "get", path: "/component-category/list" });
};

const getById = ({ keys }) => async (req, res, next) => {
  req.auditAction = "get component category";
  return masterRequest({ req, res, next, keys, method: "get", path: `/component-category/get/${encodeURIComponent(req.params.id)}` });
};

const save = ({ keys }) => async (req, res, next) => {
  req.auditAction = "create component category";
  return masterRequest({ req, res, next, keys, method: "post", path: "/component-category/save", data: req.body });
};

const update = ({ keys }) => async (req, res, next) => {
  req.auditAction = "update component category";
  return masterRequest({ req, res, next, keys, method: "post", path: "/component-category/update", data: req.body });
};

const deleteById = ({ keys }) => async (req, res, next) => {
  req.auditAction = "delete component category";
  return masterRequest({ req, res, next, keys, method: "post", path: "/component-category/delete", data: req.body });
};

module.exports = { getAll, getById, save, update, deleteById };
