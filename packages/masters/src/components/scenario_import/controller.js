
const getScenarioById =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const uuid = req.params.uuid;

      const result = await dao.getScenarioById({ db })(uuid);

      if (!result) {
        return res.status(404).send({
          statusCode: 404,
          message: "No scenario record found",
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message: "Scenario details fetched successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching scenario:", error.message);
      return res.status(500).json({
        statusCode: 500,
        message: "Internal server error",
      });
    }
  };


module.exports = {
getScenarioById
}