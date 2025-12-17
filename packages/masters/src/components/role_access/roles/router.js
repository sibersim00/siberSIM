module.exports = function (iocContainer) {
    const { express, controller } = iocContainer;
    const router = express.Router();
    //LIST
    router.get('/list/:id?', controller.list(iocContainer));
    //BY ID
    // router.get('/:id', controller.list(iocContainer));
    //GET BY ID
    router.get('/getbyid/:id', controller.getById(iocContainer));
    //CREATE & UPDATE
    router.post('/upsert/:id?', controller.create(iocContainer));
    //DELETE
    router.delete('/:id', controller.remove(iocContainer));
    //UPDATE STATUS
    router.post('/status/:id', controller.status(iocContainer));
    //Menu Role Mapping
    router.put('/rolemenumap', controller.rolemenumap(iocContainer));
    //User Role Mapping
    router.post('/userrolemap', controller.userrolemap(iocContainer));
    //DELETE
    router.delete('/userrolemap/:id', controller.userrolemapremove(iocContainer));
    //Show Rights
    router.post('/userrolerights', controller.userrolerights(iocContainer));
    //Show Role Menus
    router.post('/viewrolemenus', controller.viewRoleMenuMap(iocContainer));
    //Update Role Menus
    router.post('/storerolemenus', controller.storeRoleMenuMap(iocContainer));
    //Get User Roles
    router.get('/getusers', controller.userlist(iocContainer));
    //Get User Roles Lists
    router.get('/getrolelist', controller.rolelist(iocContainer));
    return router;
}
