import React, { useEffect, useRef } from "react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";

const Ckcomponent = (props) => {
  const { onChange, editorLoaded, data,setEditorLoaded } = props;

  useEffect(()=>{
    setEditorLoaded(true);
  },[])

  return (
    <div>
      {editorLoaded ? (
        <CKEditor
          editor={ClassicEditor}
          data={data}
          config={{}}
          onChange={(event, editor) => {
            const data = editor.getData();
            onChange(data);
          }}
          style={{ height: "400px", width: "100%" }} 
        />
      ) : (
        <div>Editor loading</div>
      )}
    </div>
  );
};

export default Ckcomponent;