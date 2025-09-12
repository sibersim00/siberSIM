const getList = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getList({ db })();
    for (const row of result) {
      if(row.static_payloads)
      {
        row.static_payloads=JSON.parse(row.static_payloads)
      }
      else
      {
        row.static_payloads=[]
      }
    }
    res.status(200).send({statusCode: 200, message: "Get Notification Templates List",data:result});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getListById = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getListById({ db })(id);
    res.status(200).send({statusCode: 200, message: "Get Notification Templates Details",data:result});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const savetemplate = ({ dao, db,validation}) => async (req, res) => {
  try {
    let body=req.body;
    const { error} = validation.schema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({statusCode:400, errors:errors});
    } else {
      body.userid=req.userLearner.userid;
      let result = await dao.savetemplate({ db })(body);
      res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});
    }
  } catch (error) {
    console.error("Error on save data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getSelectors = ({ dao, db}) => async (req, res) => {
  try {
    const template_id = req.params.id;
    const result = await dao.getSelectors({ db })(template_id);
    res.status(200).send({statusCode: 200, message: "Get Selectors List",data:result});
  } catch (error) {
    console.error("Error fetching Email Selectors data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getNotificationAll = ({ dao, db}) => async (req, res) => {
  try {
    const type = req.params.flag;
    const userid = req.params.flag == type ? req.learneruser.learner_id : req.userLearner.instructor_id;
    const result = await dao.getNotificationAll({ db })(type,userid);
    res.status(200).send({statusCode: 200, message: "Get Notifications List",data:result});
  } catch (error) {
    console.error("Error fetching Notifications data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getNotification = ({ dao, db}) => async (req, res) => {
  try {
    const type = req.params.flag;
    const userid = req.params.flag == type ? req.learneruser.learner_id : req.userLearner.instructor_id;
    const result = await dao.getNotification({ db })(type,userid);
    res.status(200).send({statusCode: 200, message: "Get Notifications List",data:result});
  } catch (error) {
    console.error("Error fetching Notifications data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const UpdateReadNotification = ({ dao, db,validation}) => async (req, res) => {
  try {
    let body=req.body;
    const { error} = validation.notischema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({statusCode:400, errors:errors});
    } else {
      body.learner_id = body.type == "Learner" ? req.learneruser.learner_id : req.learneruser.tutor_id; 
      let result = await dao.UpdateReadNotification({ db })(body);
      res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});
    }
  } catch (error) {
    console.error("Error on save data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

module.exports = {
  getList,
  getListById,
  savetemplate,
  getSelectors,
  getNotification,
  getNotificationAll,
  UpdateReadNotification
}