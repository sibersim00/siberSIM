const { valid } = require("joi");

const getAll = ({ dao, db,validation }) => async (req, res) => {
  try {
    const usertype = req.user.usertype;
    let userid = req.user.userid;
      const result = await dao.getAll({ db,validation })(userid, usertype);
      res.status(200).send({ statusCode: 200, message: validation.messages.list_success, data: result });
  } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};
const getById = ({ dao, db, validation }) => async (req, res) => {
  try {
      const id = req.params.id
      const result = await dao.getById({ db,validation })(id);
      res.status(200).send({ statusCode: 200, message: validation.messages.single_data, data: result });
  } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};
const save = ({ dao, db, validation }) => async (req, res) => {
  try {
      const body = req.body;
          let userid = req.user.userid;
          const result = await dao.save({ db, validation })(body, userid);
          res.status(200).send({ statusCode: 200, message: validation.messages.single_data, data: result });
  } catch (error) {
      console.error("Error on save data:", error.message);
      return res.status(500).json({ statusCode: 500, error: "An error occurred. Please try again later." });
  }
};
const update = ({ dao, db, validation }) => async (req, res) => {
  try {
      const body = req.body;
          let userid = req.user.userid;
          const result = await dao.update({ db, validation })(body, userid);
          res.status(200).send({ statusCode: 200, message: validation.messages.edit_success, data: result });
  } catch (error) {
      console.error("Error on save data:", error.message);
      return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};
const changestatus = ({ dao, db, validation }) => async (req, res) => {
  try {
      let body = req.body
      body.userid = req.user.userid
      const result = await dao.changestatus({ db,validation })(body);
      res.status(200).send({ statusCode: 200, message: validation.messages.status_change, data: result });
  } catch (error) {
      console.error("Error fetching data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};
const deleteById = ({ dao, db, validation }) => async (req, res) => {
  try {
      const id = req.body.batchid
      await dao.deleteById({ db,validation })(id)
      res.status(200).send({ statusCode: 200, message: "Record has been Deleted Successfully" });
  } catch (error) {
      console.error("Error Deleting data:", error.message);
      res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};
module.exports = {
  getAll,
  getById,
  save,
  update,
  deleteById,
  changestatus
}