const getAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getAll({ db })(null);

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

const deleteById = ({ dao, db, validation }) => async (req, res) => {
  try {
    const session_userid = req.user.userid;
    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const result = await dao.deleteById({ db })(req.body, session_userid, ipAddress);

    return res.status(result.status ? 200 : 400).send({
      statusCode: result.status ? 200 : 400,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting custom component:", error.message);

    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.internal_server_error,
      error: "An error occurred. Please try again later.",
    });
  }
};

const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user.userid;
    const ipAddress = req.ip;
    const result = await dao.save({ db, validation })(body, session_userid, ipAddress);
    return res.status(result.statusCode).send(result);
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const update = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    let session_userid = req.user.userid;
    const result = await dao.update({ db, validation })(body, session_userid);
    return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });

  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const vmDetails = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const result = await dao.vmDetails({ db, validation })(body, ipAddress);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching VM detail:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getVms = ({ dao, db, validation }) => async (req, res) => {
    try {
      const body = req.body;
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const result = await dao.getVms({ db ,validation})(body, ipAddress);
      res.status(200).json(result);
    } catch (err) {
      console.error("Error fetching subcategory:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
  getAll,
  getById,
  updateStatus,
  deleteById,
  save,
  update,
  vmDetails,
  getVms

}
