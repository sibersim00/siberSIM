const getDashboardStats = ({ dao, db, validation }) => async (req, res) => {
  try {
    const userid = req.user.userid;
    const usertype = req.user.usertype;

    const stats = await dao.getDashboardStats({ db , validation})({ userid, usertype });

    res.status(200).send({
      statusCode: 200,
      message: validation.messages.dashboard_stats,
      data: stats
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};

const eventListController = ({ dao, db, validation }) => async (req, res) => {
  try {
    const eventList = await dao.getEventList({ db })();
    res.json({ eventList });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch event list" });
  }
};

const fetchTeamsByEventUUID = ({ dao, db }) => async (req, res) => {
  const { eventuuid } = req.query;

  if (!eventuuid) {
    return res.status(400).json({ statusCode: 400, message: "eventuuid is required" });
  }

  try {
    const teams = await dao.getTeamsByEventUUID({ db })(eventuuid);
    res.status(200).json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error.message);
    res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
  }
};
module.exports = {
  getDashboardStats,
  eventListController,
  fetchTeamsByEventUUID,

};
