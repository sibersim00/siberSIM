const getActions = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getActions({ db })(null);
    res.status(200).send({statusCode: 200, message: "Get Email Action List",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching Email Action data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getActionbyId = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getActions({ db })(id);
    res.status(200).send({statusCode: 200, message: "Get Email Action Details",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching Email Action data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const saveAction = ({ dao, db}) => async (req, res) => {
  try {
    const body=req.body;
    const result = await dao.saveAction({ db })(body);
    let resParse=JSON.parse(result[0].result);
    res.status(resParse.statusCode).send({statusCode: resParse.statusCode, message: resParse.message});
  } catch (error) {
    console.error("Error on save Email Action data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const deleteQualification = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.deleteQualification({ db })(id);
    res.status(200).send({statusCode: 200, message: "Email Action Deleted Successfully"});
  } catch (error) {
    console.error("Error Deleting Email Action data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
module.exports = {
  getActions,
  getActionbyId,
  saveAction,
  deleteQualification
}