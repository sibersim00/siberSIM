const getFaqsAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getFaqsAll({ db })(null);
    res.status(200).send({ statusCode: 200, message: validation.messages.get_scenario_categories, data: result });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};

const getFaqById = ({ dao, db, validation }) => async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ statusCode: 400, message: "FAQ ID is required." });
    }

    const result = await dao.getFaqById({ db })(id);

    if (!result || result.length === 0) {
      return res.status(404).json({ statusCode: 404, message: "FAQ not found." });
    }

    res.status(200).json({
      statusCode: 200,
      message: validation.messages.get_faq_details, // Define this in your validation messages
      data: result, // Single FAQ object
    });
  } catch (error) {
    console.error("Error fetching FAQ data:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};


const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const userid = req.user.userid;
    const result = await dao.save({ db, validation })(body, userid);

    if (result.statusCode === 200) {
      return res.status(200).send({
        statusCode: 200,
        message: validation.messages.save_success || "FAQ saved successfully",
      });
    } else {
      return res.status(400).send({
        statusCode: 400,
        message: result.errors || ["Something went wrong"],
      });
    }
  } catch (error) {
    console.error("Error saving FAQ:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error ,
    });
  }
};


const update = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const userid = req.user.userid;

    const result = await dao.update({ db, validation })(body, userid);

    if (result.success === true) {
      return res.status(200).send({ statusCode: 200, message: validation.messages.update_success });
    } else {
      return res.status(400).send({ statusCode: 400, message: result.errors });
    }
  } catch (error) {
    console.error("Error on update FAQ:", error.message);
    return res.status(500).json({ statusCode: 500, error: validation.messages.server_error });
  }
};


const statusChange = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.loginId = req.user.userid;
    
    const result = await dao.statusChange({ db, validation })(body);
    res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
  } catch (error) {
    console.error("Error updating FAQ status:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};

const deleteById = ({ dao, db, validation }) => async (req, res) => {
  try {
    const id = req.body.faq_id;

    if (!id) {
      return res.status(400).send({ statusCode: 400, message: "FAQ ID is required." });
    }

    const result = await dao.deleteById({ db, validation })(id);

    if (result.status === true) {
      return res.status(200).send({ statusCode: 200, message: validation.messages.delete_success || result.message });
    } else {
      return res.status(400).send({ statusCode: 400, message: result.message });
    }
  } catch (error) {
    console.error("Error deleting FAQ:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};




const faqVerifyController = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    const body = req.body;
    const user = req.user;
    const result = await dao.faqVerify({ db, validation })(body, user, next);
    const { status, ...resData } = result;

    if (status) {
      return res.status(200).send({ statusCode: 200, data: resData });
    } else if (!status && result.errors && result.errors.length > 0) {
      return res.status(400).send({ statusCode: 400, errors: result.errors });
    } else {
      return res.status(400).send({ statusCode: 400, errors: [validation.messages.something_wrong_try_later] });
    }
  } catch (err) {
    console.error('faqVerifyController err:', err);
    next(err);
  }
};

const faqImportController = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    const body = req.body;
    const user = req.user;
    const result = await dao.faqImport({ db, validation })(body, user, next);

    if (result.status) {
      return res.status(200).send({ statusCode: 200, message: validation.messages.import_success });
    } else if (!result.status && result.errors && result.errors.length > 0) {
      return res.status(400).send({ statusCode: 400, errors: result.errors });
    } else {
      return res.status(400).send({ statusCode: 400, errors: [validation.messages.something_wrong_try_later] });
    }
  } catch (err) {
    console.error('faqImportController err:', err);
    next(err);
  }
};



module.exports = {
  getFaqsAll,
  getFaqById,
  save,
  update,
  statusChange,
  deleteById,
  faqVerifyController,
  faqImportController
};
