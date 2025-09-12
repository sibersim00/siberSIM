module.exports = (iocContainer) => {
  const { express, controller, crypto} = iocContainer;
  const router = express.Router();
  router.post('/get',controller.getquestionlist(iocContainer)); 
  router.post('/save',crypto.cryptoDecrypt(),controller.save(iocContainer));
  router.get('/getAllLearnerQuiz/:scenariouuid',controller.getAllLearnerQuiz(iocContainer));
  return router;
}