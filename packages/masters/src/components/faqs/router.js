module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;
  const router = express.Router();

  router.get('/get', controller.getFaqsAll(iocContainer));
  router.get('/get/:id', controller.getFaqById(iocContainer));

  // Use validator middleware with Joi validation schema for POST routes
  router.post(
    '/save',
    validator(validation.saveSchema, 'body'),
    controller.save(iocContainer)
  );

  router.post(
    '/update',
    validator(validation.updateSchema, 'body'),
    controller.update(iocContainer)
  );

  router.post(
    '/delete',
    validator(validation.deleteSchema, 'body'),
    controller.deleteById(iocContainer)
  );

  router.post(
    '/change-status',
    validator(validation.statusChangeSchema, 'body'),
    controller.statusChange(iocContainer)
  );

  router.post(
    '/verify',
    validator(validation.faqVerifySchema, 'body'),
    controller.faqVerifyController(iocContainer)
  );

  router.post(
    '/import',
    validator(validation.faqImportSchema, 'body'),
    controller.faqImportController(iocContainer)
  );

  return router;
};
