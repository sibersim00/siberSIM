const getTemplates = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getTemplates({ db })(null);
    res.status(200).send({statusCode: 200, message: "Get Templates List",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching templates data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getTemplatebyId = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getTemplates({ db })(id);
    res.status(200).send({statusCode: 200, message: "Get Template Details",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching Template data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getActionTemplates = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getActionTemplates({ db })(id);
    let data =JSON.parse(result[0].result);
    let message ="Get Template Details";
    if(!data)
    {
      data=[];
      message="No Template Found"
    }
    res.status(200).send({statusCode: 200, message: message,data:data});
  } catch (error) {
    console.error("Error fetching Template data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const saveTemplate = ({ dao, db,validation}) => async (req, res) => {
  try {
    let body=req.body;
    const { error, value } = validation.templateSchema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({statusCode:400, errors:errors});
    } else {
      body.userid=req.user.userid
      const result = await dao.saveTemplate({ db })(body);
      let resParse=JSON.parse(result[0].result);
      res.status(resParse.statusCode).send({statusCode: resParse.statusCode, message: resParse.message});
    }
  } catch (error) {
    console.error("Error on save qualification data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const getTestEmail = ({ dao, db}) => async (req, res) => {
  try {
    let body = req.body; 
    const result = await dao.getTestEmail({ db })({body});
    res.status(result.statusCode).send({statusCode: result.statusCode, message: result.message});
  } catch (error) {
    console.error("Error fetching Template data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};
module.exports = {
  getTemplates,
  getTemplatebyId,
  saveTemplate,
  getActionTemplates,
  getTestEmail
}