module.exports = function (iocContainer) {
  const { express,authJwt } = iocContainer;
  const router = express.Router();
  router.get('/refreshToken', [authJwt.refreshToken]);
  router.post("/logout", [authJwt.clearToken]);
  return router;
};

