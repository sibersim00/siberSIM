const jwt = require("jsonwebtoken");
const profile = ({ dao, db}) => async (req, res) => {
  try {
    let learner_sessionid = req.learneruser.learner_id;
    const result = await dao.profile({ db })(learner_sessionid);
    res.status(200).send({ statusCode: 200, message: "Get Learners Details", data: result });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};

const updateProfile = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    let learner_sessionid = req.learneruser.learner_id;
    const { error } = validation.schemaForm.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({statusCode:400, errors:errors});
    } else {
      const result = await dao.updateProfile({ db })(body,learner_sessionid);
      return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});
    }
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const changePassword = ({ dao, db, validation }) => async (req, res) => {
  try {
    let body = req.body;
    let learner_sessionid = req.learneruser.learner_id;
    const { error } = validation.changePasswordSchema.validate(body, { abortEarly: false, allowUnknown: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ statusCode: 400, message: errors[0], errors });
    }
    let result = await dao.changePassword({ db, validation })(body, learner_sessionid);
    if (result.status) {
      return res.status(200).send({ statusCode: 200, message: result.message });
    } else {
      return res.status(400).json({ statusCode: 400, message: result.errors?.[0] || 'Unable to change password.', errors: result.errors || [] });
    }
  } catch (error) {
    console.error("Error on update data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const dismissPasswordReset = ({ dao, db }) => async (req, res) => {
  try {
    const learner_sessionid = req.learneruser?.learner_id;
    if (!learner_sessionid) {
      return res.status(400).json({ statusCode: 400, message: 'Invalid learner session.' });
    }
    const result = await dao.dismissPasswordReset({ db })(learner_sessionid);
    return res.status(200).send({ statusCode: 200, message: result.message });
  } catch (error) {
    console.error('Error dismissing first-login password prompt:', error.message);
    return res.status(500).json({ statusCode: 500, message: 'An error occurred. Please try again later.' });
  }
};

const updateProfileImage = ({ dao, db, validation }) => async (req, res) => {
  try {
    let body = req.body;
    let learner_sessionid = req.learneruser.learner_id;
    let result = await dao.updateProfileImage({ db, validation })(body, learner_sessionid);
    if (result.status) {
      res.status(200).send({ statusCode: 200, message: result.message });
    } else {
      res.status(500).json({ statusCode: 500, message: result.errors });
    }
  } catch (error) {
    console.error("Error on update data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

module.exports = {
  profile,
  updateProfile,
  changePassword,
  dismissPasswordReset,
  updateProfileImage
}
