const path = require("path");
const fs = require("fs");
// const archiver = require("archiver");
// const unzipper = require("unzipper"); 

const list =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      let session_userid = req.learneruser.learner_id;
      const result = await dao.list({ db })(session_userid);
      res
        .status(200)
        .send({ statusCode: 200, message: "Get Scenario List", data: result });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };
  const getApproved = ({ dao, db, validation }) => async (req, res) => {
    try {
      const learner_id = req.learneruser.learner_id;
      const result = await dao.getApproved({ db })(learner_id);
      return res.status(200).send({ statusCode: 200, message: validation.messages.GET_ALL_SUCCESS, data: result });
    } catch (err) {
      console.error("Error in getAll:", err.message);
      return res.status(500).send({ statusCode: 500, message: validation.messages.GET_ALL_ERROR });
    }
  };
  

const getById =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const id = req.params.id;
      const result = await dao.getById({ db })(id);

      if (!result) {
        return res
          .status(404)
          .send({ statusCode: 404, message: "Scenario not found" });
      }
      res.status(200).send({
        statusCode: 200,
        message: "Get Scenario Details",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const create =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const body = req.body;
      const learner_id = req.learneruser.learner_id;
      const result = await dao.create({ db })(body, learner_id);
      return res.status(result.statusCode).send({
        statusCode: result.statusCode,
        message: result.message,
        scenarioid: result.custom_scenariouuid || null,
      });
    } catch (error) {
      console.error("Error on save data:", error.message);
      return res.status(500).json({
        statusCode: 500,
        error: "An error occurred. Please try again later.",
      });
    }
  };

const update =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const body = req.body;
      let session_userid = req.learneruser.learner_id;
      const result = await dao.update({ db })(body, session_userid);
      return res
        .status(result.statusCode)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error on save data:", error.message);
      return res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const saveDiagram =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      let body = req.body;
      const session_userid = req.learneruser.learner_id;
      const result = await dao.saveDiagram({ db, validation })(
        body,
        session_userid
      );
      return res
        .status(result.statusCode)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error Scenario Diagram save data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

const scenariodigramlist =
  ({ dao, db, validation }) =>
  async (req, res) => {
    const { scenarioid } = req.query;
    try {
      const result = await dao.scenariodigramlist({ db })(scenarioid);
      if (result.success) {
        return res.status(200).json({
          message: "Scenario diagrams fetched successfully",
          data: result.data,
        });
      }
      return res.status(500).json({
        message: "Error fetching scenario diagrams",
        error: result.message,
      });
    } catch (error) {
      console.error("Controller error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  };

const saveComponentconfiguration =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      let body = req.body;
      const session_userid = req.user.userid;
      const result = await dao.saveComponentconfiguration({ db, validation })(
        body,
        session_userid
      );
      return res
        .status(result.statusCode)
        .send({ statusCode: result.statusCode, message: result.message });
    } catch (error) {
      console.error("Error Component Configuration save data:", error.message);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  };

module.exports = {
  list,
  getApproved,
  getById,
  create,
  update,
  saveDiagram,
  scenariodigramlist,
  saveComponentconfiguration,
};
