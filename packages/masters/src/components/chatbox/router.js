
module.exports = function (iocContainer) {
    const {  express,controller,validator,validation } = iocContainer; 
    const router = express.Router();

   
    router.post("/getMessages", controller.getMessagesByScenario(iocContainer));
    router.post("/send", controller.sendMessage(iocContainer) );
    router.post("/markSeen", controller.markMessagesSeen(iocContainer));
    router.post("/refresh", controller.refreshByScenario(iocContainer));
    return router;
}