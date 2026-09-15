import React, {useCallback, useEffect, useState } from "react";
import axios from 'axios';
import {  Row, Col, OverlayTrigger, Popover, Tooltip} from "react-bootstrap";
import ImageViewer from "react-simple-image-viewer";
  
const FileBrowser = ({ name, sourcepath, uploadpath, ismulti, handleBrowse, extensions, oldFiles }) => {   
  let [files, setFiles] = useState([]);
  let [showPopOver, setShowPopOver] = useState(); 
  let [selectedfiles, setSelectedFiles] = useState([]); 
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState([]);
  const accessToken = JSON.parse(localStorage.getItem('accessToken')); // Replace with your actual Bearer token  
  const callbackHandleSelected = (type) =>{
    if(type=='Cancel')
    {
      handleBrowse(name,'');
      setShowPopOver(0);
    }else{
      // Call Copy API and collect response
      let completesrc = '/uploads/' + uploadpath;
      let payload = {
        'destination':completesrc,
        'items':selectedfiles
      }
      // Replace 'your-api-endpoint' with your actual API endpoint
      axios.post(process.env.API_URL_FILEMANAGER+'/fm/copyCustom', payload, {
      headers: {
          Authorization: `Bearer ${accessToken}`, // Include the Bearer token in the headers
        }
      })
      .then((response) => {
          if(oldFiles && !ismulti)
          {
            console.log('Remove function called with source:', oldFiles); 
            let items = [oldFiles];
            let payload = {
              'items':items
            } 
            // Refresh UI after remove
            deleteDataAndRefreshUI(payload);
          }
          handleBrowse(name, response.data.uploadedFiles);
          setShowPopOver(0);
      })
      .catch((err) => {
        // Handle errors during upload
        console.error('Error while coping files', err);
        error('Error coping the file');
      }); 
      }
  } 
  const deleteDataAndRefreshUI = async (payload) => {
     // Replace 'your-api-endpoint' with your actual API endpoint
     axios.post(process.env.API_URL_FILEMANAGER+'/fm/delete', payload, {
       headers: {
           Authorization: `Bearer ${accessToken}`, // Include the Bearer token in the headers
         }
       })
       .then((response) => {  
            console.log('response',response)
       })
       .catch((err) => {
         // Handle errors during upload
         console.error('Deleting failed', err);
         error('Error Deleting the file');
       }); 
 };

  const handleSelected = (file) =>{ 
    if(ismulti)
    {
        // Check if the checkbox is already in the array
        const isChecked = selectedfiles.includes(file); 
        // Update the array based on the checkbox's checked state
        if (isChecked) {
          setSelectedFiles(selectedfiles.filter((item) => item !== file));
        } else {
          setSelectedFiles([...selectedfiles, file]);
        }
    }else{
      setSelectedFiles([file]);
    }
  } 

  useEffect(()=>{
    if(showPopOver==1){
      let completesrc = '/uploads/' + sourcepath;
      let payload = {
        'path':completesrc
      }
      // Replace 'your-api-endpoint' with your actual API endpoint
      axios.post(process.env.API_URL_FILEMANAGER+'/fm/folder', payload, {
      headers: {
          Authorization: `Bearer ${accessToken}`, // Include the Bearer token in the headers
        }
      })
      .then((response) => {
           if(response.data && response.data.children.length > 0)
           {
              let childs = response.data.children;
              let fileValues = [];
              childs.filter((file)=>{
                if(extensions.length > 0){
                  if(file.type=="file" && extensions.includes(file.extension))
                  {
                    fileValues.push(file);
                  }
                }else{
                  fileValues.push(file);
                }
              });
              setSelectedFiles([]);
              setFiles(fileValues);
           }
      })
      .catch((err) => {
        // Handle errors during upload
        console.error('Error while getting folders', err);
        error('Error getting the file');
      });
    }
  },[showPopOver]);

  const openImageViewer = useCallback((path) => {  
    setCurrentImage([path])
    setIsViewerOpen(true);
  }, []);

  const closeImageViewer = () => { 
    setIsViewerOpen(false);
    setCurrentImage([])
  };
  const imageExtensions = [".jpg", ".jpeg",".png",".svg",".gif"];
  const getFileUI = (ext) =>{
    let icons = {
      ".png": "/assets/filemanager/img/files/png.svg",
      ".jpg": "/assets/filemanager/img/files/jpg.svg",
      ".jpeg": "/assets/filemanager/img/files/jpeg.svg",
      ".doc": "/assets/filemanager/img/files/doc.svg",
      ".docx": "/assets/filemanager/img/files/doc.svg",
      ".xls": "/assets/filemanager/img/files/xls.svg",
      ".pdf": "/assets/filemanager/img/files/pdf.svg",
      ".ppt": "/assets/filemanager/img/files/ppt.svg",
      ".svg": "/assets/filemanager/img/files/svg.svg",
      ".xml": "/assets/filemanager/img/files/xml.svg",
      ".psd": "/assets/filemanager/img/files/psd.svg",
      ".ai": "/assets/filemanager/img/files/ai.svg",
      ".mp4": "/assets/filemanager/img/files/mp4.svg",
      ".txt": "/assets/filemanager/img/files/txt.svg",
      ".csv": "/assets/filemanager/img/files/csv.svg",
      ".zip": "/assets/filemanager/img/files/zip.svg",
      ".gif": "/assets/filemanager/img/files/gif.svg",
      ".rar": "/assets/filemanager/img/files/zip-1.svg",
      ".tar.gz": "/assets/filemanager/img/files/zip-1.svg",
      "broken": "/assets/filemanager/img/files/search.svg",
      "folder": "/assets/filemanager/img/files/folder.svg",
      "folderopen": "/assets/filemanager/img/files/folderopen.svg",
      "folderfull": "/assets/filemanager/img/files/folderfull.svg"
    }  
    if(icons[ext]){
      return icons[ext];
    }
    return icons['broken'];
    
  }

  const popoverBrowse= () => { 
    return <Popover id="popover-trigger-click-root-close" title="Select File" className="wd-75p " style={{maxWidth:'75%'}}> 
        <Popover.Body className="pd-5">
            <Row className="row-sm">
              <Col className="text-dark mg-l-10 mg-r-10 pd-b-2"><i className="fa fa-folder-open fs-12"></i> File Manager {">"} <i className="fa fa-folder-open fs-12 "></i> <span className="tx-bold">{sourcepath} </span></Col>
            </Row>
            <Row className="row-sm pd-10">
              <div className=" overflow-y-auto ht-250 border"> 
                <div className="d-block">  
                    <Row className="d-flex pd-10 mg-r-5  ">
                      {files && files.map((f,index)=>{ 
                        return( 
                              <div className="media  rounded-10 text-center imgmainc" key={index}> 
                                    {ismulti == false && 
                                      <input type="radio" name="selectedFile" onClick={(e)=>{handleSelected(f.path)}}/>
                                    }
                                    {ismulti == true && 
                                      <input type="checkbox" name="selectedFile" checked={selectedfiles.includes(f.path)}
                                      onChange={() => handleSelected(f.path)}/>
                                    }

                                    <div className="media-body imgc pointer">
                                      { imageExtensions.includes(f.extension)  ?  
                                        <img onClick={() =>openImageViewer(process.env.API_URL_FILEMANAGER+f.path)} src={process.env.API_URL_FILEMANAGER+f.path}   />
                                        :
                                        <>
                                          <img src={getFileUI(f.extension)} /> 
                                        </>
                                      }
                                    </div>
                                    
                                    <span className="mg-t-5 badge text-dark bg-light tx-10">{f.extension}</span>
                                  </div>  
                        )
                        })}
                         
                    </Row>
                </div>
              </div>
              <div className="text-right mg-t-10">
                <button type="button" className="btn btn-sm btn-primary" onClick={(e)=>{ callbackHandleSelected('Submit')}}>
                   Select
                </button>
                <button type="button" className="btn btn-sm btn-secondary mg-l-10" onClick={(e)=>{ callbackHandleSelected('Cancel')}}>
                   Cancel
                </button>
              </div>
            </Row>
        </Popover.Body>
        {isViewerOpen && (
          <ImageViewer key={Math.random()}
          src={currentImage}
          currentIndex={0}
          onClose={closeImageViewer}
          disableScroll={false}
          backgroundStyle={{
              backgroundColor: "rgba(0,0,0,0.9)",
              zIndex:9999
          }}
          closeOnClickOutside={true}
          />
      )}
      </Popover>  
  
  }; 

  return (
    <>
      <div className="ht-auto  ">
        <label className="form-label">&nbsp;</label>
          <OverlayTrigger
            trigger="click"
            rootClose
            title="Status"
            placement="top"
            overlay={popoverBrowse()} 
            show={showPopOver == 1 ? true : false}
          >
                     
                 
              <button type="button" onClick={(e)=>{setShowPopOver(1)}} className="avatar avatar-md bg-primary-transparent text-primary btn mg-l-10  ">
                <OverlayTrigger  placement="top"  overlay={<Tooltip> Storage Browser</Tooltip>} >
                  <i className="si si-globe tx-18"></i>
                </OverlayTrigger>
            </button>
          </OverlayTrigger> 
      </div>
    </>
  );
} 
export default FileBrowser;