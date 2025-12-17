const systemconfigTypes = ({ dao, db }) =>  async (req, res, next) => {
  let orgid = req.user.orgid; 
  await dao.systemconfigTypes({ db })({orgid})
    .then(result => {
      return res.status(200).send({ statusCode: 200, data: result.data,categories:result.categories, message: result.message });
  }).catch(err => {
        return res.status(500).send({ statusCode: 500, message: err.message }); 
  }); 
}

const getEmailUsers = ({ dao, db }) =>  async (req, res, next) => {

  let service_type_id = req.params.service_type_id;  
  await dao.getEmailUsers({ db })({service_type_id})
    .then(result => {
      return res.status(200).send({ statusCode: 200, data: result.data, message: result.message });
  }).catch(err => {
        return res.status(500).send({ statusCode: 500, message: err.message }); 
  }); 
}

const systemconfigSubmit = ({ dao, db }) =>  async (req, res, next) => {
  let service_type_id = req.params.service_type_id;  
  let userid = req.user.userid; 
  let body = req.body;
  if(!service_type_id)
  {
    return res.status(400).json({statusCode:400, message:'service_type_id is required'});
  }

  await dao.systemconfigSubmit({ db })({body,service_type_id,userid})
    .then(result => {
      return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
  }).catch(err => {
        return res.status(500).send({ statusCode: 500, message: err.message }); 
  }); 
}
const systemconfigDefaultUpdate = ({ dao, db }) =>  async (req, res, next) => {
  let service_type_id = req.body.service_type_id;  
  let userid = req.user.userid;
  if(!service_type_id)
  {
    return res.status(400).json({statusCode:400, message:'service_type_id is required'});
  }

  await dao.systemconfigDefaultUpdate({ db })({service_type_id,userid})
    .then(result => {
      return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
  }).catch(err => {
        return res.status(500).send({ statusCode: 500, message: err.message }); 
  }); 
}

const systemconfigUserSubmit = ({ dao, db }) =>  async (req, res, next) => {
  let service_type_id = req.params.service_type_id;  
  let userid = req.user.userid; 
  let body = req.body;
  await dao.systemconfigUserSubmit({ db })({body,service_type_id,userid})
    .then(result => {
      return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
  }).catch(err => {
        return res.status(500).send({ statusCode: 500, message: err.message }); 
  }); 
}

const systemconfigStatusUpdate = ({ dao, db, validation }) =>  async (req, res, next) => {
  let body = req.body; 
  let userid = req.user.userid; 
  try {
    const { error, value } = validation.statusSchema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
        const errors = error.details.map((err) => err.message);
        return res.status(400).json({statusCode:400, errors:errors});
    } else {
      await dao.systemconfigStatusUpdate({ db })({body,userid})
        .then(result => {
          return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
      }).catch(err => {
            return res.status(500).send({ statusCode: 500, message: err.message }); 
      }); 
    }

  }
  catch (err) { next(err) }
}
const systemconfigUserStatusUpdate = ({ dao, db, validation }) =>  async (req, res, next) => {
  let body = req.body; 
  let userid = req.user.userid; 
  try {
    const { error, value } = validation.statusUserSchema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
        const errors = error.details.map((err) => err.message);
        return res.status(400).json({statusCode:400, errors:errors});
    } else {
      await dao.systemconfigUserStatusUpdate({ db })({body,userid})
        .then(result => {
          return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
      }).catch(err => {
            return res.status(500).send({ statusCode: 500, message: err.message }); 
      }); 
    }

  }
  catch (err) { next(err) }
}
const systemconfigTestEmail = ({ dao, db, validation }) =>  async (req, res, next) => {
  let body = req.body; 
  try {
    const { error, value } = validation.testEmailSchema.validate(body,{ abortEarly: false,allowUnknown:true });
    if (error) {
        const errors = error.details.map((err) => err.message);
        return res.status(400).json({statusCode:400, errors:errors});
    } else {
      await dao.systemconfigTestEmail({ db })({body})
        .then(result => {
          return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
      }).catch(err => {
            return res.status(500).send({ statusCode: 500, message: err.message }); 
      }); 
    }

  }
  catch (err) { next(err) }
}
module.exports = {
  systemconfigTypes,
  systemconfigSubmit,
  systemconfigStatusUpdate,
  systemconfigUserSubmit,
  getEmailUsers,
  systemconfigUserStatusUpdate,
  systemconfigDefaultUpdate,
  systemconfigTestEmail
}