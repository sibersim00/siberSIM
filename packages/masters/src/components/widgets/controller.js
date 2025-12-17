const getWidgetsAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getWidgetsAll({ db })(null);
    res.status(200).send({
      statusCode: 200,
      message: validation.messages.get_widgets_success,
      data: result
    });
  } catch (error) {
    console.error("Error fetching widgets:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};


const saveWidget = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const userid = req.user.userid; // assuming req.user is populated via auth middleware
    console.log("bodybodybody",body)

    const result = await dao.saveWidget({ db, validation })(body, userid);

    if (result.statusCode === 200) {
      return res.status(200).send({
        statusCode: 200,
        message: validation.messages.save_success || "Widget saved successfully",
      });
    } else {
      return res.status(400).send({
        statusCode: 400,
        message: result.errors || ["Something went wrong"],
      });
    }
  } catch (error) {
    console.error("Error saving Widget:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error,
    });
  }
};


const updateWidget = ({ dao, db, validation }) => async (req, res) => {
  try {
    const { webbrowserwidgetid, widget_name, widget_url, order } = req.body;
    const userid = req.user.userid;

    if (!webbrowserwidgetid) {
      return res.status(400).json({ statusCode: 400, message: "ID is required" });
    }

    const result = await dao.updateWidget({ db, validation })(webbrowserwidgetid, { widget_name, widget_url, order }, userid);

    if (result.statusCode === 200) {
      return res.status(200).json({
        statusCode: 200,
        message: validation.messages.update_success || "Widget updated successfully",
      });
    } else {
      return res.status(400).json({ statusCode: 400, message: result.errors || ["Update failed"] });
    }
  } catch (error) {
    console.error("Error updating widget:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error,
    });
  }
};


const deleteWidget = ({ dao, db, validation }) => async (req, res) => {
  try {
    const { webbrowserwidgetid } = req.body;
    const userid = req.user.userid;

    if (!webbrowserwidgetid) {
      return res.status(400).json({ statusCode: 400, message: "ID is required" });
    }

    const result = await dao.deleteWidget({ db, validation })(webbrowserwidgetid, userid);

    if (result.statusCode === 200) {
      return res.status(200).json({
        statusCode: 200,
        message: validation.messages.delete_success || "Widget deleted successfully",
      });
    } else {
      return res.status(400).json({ statusCode: 400, message: result.errors || ["Delete failed"] });
    }
  } catch (error) {
    console.error("Error deleting widget:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error,
    });
  }
};
const statusChange = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.userid = req.user.userid;
    console.log("body-------------------------",body);
    
    const result = await dao.statusChange({ db, validation })(body);
    res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
  } catch (error) {
    console.error("Error updating FAQ status:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};


module.exports = {
  getWidgetsAll,
  saveWidget,
  updateWidget,
  deleteWidget,
  statusChange
};
