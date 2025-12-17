import React,{useState,useEffect,useMemo} from "react";
import { useFormik } from 'formik';
import { useDispatch, useSelector} from "react-redux";
import * as Yup from "yup";
import { toast } from "react-toastify";
import  { Row, Col, Card, Tooltip, Button,  Form,Spinner,OverlayTrigger,Popover , Table } from "react-bootstrap";
import { getCategoriesList } from "../../../redux/slices/masters/ComponentCategories";  
import { saveSubCategories,clearSaveSubCategories,updateSubCategories,clearUpdateSubCategories , getSubCategoriesList, getSingleSubCat, clearSingleSubCategories } from "../../../redux/slices/masters/ComponentSubCategories";
import Select from 'react-select' 
import "../../../utils/i18n";
import { useTranslation } from "react-i18next"; 
import dynamic from 'next/dynamic';  ;
import { emojiRegex } from "../../../utils/regex";
  
const EditorComponent = dynamic( () => { return import( '../../common/ckEditor' ); }, { ssr: false } );

const FileUploader = dynamic( () => { return import( '../../common/fileuploads/fileuploader' ); }, { ssr: false } );


import {FilePath} from '../../common/fileuploads/filepath';


const ComponentSubCategoriesForm = (props) => {
  const dispatch = useDispatch(); 
  const [catDropDownData, setCatDropDownData] = useState([]); 
  const [heading,setHeading] = useState('Add');
  const [rowValues,setRowValues] = useState({});
  const {setView,rowId,backView,  oneClick, handleOneClick} = props; 
  const { t, i18n } = useTranslation(); 
  const [isChecked, setIsChecked] = useState(true); 
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [initialHtml, setInitialHtml] = useState("");
 const banner_path = FilePath.componenet_subcategories;
  const category_path = FilePath.componenet_subcategories;
  const ismulti = false;
   const [uploadedFile, setUploadedFile] = useState({});
    const noEmojiTest = (value) => {
       if (typeof value !== "string") return true;
       return !emojiRegex.test(value);
     }; 
   const getSelectStyles = (fieldName) => {
    const error =
      !formValidation.values[fieldName] &&
      formValidation.errors[fieldName] &&
      formValidation.touched[fieldName];
    return error
      ? {
          ...customStyles,
          control: (styles) => ({
            ...styles,
            borderColor: "#EB5757",
            boxShadow: "0 0 0 0.001rem #EB5757",
          }),
        }
      : customStyles;
  };
  console.log('backViewbackView',backView);
  const customStyles = {
    control: (styles, { isFocused, isDisabled }) => ({
      ...styles,
      borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
      boxShadow: isDisabled ? null : isFocused ? "0 0 0 0.001rem #00d683" : null,
      "&:hover": {
        borderColor: isDisabled
          ? "#e8e8f7"
          : isFocused
          ? "#00d683"
          : styles.borderColor,
      },
    }),
  };
  useEffect(()=>{
    dispatch(getCategoriesList());
    dispatch(clearSingleSubCategories());
  },[])
  useEffect(() => {
    if(rowId && rowId!=="")
    {
      setHeading('Update');
      dispatch(getSingleSubCat(rowId));
    }
  },[rowId])
  useEffect(()=>{
      if(rowValues){
          setIsChecked(rowValues?.status)
          setInitialHtml(rowValues?.description)
      }
  },[rowValues])
  
  const {
    saveSubCategoriesData,  updateSubCategoriesData,
    errorData, hasgetCatListSucc, singleSubCatRes
  } = useSelector((state) => {
    return {
      saveSubCategoriesData:
        state && state.componentsubcategories && state.componentsubcategories.saveSubCategories,
      updateSubCategoriesData:
        state && state.componentsubcategories && state.componentsubcategories.updateSubCategories,
      errorData: 
        state && 
        state.componentsubcategories && 
        state.componentsubcategories.error &&
        state.componentsubcategories.error,
      hasgetCatListSucc:   
        state && 
        state.componentcategories && 
        state.componentcategories.getCategoriesListData &&
        state.componentcategories.getCategoriesListData.data,
      singleSubCatRes:
        state && state.componentsubcategories && state.componentsubcategories.singleSubCat && state.componentsubcategories.singleSubCat.data,
      
    };
  });

  console.log("singleSubCatRes",singleSubCatRes);
  useEffect(() => {
    if (singleSubCatRes && singleSubCatRes!=="") { 
      setRowValues(singleSubCatRes);
    }
  }, [singleSubCatRes]); 
  console.log(rowValues,'rowValues');
    useEffect(() => {
      if (hasgetCatListSucc && hasgetCatListSucc.length > 0) {
        let temp = hasgetCatListSucc.map((cat) => ({
          category: (cat?.parentcategoryname || '')  ,
          category_id: cat?.componentcategoryid,
          id: cat?.componentcategoryid 
        }));
        setCatDropDownData(temp);
         const selectedcategory = temp.find((obj) => obj?.id === rowValues?.componentcategoryid);
      

        formValidation.setFieldValue("category_id", selectedcategory);
      }
    }, [hasgetCatListSucc]); 
    console.log(catDropDownData,"hasgetCatListSucc",hasgetCatListSucc);

  useEffect(() => {
      if (saveSubCategoriesData?.statusCode === 200) {
            toast.success(
              <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
              {saveSubCategoriesData?.message}
              </p>,
              {
              position: toast.POSITION.TOP_RIGHT,
              hideProgressBar: false,
              theme: "colored",
              }
          );
          dispatch(getSubCategoriesList())
          dispatch(clearSaveSubCategories());
          setView(backView);
      }
  }, [saveSubCategoriesData]); 

  useEffect(() => {
    if (updateSubCategoriesData?.statusCode === 200) {
          toast.success(
            <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
            {updateSubCategoriesData?.message}
            </p>,
            {
            position: toast.POSITION.TOP_RIGHT,
            hideProgressBar: false,
            theme: "colored",
            }
        );
        dispatch(getSubCategoriesList())
        dispatch(clearUpdateSubCategories());
        dispatch(clearSingleSubCategories());
         handleOneClick(true);
        setView(backView);
    }
}, [updateSubCategoriesData]); 
 
  const formValidation = useFormik({
  enableReinitialize: true,
  initialValues: {
    title: rowValues?.categoryname || "",
    parentscenariocategoryid: rowValues?.parentcategoryname
    ? catDropDownData && catDropDownData.length > 0 && catDropDownData.find((ob) => ob.category_id === rowValues?.componentcategoryid)
    : null,

    image_url: rowValues?.categoryimage || "",
    description: rowValues?.description || "",
    status: rowValues?.status || true,
    checklist: 
    rowValues?.checkilistdata?.length > 0
      ? rowValues.checkilistdata.map((v) => ({
        checklistname: v.checklistname, // Ensure a proper label is set
        checkliststatus: v.checkliststatus|| "",
        checklistid : v.checklistid|| "",
        }))
      : [{ checklistname: "", checkliststatus: "true" , checklistid :"" }], 
  },

  
  validationSchema: Yup.object().shape({
    title: Yup.string().trim().required('Required').matches(/^[A-Za-z0-9 ]+$/, "No special characters allowed").test("no-emoji", "Emojis are not allowed", noEmojiTest).min(3, "Component Sub Category must be at least 3 characters").max(30, "Component Sub Category should not exceed 30 characters"), 
      parentscenariocategoryid: Yup.object().required("Required"), 

  }),
  onSubmit: (data, action) => {
    const payload = {
      ...(rowValues?.componentsubcategoryid && { componentsubcategoryid: rowValues?.componentsubcategoryid }),
      componentcategoryid: data?.parentscenariocategoryid?.category_id,
      name: data?.title,
      image: data?.image_url,
      description: initialHtml ? initialHtml : '', 
      status: 'Active' ,
      checklistdata: data?.checklist  
    };
    handleOneClick(true);
  // console.log(payload,"payload", data) ;return false;
   if (rowValues?.componentsubcategoryid) {
    dispatch(updateSubCategories(payload)); 
  } else {
    dispatch(saveSubCategories(payload));  
  } 
  }
});
 console.log('formValidation',formValidation);
// Handle Uploaded files
  const handleUpload = (name='',files='',flag = '') =>{
    
    formValidation.setFieldValue("flag",flag); // Set remove or update
    if(ismulti){
      let selectedFiles =  [];
      files.filter((f)=>{
        selectedFiles.push(f.file)
      });
      let filesStr = selectedFiles.join(',');
      formValidation.setFieldValue(name, filesStr ? filesStr : "")
      setUploadedFile(files && files.length > 0 && filesStr ? filesStr : "")
    }else{ 
      formValidation.setFieldValue(name,files[0]?.file ? files[0]?.file : "")
      setUploadedFile(files && files.length > 0 && files[0]?.file ? files[0]?.file : "")
    }
  }
console.log("uploadedFile",uploadedFile);
  const handleBrowse = (name='', filepaths="") =>{ 
    if(ismulti){
      if(filepaths){
        let files = filepaths.join(',');
        if(formValidation.values.image_url){
          files = files + ',' +formValidation.values.image_url;
        }
        formValidation.setFieldValue(name,files ? files : "");
      }
    }else{
      formValidation.setFieldValue("flag",'update');
      formValidation.setFieldValue(name,filepaths ? filepaths[0] : "");
      setUploadedFile(filepaths && filepaths.length > 0 ? filepaths[0] : "")
    }
  }
 
  const handleToggle = () =>{
    setIsChecked(!isChecked)
}
 
   
   

    const [formFields, setFormFields] = useState(
      rowValues?.checkilistdata || [{ checklistname: "", checkliststatus: "true" }]
    );
    
    const handleAddField = () => {
        // setFormFields([...formFields, { checklistname: '', checkliststatus: '' }]);
        const checklist_details = [
          ...formValidation.values.checklist,
          { checklistname: "", checkliststatus: "" },
        ];
        formValidation.setFieldValue("checklist", checklist_details);
      };
      const handleRemoveField = (index) => {
       
        const checklist_details = formValidation.values.checklist.filter(
          (_, i) => i !== index
        );
        formValidation.setFieldValue("checklist", checklist_details);
      };
      const handleInputChange = (e, index) => {
        const { name, value } = e.target;
        const updatedFields = [...formFields];
        console.log(updatedFields,'$$$$$$$$$$$4');

       
      };

      const handleChecklistToggle  = (e, index) => {
     
        const { name, value } = e.target;
        console.log('88888',e.target.checked,value)

        const updatedFields = [...formFields];
        updatedFields[index][name] = e.target.checked ;  

      
        setFormFields(updatedFields);
      }
  
    
  return (
    <> 
     <Row className="row-sm mg-t-10">
      <Col md={12}>   
        <Form
          noValidate
          onSubmit={(e) => {
          e.preventDefault();
          formValidation.handleSubmit();
          return false;
          }}
        >
          <Card className="custom-card">
            <Card.Body>
            <div className="learnerTitle d-flex justify-content-between align-items-center">
              <h5>{heading} Component Sub Category</h5>
              <Button variant="outline-secondary" type="button"  
              onClick={() => {
                setView(backView); 
                formValidation.resetForm();  dispatch(clearSingleSubCategories());  
              }}><i className='fe fe-arrow-left'></i>{t("")}</Button>
          </div>
            <Row className="row-sm">
            <Col md={12}>
               <Card className="custom-card">
                    
                    <Row>
                      <Col md={8}>
                          <Row>
                              <Form.Group
                                  as={Col}
                                  md="6"
                                  controlid="validationFormik102"
                                  className="mb-3"
                              >
                                  <Form.Label>
                                  {t("component_sub_categories.forms.label.title")} <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                  type="text"
                                  name="title"
                                  autoComplete="off"
                                  placeholder={t("component_sub_categories.forms.placeholder.title")}
                                  onChange={(e)=>{formValidation.handleChange(e)}}
                                  value={formValidation.values.title}
                                  isValid={
                                      formValidation.touched.title &&
                                      !formValidation.errors.title
                                  }
                                  isInvalid={
                                      formValidation.touched.title &&
                                      formValidation.errors.title
                                  }
                                  />
                                 
                                <Form.Control.Feedback type="invalid">
                                  {formValidation.errors.title}
                                  </Form.Control.Feedback>
                              </Form.Group>
                              <Form.Group
                                as={Col}
                                md="6"
                                controlId="1_2"
                                className="mb-3 h-62 input-container select"
                              >
                                <Form.Label>
                                Component Category <span className="text-danger">*</span>
                                </Form.Label>
                                <Select
                                  theme={(theme) => ({
                                    ...theme,
                                    colors: {
                                      ...theme.colors,
                                      primary25: "var(--primary-bg-color)",
                                      primary: "var(--primary-bg-color)",
                                    },
                                  })}
                                  name="parentscenariocategoryid"
                                  styles={getSelectStyles("parentscenariocategoryid")}
                                  value={formValidation.values.parentscenariocategoryid}   
                                  options={catDropDownData}
                                  getOptionLabel={(x) => x.category}
                                  getOptionValue={(x) => x.category_id}
                                  placeholder="Select Component Category" 
                                  onChange={(e) => {
                                    console.log("Selected:", e); 
                                    formValidation.setFieldValue("parentscenariocategoryid", e);
                                    
                                  }} 
                                /> 
                             

                                {formValidation.errors.parentscenariocategoryid && formValidation.touched.parentscenariocategoryid && (
                                  <div className="invalid-tooltiped">
                                    {formValidation.errors.parentscenariocategoryid}
                                  </div>
                                )}
                              </Form.Group>
                          </Row>
                          <Row>
                              <Form.Group
                                  as={Col}
                                  md="12"
                                  controlid="validationFormik102"
                                  className="mb-3"
                              >
                                  <Form.Label>{t("component_sub_categories.forms.label.description")} </Form.Label>
                                  <EditorComponent
                                      name="description"
                                      onChange={(data) => {
                                      setInitialHtml(data);
                                      }}
                                      editorLoaded={editorLoaded}
                                      data={initialHtml}
                                      setEditorLoaded={setEditorLoaded}
                                  />
                                  <Form.Control.Feedback type="invalid">
                                  {formValidation.errors.description}
                                  </Form.Control.Feedback>
                              </Form.Group> 
                            
                          </Row>
                          <Row>
                              <Table responsive>
                                  <thead>
                                  <tr>
                                      <th>Checklist Name</th>
                                      {/* <th>Status</th>
                                      <th> <Button variant="primary" onClick={handleAddField}>
                                      <i className="fa fa-plus"></i>  
                              </Button></th> */}
                                  </tr>
                                  </thead>
                                  <tbody>
                                  {formValidation.values.checklist.map((field, index) => (
                                      <tr key={index}>
                                     
                                      <td>
                                          <Form.Control
                                          type="text"
                                          name={`checklist.${index}.checklistname`}
                                          autoComplete="off"
                                          placeholder="Enter checklist name"
                                          value={formValidation.values.checklist[index].checklistname}
                                          onChange={formValidation.handleChange}
                                          />
                                          <input type="hidden"  name={`checklist.${index}.checklistid`} value={formValidation.values.checklist[index].checklistid} defaultChecked
                                              onChange={formValidation.handleChange} />
                                      </td>
                                      <td>
                                          {/* <label className="custom-switch">
                                          
                                          <input
                                              type="checkbox"
                                              name={`checklist.${index}.checkliststatus`}
                                              className="custom-switch-input"
                                              value={formValidation.values.checklist[index].checkliststatus} defaulthecked
                                              onChange={formValidation.handleChange}
                                            // onChange={(e) => handleChecklistToggle(e, index)}
                                          />
                                          <span className="custom-switch-indicator custom-switch-indicator-md"></span>
                                          </label> */}
                                      </td>
                                      <td>
                                          {/* Delete button: only show when there's more than one row */}
                                          {formValidation.values.checklist.length > 1 && (
                                          <Button variant="danger" onClick={() => handleRemoveField(index)}>
                                          <i className="fa fa-trash"></i>  
                                          </Button>
                                          )}
                                      </td>
                                      </tr>
                                  ))}
                                  </tbody>
                              </Table>
                          </Row>
                      </Col>
                      <Col md={4}>
                      <Form.Group
                              as={Col}
                              md="12"
                              controlid="validationFormik102"
                              className="mb-3 d-flex"
                          >
                              <div className='wd-80p'> 
                              <Form.Label>{t("component_sub_categories.forms.label.image_url")}</Form.Label>
                              
                              <FileUploader
                                  folderpath={category_path} 
                                  ismulti={ismulti} 
                                  name="image_url" 
                                  acceptedFileTypes={['image/png','image/jpeg']}
                                  handleUpload={handleUpload} 
                                  fetchfiles={ismulti ? (formValidation.values.image_url).split(',') : [formValidation.values.image_url]}
                              />
                              <Form.Control.Feedback type="invalid">
                                  {formValidation.errors.image_url}
                              </Form.Control.Feedback>
                              {rowValues?.id != 0 && 
                              <span className="text-warning tx-12">
                                  <strong><i className='fe fe-alert-circle'></i> Note : </strong> Removing the image will permanently delete it from storage and update the record.
                              </span>
                              }
                              {rowValues?.categoryimage &&
                                 <div className="picture avatar-lg online text-center">
                                  <div className="rounded-circle pointer">
                                    <img
                                      alt="avatar"    
                                       src={`${process.env.API_URL_FILEMANAGER}${rowValues.categoryimage}` } 
                                    />
                                  </div>
                                  </div>
                                
                                } 
                              </div>
                              
                          </Form.Group> 
                      </Col>  
                   </Row>
                     <Row>
                        <Col className="d-flex justify-content-end">
                        {oneClick ? (
                            <Button disabled>
                            <Spinner
                            as="span"
                            animation="grow"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            />
                            {t("common.loading")}
                        </Button>  
                         ) 
                        :  
                        <Button type="submit">{t("common.submit")}</Button>
                        }
                        </Col>
                    </Row>
                 
               </Card>
            </Col> 
            </Row>
            </Card.Body>
          </Card>
        </Form> 
      </Col> 
    </Row>
    </>
  );
};
ComponentSubCategoriesForm.layout = "Contentlayout";
export default ComponentSubCategoriesForm;