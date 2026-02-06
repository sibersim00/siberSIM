
module.exports = function (iocContainer) {
    const {express,controller,crypto,authJwt} = iocContainer; 
    const router = express.Router();

    router.get('/get_web_settings', controller.getWebSettings(iocContainer));
    router.get('/get_web_footer', controller.getWebFooter(iocContainer));
    router.post('/add-web-setting', controller.addWebSettings(iocContainer));
    router.post('/update-web-setting', controller.updateWebSettings(iocContainer));
    router.post('/add-web-footer', controller.addWebFooter(iocContainer));
    router.post('/update-web-footer', controller.updateWebFooter(iocContainer));
    router.post('/change-status-footer', controller.changeStatusWebFooter(iocContainer));
    router.post('/upload-logo', controller.uploadLogo(iocContainer));
    router.post('/validate-license', [authJwt.validateLicenseToken], crypto.cryptoDecrypt(), controller.validateCustomerLicense(iocContainer));
  
    return router;
}