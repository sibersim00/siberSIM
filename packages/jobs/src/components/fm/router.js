
const multer = require('multer');
const nodePath = require('path');

const coreFolder = nodePath.resolve(__dirname + '/../');
const TMP_PATH = `${coreFolder}/uploads/tmp`;

// configure multer
const upload = multer({
    dest: `${TMP_PATH}/`,
    limits: {
        files: 15, // allow up to 5 files per request,
        fieldSize: 5 * 1024 * 1024 // 2 MB (max file size)
    }
});
module.exports = function (iocContainer) {
    const {
        express,
        controller,
    } = iocContainer;

    const router = express.Router();

router.post('/uploadfiles', upload.any(), controller.uploadFiles(iocContainer));
router.post('/folder',controller.folderInfo(iocContainer));
router.post('/createfolder', controller.createFolder(iocContainer));
router.post('/saveimage', controller.saveImage(iocContainer));
router.post('/delete', controller.deleteImage(iocContainer));






return router;

}