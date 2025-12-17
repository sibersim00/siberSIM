module.exports = (iocContainer) => {
  const { express, controller,validator,validation } = iocContainer;
  const router = express.Router();

  // Get Programs Questions
  router.get('/get/:scenariouuid',controller.scenarioQuestions(iocContainer)); 
  // Add/Update Questions
  router.post('/save',validator(validation.saveSchema,'body'),controller.scenarioQuestionSave(iocContainer));
  // import Questions
  router.post('/scenario_questions_import',controller.importScenarioQuestion(iocContainer));//validator(validation.importScenarioQuestionSchema,'body'),

   router.post('/scenario_questions_verify',controller.verifyImportScenarioQuestion(iocContainer));
  // Changes status
  router.post('/status_change',validator(validation.statusSchema,'body'),controller.statusChange(iocContainer));
  // delete
  router.get('/delete/:scenarioquestionid',controller.deleteById(iocContainer));

  return router;
}
