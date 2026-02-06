const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getAll({ db })();
    res.status(200).json({
      statusCode: 200,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};






 module.exports = {
    getAll,
  }