const getfaq = ({ dao, db, validation }) => async (req, res, next) => {
    try {
      const result = await dao.getfaq({ db })();
      return res.status(200).send({statusCode: 200, message: validation.messages.faq_fetched, data: result});
    } catch (err) {
      console.error("Error fetching FAQs:", err);
      return res.status(500).send({statusCode: 500, message: validation.messages.faq_fetch_error});
    }
  };

module.exports = {getfaq};