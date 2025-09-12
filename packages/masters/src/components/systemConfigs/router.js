module.exports = (iocContainer) => {
  const { express, controller } = iocContainer;
  const router = express.Router();
  const { authJwt } = require("../../middleware");

  // Get System Config Types
  router.get('/sc_types',[authJwt.authenticateToken], controller.systemconfigTypes(iocContainer));

  // Submit System Config
  router.post('/sc_submit/:service_type_id',[authJwt.authenticateToken], controller.systemconfigSubmit(iocContainer));
  
  // Get System Config Types
  router.get('/sc_email_user/:service_type_id',[authJwt.authenticateToken], controller.getEmailUsers(iocContainer));

  // Submit System Config Email Users
  router.post('/sc_users_submit/:service_type_id',[authJwt.authenticateToken], controller.systemconfigUserSubmit(iocContainer));

  // Update System Config Status
  router.post('/sc_update_status',[authJwt.authenticateToken], controller.systemconfigStatusUpdate(iocContainer));

  // Update System Config Users Status
  router.post('/sc_user_update_status',[authJwt.authenticateToken], controller.systemconfigUserStatusUpdate(iocContainer));

   // Update System Config Default Status
   router.post('/sc_types_defaultupdate',[authJwt.authenticateToken], controller.systemconfigDefaultUpdate(iocContainer));

   // Update System Config Default Status
   router.post('/sc_testemail',[authJwt.authenticateToken], controller.systemconfigTestEmail(iocContainer));


  return router;
}
