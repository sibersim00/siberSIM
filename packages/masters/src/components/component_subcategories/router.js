module.exports = (iocContainer) => {
    const { express, controller, validation, validator} = iocContainer;
    const router = express.Router();
    
    router.get('/list', controller.componentCategorylist(iocContainer));
    router.get('/get/:id', (req, res, next) => {
        if (!req.params.id) {
            let errors = ["Invalid Request: Component subcategory id is required"];
            return res.status(400).json({ statusCode: 400, message: errors }); // ✅ RETURN here
        }
        next();
    },validator(validation.idSchema,'params'), controller.getComponentCategorybyId(iocContainer));

    router.post('/save', validator(validation.schema,'body'),controller.saveComponentCategory(iocContainer));
    router.post('/update',  validator(validation.updateSchema,'body'),controller.updateComponentCategory(iocContainer));
    router.post('/status', validator(validation.statusSchema,'body'),controller.changeStatus(iocContainer));
    router.post('/delete', validator(validation.deleteSchema,'body'),controller.deleteCategory(iocContainer));
    return router;

}
