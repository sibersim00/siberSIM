module.exports = (schema, property) => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((item) => item.message);
    return res.status(400).send({ statusCode: 400, message: errors[0], errors });
  }
  req[property] = value;
  next();
};
