
const componentCategorylist = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    const result = await dao.componentCategorylist({ db, validation })();
    res.status(200).send({ statusCode: 200, message: validation.messages.list_success, data: result });
  }
  catch (err) { next(err) }
}

const getComponentCategorybyId = ({ dao, db, validation}) => async (req, res) => {
  try {
    const id=req.params.id
    const result = await dao.getComponentCategory({ db,validation })(id);
    res.status(200).send({ statusCode: 200, message: validation.messages.single_data, data: result });
  } catch (error) {
    console.error("Error fetching component sub category data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const saveComponentCategory = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const userid = req.user.userid;

    body.id = '0';

    const result = await dao.saveComponentCategory({ db, validation })(body, userid);

    if (result.success === true) {
      res.status(200).send({
        statusCode: 200,
        message: validation.messages.add_success
      });
    } else {
      res.status(400).send({
        statusCode: 400,
        message: result.errors?.[0] || "Failed to save category."
      });
    }
  } catch (error) {
    console.error("Error on save component category data:", error.message);
    res.status(500).send({
      statusCode: 500,
      message: "Internal server error."
    });
  }
};


const updateComponentCategory = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    const userid = req.user.userid;

    const result = await dao.updateComponentCategory({ db, validation })(body, userid);

    if (result.success === true) {
      res.status(200).send({
        statusCode: 200,
        message: validation.messages.edit_success,
        data: result,
      });
    } else {
      res.status(400).send({
        statusCode: 400,
        message: result.errors || 'Failed to update category',
      });
    }
  } catch (error) {
    console.error("Error on update component category data:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: "An error occurred. Please try again later...",
    });
  }
};


const changestatus = ({ dao, db }) => async(req,res,next) => {
  try {
      const body = req.body;
      const loginId = req.user.userid;
      
      let result = await dao.changestatus({ db })(body, loginId);
      if(result){
        return res.status(200).send({statusCode:200, message: "Component category status updated successfully"});
      }else{
        return res.status(500).send({statusCode:500, message: "An error occurred. Please try again later."});
      }
  }catch (err) { next(err) }
};

const deleteCategory = ({ dao, db ,validation}) => async (req, res) => {
  try {
    const body=req.body;
    const result = await dao.deleteCategory({ db ,validation})(body);
    if(result.status==true)
    {
      res.status(200).send({statusCode: 200, message: result.message});
    }else{
      res.status(400).send({statusCode: 400, message: result.errors});
    }

  } catch (error) {
    console.error("Error deleting sub category data:", error.errors);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 

const verifyCategory =({dao ,db ,validation}) =>async(req,res,next)=>{
  try {
      const body = req.body;
      const user = req.user;
      let result =  await dao.verifyCategory({ db, validation })(body,user,next);
      const { status, ...resData } = result;
      if(result?.status){
        return res.status(200).send({statusCode:200, data: resData});
      }else if (!result.status && result.errors && result.errors.length > 0) {
        return  res.status(400).send({ statusCode : 400, errors: result.errors });
      } else {
        return  res.status(400).send({ statusCode : 400, errors: [validation.messages.something_wrong_try_later] });
      } 
  }catch (err) {  console.log('verifyCategory err==>>', err);  next(err) }
}

const importCategory = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.id = '0';
    const userID = req.user.userid;
    const result = await dao.importCategory({ db, validation })(body, userID);
    if (result.success === true) {
      res.status(200).send({ statusCode: 200, message: result.message });
    } else {
      res.status(400).send({ statusCode: 400, message: result.errors });
    }
  } catch (error) {
    console.error("Error importing category:", error);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};
module.exports = {
  componentCategorylist,
  getComponentCategorybyId,
  saveComponentCategory,
  updateComponentCategory,
  changestatus,
  deleteCategory,
  verifyCategory,
  importCategory
}
  