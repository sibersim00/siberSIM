const getWebSettings = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getWebSettings({ db })(null);
    res.status(200).send({statusCode: 200, message: "Get Learners List",data:result});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getWebFooter = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getWebFooter({ db })(null);
    res.status(200).send({statusCode: 200, message: "Get Learners List",data:result});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const addWebSettings = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    const { error, value } = validation.schema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({statusCode:400, errors:errors});
    } else {
      let userid=req.user.userid;
      const result = await dao.addWebSettings({ db })(body,userid);
      return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});
    }
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const updateWebSettings = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    const { error, value } = validation.updateSchema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({statusCode:400, errors:errors});
    } else {
      let userid=req.user.userid;
      const result = await dao.updateWebSettings({ db })(body,userid);
      return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});
    }
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 


const addWebFooter = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    let userid=req.user.userid;
    const result = await dao.addWebFooter({ db })(body,userid);
    if(result){
    return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});}
    else {return res.status(400).send({statusCode: result.statusCode, message: result.message});}
    
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const updateWebFooter = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    let userid=req.user.userid;
    const result = await dao.updateWebFooter({ db })(body,userid);
    if(result.flag){
    return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});}
    else {res.status(400).send({statusCode: result.statusCode, message: result.message});}
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 


const changeStatusWebFooter = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    let userid=req.user.userid;
    const result = await dao.changeStatusWebFooter({ db })(body,userid);
    if(result.flag){
    return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});}
    else {res.status(400).send({statusCode: result.statusCode, message: result.message});}
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const uploadLogo = ({ dao, db,validation}) => async (req, res) => {
  try {
    const body=req.body;
    let userid=req.user.userid;
    const result = await dao.uploadLogo({ db })(body,userid);
    if(result.flag){
    return res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});}
    else {res.status(400).send({statusCode: result.statusCode, message: result.message});}
  } catch (error) {
    console.error("Error on save data:", error.message);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  } 
};

const validateCustomerLicense = ({ dao, db }) => async (req, res, next) => {
  try {
    const hostname = req?.hostname;
    const license_key = req?.body?.license_key;
    const userid = req.user.userid;
    console.log("license_key=========>",hostname,license_key);
    const result = await dao.validateCustomerLicense({ db })(hostname,license_key,userid);
    if (result.status) {
      return res.status(200).send({ statusCode: 200, message: result.message, new : result.new });
    }else{
      return res.status(400).send({ statusCode: 400, message: result?.message });
    }
  } catch (err) {
    console.error("validateCustomerLicense err==>>", err);
    next(err);
  }
};
module.exports = {
  getWebSettings,
  getWebFooter,
  addWebSettings,
  updateWebSettings,
  addWebFooter,
  updateWebFooter,
  changeStatusWebFooter,
  uploadLogo,
  validateCustomerLicense
}