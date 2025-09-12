const list = ({ dao, db }) =>  async (req, res, next) => {
    const id = req.params.id ? parseInt(req.params.id): null;
    await dao.list({ db })(id)
    .then(result => {
      return res.status(200).send({ statusCode: 200, data:result, message: '' });
    }).catch(err => {
            return res.status(500).send({ statusCode: 500, message: err.message }); 
    });
}

const create = ({ dao, db, validation }) => async (req, res) => {
    try {
        const body = req.body;
        const loginId = req.user.userid;
        body.userid = loginId;
        body.orgid = '0';
      let result = await dao.create({ db, validation })(body);
      if (result.status) {
        res.status(200).send({ statusCode: 200, message: result.message });
      } else {
        res.status(500).json({ statusCode: 500, errors: result.errors });
      }
    } catch (error) {
      console.error("Error on create data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
    }
  };

const update = ({ dao, db, validation }) => async(req,res) => {
    try {
        const id = parseInt(req.params.id);
        const body = req.body;
        body.userid = req.user.userid;
        body.orgid = id;
       let result = await dao.update({ db, validation })(body);
      if (result.status) {
        res.status(200).send({ statusCode: 200, message: result.message });
      } else {
        res.status(500).json({ statusCode: 500, errors: result.errors });
      }
    } catch (error) {
      console.error("Error on create data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
    }
  };
  

const status = ({ dao, db, validation }) => async(req,res,next) => {
    try {
        const id = parseInt(req.params.id);
        const body = req.body;
        const loginId = req.user.loginid;
        const { error, value } = validation.statusschema.validate(body,{ abortEarly: false });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({statusCode:400, errors:errors});
        } else {
            let result = await dao.status({ db })(id, body, loginId);
            return res.status(200).send({statusCode:200, message: validation.messages.status_change, data:result});
        }
    }catch (err) { next(err) }
}
module.exports = {
    list,
    create,
    update,
    status
}