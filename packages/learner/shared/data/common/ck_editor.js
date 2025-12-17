import React,{useEffect} from "react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import loader from "../../../public/assets/img/loader.svg"
const EditorComponent = (props) => {
const { onChange, editorLoaded, data ,setEditorLoaded } = props;

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
        />
      ) : (
        <div><img src={loader.src}/>Loading Please Wait...</div>
      )}
    </div>
  );
};

export default EditorComponent;