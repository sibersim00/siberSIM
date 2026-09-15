

const getLicenseDashboardStats = ({ dao, db, validation }) => async (req, res) => {
  try {
    const { userid, usertype } = req.user;

    // dropdown value: today | week | month
    const { range = "month" } = req.query;
    const stats = await dao.getLicenseDashboardStats({ db, validation })({
      userid,
      usertype,
      range,
    });

    res.status(200).json({
      statusCode: 200,
      message: validation.messages.dashboard_stats,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);

    res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};

module.exports = {
  getLicenseDashboardStats,
};

module.exports = {
  getLicenseDashboardStats,
};
