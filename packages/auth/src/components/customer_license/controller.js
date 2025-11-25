const validateCustomerLicense = ({ dao, db }) => async (req, res, next) => {
  try {
    const result = await dao.validateCustomerLicense({ db })(req.body);
    if (result.status) {
      return res.status(200).send({ statusCode: 200, data: result?.data, message: "Company settings fetched successfully", new : result.new });
    }else if(result.status == false){
      return res.status(400).send({ statusCode: 400, message: result?.message });
    }else{
      return res.status(404).send({ statusCode: 404, message: "Settings not found for the given company." });
    }
  } catch (err) {
    console.error("validateCustomerLicense err==>>", err);
    next(err);
  }
};

module.exports = {
  validateCustomerLicense,
}
