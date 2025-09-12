const rateLimit =require('express-rate-limit');
  const limiter =rateLimit({
      windowMs:2*60*1000, //2 minutes
      max:10, //limit each Ip to 10 requests per windows
      message:{ statusCode: 400, message: 'Too Manay requests from this IP, Please try again later' }
  });

module.exports = (iocContainer) => {
  const { express, controller, crypto, validator, validation } = iocContainer;
  const router = express.Router();
  router.post('/checklogin',limiter, crypto.cryptoDecrypt(), controller.checklogin(iocContainer));
  router.post('/verifylogin',limiter, crypto.cryptoDecrypt(), controller.verifylogin(iocContainer));
  router.post('/verifydirectlogin', crypto.cryptoDecrypt(), controller.verifyDirectLogin(iocContainer));

  router.get('/geteventlist',controller.geteventlist(iocContainer))
  return router;
}