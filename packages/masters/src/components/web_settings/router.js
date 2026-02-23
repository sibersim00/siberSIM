
module.exports = function (iocContainer) {
    const {express,controller,crypto,authJwt} = iocContainer; 
    const router = express.Router();

    router.get('/get_web_settings', [authJwt.authenticateToken([""])], controller.getWebSettings(iocContainer));
    router.get('/get_web_footer', [authJwt.authenticateToken([""])], controller.getWebFooter(iocContainer));
    router.post('/add-web-setting',  [authJwt.authenticateToken([""])],controller.addWebSettings(iocContainer));
    router.post('/update-web-setting', [authJwt.authenticateToken([""])], controller.updateWebSettings(iocContainer));
    router.post('/add-web-footer',  [authJwt.authenticateToken([""])],controller.addWebFooter(iocContainer));
    router.post('/update-web-footer',  [authJwt.authenticateToken([""])],controller.updateWebFooter(iocContainer));
    router.post('/change-status-footer', [authJwt.authenticateToken([""])], controller.changeStatusWebFooter(iocContainer));
    router.post('/upload-logo', [authJwt.authenticateToken([""])], controller.uploadLogo(iocContainer));
    router.post('/validate-license', [authJwt.validateLicenseToken], crypto.cryptoDecrypt(), controller.validateCustomerLicense(iocContainer));
  
    return router;
}