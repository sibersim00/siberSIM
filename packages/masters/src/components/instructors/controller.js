const list = ({ dao, db, validation}) => async (req, res) => {
  try {
    const result = await dao.list({ db })();
    res.status(200).send({statusCode: 200, message: validation.messages.intructor_list,data:result});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getById = ({ dao, validation, db }) => async (req, res) => {
  try {
    const { id: useruuid } = req.params;
    const result = await dao.getById({ db })(useruuid);

    return res.status(200).json({
      statusCode: 200,
      message: validation.messages.get_success || "Instructor fetched successfully.",
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



const save = ({ dao, db,validation,keys}) => async (req, res) => {
  try {
    const body=req.body;
    let session_userid=req.user.userid;
    const result = await dao.save({ db, validation,keys })(body,session_userid);
    return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message, errors: result.errors});
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ statusCode: 500, error: "An error occurred. Please try again later." });
  }
}; 

const update = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    let session_userid=req.user.userid;
      const result = await dao.update({ db, validation })(body,session_userid);
      return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message, errors: result.errors});
    // }
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const statusChange = ({ dao, db , validation}) => async (req, res) => {
  try {
    let body=req.body
    const result = await dao.statusChange({ db, validation })(body);
    res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message,data:result.data});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const deleteById = ({ dao, db, validation}) => async (req, res) => {
  try {
    const instructor_id=req.body.instructor_id
    const result = await dao.deleteById({ db })(instructor_id);
    res.status(200).send({statusCode: 200, message: validation.messages.delete_success});
  } catch (error) {
    console.error("Error Deleting data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const sendVerification = ({ dao, db, validation}) => async (req, res) => {
  try {
    const instructor_id=req.body.instructor_id
    const result = await dao.sendVerification({ db, validation })(instructor_id);
    res.status(200).send({statusCode: result.statusCode, message: result.message});
  } catch (error) {
    console.error("Error Deleting data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const resetPassword = ({ dao, db, validation}) => async (req, res) => {
  try {
    const instructor_id=req.body.instructor_id
    const result = await dao.resetPassword({ db })(instructor_id);
    res.status(200).send({statusCode: 200, message: validation.messages.reset_success});
  } catch (error) {
    console.error("Error Deleting data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

module.exports = {
  list,
  getById,
  save,
  update,
  statusChange,
  deleteById,
  sendVerification,
  resetPassword,
}