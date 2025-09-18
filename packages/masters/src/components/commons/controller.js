const getComponentByCategoryId = ({ dao, db, validation }) => async (req, res) => {
  try {
      const id = req.body.componentcategoryid
      const result = await dao.getComponentByCategoryId({ db })(id);
      return res.status(200).send({ statusCode: 200, data: result });
  } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};

const instructorlist = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.instructorlist({ db })();
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { next(err) }
}

const getJson = ({ dao, db }) => async (req, res, next) => {
  try {
    const body = req.body;
    const result = await dao.getJson({ db,body })();
    res.status(200).send({ statusCode: 200, message: validation.messages.save_success, data: result });
   
  }
  catch (err) { next(err) }
}

const saveJson = ({ dao, db }) => async (req, res, next) => {
  try {
   const body = req.body;
    const result = await dao.saveJson({ db,body })();
    return res.status(200).send({ statusCode: 200, data: result });
   
  }
  catch (err) { next(err) }
}

const scenariosubcategorylist = ({ dao, db, validation }) => async (req, res, next) => {
  try {
   const body = req.body;
    const result = await dao.scenariosubcategorylist({ db,body })();
    return res.status(200).send({ statusCode: 200, data: result });
   
  }
  catch (err) { next(err) }
}
const scenariocategorylist = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.scenariocategorylist({ db })();
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { next(err) }
}

const componentcategorylist = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.componentcategorylist({ db })();
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

const componentsubcategorylist = ({ dao, db, validation }) => async (req, res, next) => {
  try {
    const body = req.body;
    const result = await dao.componentsubcategorylist({ db,body })();
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { next(err) }
}

const emailtemplatelist = ({ dao, db }) => async (req, res, next) => {
  try {
    const orgId = req.user.orgid;
    const result = await dao.emailtemplatelist({ db })(orgId);
    return res.status(200).send({ statusCode: 200, data: result });
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
const studentlist = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.studentlist({ db })();
    return res.status(200).send({ statusCode: 200, data: result });
  } catch (err) {
    next(err);
  }
};
const studentlistevent = ({ dao, db }) => async (req, res, next) => {
  try {
    const session_userid = req.user.userid;
    const usertype = req.user.usertype;
    const eventid = parseInt(req.body.eventid, 10);

    if (isNaN(eventid)) {
      return res.status(400).send({ statusCode: 400, message: "Invalid or missing eventid" });
    }
    const result = await dao.studentlistevent({ db })(session_userid, usertype, eventid);
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { 
    next(err);
  }
};


const batchlist = ( {dao, db})=> async( req, res, next)=>{
  try {
    const session_userid = req.user.userid; 
    const usertype = req.user.usertype; 
    const result = await dao.batchlist({db})(session_userid,usertype)
    return res.status(200).send({ statusCode: 200, data: result });
  } catch (err) {
    next(err)
  }
}

const scenariolist = ({ dao, db }) => async (req, res, next) => {
  try {
    const session_userid = req.user.userid;
    const usertype = req.user.usertype;

    const result = await dao.scenariolist({ db })(session_userid, usertype);

    return res.status(200).send({
      statusCode: 200,
      message: "Scenario list fetched successfully.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};


const scenarioinstructorlist = ({ dao, db }) => async (req, res, next) => {
  try {
    const { scenarioid } = req.body;
    
    if (!scenarioid) {
      return res.status(400).send({ statusCode: 400, message: "scenarioid is required" });
    }

    const result = await dao.scenarioinstructorlist({ db })(scenarioid);

return res.status(200).send({
  statusCode: 200,
  data: result[0] || null
});

  } catch (err) {
    next(err);
  }
};

const scenariodiagramlist = ( {dao, db})=> async( req, res, next)=>{
  try {
    const param = req.param;
    const session_userid = req.user.userid; 
    const usertype = req.user.usertype; 
    const result = await dao.scenariodiagramlist({db})(session_userid,usertype,param)
    return res.status(200).send({ statusCode: 200, data: result });
  } catch (err) {
    next(err)
  }
}

const faqlist = ({ dao, db }) => async (req, res, next) => {
  try {
    const usertype = req.user.usertype; 
    const result = await dao.faqlist({ db })(usertype);
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { next(err) }
}

const eventScenarioList = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.eventScenarioList({ db })();
    return res.status(200).send({ statusCode: 200, data: result });
  }
  catch (err) { next(err) }
}

// controller/user.js
const theme = ({ dao, db }) => async (req, res, next) => {
  try {
    const session_userid = req.user.userid;
    const themeParam = req.query.theme; // optional: "dark" or "light"

    const result = await dao.theme({ db })(session_userid, themeParam);

    return res.status(200).send({
      statusCode: 200,
      message: themeParam ? "Theme updated." : "Theme fetched.",
      data: result, // returns "dark" or "light"
    });
  } catch (err) {
    next(err);
  }
};



module.exports = {
  instructorlist,
  componentcategorylist,
  scenariocomponentcategorylist,
  componentsubcategorylist,
  scenariosubcategorylist,
  scenariocategorylist,
  emailtemplatelist,
  rolelist,
  studentlistevent,
  batchlist,
  scenariolist,
  getJson,
  saveJson,
  getComponentByCategoryId,
  scenarioinstructorlist,
  scenariodiagramlist,
  faqlist,
  eventScenarioList,
  studentlist,
  theme,
  
  

  
  
}
