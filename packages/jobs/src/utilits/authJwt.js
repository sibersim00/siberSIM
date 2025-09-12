const jwt = require("jsonwebtoken");
const keys = require('../keys');

const authenticateToken = (req, res, next) => {
  
  const accessToken = req.headers['authorization'];
  if (accessToken == null)
    return res.sendStatus(401);
  const token = accessToken.split(' ');
  jwt.verify(token[1], keys.JWT_SECURITY_KEY, (err, data) => {
    if (err) return res.status(401).send(err);
    req.user = data;
    next();
  })
}

const authJwt = {
  authenticateToken: authenticateToken
};
module.exports = authJwt;