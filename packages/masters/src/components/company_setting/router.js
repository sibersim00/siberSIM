const multer = require("multer");

module.exports = function (iocContainer) {
  const { express, controller } = iocContainer;

  const router = express.Router();
  router.get("/export_masters", controller.exportMasters(iocContainer));
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

// -------- ROUTER --------
router.post(
  "/import_masters",
  upload.single("sqlFile"),   // 👈 frontend sends "sqlFile"
  controller.importMasters(iocContainer)
);

  return router;
};



