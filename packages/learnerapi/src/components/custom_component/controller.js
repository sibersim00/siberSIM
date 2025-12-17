const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const learnerId = req.learneruser.learner_id;

    const result = await dao.getAll({ db })(learnerId);

    res.status(200).send({
      statusCode: 200,
      message: validation.messages.custom_component_list,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);

    res.status(500).json({
      statusCode: 500,
      message: validation.messages.internal_server_error,
      error: "An error occurred. Please try again later.",
    });
  }
};

const getById = ({ dao, db, validation }) => async (req, res) => {
  try {
    const uuid = req.params.uuid;

    // Basic validation
    if (!uuid || uuid.length !== 36) {
      return res.status(400).send({
        statusCode: 400,
        message: validation.messages.invalid_custom_uuid,
        data: null,
      });
    }

    const result = await dao.getById({ db })(uuid);

    if (!result) {
      return res.status(404).send({
        statusCode: 404,
        message: validation.messages.custom_component_not_found,
        data: null,
      });
    }

    res.status(200).send({
      statusCode: 200,
      message: validation.messages.custom_component_detail,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);

    res.status(500).json({
      statusCode: 500,
      message: validation.messages.internal_server_error,
    });
  }
};


const updateStatus = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.updateStatus({ db })(req.body);

    res.status(200).send({
      statusCode: 200,
      message: validation.messages.custom_component_update,
      // data: result,
    });
  } catch (error) {
    console.error("Error updating custom component:", error.message);

    res.status(500).json({
      statusCode: 500,
      message: validation.messages.internal_server_error,
      error: "An error occurred. Please try again later.",
    });
  }
};






module.exports = {
  getAll,
  getById,
  updateStatus

}