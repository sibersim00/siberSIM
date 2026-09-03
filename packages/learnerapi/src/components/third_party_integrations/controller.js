const validate = (schema, body) => {
  const { error, value } = schema.validate(body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });
  return {
    value,
    errors: error ? error.details.map((detail) => detail.message) : null,
  };
};

const getLearnerId = (req) => req.learneruser?.learner_id;

const getIntegrations = ({ dao, db, validation }) => async (req, res) => {
  try {
    const data = await dao.getIntegrations({ db })(getLearnerId(req));
    return res.status(200).send({
      statusCode: 200,
      message: validation.messages.fetched,
      data,
    });
  } catch (error) {
    console.error("Third party integration fetch error:", error.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.serverError });
  }
};

const saveIntegration = ({ dao, db, validation }) => async (req, res) => {
  try {
    const checked = validate(validation.saveSchema, req.body);
    if (checked.errors) {
      return res.status(400).send({ statusCode: 400, message: checked.errors[0], errors: checked.errors });
    }
    const learnerId = getLearnerId(req);
    const duplicate = await dao.findDuplicate({ db })(learnerId, checked.value.integration_name);
    if (duplicate) {
      return res.status(409).send({ statusCode: 409, message: validation.messages.duplicate });
    }
    await dao.saveIntegration({ db })(learnerId, checked.value);
    return res.status(200).send({ statusCode: 200, message: validation.messages.saved });
  } catch (error) {
    console.error("Third party integration save error:", error.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.serverError });
  }
};

const updateIntegration = ({ dao, db, validation }) => async (req, res) => {
  try {
    const checked = validate(validation.updateSchema, req.body);
    if (checked.errors) {
      return res.status(400).send({ statusCode: 400, message: checked.errors[0], errors: checked.errors });
    }
    const learnerId = getLearnerId(req);
    const duplicate = await dao.findDuplicate({ db })(
      learnerId,
      checked.value.integration_name,
      checked.value.integration_id
    );
    if (duplicate) {
      return res.status(409).send({ statusCode: 409, message: validation.messages.duplicate });
    }
    const affected = await dao.updateIntegration({ db })(learnerId, checked.value);
    if (!affected) {
      return res.status(404).send({ statusCode: 404, message: validation.messages.notFound });
    }
    return res.status(200).send({ statusCode: 200, message: validation.messages.updated });
  } catch (error) {
    console.error("Third party integration update error:", error.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.serverError });
  }
};

const deleteIntegration = ({ dao, db, validation }) => async (req, res) => {
  try {
    const checked = validate(validation.deleteSchema, req.body);
    if (checked.errors) {
      return res.status(400).send({ statusCode: 400, message: checked.errors[0], errors: checked.errors });
    }
    const affected = await dao.deleteIntegration({ db })(getLearnerId(req), checked.value.integration_id);
    if (!affected) {
      return res.status(404).send({ statusCode: 404, message: validation.messages.notFound });
    }
    return res.status(200).send({ statusCode: 200, message: validation.messages.deleted });
  } catch (error) {
    console.error("Third party integration delete error:", error.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.serverError });
  }
};

const changeStatus = ({ dao, db, validation }) => async (req, res) => {
  try {
    const checked = validate(validation.statusSchema, req.body);
    if (checked.errors) {
      return res.status(400).send({ statusCode: 400, message: checked.errors[0], errors: checked.errors });
    }
    const affected = await dao.changeStatus({ db })(
      getLearnerId(req),
      checked.value.integration_id,
      checked.value.status
    );
    if (!affected) {
      return res.status(404).send({ statusCode: 404, message: validation.messages.notFound });
    }
    return res.status(200).send({ statusCode: 200, message: validation.messages.statusChanged });
  } catch (error) {
    console.error("Third party integration status error:", error.message);
    return res.status(500).send({ statusCode: 500, message: validation.messages.serverError });
  }
};

module.exports = {
  getIntegrations,
  saveIntegration,
  updateIntegration,
  deleteIntegration,
  changeStatus,
};
