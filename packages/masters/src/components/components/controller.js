const getAll = ({ dao, db, validation }) => async (req, res) => {
    try {
        const result = await dao.getAll({ db })(null);
        res.status(200).send({ statusCode: 200, message: validation.messages.component_detail, data: result });
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const getById = ({ dao, db, validation }) => async (req, res) => {
    try {
        const session_userid = req.params.uuid
        const result = await dao.getById({ db })(session_userid);
        res.status(200).send({ statusCode: 200, message: validation.messages.component_detail, data: result });
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const save = ({ dao, db, validation }) => async (req, res) => {
    try {
      const body = req.body;
      const session_userid = req.user.userid;
      const ipAddress = req.ip;
      const result = await dao.save({ db, validation })(body, session_userid, ipAddress);
      return res.status(result.statusCode).send(result);
    } catch (error) {
      console.error("Error on save data:", error.message);
      return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const update = ({ dao, db, validation }) => async (req, res) => {
    try {
        const body = req.body;
        let session_userid = req.user.userid;
        const result = await dao.update({ db, validation })(body, session_userid);
        return res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message });
        
    } catch (error) {
        console.error("Error on save data:", error.message);
        return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const statusChange = ({ dao, db,validation }) => async (req, res) => {
    try {
        let body = req.body
        body.userid = req.user.userid
        const result = await dao.statusChange({ db,validation })(body);
        res.status(result.statusCode).send({ statusCode: result.statusCode, message: result.message, data: result.data });
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const getVms = ({ dao, db, validation }) => async (req, res) => {
    try {
      const body = req.body;
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const result = await dao.getVms({ db ,validation})(body, ipAddress);
      res.status(200).json(result);
    } catch (err) {
      console.error("Error fetching subcategory:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

  const vmDetails = ({ dao, db, validation }) => async (req, res) => {
    try {
      const body = req.body;
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
      const result = await dao.vmDetails({ db,validation })(body, ipAddress);
      res.status(200).json(result);
    } catch (err) {
      console.error("Error fetching VM detail:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
}; 

  const deleteById = ({ dao, db,validation }) => async (req, res) => {
    try {
        let body = req.body;
        let session_userid = req.user.userid;
        const result = await dao.deleteById({ db,validation })(body,session_userid);
        res.status(200).send({ statusCode: 200, message: "Component Deleted Successfully" });
    } catch (error) {
        console.error("Error Deleting data:", error.message);
        res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

const fetchAndStoreOVSNetworks =
  ({ dao, db }) =>
  async (req, res) => {
    try {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const body = {
        userId: req.user?.id || null,   // optional: auth user
        node: req.query?.node || 'ofisgate', // support ?node=yourNode
      };

      const result = await dao.fetchAndStoreOVSNetworks({ db })(body, ipAddress);
      res.status(result.statusCode).json(result);
    } catch (err) {
      console.error('Controller error in fetchAndStoreOVSNetworks:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  
module.exports = {
    getAll,
    getById,
    save,
    update,
    statusChange,
    getVms,
    vmDetails,
    deleteById,
     fetchAndStoreOVSNetworks,
}