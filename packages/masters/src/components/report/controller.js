const getAdminLogs = ({ dao, db }) => async (req, res) => {
  try {
    const logs = await dao.getAdminLogs({ db });
    return res.status(200).send({
      statusCode: 200,
      message: 'Admin login logs fetched successfully',
      data: logs,
    });
  } catch (error) {
    console.error('Error in getAdminLogs:', error);
    return res.status(500).send({
      statusCode: 500,
      message: 'Failed to fetch admin login logs',
    });
  }
};

const getInstructorLogs = ({ dao, db }) => async (req, res) => {
  try {
    const logs = await dao.getInstructorLogs({ db });
    return res.status(200).send({
      statusCode: 200,
      message: 'Instructor login logs fetched successfully',
      data: logs,
    });
  } catch (error) {
    console.error('Error in getInstructorLogs:', error);
    return res.status(500).send({
      statusCode: 500,
      message: 'Failed to fetch instructor login logs',
    });
  }
};

const getLearnerLogs = ({ dao, db }) => async (req, res) => {
  try {
    const logs = await dao.getLearnerLogs({ db });
    console.log("Learner Logs:", logs);
    return res.status(200).send({
      statusCode: 200,
      message: 'Learner login logs fetched successfully',
      data: logs,
    });
  } catch (error) {
    console.error('Error in getLearnerLogs:', error);
    return res.status(500).send({
      statusCode: 500,
      message: 'Failed to fetch learner login logs',
    });
  }
};

module.exports = {
  getAdminLogs,
  getInstructorLogs,
  getLearnerLogs
};
