const getWorkflows = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getEmailWorkflows({ db })(null);
    res.status(200).send({statusCode: 200, message: "Get Workflow List",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching templates data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getWorkflowbyId = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getEmailWorkflows({ db })(id);
    res.status(200).send({statusCode: 200, message: "Get Workflow Details",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching Workflow data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const saveWorkflow = ({ dao, db}) => async (req, res) => {
  try {
    let body=req.body;
    body.userid=req.user.userid
    const result = await dao.saveWorkflow({ db })(body);
    let resParse=JSON.parse(result[0].result);
    res.status(resParse.statusCode).send({statusCode: resParse.statusCode, message: resParse.message});
  } catch (error) {
    console.error("Error on save workflow data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
module.exports = {
  getWorkflows,
  getWorkflowbyId,
  saveWorkflow
}