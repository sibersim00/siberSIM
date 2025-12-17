const { commonMsgs } = require('../../message');
const componentCategorylist = ({ dao, db }) => async (req, res, next) => {
  try {
    const user = req.user;
    const result = await dao.componentCategorylist({ db })();
    
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { next(err) }
}

const getComponentCategorybyId = ({ dao, db}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getComponentCategory({ db })(id);
    res.status(200).send({statusCode: 200, message: commonMsgs.FETCH,data : result[0]});
  } catch (error) {
    console.error("Error fetching component sub category data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const saveComponentCategory = ({ dao, db, validation}) => async (req, res) => {
  try {
    const body=req.body;
    body.id = '0';
    const session_userid = req.user.userid;
      const result = await dao.saveComponentCategory({ db , validation})(body,session_userid);
      if(result. success==true)
      {
        res.status(200).send({statusCode: 200, message: result.message});
      }else{
        res.status(400).send({statusCode: 400, message: result.errors});
      }
  } catch (error) {
    console.error("Error on save component sub category data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later..." });
  }
}; 

const updateComponentCategory = ({ dao, db, validation}) => async (req, res) => {
  try {
    const body=req.body;
    body.id = '0';
    const session_userid = req.user.userid;
    const { error, value } = validation.schema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
        const errors = error.details.map((err) => err.message);
        return res.status(400).json({statusCode:400, errors:errors});
    } else {
      const result = await dao.updateComponentCategory({ db , validation})(body,session_userid);
      if(result. success==true)
      {
        res.status(200).send({statusCode: 200, message: result.message});
      }else{
        res.status(400).send({statusCode: 400, message: result.errors});
      }
    }
  } catch (error) {
    console.error("Error on update component sub category data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later..." });
  }
}; 

const changeStatus = ({ dao, db }) => async(req,res,next) => {
  try {
      const body = req.body;
      const session_userid = req.user.userid;
      
      let result = await dao.changeStatus({ db })(body, session_userid);
      if(result){
        return res.status(200).send({statusCode:200, message: commonMsgs.STATUS});
      }else{
        return res.status(500).send({statusCode:500, message: "An error occurred. Please try again later."});
      }
  }catch (err) { next(err) }
};

const deleteCategory = ({ dao, db}) => async (req, res) => {
  try {
    const body = req.body;
    const session_userid = req.user.userid;
    const result = await dao.deleteCategory({ db })(body, session_userid);
    res.status(200).send({statusCode: 200, message: "Category Deleted Successfully"});
  } catch (error) {
    console.error("Error deleting sub category data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

module.exports = {
  componentCategorylist,
  getComponentCategorybyId,
  saveComponentCategory,
  updateComponentCategory,
  changeStatus,
  deleteCategory
}
  