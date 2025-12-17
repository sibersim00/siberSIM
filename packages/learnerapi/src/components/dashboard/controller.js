const getStudentDashboard = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learner_id = req.learneruser?.learner_id;
    if (!learner_id) {
      return res.status(400).json({ message: validation.messages.not_found });
    }
    const data = await dao.getStudentDashboardData({ db })(learner_id);
    return res.status(200).json({
  statusCode: 200,
  message: validation.messages.dashboard_fetch_success,
  data,
});
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error || "Server Error",
    });
  }
};
module.exports = {
    getStudentDashboard 
}