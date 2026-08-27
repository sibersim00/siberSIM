const theme =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const learner_id = req.learneruser.learner_id;
      const themeParam = req.query.theme;
      const result = await dao.theme({ db })(learner_id, themeParam);
      return res
        .status(200)
        .send({
          statusCode: 200,
          message: themeParam ? "Theme updated." : "Theme fetched.",
          data: result,
        });
    } catch (err) {
      next(err);
    }
  };

const getAmbientMotion =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      const learner_id = req.learneruser.learner_id;
      const ambient_motion = await dao.getAmbientMotion({ db })(learner_id);
      return res.status(200).send({
        statusCode: 200,
        message: "Ambient motion preference fetched.",
        data: { ambient_motion },
      });
    } catch (err) {
      next(err);
    }
  };

const updateAmbientMotion =
  ({ dao, db }) =>
  async (req, res, next) => {
    try {
      if (typeof req.body?.ambient_motion !== "boolean") {
        return res.status(400).send({
          statusCode: 400,
          message: "ambient_motion must be true or false.",
        });
      }

      const learner_id = req.learneruser.learner_id;
      const ambient_motion = await dao.updateAmbientMotion({ db })(
        learner_id,
        req.body.ambient_motion
      );
      return res.status(200).send({
        statusCode: 200,
        message: "Ambient motion preference updated.",
        data: { ambient_motion },
      });
    } catch (err) {
      next(err);
    }
  };

  const componentcategorylist = ({ dao, db }) => async (req, res, next) => {
    try {
      const result = await dao.componentcategorylist({ db })();
      return res.status(200).send({ statusCode: 200, data: result });
    }
    catch (err) { next(err) }
  }

  const componentsubcategorylist = ({ dao, db, validation }) => async (req, res, next) => {
    try {
      const body = req.body;
      const result = await dao.componentsubcategorylist({ db,body })();
      return res.status(200).send({ statusCode: 200, data: result });
    }
    catch (err) { next(err) }
  }


  const scenariocomponentcategorylist = ({ dao, db }) => async (req, res) => {
    try {
      const { componentcategoryid } = req.body;
  
      if (!componentcategoryid || typeof componentcategoryid !== 'number') {
        return res.status(400).json({
          statusCode: 400,
          error: 'componentcategoryid must be a valid number'
        });
      }
  
      const data = await dao.scenariocomponentcategorylist(db, componentcategoryid);
  
      return res.status(200).json({
        statusCode: 200,
        data
      });
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error'
      });
    }
  };


  const scenariocategorylist = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.scenariocategorylist({ db })();
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { next(err) }
}

const scenariosubcategorylist = ({ dao, db, validation }) => async (req, res, next) => {
  try {
   const body = req.body;
    const result = await dao.scenariosubcategorylist({ db })(body);
    return res.status(200).send({ statusCode: 200, data: result });
   
  }
  catch (err) { next(err) }
}
module.exports = {
  theme,
  getAmbientMotion,
  updateAmbientMotion,
  componentcategorylist,
  componentsubcategorylist,
  scenariocomponentcategorylist,
  scenariocategorylist,
  scenariosubcategorylist
};
