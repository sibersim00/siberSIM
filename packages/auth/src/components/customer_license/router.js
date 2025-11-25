module.exports = (iocContainer) => {
  const { express, controller, crypto } = iocContainer;
  const router = express.Router();
  
  router.post('/validate-license', crypto.cryptoDecrypt(), controller.validateCustomerLicense(iocContainer));
  return router;
}
