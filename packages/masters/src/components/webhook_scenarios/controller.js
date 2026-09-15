const getScenarios =
  ({ dao, db }) =>
  async (_req, res) => {
    try {
      const result = await dao.getScenarios({ db })();
      return res.status(200).send({
        statusCode: 200,
        message: "Scenarios fetched successfully.",
        data: result,
      });
    } catch (error) {
      console.error("Webhook scenario list error:", error);
      return res.status(500).send({
        statusCode: 500,
        message: "Unable to fetch scenarios.",
      });
    }
  };

const importScenario =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const result = await dao.importScenario({ db })(
        req.body,
        req.user.userid,
      );

      return res.status(result.statusCode).send(result);
    } catch (error) {
      console.error("Webhook scenario import error:", error);
      return res.status(500).send({
        statusCode: 500,
        message: "Unable to import the scenario diagram.",
      });
    }
  };

module.exports = { getScenarios, importScenario };
