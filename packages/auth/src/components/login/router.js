
const rateLimit =require('express-rate-limit');
  const limiter =rateLimit({
      windowMs:2*60*1000, //2 minutes
      max:10    , //limit each Ip to 10 requests per windows
      message:{ statusCode: 400, message: 'Too Manay requests from this IP, Please try again later' }
  });

module.exports = (iocContainer) => {
  const { express, controller, crypto } = iocContainer;
  const router = express.Router();
  
  // Get Active oranizations || single organization by id
  router.get('/orglist/:id?', controller.organizationList(iocContainer));
  router.get('/company_setting', crypto.cryptoDecrypt(), controller.getCompanySettingController(iocContainer));
  router.post('/checklogin',limiter, crypto.cryptoDecrypt(), controller.checklogin(iocContainer));
  router.post('/verifylogin',limiter, crypto.cryptoDecrypt(), controller.verifylogin(iocContainer));
  router.post('/verifydirectlogin', crypto.cryptoDecrypt(), controller.verifyDirectLogin(iocContainer));
  router.get('/generateRewrites', controller.generateRewrites(iocContainer));
  router.post('/checkforgot', crypto.cryptoDecrypt(), controller.checkforgot(iocContainer));
  router.post('/verifyforgot', crypto.cryptoDecrypt(), controller.verifyforgot(iocContainer));
  router.post('/cryptodecrypt', crypto.cryptoDecrypt(), async (req, res, next) => { return res.status(200).send({ statusCode: 200, data: req.body }); });
  router.post('/cryptoencrypt', async (req, res, next) => { return res.status(200).send({ statusCode: 200, data: crypto.cryptoEncrypt(req.body) }); });
  return router;
}
