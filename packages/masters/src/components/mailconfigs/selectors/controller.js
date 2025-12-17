const getSelectors = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getSelectors({ db })(null);
    res.status(200).send({statusCode: 200, message: "Get Selectors List",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching selectors data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getSelectorbyId = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getSelectors({ db })(id);
    res.status(200).send({statusCode: 200, message: "Get Selector Details",data:JSON.parse(result[0].result)});
  } catch (error) {
    console.error("Error fetching Selector data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const saveSelector = ({ dao, db}) => async (req, res) => {
  try {
    const body=req.body;
    const result = await dao.saveSelector({ db })(body);
    let resParse=JSON.parse(result[0].result);
    res.status(resParse.statusCode).send({statusCode: resParse.statusCode, message: resParse.message});
  } catch (error) {
    console.error("Error on save selector data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const deleteSelector = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.deleteCategory({ db })(id);
    res.status(200).send({statusCode: 200, message: "Selector Deleted Successfully"});
  } catch (error) {
    console.error("Error Deleting Selector data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
module.exports = {
  getSelectors,
  getSelectorbyId,
  saveSelector,
  deleteSelector
}