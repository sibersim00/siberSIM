const getList = ({ dao, db, validation }) => async (req, res) => {
    try {
        const result = await dao.getList({ db })(null);

        if (result && result.length > 0) {
            return res.status(200).send({
                statusCode: 200,
                message: "Scenario Tab List fetched successfully",
                data: result,
            });
        }

        return res.status(200).send({
            statusCode: 200,
            message: "No records found",
            data: [],
        });
    } catch (error) {
        console.error("Error fetching scenario tab list:", error);
        return res.status(500).json({
            statusCode: 500,
            error: validation.messages.server_error,
        });
    }
};

const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const userid = req.user?.userid || null;
    if (!userid) {
      return res.status(400).json({
        statusCode: 400,
        message: "User ID is required",
      });
    }

    const body = req.body;
    const payloadArray = Array.isArray(body)
      ? body
      : Array.isArray(body.tabs)
      ? body.tabs
      : [body];

    const results = [];
    const failedTabs = [];
    for (const tab of payloadArray) {
      try {
        const result = await dao.save({ db, validation })(tab, userid,payloadArray);
        results.push(result);
        if (result.status === false) {
          failedTabs.push(...(result.errors || ["Unknown error"]));
        }
      } catch (err) {
        failedTabs.push(err.message || "Unexpected error");
      }
    }
    if (failedTabs.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Some tabs failed to save",
        errors: failedTabs,
        results,
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "Scenario tabs processed successfully",
      results,
    });
  } catch (error) {
    console.error("Error saving scenario tab:", error);
    return res.status(500).json({
      statusCode: 500,
      message: validation.messages.server_error,
    });
  }
};




const getWidgetList = ({ dao, db, validation }) => async (req, res) => {
    try {
        const result = await dao.getWidgetList({ db })(null);

        if (result && result.length > 0) {
            return res.status(200).send({
                statusCode: 200,
                message: "Web browser widgets fetched successfully",
                data: result,
            });
        }

        return res.status(200).send({
            statusCode: 200,
            message: "No widgets found",
            data: [],
        });
    } catch (error) {
        console.error("Error fetching web browser widgets:", error);
        return res.status(500).json({
            statusCode: 500,
            error: validation.messages.server_error,
        });
    }
};

module.exports = {
    getList,
    save,
    getWidgetList
}