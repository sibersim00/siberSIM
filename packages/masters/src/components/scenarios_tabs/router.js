
module.exports = function (iocContainer) {
    const { express, controller, validator, validation } = iocContainer;
    const router = express.Router();

    router.get(
        "/list",
        controller.getList(iocContainer)
    );

    router.post(
        "/save",
        validator(validation.saveSchema, "body"),
        controller.save(iocContainer)
    );
    router.get(
        "/widgetlist",
        controller.getWidgetList(iocContainer)
    );
    return router;
}