const getActions = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getActions({ db })();
    for (const row of result) {
      if(row.static_payloads)
      {
        row.static_payloads=JSON.parse(row.static_payloads)
      }
      else
      {
        row.static_payloads=[]
      }
    }
    res.status(200).send({statusCode: 200, message: "Get Email Action List",data:result});
  } catch (error) {
    console.error("Error fetching Email Action data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getSelectors = ({ dao, db}) => async (req, res) => {
  try {
    const action_id=req.params.id;
    const result = await dao.getSelectors({ db })(action_id);
    res.status(200).send({statusCode: 200, message: "Get Selectors List",data:result});
  } catch (error) {
    console.error("Error fetching Email Selectors data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getActivities = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getActivities({ db })(null);
    res.status(200).send({statusCode: 200, message: "Get Activities List",data:result});
  } catch (error) {
    console.error("Error fetching Email Selectors data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getActivityActions = ({ dao, db}) => async (req, res) => {
  try {
    const action_id=req.params.id;
    const result = await dao.getActivityActions({ db })(action_id);
    for (const row of result) {
      if(row.workflow)
      {
        row.workflow=JSON.parse(row.workflow)
      }
      else
      {
        row.workflow=[]
      }
    }
    res.status(200).send({statusCode: 200, message: "Get Activities List",data:result});
  } catch (error) {
    console.error("Error fetching Email Selectors data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getEmailSenders = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getEmailSenders({ db })();
    res.status(200).send({statusCode: 200, message: "Get Email Senders List",data:result});
  } catch (error) {
    console.error("Error fetching Email Selectors data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
const getEmailConfigs = ({ dao, db}) => async (req, res) => {
  try {
    const result = await dao.getEmailConfigs({ db })();
    for (const row of result) {
      row.form_payloads=JSON.parse(row.form_payloads)
      row.form_values=JSON.parse(row.form_values)      
    }
    res.status(200).send({statusCode: 200, message: "Get Email Configs List",data:result});
  } catch (error) {
    console.error("Error fetching Email Selectors data:", error.message);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
}; 
module.exports = {
  getActions,
  getSelectors,
  getActivities,
  getActivityActions,
  getEmailConfigs,
  getEmailSenders
}