const validator = (schema, property) => async (req, res, next) => {
    try {
        if(property == 'params'){
            const value = req[property];
                  const dynamicValue = Object.values(value)[0]; 
                  const { error } = schema.validate(dynamicValue, { abortEarly: false });
                  if (error) {
                    const errorMessage = error.details[0].message;
                    return res.status(400).json({ statusCode: 400, error: errorMessage });
                  }
        }else{
            const value = req[property];
            const { error } = schema.validate(value, { abortEarly: false, allowUnknown: true }); 
            if (error) {
              const errors = error.details.map((err) => err.message);
                  return res.status(400).json({ statusCode: 400, errors: errors });
            }
        }
      next();
    } catch (err) {
      next(err);
    }
  };
  module.exports = validator;