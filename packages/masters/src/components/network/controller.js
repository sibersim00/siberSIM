const fetchAndStoreOVSNetworks =
  ({ dao, db, validation }) =>
  async (req, res) => {
    try {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const body = {
        userId: req.user?.id || null,   // optional: auth user
        node: req.query?.node || 'ofisgate', // support ?node=yourNode
      };

      const result = await dao.fetchAndStoreOVSNetworks({ db,validation })(body, ipAddress);
      res.status(200).send({statusCode: 200, message: validation.messages.fetch,data:result});
      
    } catch (err) {
      console.error('Controller error in fetchAndStoreOVSNetworks:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  const list = ({ dao, db, validation }) => async (req, res) => {
    try {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const body = {
        userId: req.user?.id || null,   // optional: auth user
        node: req.query?.node || 'ofisgate', // support ?node=yourNode
      };
      const result = await dao.list({ db,validation })(body, ipAddress);
      res.status(200).send({statusCode: 200, message: validation.messages.list,data:result});
       } catch (err) {
      console.error("Error fetching data:", err.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  module.exports = {
       fetchAndStoreOVSNetworks,
       list
  }