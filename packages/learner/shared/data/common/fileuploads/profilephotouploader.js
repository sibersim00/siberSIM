'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import dummy_profile from "../../../../public/assets/img/dummy_profile.png";
import { toast, ToastContainer } from "react-toastify";


export default function ProfilePhotoUploader({
    ismulti = false,
    name = 'profile_url',
    acceptedFileTypes = ['image/png', 'image/jpeg'],
    handleUpload: callbackHandleUpload, setProfileImage,
    fetchfiles = [], 
    folderpath = 'profile',
    setFiles,
    setUploadsFiles,
    progress = () => {},
    load = () => {},
    error = () => {}, 
}) {
  const accessToken = JSON.parse(localStorage.getItem('accessTokenLearner')); 
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef();
  const uploadsfiles = [];

  useEffect(() => {

    if (fetchfiles && fetchfiles.length > 0 && fetchfiles[0]) {
      setPreview(`${process.env.API_URL_FILEMANAGER}`+fetchfiles[0]);
    }
  }, [fetchfiles]); 

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png"];
  if (!validTypes.includes(file.type)) {
    error("Only PNG, JPG and JPEG  files are allowed.");
    toast.error("Only PNG, JPG and JPEG files are allowed.", {
      position: toast.POSITION.TOP_RIGHT,
      hideProgressBar: true,
      theme: "colored",
    });
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  setPreview(previewUrl);

  const fieldName = name;
  const formData = new FormData();
  formData.append(fieldName, file, file.name.replace(/\s+/g, ""));
  formData.append("folderpath", folderpath);

  try {
    const response = await axios.post(
      `${process.env.API_URL_FILEMANAGER}/fm/uploadfiles`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          progress(percentage);
        },
      }
    );

    if (response.data?.files?.length > 0) {
      const uploadedPath = response.data.files[0];
      const uploadedFileObj = {
        file: uploadedPath,
        name: fieldName,
      };

      load(uploadedPath);
      uploadsfiles.push(uploadedFileObj);
      callbackHandleUpload(fieldName, uploadsfiles, "uploaded");
      setFiles?.([uploadedFileObj]);
      setProfileImage?.([uploadedFileObj]);
      setUploadsFiles?.([uploadedFileObj]);
    }
  } catch (err) {
    console.error("Upload failed", err);
    error("Error uploading the file");
  }
};

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div style={styles.container}>
      <div style={styles.imageWrapper} onClick={handleClick}>
        <img
          onError={(e) => { e.target.onerror = null; e.target.src = dummy_profile.src }}
          src={preview || dummy_profile.src}
          alt="Profile Preview"
          style={styles.image}
        />
      </div>
      <input
        type="file"
        name={name}
        multiple={ismulti}
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
    marginBottom: '20px',
  },
  imageWrapper: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #ccc',
    cursor: 'pointer',
    transition: '0.3s ease',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
};
