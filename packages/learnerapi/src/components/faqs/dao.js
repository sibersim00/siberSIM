const getfaq = ({ db }) => async () => {
    try {
      let result = await db.sequelize.query(`SELECT faq.question, faq.answer, faq.order_by, faq.type FROM mst_faqs faq WHERE faq.type IN ('Learner') and deletedon is NULL`,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.log("sceanrios err==>", error);
    }
  };

module.exports = {getfaq};