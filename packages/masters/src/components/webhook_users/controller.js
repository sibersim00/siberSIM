const list =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      return res.send({
        statusCode: 200,
        message: "Webhook users fetched successfully.",
        data: await dao.list({ db })(req.user.orgid || 1),
      });
    } catch (error) {
      next(error);
    }
  };
const save =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const result = await dao.save({ db })(req.body, req.user);
      return res.status(result.statusCode).send(result);
    } catch (error) {
      next(error);
    }
  };
const update =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const result = await dao.update({ db })(req.body, req.user);
      return res.status(result.statusCode).send(result);
    } catch (error) {
      next(error);
    }
  };
const changeStatus =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const result = await dao.changeStatus({ db })(req.body, req.user);
      return res.status(result.statusCode).send(result);
    } catch (error) {
      next(error);
    }
  };
const remove =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const result = await dao.remove({ db })(
        req.body.webhook_user_id,
        req.user,
      );
      return res.status(result.statusCode).send(result);
    } catch (error) {
      next(error);
    }
  };
module.exports = { list, save, update, changeStatus, remove };
