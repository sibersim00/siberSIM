const list = ({ dao, db }) =>  async (req, res, next) => {
    try {
        await dao.list({ db })(null)
        .then(result => {
            return res.status(200).send({ statusCode: 200, data:result, message: '' });
        }).catch(err => {
            return res.status(500).send({ statusCode: 500, message: err.message }); 
        });
    }
    catch (err) { next(err) }
}

const getById = ({ dao, db }) => async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await dao.getById({ db })(id)
        .then(result => {
            return res.status(200).send({ statusCode: 200, data:result, message: '' });
        }).catch(err => {
            return res.status(500).send({ statusCode: 500, message: err.message }); 
        });
    }
    catch (err) { next(err) }
}

const rolemenumap = ({ dao, db, validation }) => async(req,res,next) => {
    try {
        const body = req.body;
        const loginId = req.user.userid;
        const { error, value } = validation.rolemenuschema.validate(body,{ abortEarly: false,allowUnknown:true  });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({statusCode:400, errors:errors});
        } else {
            let result =  await dao.rolemenumap({ db })(body, loginId);
            if(result){
                return res.status(200).send({statusCode:200, message: "Mapping was created successfully."});
            }
        }
    }catch (err) { next(err) }
}

const viewRoleMenuMap = ({ dao, db }) => async(req,res,next) => {
    try {
        const body = req.body;
        const loginId = req.user.userid;
        let result =  await dao.viewRoleMenuMap({ db })(body, loginId);
        if(result){
            return res.status(200).send({statusCode:200,data:result, message: ""});
        }
    }catch (err) { next(err) }
}

const storeRoleMenuMap = ({ dao, db }) => async(req,res,next) => {
    try {
        const data = req.body.data;
        const roleId = req.body.roleid;
        const loginId = req.user.userid;
        let result =  await dao.storeRoleMenuMap({ db })(data, roleId, loginId, true);
        if(result.success){
            return res.status(200).send({statusCode:200,data:result, message: result.message});
        }else{
            return res.status(500).send({statusCode:500,message: result.message});
        }
    }catch (err) { next(err) }
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
                  return res.status(500).send({ statusCode : result.statusCode, message: result.message }); 
              });
        }
    }catch (err) { next(err) }
}

const remove = ({ dao, db }) =>  async (req, res, next) => {
    try {
        let id=req.params.id;
        let result = await dao.remove({ db })(id);
        return res.status(200).send({statusCode:200, message: "Role was deleted successfully."});
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

const userlist = ({ dao, db }) => async(req,res,next) => {
    try {
        let result =  await dao.userlist({ db })();
        return res.status(200).send({statusCode:200, message: "", data:result});
    }catch (err) { next(err) }
}

const userrolemap = ({ dao, db,validation }) => async(req,res,next) => {
    try {
        const body = req.body;
        const orgid = req.user.orgid;
        const loginId = req.user.loginid;  
        const { error, value } = validation.userroleschema.validate(body,{ abortEarly: false,allowUnknown:true  });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({statusCode:400, errors:errors});
        } else {
            let result =  await dao.userrolemap({ db })(body, loginId,orgid);
            if(result){
                return res.status(200).send({statusCode:200, message: "Successfully grant access rights to user.", data:result});
            }else{
                return res.status(200).send({statusCode:200, message: "Access rights already given to user.", data:result});
            }
        }
    }catch (err) { next(err) }
}

const userrolerights = ({ dao, db, validation }) => async(req,res,next) => {
    try {
        const body = req.body;
        const orgId = req.user.orgid;
        const { error, value } = validation.userrolerightschema.validate(body,{ abortEarly: false,allowUnknown:true  });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({statusCode:400, errors:errors});
        } else {
            let result =  await dao.userrolerights({ db })(body,orgId);
            return res.status(200).send({statusCode:200, data:result});
        }
    }catch (err) { next(err) }
}

const userrolemapremove = ({ dao, db }) =>  async (req, res, next) => {
    try {
        let id = req.params.id;
        let result = await dao.userrolemapremove({ db })(id);
        return res.status(200).send({statusCode:200, message: "User role was deleted successfully."});
    }
    catch (err) { next(err) }
}

const rolelist = ({ dao, db }) => async (req, res, next) => {
    try {
      const result = await dao.rolelist({ db })();
      return res.status(200).send({ statusCode: 200, data: result });
    }
    catch (err) { next(err) }
}

module.exports = {
    list,
    getById,
    create,
    remove,
    status,
    rolemenumap,
    userrolemap,
    userrolerights,
    userrolemapremove,
    viewRoleMenuMap,
    storeRoleMenuMap,
    userlist,
    rolelist
}