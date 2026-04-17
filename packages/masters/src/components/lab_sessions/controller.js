const labSessionList =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const result = await dao.labSessionList({ db })();
      res.status(200).send({
        statusCode: 200,
        message:
          validation?.messages?.get_success ||
          "Lab session list fetched successfully.",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching lab sessions:", error.message);
      res.status(500).json({
        error:
          "An error occurred while fetching lab sessions. Please try again later.",
      });
    }
  };

const save =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const session_userid = req.user?.userid;
      const user_count_limit = req.user?.user_count_limit;

      const result = await dao.save({ db, validation })(
        body,
        session_userid,
        user_count_limit,
      );
      return res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Error on save lab session:", error.message);
      return res.status(500).json({
        statusCode: 500,
        error: "An error occurred. Please try again later.",
      });
    }
  };

const update =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const session_userid = req.user?.userid;
      const user_count_limit = req.user?.user_count_limit;

      const result = await dao.update({ db, validation })(
        body,
        session_userid,
        user_count_limit,
      );
      return res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Error on update lab session:", error.message);
      return res.status(500).json({
        statusCode: 500,
        error: "An error occurred. Please try again later.",
      });
    }
  };

const deleteById =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const session_userid = req.user?.userid;
      const result = await dao.deleteById({ db })(body, session_userid);
      if (!result.status) {
        return res.status(400).send({
          statusCode: 400,
          message: result.message,
        });
      }

      return res.status(200).send({
        statusCode: 200,
        message:
          validation?.messages?.delete_success ||
          "Lab session deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting lab session:", error.message);
      res.status(500).json({
        statusCode: 500,
        error: "An error occurred. Please try again later.",
      });
    }
  };

const changeStatus =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const session_userid = req.user?.userid;
      const result = await dao.changeStatus({ db, validation })(
        body,
        session_userid,
      );
      return res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
      });
    } catch (error) {
      console.error("Error on lab status change:", error.message);
      res.status(500).json({
        statusCode: 500,
        error: "An error occurred. Please try again later.",
      });
    }
  };

module.exports = {
  labSessionList,
  save,
  update,
  deleteById,
  changeStatus,
};
