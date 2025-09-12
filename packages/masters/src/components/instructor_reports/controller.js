const getInstructorDetails =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const { instructor_id } = req.body;

      const result = await dao.getInstructorDetails({ db })(
        instructor_id || null
      );

      return res.status(200).send({
        statusCode: 200,
        message: instructor_id
          ? "Instructor(s) fetched successfully"
          : "All instructors fetched successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };


const getInstructorStatistics = ({ dao, db }) => async (req, res, next) => {
  try {
    const { instructor_id = null, scenario_id = null } = req.body;

    const data = await dao.getInstructorStatistics({ db })(instructor_id, scenario_id);

    return res.status(200).send({
      statusCode: 200,
      message: 'Instructor statistics fetched successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};






module.exports = { getInstructorDetails,getInstructorStatistics };
