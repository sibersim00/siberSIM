import React, {useEffect, useState } from "react";
import axios from 'axios';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
registerPlugin(FilePondPluginFileValidateType);

const FileUploader = ({ ismulti, folderpath, name, acceptedFileTypes, handleUpload, fetchfiles, disabled, isDelete }) => {  
  
  // Use Below extensions to set file accept type
  // [
  //   'image/*',
  //   'image/png','image/png',
  //   'application/zip',
  //   'application/pdf',
  //   'application/msword', // doc
  //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', //docx
  //   'application/vnd.ms-excel', // .xls
  //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', //xlsx
  //   'text/plain',
  //   'application/vnd.ms-powerpoint',
  //   'video/mp4',
  //   'text/csv',
  //   'text/csv',
  // ]

  let [files, setFiles] = useState([]);

  let [uploadsfiles, setUploadsFiles] = useState([]); 
  const accessToken = JSON.parse(localStorage.getItem('accessToken')); // Replace with your actual Bearer token 
  
    // useEffect(() => {
    // // Fetch information about files from your server 
    //   if(fetchfiles.length > 0){
    //     fetchDataAndSetFiles();
    //   }
    // }, [fetchfiles]); 
    // Run this effect only once on component mount 


    const fetchDataAndSetFiles = async () => {
      try {
        const response = await axios.post(
          process.env.API_URL_FILEMANAGER + '/fm/folder',
          { path: '/uploads/' + folderpath },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Include the Bearer token in the headers
            },
          }
        );
    
        if (response.data && response.data.children) {
          const filesToSet = response.data.children
            .filter((d) => fetchfiles.includes(d.path))
            .map((d) => ( 
              {
                file: '/uploads/' + folderpath + '/' + d.name,
                name:name,
                source: d.name, 
                options: {
                  type: 'local',  
                  file: {
                    name: d.name,
                    size: d.size,
                    type: d.extension,
                },
                },
              }
            ));
          setFiles(filesToSet);
          setUploadsFiles(filesToSet)
        }
      } catch (err) {
        // Handle errors during upload
        console.error('Upload failed', err);
      }
    };
    
    useEffect(() => {
      if (isDelete) {
        // Clear files if disabled is true
        setFiles([]);
        setUploadsFiles([]);
        handleUpload(name, [], 'removed'); // Trigger file removal in parent component
      }
    }, [isDelete]);

     // Customize this configuration according to your needs
     const pondOptions = {
        allowMultiple: ismulti,
        labelIdle: 'Drag & Drop your files or <span class="filepond--label-action">Browse</span>',
        instantUpload: true,
        files: files, // Set the initial files
        server: {
          process: (fieldName, file, metadata, load, error, progress, abort) => {
            const formData = new FormData(); 
            formData.append(fieldName, file, file.name.replace(/\s+/g, ''));
            // Append additional data, such as the folder path, to the FormData
            formData.append('folderpath', folderpath);
            // Replace 'your-api-endpoint' with your actual API endpoint
            axios.post(process.env.API_URL_FILEMANAGER+'/fm/uploadfiles', formData, {
            headers: {
                Authorization: `Bearer ${accessToken}`, // Include the Bearer token in the headers
              },
              onUploadProgress: (progressEvent) => {
                const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                progress(percentage);
              },
            })
            .then((response) => {
                // Handle the response from the server after successful upload
                load(response.data.files[0]);
                uploadsfiles.push({'file':response.data.files[0],'name':name});
                callbackHandleUpload(name,uploadsfiles,'uploaded'); // returns uploads files
            })
            .catch((err) => {
              // Handle errors during upload
              console.error('Upload failed', err);
              error('Error uploading the file');
            });
    
            // Optionally return an object with an abort function
            return {
              abort: () => {
                // This function will be called if the user decides to remove the file while it's still uploading
                console.log('Upload aborted');
                abort();
              },
            };
          },
          revert: async (uniqueFileId, load, error) => {
            console.log('Revert function called with uniqueFileId:', uniqueFileId); 
            // Append additional data, such as the folder path, to the FormData
            let items = [uniqueFileId];
            let payload = {
              'items':items
            }
           
            // Refresh UI after remove
            await deleteDataAndRefreshUI(payload,uniqueFileId);
            // Callback to handle the response after successful remove
            setTimeout(()=>{
                load();
            },400);
           

          },
          remove: async (source, load, error) => {
            console.log('Remove function called with source:', source);
            let completesrc = '/uploads/' + folderpath + '/' + source;
            let items = [completesrc];
            let payload = {
              'items':items
            }
            
            // Refresh UI after remove
            await deleteDataAndRefreshUI(payload,completesrc);
            // Callback to handle the response after successful remove
            setTimeout(()=>{
              load();
            },400); 
           
          },
          
        },
      };
      const deleteDataAndRefreshUI = async (payload,removeItem) => {
          // Replace 'your-api-endpoint' with your actual API endpoint
          axios.post(process.env.API_URL_FILEMANAGER+'/fm/delete', payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`, // Include the Bearer token in the headers
              }
            })
            .then((response) => {  
                let files = uploadsfiles.filter((f)=>(f.file !== removeItem)); 
                setUploadsFiles(files);
                // Handle the response from the server after successful upload 
                callbackHandleUpload(name,files,'removed'); // returns uploads files
            })
            .catch((err) => {
              // Handle errors during upload
              console.error('Deleting failed', err);
              // error('Error Deleting the file');
            }); 
      };

    const callbackHandleUpload = (name,file,flag) =>{
        handleUpload(name,file,flag)
    } 
   

    return (
      <FilePond className='mt-3 mb-5 m-lg-0'
        disabled={disabled ? disabled : false}
        name="files"
        files={files}
        allowFileTypeValidation={true}
        acceptedFileTypes={acceptedFileTypes}
        onupdatefiles={setFiles}
        allowMultiple={ismulti}
        {...pondOptions}
        />
    );
} 
export default FileUploader;