const customerList = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.customerList({ db })();
    res.status(200).send({
      statusCode: 200,
       message: validation.messages.get_success || "Customer list fetched successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching customers:", error.message);
    res.status(500).json({
      error: "An error occurred while fetching customers. Please try again later.",
    });
  }
};

const getById = ({ dao, validation, db }) => async (req, res) => {
  try {
    const { id: customeruuid } = req.params;
    const result = await dao.getById({ db })(customeruuid);
    if (!result) {
      return res.status(404).json({
        statusCode: 404,
        message: validation.messages.not_found || "Customer not found.",
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.get_success || "Customer fetched successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in getById controller:", error.message);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error || "Internal Server Error.",
    });
  }
};

const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user?.userid;
    const result = await dao.save({ db, validation })(body, session_userid);
    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error on save customer:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred. Please try again later.",
    });
  }
};

const update = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user?.userid;
    const result = await dao.update({ db, validation })(body, session_userid);
    return res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error on update customer:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred. Please try again later.",
    });
  }
};

const statusChange = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user?.userid;
    const result = await dao.statusChange({ db, validation })(body, session_userid);
    res.status(result.statusCode).send({
      statusCode: result.statusCode,
      message: result.message,
    });
  } catch (error) {
    console.error("Error on customer status change:", error.message);
    res.status(500).json({
      statusCode: 500,
      error: "An error occurred. Please try again later.",
    });
  }
};

const getLicenseByCustomerId =
  ({ dao, db, validation }) =>
    async (req, res) => {
      try {
        const { customer_id } = req.body; 
        const result = await dao.getLicenseByCustomerId({ db })(customer_id);
        return res.status(200).json({
          statusCode: 200,
          message: validation.messages.get_success || "Customer license fetched successfully.",
          data: result,
        });
      } catch (error) {
        console.error("Error fetching customer license:", error.message);
        return res.status(500).json({
          statusCode: 500,
          message: validation.messages.server_error || "Internal server error.",
        });
      }
    };


const saveLicense = ({ dao, db, validation }) => async (req, res) => {
  try {
    const session_userid = req.user?.userid;
    const body = req.body;
    const result = await dao.saveLicense({ db, validation })(body, session_userid);
    return res.status(result.statusCode).json({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error saving license:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred. Please try again later.",
    });
  }
};

const updateLicense = ({ dao, db, validation }) => async (req, res) => {
  try {
    const session_userid = req.user?.userid;
    const body = req.body;
    const result = await dao.updateLicense({ db, validation })(body, session_userid);
    return res.status(result.statusCode).json({
      statusCode: result.statusCode,
      message: result.message,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error updating license:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: "An error occurred. Please try again later.",
    });
  }
};

const dashboardData =
  ({ dao, validation, db }) =>
    async (req, res) => {
      try {
        const result = await dao.dashboardData({ db })();
        return res.status(200).json({
          statusCode: 200,
          message:
            validation.messages.get_success ||
            "Dashboard data fetched successfully.",
          data: result,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error.message);
        return res.status(500).json({
          statusCode: 500,
          message:
            validation.messages.server_error || "Internal Server Error.",
        });
      }
    };

const resendLicenseEmail = ({ dao, db, validation }) => async (req, res) => {
  try {
    const { customer_license_id } = req.body;
    const result = await dao.resendLicenseEmail({ db })(customer_license_id);
    if (!result) {
      return res.status(404).json({
        statusCode: 404,
        message: validation.messages.data_not_found || "License not found.",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.license_email_sent || "License email resent successfully.",
    });
  } catch (error) {
    console.error("Error resending license email:", error.message);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error || "Internal server error.",
    });
  }
};

module.exports = {
  customerList,
  getById,
  save,
  update,
  statusChange,
  getLicenseByCustomerId,
  saveLicense,
  updateLicense,
  dashboardData,
  resendLicenseEmail
}