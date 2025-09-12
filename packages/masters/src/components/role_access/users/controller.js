const list = ({ dao, db }) => async (req, res, next) => {
  const session_userid = req.params.id ? parseInt(req.params.id) : null;
  await dao.list({ db })(session_userid)
    .then(result => {
      return res.status(200).send({ statusCode: 200, data: result, message: '' });
    }).catch(err => {
      return res.status(500).send({ statusCode: 500, message: err.message });
    });
}

const getProfile = ({ dao, db }) => async (req, res) => {
  try {
    const result = await dao.getProfile({ db })(req);
    res.status(200).send({ statusCode: 200, message: "", data: result });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const create = ({ dao, db, validation,keys }) => async (req, res) => {
  try {
    let body = req.body;
    let session_userid = req.user.userid;
    let result = await dao.create({ db, validation,keys })(body, session_userid);
    if (result.status) {
      res.status(200).send({ statusCode: 200, message: result.message });
    } else {
      res.status(500).json({ statusCode: 500, errors: result.errors });
    }
    // return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message, errors: result.errors});
  } catch (error) {
    console.error("Error on create data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const update = ({ dao, db, validation }) => async (req, res) => {
  try {
   
    let body = req.body;
    session_userid = req.user.userid;

    let result = await dao.update({ db, validation })(body,session_userid);
    return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message, errors: result.errors});
  } catch (error) {
    console.error("Error on update data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const updateProfile = ({ dao, db, validation }) => async (req, res) => {
  try {
    let body = req.body;
    let session_userid = req.user.userid;
    let result = await dao.updateProfile({ db, validation })(body, session_userid);

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

const updateProfileImage = ({ dao, db, validation }) => async (req, res) => {
  try {
    let body = req.body;
    let session_userid = req.user.userid;
    let result = await dao.updateProfileImage({ db, validation })(body, session_userid);

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

const changePassword = ({ dao, db, validation }) => async (req, res) => {
  try {
    let body = req.body;
    let session_userid = req.user.userid;
    let result = await dao.changePassword({ db, validation })(body, session_userid);

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

const resetpassword = ({ dao, db, validation}) => async (req, res) => {
  try {
    const session_userid=req.body.userid
    const result = await dao.resetpassword({ db })(session_userid);
    res.status(200).send({statusCode: 200, message: validation.messages.reset_success});
  } catch (error) {
    console.error("Error Deleting data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const status = ({ dao, db }) => async(req,res,next) => {
  try {
     
      const body = req.body;
      const loginId = req.user.userid;
      
      let result = await dao.status({ db })(body,loginId);
      if(result){
        return res.status(200).send({statusCode:200, message: 'Status updated successfully.'});
      }else{
        return res.status(500).send({statusCode:500, message: "An error occurred. Please try again later."});
      }
  }catch (err) { next(err) }
};

const mailConfirmation = ({ dao, db,validation}) => async (req, res) => {
  try {
    let body=req.body
    body.userid=req.user.userid
    const result = await dao.mailConfirmation({ db,validation })(body);
   
    res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message,data:result.data});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const resendMailUser = ({ dao, db, validation }) => async (req, res, next) => {
	try {
			let body = req.body;
			let result = await dao.resendMailUser({ db, validation })(body);

			if (result.status) {
					res.status(200).send({ statusCode: 200, message: result.message });
			} else {
					res.status(500).json({ statusCode: 500, errors: result.errors });
			}
	} catch (err) { next(err) }
};
const userImport = ({ dao, db, validation }) =>  async (req, res, next) => {
  try {
    let body = req.body;
    let session_userid = req.user.userid;
    let orgid = req.user.orgid;
    await dao.userImport({ db })({body,session_userid,orgid})
      .then(result => {
        return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message,data:result.data });
    }).catch(err => {
        return res.status(500).send({ statusCode: 500, message: err.message }); 
    });
  }
  catch (err) { next(err) }
}

module.exports = {
  list,
  getProfile,
  create,
  update,
  updateProfile,
  updateProfileImage,
  changePassword,
  resetpassword,
  status,
  mailConfirmation,
  resendMailUser,
  userImport
}