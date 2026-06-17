

const multer  = require("multer");
// const upload  = multer(); // memory storage — we just forward the file
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },  // 10GB
});

module.exports = function (iocContainer) {
  const { express, controller, validator, validation } = iocContainer;

  const router = express.Router();

  router.post("/set-scenario-learner-config",validator(validation.setScenarioLearnerConfigSchema, "body"),controller.setScenarioLearnerConfiguration(iocContainer));
  router.post("/update-complete-terminate",validator(validation.updateCompleteTerminatelearner, "body"),controller.updateCompleteTerminatelearner(iocContainer));
  router.post("/auto-terminate-expired-scenarios",controller.autoTerminateFailedScenarios(iocContainer));
  router.post("/start-scenario-learner",controller.startScenarioLearner(iocContainer));
  router.post("/restart-scenario-learner",controller.restartscenarioLearner(iocContainer));
  router.post("/create-snapshot", controller.createSnapshot(iocContainer));
  router.delete("/delete-snapshot", controller.deleteSnapshot(iocContainer));
  router.post("/restore-snapshot", controller.restoreSnapshot(iocContainer));
  router.post("/pause-scenario-learner",controller.pauseScenarioLearner(iocContainer));
  router.post("/resume-scenario-learner",controller.resumeScenarioLearner(iocContainer));
  router.post("/generate-access-token",controller.generateProxmoxAccessToken(iocContainer));
  router.post("/delete-scenario-learner",controller.deleteScenarioLearner(iocContainer));
  router.post("/save", controller.save(iocContainer));
  router.post("/vm-details",controller.vmDetails(iocContainer));
  router.post("/vm-config",controller.getVmConfig(iocContainer));
  router.post("/stop-vm",controller.stopScenarioVM(iocContainer));
  router.post("/add-vm-network",controller.addScenarioVmNetwork(iocContainer));
  router.post("/delete-vm-network",controller.deleteScenarioVmNetwork(iocContainer));
  router.post("/modify-vm-network",controller.ModifyScenarioVmNetwork(iocContainer));
  router.post("/add-single-component",controller.addRuntimeComponent(iocContainer));
  router.post("/delete-single-network",controller.stopDestroySingleComponent(iocContainer));
  router.post("/disconnect-single-network",controller.disconnectRuntimeNetworks(iocContainer));
  router.post("/connect-single-network",controller.connectRuntimeNetwork(iocContainer));
  router.post("/plug-single-network",controller.plugRuntimeNetwork(iocContainer));
  router.post("/unplug-single-network",controller.unplugRuntimeNetwork(iocContainer));
  router.post("/stop-single-component",controller.stopComponent(iocContainer));
  router.post("/start-single-component",controller.startComponent(iocContainer));
  router.post("/restart-single-component",controller.restartComponent(iocContainer));
  router.post("/trigger-export",controller.triggerExport(iocContainer));
  router.post("/trigger-import", controller.triggerImport(iocContainer));
  router.get("/import-list",     controller.getImportList(iocContainer));
  router.post("/check-import",    upload.single("zipfile"), controller.checkScenarioIdentification(iocContainer));
  router.get("/import/:importid", controller.getImportStatus(iocContainer));

  // import ------------------
  router.post("/upload-zst",controller.uploadComponentZst(iocContainer));
  router.get("/zst-status",  controller.getZstUploadStatus(iocContainer));
  router.post("/start-restore", controller.startRestore(iocContainer));


  // doenload zip nad zst---------
  router.get("/download-export-zip",controller.downloadExport(iocContainer));
  router.get("/download-component",controller.downloadComponentzst(iocContainer));

  return router;
};
