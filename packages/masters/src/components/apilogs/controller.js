const getApiLogs = ({ dao, db, validation }) => async (req, res, next) => {
    try {
      const result = await dao.getApiLogs({ db })();
      return res.status(200).send({ statusCode: 200, message: validation.messages.Log_success, data: result });
    } catch (err) {
      next(err);
    }
  };

 const getApiLogById = ({ dao, db, validation }) => async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await dao.getApiLogById({ db })(id);
      if (!result) {
        return res.status(404).send({ statusCode: 404, message: validation.messages.Log_not_found });
      }
      return res.status(200).send({ statusCode: 200, message: validation.messages.Log_success, data: result });
    } catch (err) {
      next(err);
    }
  };


module.exports = {
  getApiLogs,
  getApiLogById
};
