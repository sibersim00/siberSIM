const theme =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const learner_id = req.learneruser.learner_id;
      const themeParam = req.query.theme;
      const result = await dao.theme({ db })(learner_id, themeParam);
      return res
        .status(200)
        .send({
          statusCode: 200,
          message: themeParam ? "Theme updated." : "Theme fetched.",
          data: result,
        });
    } catch (err) {
      next(err);
    }
  };

module.exports = {
  theme,
};
