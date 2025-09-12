const list = ({ dao, db }) =>  async (req, res, next) => {
    await dao.list({ db })(null)
    .then(result => {
      return res.status(200).send({ statusCode: 200, data:result, message: '' });
    }).catch(err => {
            return res.status(500).send({ statusCode: 500, message: err.message }); 
    });
}

const getById = ({ dao, db }) => async (req, res, next) => {
    const id = parseInt(req.params.id);
    await dao.getById({ db })(id)
    .then(result => {
      return res.status(200).send({ statusCode: 200, data:result, message: '' });
    }).catch(err => {
        return res.status(500).send({ statusCode: 500, message: err.message }); 
    });
}

const parentlist = ({ dao, db }) =>  async (req, res, next) => {
    try {
        const result = await dao.parentlist({ db })();
        return res.status(200).send({statusCode:200, data:result, message:""});
    }
    catch (err) { next(err) }
}

const create = ({ dao, db, validation }) => async(req,res,next) => {
    try {
        const body = req.body;
        const loginId = req.user.userid;
        const { error, value } = validation.schema.validate(body,{ abortEarly: false,allowUnknown:true  });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({statusCode:400, errors:errors});
        } else {
            await dao.create({ db })(body, loginId)
            .then(result => {
                return res.status(200).send({ statusCode : result.statusCode, message: result.message });
              }).catch(err => {
                //   return res.status(500).send({ statusCode : result.statusCode, message: result.message }); 
                  return res.status(500).send({ statusCode: 500, message: err.message || "Internal Server Error" });
              });
        }
    }catch (err) { next(err) }
}

const update = ({ dao, db, validation }) => async(req,res,next) => {
    try {
        const id = parseInt(req.params.id);
        const body = req.body;
        const loginId = req.user.loginid;
        const { error, value } = validation.schema.validate(body,{ abortEarly: false,allowUnknown:true  });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({statusCode:400, errors:errors});
        } else {
            let result = await dao.update({ db })(id, body, loginId);
            return res.status(200).send({statusCode:200, message: "Menu updated successfully.", data:result});
        }
    }catch (err) { next(err) }
}

const remove = ({ dao, db }) =>  async (req, res, next) => {
    try {
        let id=req.params.id;
        await dao.remove({ db })(id)
        .then(result => {
            return res.status(200).send({ statusCode:200, message: "Menu was deleted successfully." });
          }).catch(err => {
              console.log("Error",err);
              return res.status(500).send({ statusCode : 500, message: "An error occurred. Please try again later." }); 
          });
    }
    catch (err) { next(err) }
}

const status = ({ dao, db, validation }) => async(req,res,next) => {
    try {
        const id = parseInt(req.params.id);
        const body = req.body;
        const loginId = req.user.userid;
        const { error, value } = validation.statusschema.validate(body,{ abortEarly: false });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({statusCode:400, errors:errors});
        } else {
            let result = await dao.status({ db })(id, body, loginId);
            return res.status(200).send({statusCode:200, message: "Status was updated successfully."});
        }
    }catch (err) { next(err) }
}

module.exports = {
    list,
    getById,
    parentlist,
    create,
    update,
    remove,
    status
}