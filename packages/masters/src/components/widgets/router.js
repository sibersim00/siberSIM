module.exports = function (iocContainer) {
    const { express, controller, validation, validator } = iocContainer;
    const { authJwt } = require("../../middleware");
    const router = express.Router();

router.get('/get', controller.getWidgetsAll(iocContainer));
router.post('/save', controller.saveWidget(iocContainer));
router.post('/update', controller.updateWidget(iocContainer));
router.post('/delete', controller.deleteWidget(iocContainer));
    router.post('/change-status', controller.statusChange(iocContainer));



    return router;
};
