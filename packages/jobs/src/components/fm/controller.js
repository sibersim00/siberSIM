
const nodePath = require('path');
const coreFolder = nodePath.resolve(__dirname + '/../../../');
const dirTree = require('../../utilits/directory-tree');
const {escapePath, checkExtension,checkVariables} = require('../../utilits/filemanager');
const fs = require('graceful-fs');
const AppError = require('../../utilits/appError');
const fsExtra = require('fs-extra');


const uploadFiles = ({ }) => async(req, res, next) => {
        const { folderpath } = req.body;
            let folders = folderpath.split('/');
            var path = "";
            for(var folder of folders){
                path = escapePath(path);
                folder = escapePath(folder);
                mask =parseInt('0777');
                var nextpath=`${path}${folder}/`;
                fs.mkdir(`${coreFolder}${path}/${folder}`, parseInt('0777'), function(err) {
                    if (err) {
                        if (err.code == 'EEXIST'){
                            console.log("Folder already exists")
                        }
                    } else {
                        console.log("Folder succesfully created!")
                    }
                });
                path = nextpath;
            }
            path = escapePath(path);
            let fileNames = [];
            try { 
                req.files.forEach(function (element, index, array) {
                    var timestamp = new Date().getTime();
                    var newName = timestamp+'_'+element.originalname;
                    if(checkExtension(nodePath.extname(newName))){
                        fs.readFile(element.path, function (err, data) { 
                            fs.writeFile(`${coreFolder}${path}/${newName}`, data, function (err) {
                                if(err) {
                                    return next(new AppError(err.message, 400));
                                }
                                fileNames.push(path+newName);
                            });
                          });
                    }
                });
            } catch (error) {
                return next(new AppError(error.message, 400));
            }
            setTimeout(()=>{
                res.status(200).json({
                    'status': 'success',
                    'message': 'Files are succesfully uploaded!',
                    'files':fileNames
                });
            },400);
        }



const folderInfo = ({}) => async (req, res, next) => {
    try {
        const { path } = req.body;

        const paths = dirTree(coreFolder + escapePath(path), {
            normalizePath: true,
            removePath: coreFolder,
            includeFiles: true
        });

        res.status(200).send(paths);
    } catch (error) {
        console.error("Error in folderInfo:", error);
        res.status(500).json({ message: "Failed to fetch folder info", error: error.message });
    }
};

const createFolder = ({}) => async (req, res, next) => {
    try {
        let { path, foldername } = req.body;

        // Validate inputs
        if (!foldername) {
            return next(new AppError('Folder name is required', 400));
        }

        path = escapePath(path || '');
        foldername = escapePath(foldername);

        const fullPath = nodePath.join(coreFolder, path, foldername);

        // Create the directory (including any missing parent directories)
        fsExtra.ensureDirSync(fullPath);

        return res.status(200).json({
            status: 'success',
            message: 'Folder created successfully!',
            folderPath: fullPath.replace(coreFolder, '') // return relative path
        });
    } catch (error) {
        console.error('Error in createFolder:', error);
        return next(new AppError(error.message, 400));
    }
};

const saveImage = ({}) => async (req, res, next) => {
        let { path, file, isnew } = req.body;
        path = escapePath(path);
        if (!file) {
    return next(new AppError('File data is missing in request body', 400));
}
        file = file.split(';base64,').pop();
        if(!checkExtension(nodePath.extname(path))){
            return next(new AppError(`Wrong File Format ${path}`, 400));
        }
        if(!checkVariables([path, file])){
            return next(new AppError('Variables not seted!', 400));
        }
        if(isnew){
            var nameNew = path.split('.');
            var timestamp = new Date().getTime();
            path = `${nameNew[0]}_${timestamp}.${nameNew[1]}`;
        }
        fs.writeFile(`${coreFolder}${path}`, file, {encoding: 'base64'}, function(err) {
            if(err){ 
                return next(new AppError("Error while creating file", 400)); 
            }
            res.status(200).json({
                'status': 'success',
                'message': 'File or Folder succesfully renamed!'
            });
        });
    };

   const deleteImage = ({}) => async (req, res, next) => {
        let { items } = req.body;
        if(!checkVariables([items])){
            return next(new AppError('Variables not seted!', 400));
        }
        var pendingRequests = [];
        var errorDeleted = [];
            items.forEach(function(item, i, arr) {
                item = escapePath(item);
                pendingRequests.push(
                    fsExtra.remove(`${coreFolder}${item}`, err=>{
                            if (err) {
                                errorDeleted.push({item, err});
                            }
                    })
                )
            });
            Promise.all(pendingRequests)
            .then(values => { 
                res.status(200).json({
                                    'status': 'success',
                                    'message': 'File or folder succesfully deleted!'
                                });
            })
            .catch(error => { 
                return next(new AppError(errorDeleted, 400));
            });
    }




 module.exports = {
    uploadFiles,
    folderInfo,
    createFolder,
    saveImage,
    deleteImage
 }
