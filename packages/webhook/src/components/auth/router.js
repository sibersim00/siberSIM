const controller = require("./controller");
const validation = require("./validation");
const rateLimit = require("../../middleware/rateLimit");
module.exports = ({ express, validator, ...ioc }) => {
  const router = express.Router();
  router.post("/token", rateLimit(), validator(validation.loginSchema, "body"), controller(ioc));
  return router;
};
