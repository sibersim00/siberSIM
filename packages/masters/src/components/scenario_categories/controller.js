const getscenarioAll = ({ dao, db, validation }) => async (req, res) => {
  try {
    const result = await dao.getscenarioAll({ db })(null);
    res.status(200).send({ statusCode: 200, message: validation.messages.get_scenario_categories, data: result });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};

const getScenarioCategorybyId = ({ dao, db, validation }) => async (req, res) => {
  try {
    const id = req.params.id;
    const result = await dao.getScenarioCategorybyId({ db })(id);
    res.status(200).send({ statusCode: 200, message: validation.messages.get_scenario_category_details, data: result });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};

const save = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.id = '0';
    const userid = req.user.userid;

    const result = await dao.save({ db })(body, userid);

    if (result.status === true) {
      return res.status(200).send({
        statusCode: 200,
        message: validation.messages.save_success,
      });
    } else {
      return res.status(400).send({
        statusCode: 400,
        message: result.errors,
      });
    }
  } catch (error) {
    console.error("Error on save scenario category data:", error.message);
    res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error,
    });
  }
};

const update = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.id = '0';
    const userid = req.user.userid;

    const result = await dao.update({ db })(body, userid);

    if (result.status === true) {
      return res.status(200).send({
        statusCode: 200,
        message: validation.messages.update_success,
      });
    } else {
      return res.status(400).send({
        statusCode: 400,
        message: result.errors,
      });
    }
  } catch (error) {
    console.error("Error on update data:", error.message);
    return res.status(500).json({
      statusCode: 500,
      error: validation.messages.server_error,
    });
  }
};


const statusChange = ({ dao, db, validation }) => async (req, res) => {
  try {
    const body = req.body;
    body.loginId = req.user.userid;
    const result = await dao.statusChange({ db, validation })(body);
    
    res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message, data: result.data });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};

const deleteById = ({ dao, db, validation }) => async (req, res) => {
  try {
    const id = req.body.scenariocategoryid;
    const result = await dao.deleteById({ db, validation })(id);
    
    if (result.status === true) {
      return res.status(200).send({ statusCode: 200, message: validation.messages.delete_success});
    } else {
      return res.status(400).send({ statusCode: 400, message: result.message });
    }
  } catch (error) {
    console.error("Error Deleting Scenario Category data:", error.message);
    res.status(500).json({ error: validation.messages.server_error });
  }
};

const scenariocategoryverify = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    const body = req.body;
    const user = req.user;
    const result = await dao.scenariocategoryverify({ db, validation })(body, user, next);
    const { status, ...resData } = result;
    
    if (result?.status) {
      return res.status(200).send({ statusCode: 200, data: resData });
    } else if (!result.status && result.errors && result.errors.length > 0) {
      return res.status(400).send({ statusCode: 400, errors: result.errors });
    } else {
      return res.status(400).send({ statusCode: 400, errors: [validation.messages.something_wrong_try_later] });
    }
  } catch (err) {
    console.log('scenariocategoryverify err==>>', err);
    next(err);
  }
};

const scenariocategoryImport =({dao ,db ,validation}) =>async(req,res,next)=>{
  try {
      const body = req.body;
      const user = req.user;
      let result =  await dao.scenariocategoryImport({ db, validation })(body,user,next);
      if(result?.status){
        return res.status(200).send({statusCode:200,  message: validation.messages.import_success});
      }else if (!result.status && result.errors && result.errors.length > 0) {
        return  res.status(400).send({ statusCode : 400, errors: result.errors });
      } else {
        return  res.status(400).send({ statusCode : 400, errors: [validation.messages.something_wrong_try_later] });
      } 
  }catch (err) {  console.log('scenariocategoryImport err==>>', err);  next(err) }
}


module.exports = {
  getscenarioAll,
  getScenarioCategorybyId,
  save,
  update,
  statusChange,
  deleteById,
  scenariocategoryverify,
  scenariocategoryImport
};
