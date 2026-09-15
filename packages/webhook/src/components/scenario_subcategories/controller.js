const masterRequest = require("../masterRequest");

const getAll = ({ keys }) => async (req, res, next) => {
  req.auditAction = "list scenario subcategories";
  return masterRequest({ req, res, next, keys, method: "get", path: "/scenario-subcategories/get" });
};

const getById = ({ keys }) => async (req, res, next) => {
  req.auditAction = "get scenario subcategory";
  return masterRequest({ req, res, next, keys, method: "get", path: `/scenario-subcategories/get/${encodeURIComponent(req.params.id)}` });
};

const save = ({ keys }) => async (req, res, next) => {
  req.auditAction = "create scenario subcategory";
  return masterRequest({ req, res, next, keys, method: "post", path: "/scenario-subcategories/save", data: req.body });
};

const update = ({ keys }) => async (req, res, next) => {
  req.auditAction = "update scenario subcategory";
  return masterRequest({ req, res, next, keys, method: "post", path: "/scenario-subcategories/update", data: req.body });
};

const deleteById = ({ keys }) => async (req, res, next) => {
  req.auditAction = "delete scenario subcategory";
  return masterRequest({ req, res, next, keys, method: "post", path: "/scenario-subcategories/delete", data: req.body });
};

module.exports = { getAll, getById, save, update, deleteById };
