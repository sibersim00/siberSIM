const getLearnerStatistics = ({ dao, db }) => async (req, res, next) => {
  try {
    const { learner_id = [], scenario_id = [] } = req.body;
    const data = await dao.getLearnerStatistics({ db })(learner_id, scenario_id);
    return res.status(200).send({
      statusCode: 200,
      message: 'Learner statistics fetched successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getLearnerDetails = ({ dao, db }) => async (req, res, next) => {
  try {
    const { learner_id } = req.body;
    const result = await dao.getLearnerDetails({ db })(learner_id || null);
    return res.status(200).send({
      statusCode: 200,
      message: learner_id
        ? "Learner fetched successfully"
        : "All learners fetched successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {

  getLearnerStatistics,
  getLearnerDetails,
};
