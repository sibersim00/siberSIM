import React,{useEffect, useState} from 'react'
import { useDispatch, useSelector } from "react-redux";
import {Button,Spinner, Offcanvas } from "react-bootstrap";
import { useFormik } from 'formik';
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css'; 
import { storeRoleMenus,clearStoreRoleMenus,getViewRoleMenusData } from '../../../redux/slices/admin/Roles';
import { toast } from "react-toastify";

const Treeviewoffcanvas = (props) => {
  const {treeOffcanvas,handleTreeViewOffcanvas,rowValues, handleLoaderForTreeViewOffcanvas ,loaderForTreeView} = props;
  const dispatch = useDispatch()
  const { viewRoleMenuData,storeRoleMenusData, } = useSelector((state) => {
    return {
        viewRoleMenuData:
        state &&
        state.roles &&
        state.roles.viewRoleMenuData &&
        state.roles.viewRoleMenuData.data,

        storeRoleMenusData:
        state && state.roles && state.roles.storeRoleMenusData,
    }
  });

  const [treeData, setTreeData] = useState([])
  

  useEffect(()=>{
    if(viewRoleMenuData){
      let temp = [...viewRoleMenuData]
      setTreeData(temp);
      let list = processNestedObjects(temp, [])
      formik.setFieldValue('checked', list)
      formik.setFieldValue('expanded', [])
    }
  },[viewRoleMenuData])


  useEffect(() => {
    if (storeRoleMenusData?.statusCode) {
      // handleTreeViewOffcanvas()
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {storeRoleMenusData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      handleLoaderForTreeViewOffcanvas(false)
      dispatch(getViewRoleMenusData({"roleid":rowValues?.roleid}))
      dispatch(clearStoreRoleMenus());
    }
  }, [storeRoleMenusData]);

  const processNestedObjects = (temp,list)=> {
    if (temp && temp.length > 0) {
      temp.forEach((obj, index) => {
        if (obj?.children && obj.children.length > 0) {
          processNestedObjects(obj.children, list);
        }
        
        if (obj?.ischeck && ((!obj?.parentmenuid && !obj?.children) || (obj?.parentmenuid && !obj?.children))) {
          list.push(obj.value);
        }
      });
    }
    return list;
  }
  
  const initialValues = {
    checked: [], // Initially checked checkboxes
    expanded: [],
  };

  const onSubmit = (values) => {
    let updatedArray = updateDataWithCheckProperty(treeData,values?.checked)
    const payload = {
      roleid : rowValues?.roleid,
      data : updatedArray
    }
    dispatch(storeRoleMenus(payload))
    handleLoaderForTreeViewOffcanvas(true)
  };

  const updateDataWithCheckProperty = (dataArray, idsArray) => {
    return dataArray.map(menuItem => {
      const children = menuItem.children
        ? updateDataWithCheckProperty(menuItem.children, idsArray)
        : null;
  
      const hasChildWithCheck = children
        ? children.some(child => child.ischeck)
        : false;
  
      const isCheckValue = idsArray.includes(menuItem.value.toString()) || hasChildWithCheck;
  
      return {
        ...menuItem,
        ischeck: isCheckValue,
        children: children,
      };
    });
  };

  const formik = useFormik({
    initialValues,
    onSubmit,
  });

  const handleChecked = (value) =>{
    formik.setFieldValue('checked', value);
  }


  return (
    <>
    <Offcanvas show={treeOffcanvas} placement='end' className="wd-40p">
      <Offcanvas.Header closeButton onClick={handleTreeViewOffcanvas}>
      <div className='tx-16'>Tree View</div>
      </Offcanvas.Header>
      <Offcanvas.Body>
      <form onSubmit={formik.handleSubmit}>
        <div className='d-flex justify-content-center'>
        <CheckboxTree
          nodes={treeData}
          checked={formik.values.checked}
          expanded={formik.values.expanded}
          onCheck={(checked) => handleChecked(checked)}
          onExpand={(value) => formik.setFieldValue('expanded', value)}
          expandOnClick
        />
        </div>
        <div className='text-right'>
          {loaderForTreeView ? (
            <Button variant="primary" disabled>
              <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
              />
              Loading...
            </Button>
            ) 
            :
          <Button variant="primary" type="submit">
            Submit
          </Button>}
          {" "}
          <Button
            variant="secondary"
            onClick={handleTreeViewOffcanvas}
          >
            Close
          </Button>
        </div>
      </form>
      
      </Offcanvas.Body>
    </Offcanvas>
    </>
  )
}

export default Treeviewoffcanvas