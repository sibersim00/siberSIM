module.exports = (iocContainer) => {
    const { express, controller, validation, validator} = iocContainer;
    const router = express.Router();
    
    router.get('/list', controller.componentCategorylist(iocContainer));

    router.get('/get/:id', (req, res, next) => {
        if (!req.params.id) {
            let errors = ["Invalid Request: Component category id is required"];
            return res.status(400).json({ statusCode: 400, message: errors }); // ✅ RETURN here
        }
        next();
    },validator(validation.idSchema,'params'), controller.getComponentCategorybyId(iocContainer));

    router.post('/save', validator(validation.schema,'body'),controller.saveComponentCategory(iocContainer));
    router.post('/update', validator(validation.updateschema,'body'), controller.updateComponentCategory(iocContainer));
    router.post('/status',validator(validation.statusschema,'body'),controller.changestatus(iocContainer) );
    router.post('/delete', validator(validation.deleteIdSchema,'body'),controller.deleteCategory(iocContainer));
    router.post('/verify', controller.verifyCategory(iocContainer));
    router.post('/import', controller.importCategory(iocContainer));

    return router;
}


